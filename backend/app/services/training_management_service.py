# app/services/training_management_service.py
"""
Service for managing ML model training sessions and monitoring
"""

import logging
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

import requests
from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.ml_models import MLModelConfig, ModelTrainingHistory, SystemAlert

settings = get_settings()
logger = logging.getLogger(__name__)


class TrainingStatus(Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TrainingManagementService:
    """Manage ML model training sessions"""

    def __init__(self, db: Session):
        self.db = db
        self.max_concurrent_trainings = getattr(settings, "MAX_CONCURRENT_TRAININGS", 2)

    def start_training(
        self,
        model_config_id: str,
        user_id: str,
        custom_parameters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Start a new training session"""
        try:
            # Get model configuration
            config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(model_config_id))
                .first()
            )

            if not config:
                raise ValueError(f"Model configuration not found: {model_config_id}")

            # Check if training is already in progress for this model type
            running_trainings = (
                self.db.query(ModelTrainingHistory)
                .filter(
                    and_(
                        ModelTrainingHistory.model_config_id == config.id,
                        ModelTrainingHistory.training_status.in_(["queued", "running"]),
                    )
                )
                .count()
            )

            if running_trainings > 0:
                raise ValueError(
                    f"Training already in progress for {config.model_name}"
                )

            # Check concurrent training limit
            total_running = (
                self.db.query(ModelTrainingHistory)
                .filter(ModelTrainingHistory.training_status.in_(["queued", "running"]))
                .count()
            )

            if total_running >= self.max_concurrent_trainings:
                raise ValueError(
                    f"Maximum concurrent trainings ({self.max_concurrent_trainings}) reached"
                )

            # Merge custom parameters with config parameters
            training_params = config.parameters.copy()
            if custom_parameters:
                training_params.update(custom_parameters)

            # Create training record
            training_record = ModelTrainingHistory(
                id=uuid.uuid4(),
                model_config_id=config.id,
                training_status=TrainingStatus.QUEUED.value,
                training_parameters=training_params,
                initiated_by=uuid.UUID(user_id),
            )

            self.db.add(training_record)
            self.db.commit()
            self.db.refresh(training_record)

            # Start training asynchronously
            training_result = self._initiate_training(training_record, config)

            # Update status based on initial result
            if training_result.get("success"):
                training_record.training_status = TrainingStatus.RUNNING.value
            else:
                training_record.training_status = TrainingStatus.FAILED.value
                training_record.error_message = training_result.get(
                    "error", "Failed to start training"
                )

            self.db.commit()

            logger.info(
                f"Started training for {config.model_name} (ID: {training_record.id})"
            )

            return {
                "training_id": str(training_record.id),
                "status": training_record.training_status,
                "model_name": config.model_name,
                "model_type": config.model_type,
                "started_at": training_record.started_at.isoformat(),
                "estimated_duration_minutes": self._estimate_training_duration(
                    config.model_type
                ),
                "progress_url": f"/admin/training/{training_record.id}/progress",
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error starting training: {e}")
            raise

    def get_training_status(self, training_id: str) -> Dict[str, Any]:
        """Get detailed status of a training session"""
        try:
            training = (
                self.db.query(ModelTrainingHistory)
                .filter(ModelTrainingHistory.id == uuid.UUID(training_id))
                .first()
            )

            if not training:
                raise ValueError(f"Training session not found: {training_id}")

            # Get real-time status from recommendation service if running
            if training.training_status == TrainingStatus.RUNNING.value:
                live_status = self._get_live_training_status(training_id)
                if live_status:
                    return live_status

            return self._serialize_training_status(training)

        except Exception as e:
            logger.error(f"Error getting training status: {e}")
            raise

    def cancel_training(self, training_id: str, user_id: str) -> Dict[str, Any]:
        """Cancel a running training session"""
        try:
            training = (
                self.db.query(ModelTrainingHistory)
                .filter(ModelTrainingHistory.id == uuid.UUID(training_id))
                .first()
            )

            if not training:
                raise ValueError(f"Training session not found: {training_id}")

            if training.training_status not in [
                TrainingStatus.QUEUED.value,
                TrainingStatus.RUNNING.value,
            ]:
                raise ValueError(
                    f"Cannot cancel training with status: {training.training_status}"
                )

            # Send cancellation request to recommendation service
            cancel_result = self._send_cancellation_request(training_id)

            # Update training record
            training.training_status = TrainingStatus.CANCELLED.value
            training.completed_at = datetime.utcnow()
            training.error_message = f"Training cancelled by user {user_id}"

            self.db.commit()

            # Create system alert
            self._create_training_alert(
                "training_cancelled",
                f"Training cancelled for {training.model_config.model_name}",
                {"training_id": training_id, "cancelled_by": user_id},
            )

            logger.info(f"Cancelled training {training_id} by user {user_id}")

            return {
                "training_id": training_id,
                "status": "cancelled",
                "cancelled_at": training.completed_at.isoformat(),
                "cancelled_by": user_id,
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error cancelling training: {e}")
            raise

    def get_training_logs(self, training_id: str, lines: int = 100) -> List[str]:
        """Get training logs for a session"""
        try:
            # Get logs from recommendation service
            response = requests.get(
                f"{self.recommendation_service_url}/admin/training/{training_id}/logs",
                params={"lines": lines},
                timeout=30,
            )

            if response.status_code == 200:
                return response.json().get("logs", [])
            else:
                logger.warning(f"Failed to get training logs: {response.status_code}")
                return [f"Unable to retrieve logs: HTTP {response.status_code}"]

        except Exception as e:
            logger.error(f"Error getting training logs: {e}")
            return [f"Error retrieving logs: {str(e)}"]

    def get_training_history(
        self,
        days: int = 30,
        model_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Get training history with filters"""
        try:
            query = self.db.query(ModelTrainingHistory).join(MLModelConfig)

            # Apply filters
            if days > 0:
                start_date = datetime.utcnow() - timedelta(days=days)
                query = query.filter(ModelTrainingHistory.started_at >= start_date)

            if model_type:
                query = query.filter(MLModelConfig.model_type == model_type)

            if status:
                query = query.filter(ModelTrainingHistory.training_status == status)

            history = (
                query.order_by(desc(ModelTrainingHistory.started_at)).limit(limit).all()
            )

            return [self._serialize_training_history(record) for record in history]

        except Exception as e:
            logger.error(f"Error getting training history: {e}")
            return []

    def get_training_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get training statistics and metrics"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)

            # Get training counts by status
            status_counts = (
                self.db.query(
                    ModelTrainingHistory.training_status,
                    func.count(ModelTrainingHistory.id).label("count"),
                )
                .filter(ModelTrainingHistory.started_at >= start_date)
                .group_by(ModelTrainingHistory.training_status)
                .all()
            )

            # Get training counts by model type
            type_counts = (
                self.db.query(
                    MLModelConfig.model_type,
                    func.count(ModelTrainingHistory.id).label("count"),
                )
                .join(ModelTrainingHistory)
                .filter(ModelTrainingHistory.started_at >= start_date)
                .group_by(MLModelConfig.model_type)
                .all()
            )

            # Get average training duration
            avg_duration = (
                self.db.query(func.avg(ModelTrainingHistory.training_duration_seconds))
                .filter(
                    and_(
                        ModelTrainingHistory.started_at >= start_date,
                        ModelTrainingHistory.training_status
                        == TrainingStatus.COMPLETED.value,
                        ModelTrainingHistory.training_duration_seconds.isnot(None),
                    )
                )
                .scalar()
                or 0
            )

            # Get success rate
            total_trainings = sum(count.count for count in status_counts)
            successful_trainings = next(
                (
                    count.count
                    for count in status_counts
                    if count.training_status == TrainingStatus.COMPLETED.value
                ),
                0,
            )
            success_rate = (
                (successful_trainings / total_trainings * 100)
                if total_trainings > 0
                else 0
            )

            return {
                "period_days": days,
                "total_trainings": total_trainings,
                "success_rate": round(success_rate, 2),
                "average_duration_minutes": round(avg_duration / 60, 2)
                if avg_duration
                else 0,
                "status_breakdown": {
                    count.training_status: count.count for count in status_counts
                },
                "model_type_breakdown": {
                    count.model_type: count.count for count in type_counts
                },
                "currently_running": self._get_currently_running_count(),
                "queued_trainings": self._get_queued_count(),
            }

        except Exception as e:
            logger.error(f"Error getting training statistics: {e}")
            return self._empty_training_statistics()

    def schedule_automatic_training(
        self, model_config_id: str, schedule: str
    ) -> Dict[str, Any]:
        """Schedule automatic training for a model configuration"""
        try:
            config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(model_config_id))
                .first()
            )

            if not config:
                raise ValueError(f"Model configuration not found: {model_config_id}")

            # Validate schedule
            valid_schedules = ["daily", "weekly", "monthly", "manual"]
            if schedule not in valid_schedules:
                raise ValueError(f"Invalid schedule: {schedule}")

            # Update configuration
            config.training_schedule = schedule
            if schedule != "manual":
                config.next_training_at = self._calculate_next_training_time(schedule)
            else:
                config.next_training_at = None

            self.db.commit()

            logger.info(
                f"Scheduled automatic training for {config.model_name}: {schedule}"
            )

            return {
                "model_config_id": str(config.id),
                "model_name": config.model_name,
                "schedule": schedule,
                "next_training_at": config.next_training_at.isoformat()
                if config.next_training_at
                else None,
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error scheduling automatic training: {e}")
            raise

    def check_scheduled_trainings(self) -> List[Dict[str, Any]]:
        """Check for and execute scheduled trainings"""
        try:
            now = datetime.utcnow()

            # Find configs that need training
            configs_to_train = (
                self.db.query(MLModelConfig)
                .filter(
                    and_(
                        MLModelConfig.is_active == True,
                        MLModelConfig.training_schedule != "manual",
                        MLModelConfig.next_training_at.isnot(None),
                        MLModelConfig.next_training_at <= now,
                    )
                )
                .all()
            )

            scheduled_trainings = []

            for config in configs_to_train:
                try:
                    # Start training
                    result = self.start_training(
                        str(config.id),
                        "system",  # System user for scheduled trainings
                        None,
                    )

                    # Update next training time
                    config.next_training_at = self._calculate_next_training_time(
                        config.training_schedule
                    )
                    self.db.commit()

                    scheduled_trainings.append(
                        {
                            "model_name": config.model_name,
                            "training_id": result["training_id"],
                            "scheduled_at": now.isoformat(),
                        }
                    )

                except Exception as e:
                    logger.error(
                        f"Error starting scheduled training for {config.model_name}: {e}"
                    )
                    continue

            return scheduled_trainings

        except Exception as e:
            logger.error(f"Error checking scheduled trainings: {e}")
            return []

    def update_training_progress(self, training_id: str, progress_data: Dict[str, Any]):
        """Update training progress from external service"""
        try:
            training = (
                self.db.query(ModelTrainingHistory)
                .filter(ModelTrainingHistory.id == uuid.UUID(training_id))
                .first()
            )

            if not training:
                logger.warning(
                    f"Training record not found for progress update: {training_id}"
                )
                return

            # Update training record with progress data
            if "status" in progress_data:
                training.training_status = progress_data["status"]

            if "metrics" in progress_data:
                training.training_metrics = progress_data["metrics"]

            if "performance" in progress_data:
                training.model_performance = progress_data["performance"]

            if "data_stats" in progress_data:
                training.training_data_stats = progress_data["data_stats"]

            if "error" in progress_data:
                training.error_message = progress_data["error"]

            # Update completion time if training is finished
            if progress_data.get("status") in [
                TrainingStatus.COMPLETED.value,
                TrainingStatus.FAILED.value,
            ]:
                training.completed_at = datetime.utcnow()

                # Calculate duration
                if training.started_at:
                    duration = (
                        training.completed_at - training.started_at
                    ).total_seconds()
                    training.training_duration_seconds = int(duration)

            self.db.commit()

            # Create alert for failed trainings
            if progress_data.get("status") == TrainingStatus.FAILED.value:
                self._create_training_alert(
                    "training_failed",
                    f"Training failed for {training.model_config.model_name}",
                    {
                        "training_id": training_id,
                        "error": progress_data.get("error", "Unknown error"),
                    },
                )

            logger.debug(f"Updated training progress for {training_id}")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating training progress: {e}")

    def _initiate_training(
        self, training_record: ModelTrainingHistory, config: MLModelConfig
    ) -> Dict[str, Any]:
        """Start training directly in the ML engine"""
        try:
            from app.services.ml_engine_service import MLEngineService

            ml_engine = MLEngineService(self.db)
            result = ml_engine.start_training_async(
                training_id=str(training_record.id),
                model_type=config.model_type,
                model_name=config.model_name,
                parameters=training_record.training_parameters,
                callback=self._training_progress_callback,
            )

            return result

        except Exception as e:
            return {"success": False, "error": str(e)}

    def _get_live_training_status(self, training_id: str) -> Optional[Dict[str, Any]]:
        """Get live training status from ML engine"""
        try:
            from app.services.ml_engine_service import MLEngineService

            ml_engine = MLEngineService(self.db)
            status = ml_engine.get_training_status(training_id)

            return status

        except Exception as e:
            logger.error(f"Error getting live training status: {e}")
            return None

    def _send_cancellation_request(self, training_id: str) -> Dict[str, Any]:
        """Cancel training in ML engine"""
        try:
            from app.services.ml_engine_service import MLEngineService

            ml_engine = MLEngineService(self.db)
            result = ml_engine.cancel_training(training_id)

            return result

        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_training_logs(self, training_id: str, lines: int = 100) -> List[str]:
        """Get training logs from ML engine"""
        try:
            from app.services.ml_engine_service import MLEngineService

            ml_engine = MLEngineService(self.db)
            logs = ml_engine.get_training_logs(training_id, lines)

            return logs

        except Exception as e:
            logger.error(f"Error getting training logs: {e}")
            return [f"Error retrieving logs: {str(e)}"]

    def _training_progress_callback(
        self, training_id: str, progress_data: Dict[str, Any]
    ):
        """Callback function for training progress updates"""
        self.update_training_progress(training_id, progress_data)

    def _estimate_training_duration(self, model_type: str) -> int:
        """Estimate training duration in minutes based on model type"""
        estimates = {"als": 15, "lightgbm": 10, "kmeans": 5, "content_based": 8}
        return estimates.get(model_type, 10)

    def _calculate_next_training_time(self, schedule: str) -> datetime:
        """Calculate next training time based on schedule"""
        now = datetime.utcnow()

        if schedule == "daily":
            return now + timedelta(days=1)
        elif schedule == "weekly":
            return now + timedelta(weeks=1)
        elif schedule == "monthly":
            return now + timedelta(days=30)
        else:
            return now

    def _get_currently_running_count(self) -> int:
        """Get count of currently running trainings"""
        return (
            self.db.query(ModelTrainingHistory)
            .filter(
                ModelTrainingHistory.training_status == TrainingStatus.RUNNING.value
            )
            .count()
        )

    def _get_queued_count(self) -> int:
        """Get count of queued trainings"""
        return (
            self.db.query(ModelTrainingHistory)
            .filter(ModelTrainingHistory.training_status == TrainingStatus.QUEUED.value)
            .count()
        )

    def _create_training_alert(self, alert_type: str, title: str, data: Dict[str, Any]):
        """Create a system alert for training events"""
        try:
            alert = SystemAlert(
                id=uuid.uuid4(),
                alert_type=alert_type,
                severity="medium" if "failed" in alert_type else "low",
                title=title,
                alert_data=data,
                source_component="training_management",
            )

            self.db.add(alert)
            self.db.commit()

        except Exception as e:
            logger.error(f"Error creating training alert: {e}")

    def _serialize_training_status(
        self, training: ModelTrainingHistory
    ) -> Dict[str, Any]:
        """Serialize training status to dictionary"""
        return {
            "training_id": str(training.id),
            "model_name": training.model_config.model_name,
            "model_type": training.model_config.model_type,
            "status": training.training_status,
            "started_at": training.started_at.isoformat(),
            "completed_at": training.completed_at.isoformat()
            if training.completed_at
            else None,
            "duration_seconds": training.training_duration_seconds,
            "progress_percentage": self._calculate_progress_percentage(training),
            "current_metrics": training.training_metrics,
            "performance_metrics": training.model_performance,
            "error_message": training.error_message,
            "data_statistics": training.training_data_stats,
        }

    def _serialize_training_history(
        self, record: ModelTrainingHistory
    ) -> Dict[str, Any]:
        """Serialize training history record"""
        return {
            "id": str(record.id),
            "model_name": record.model_config.model_name,
            "model_type": record.model_config.model_type,
            "status": record.training_status,
            "started_at": record.started_at.isoformat(),
            "completed_at": record.completed_at.isoformat()
            if record.completed_at
            else None,
            "duration_seconds": record.training_duration_seconds,
            "error_message": record.error_message,
            "initiated_by": str(record.initiated_by) if record.initiated_by else None,
        }

    def _calculate_progress_percentage(self, training: ModelTrainingHistory) -> int:
        """Calculate training progress percentage"""
        if training.training_status == TrainingStatus.COMPLETED.value:
            return 100
        elif training.training_status == TrainingStatus.FAILED.value:
            return 0
        elif training.training_status == TrainingStatus.RUNNING.value:
            # Estimate based on elapsed time and expected duration
            if training.started_at:
                elapsed = (datetime.utcnow() - training.started_at).total_seconds()
                estimated_total = (
                    self._estimate_training_duration(training.model_config.model_type)
                    * 60
                )
                progress = min(
                    95, int((elapsed / estimated_total) * 100)
                )  # Cap at 95% until complete
                return progress
            return 10
        else:
            return 0

    def _empty_training_statistics(self) -> Dict[str, Any]:
        """Return empty training statistics structure"""
        return {
            "period_days": 30,
            "total_trainings": 0,
            "success_rate": 0.0,
            "average_duration_minutes": 0.0,
            "status_breakdown": {},
            "model_type_breakdown": {},
            "currently_running": 0,
            "queued_trainings": 0,
        }
