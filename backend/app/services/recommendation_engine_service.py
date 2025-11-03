# app/services/recommendation_engine_service.py
"""
Service for managing recommendation engine configurations and performance
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.ml_models import (
    MLModelConfig,
    ModelTrainingHistory,
    RecommendationConversion,
    RecommendationMetrics,
)

settings = get_settings()
logger = logging.getLogger(__name__)


class RecommendationEngineService:
    """Manage recommendation engine configurations and monitor performance"""

    def __init__(self, db: Session):
        self.db = db
        # Direct integration - no external service calls

    def get_model_configs(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """Get all ML model configurations"""
        query = self.db.query(MLModelConfig)

        if active_only:
            query = query.filter(MLModelConfig.is_active == True)

        configs = query.order_by(MLModelConfig.created_at.desc()).all()

        return [self._serialize_model_config(config) for config in configs]

    def create_model_config(
        self, config_data: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """Create a new ML model configuration"""
        try:
            # Validate required fields
            required_fields = ["model_name", "model_type", "parameters"]
            for field in required_fields:
                if field not in config_data:
                    raise ValueError(f"Missing required field: {field}")

            # Create new configuration
            new_config = MLModelConfig(
                id=uuid.uuid4(),
                model_name=config_data["model_name"],
                model_type=config_data["model_type"],
                parameters=config_data["parameters"],
                training_schedule=config_data.get("training_schedule", "manual"),
                performance_threshold=config_data.get("performance_threshold", 0.0),
                description=config_data.get("description", ""),
                created_by=uuid.UUID(user_id),
            )

            self.db.add(new_config)
            self.db.commit()
            self.db.refresh(new_config)

            logger.info(
                f"Created ML model config: {new_config.model_name} by user {user_id}"
            )
            return self._serialize_model_config(new_config)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating model config: {e}")
            raise

    def update_model_config(
        self, config_id: str, config_data: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """Update an existing ML model configuration"""
        try:
            config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(config_id))
                .first()
            )
            if not config:
                raise ValueError(f"Model config not found: {config_id}")

            # Update fields
            updateable_fields = [
                "model_name",
                "parameters",
                "training_schedule",
                "performance_threshold",
                "description",
            ]

            for field in updateable_fields:
                if field in config_data:
                    setattr(config, field, config_data[field])

            config.updated_by = uuid.UUID(user_id)
            config.updated_at = datetime.utcnow()

            self.db.commit()

            # If configuration changed and model is active, sync with recommendation service
            if config.is_active:
                self._sync_config_with_recommendation_service(config)

            logger.info(f"Updated ML model config: {config_id} by user {user_id}")
            return self._serialize_model_config(config)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating model config: {e}")
            raise

    def activate_model_config(self, config_id: str, user_id: str) -> Dict[str, Any]:
        """Activate a model configuration"""
        try:
            config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(config_id))
                .first()
            )
            if not config:
                raise ValueError(f"Model config not found: {config_id}")

            # Deactivate other configs of the same type
            self.db.query(MLModelConfig).filter(
                and_(
                    MLModelConfig.model_type == config.model_type,
                    MLModelConfig.id != config.id,
                )
            ).update({"is_active": False})

            # Activate this config
            config.is_active = True
            config.updated_by = uuid.UUID(user_id)
            config.updated_at = datetime.utcnow()

            self.db.commit()

            # Sync with recommendation service
            self._sync_config_with_recommendation_service(config)

            logger.info(f"Activated ML model config: {config_id} by user {user_id}")
            return self._serialize_model_config(config)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error activating model config: {e}")
            raise

    def deactivate_model_config(self, config_id: str, user_id: str) -> Dict[str, Any]:
        """Deactivate a model configuration"""
        try:
            config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(config_id))
                .first()
            )
            if not config:
                raise ValueError(f"Model config not found: {config_id}")

            config.is_active = False
            config.updated_by = uuid.UUID(user_id)
            config.updated_at = datetime.utcnow()

            self.db.commit()

            # Notify recommendation service
            self._sync_config_with_recommendation_service(config)

            logger.info(f"Deactivated ML model config: {config_id} by user {user_id}")
            return self._serialize_model_config(config)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deactivating model config: {e}")
            raise

    def delete_model_config(self, config_id: str) -> bool:
        """Delete a model configuration"""
        try:
            config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(config_id))
                .first()
            )
            if not config:
                raise ValueError(f"Model config not found: {config_id}")

            if config.is_active:
                raise ValueError("Cannot delete active model configuration")

            self.db.delete(config)
            self.db.commit()

            logger.info(f"Deleted ML model config: {config_id}")
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting model config: {e}")
            raise

    def trigger_model_training(
        self, model_type: str, user_id: str, parameters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Trigger training for a specific model type"""
        try:
            # Get active config for this model type
            config = (
                self.db.query(MLModelConfig)
                .filter(
                    and_(
                        MLModelConfig.model_type == model_type,
                        MLModelConfig.is_active == True,
                    )
                )
                .first()
            )

            if not config:
                raise ValueError(
                    f"No active configuration found for model type: {model_type}"
                )

            # Create training history record
            training_record = ModelTrainingHistory(
                id=uuid.uuid4(),
                model_config_id=config.id,
                training_status="queued",
                training_parameters=parameters or config.parameters,
                initiated_by=uuid.UUID(user_id),
            )

            self.db.add(training_record)
            self.db.commit()
            self.db.refresh(training_record)

            # Send training request to recommendation service
            training_result = self._send_training_request(
                model_type, parameters or config.parameters, str(training_record.id)
            )

            # Update training record with initial result
            training_record.training_status = (
                "running" if training_result.get("success") else "failed"
            )
            if not training_result.get("success"):
                training_record.error_message = training_result.get(
                    "error", "Unknown error"
                )

            self.db.commit()

            logger.info(f"Triggered training for {model_type} by user {user_id}")
            return {
                "training_id": str(training_record.id),
                "status": training_record.training_status,
                "model_type": model_type,
                "started_at": training_record.started_at.isoformat(),
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error triggering model training: {e}")
            raise

    def get_training_history(
        self, limit: int = 50, model_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get model training history"""
        query = self.db.query(ModelTrainingHistory).join(MLModelConfig)

        if model_type:
            query = query.filter(MLModelConfig.model_type == model_type)

        history = (
            query.order_by(desc(ModelTrainingHistory.started_at)).limit(limit).all()
        )

        return [self._serialize_training_history(record) for record in history]

    def get_recommendation_performance(self, days: int = 30) -> Dict[str, Any]:
        """Get recommendation performance metrics"""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Get basic metrics
        metrics = (
            self.db.query(RecommendationMetrics)
            .filter(RecommendationMetrics.created_at >= start_date)
            .all()
        )

        # Calculate aggregated statistics
        total_recommendations = len(metrics)
        if total_recommendations == 0:
            return self._empty_performance_metrics()

        # Conversion rates by type
        conversion_by_type = {}
        revenue_by_type = {}

        for metric in metrics:
            rec_type = metric.recommendation_type
            if rec_type not in conversion_by_type:
                conversion_by_type[rec_type] = []
                revenue_by_type[rec_type] = []

            if metric.conversion_rate:
                conversion_by_type[rec_type].append(float(metric.conversion_rate))
            if metric.revenue_generated:
                revenue_by_type[rec_type].append(float(metric.revenue_generated))

        # Calculate averages
        avg_conversion_by_type = {
            rec_type: sum(rates) / len(rates) if rates else 0
            for rec_type, rates in conversion_by_type.items()
        }

        total_revenue_by_type = {
            rec_type: sum(revenues) for rec_type, revenues in revenue_by_type.items()
        }

        # Overall metrics
        overall_conversion = (
            sum(float(m.conversion_rate) for m in metrics if m.conversion_rate)
            / len([m for m in metrics if m.conversion_rate])
            if metrics
            else 0
        )

        total_revenue = sum(
            float(m.revenue_generated) for m in metrics if m.revenue_generated
        )

        return {
            "period_days": days,
            "total_recommendations": total_recommendations,
            "overall_conversion_rate": round(overall_conversion, 4),
            "total_revenue": round(total_revenue, 2),
            "conversion_by_type": avg_conversion_by_type,
            "revenue_by_type": total_revenue_by_type,
            "daily_metrics": self._get_daily_performance_metrics(start_date),
            "top_performing_products": self._get_top_performing_products(start_date),
        }

    def get_conversion_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get detailed conversion analytics"""
        start_date = datetime.utcnow() - timedelta(days=days)

        conversions = (
            self.db.query(RecommendationConversion)
            .filter(RecommendationConversion.created_at >= start_date)
            .all()
        )

        if not conversions:
            return self._empty_conversion_analytics()

        # Calculate metrics
        total_conversions = len(conversions)
        total_value = sum(
            float(c.conversion_value) for c in conversions if c.conversion_value
        )
        avg_value = total_value / total_conversions if total_conversions > 0 else 0

        # Time to conversion analysis
        conversion_times = [
            c.time_to_conversion_minutes
            for c in conversions
            if c.time_to_conversion_minutes is not None
        ]

        avg_time_to_conversion = (
            sum(conversion_times) / len(conversion_times) if conversion_times else 0
        )

        # Funnel analysis
        funnel_data = self._analyze_conversion_funnel(conversions)

        return {
            "period_days": days,
            "total_conversions": total_conversions,
            "total_conversion_value": round(total_value, 2),
            "average_conversion_value": round(avg_value, 2),
            "average_time_to_conversion_minutes": round(avg_time_to_conversion, 2),
            "conversion_funnel": funnel_data,
            "daily_conversions": self._get_daily_conversion_metrics(start_date),
        }

    def log_recommendation_display(
        self,
        user_id: str,
        session_id: str,
        recommendations: List[Dict],
        recommendation_type: str,
        context: Optional[Dict] = None,
    ):
        """Log when recommendations are displayed to a user"""
        try:
            metric = RecommendationMetrics(
                id=uuid.uuid4(),
                user_id=uuid.UUID(user_id),
                session_id=session_id,
                recommendation_type=recommendation_type,
                recommended_products=recommendations,
                recommendation_context=context or {},
            )

            self.db.add(metric)
            self.db.commit()

            logger.debug(f"Logged recommendation display for user {user_id}")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error logging recommendation display: {e}")

    def log_recommendation_interaction(
        self,
        user_id: str,
        session_id: str,
        interaction_type: str,
        product_id: str,
        recommendation_request_id: Optional[str] = None,
    ):
        """Log user interactions with recommendations"""
        try:
            # Find or create recommendation metrics record
            metric = (
                self.db.query(RecommendationMetrics)
                .filter(
                    and_(
                        RecommendationMetrics.user_id == uuid.UUID(user_id),
                        RecommendationMetrics.session_id == session_id,
                    )
                )
                .order_by(desc(RecommendationMetrics.created_at))
                .first()
            )

            if metric:
                # Update existing metric
                if interaction_type == "view":
                    viewed = metric.viewed_products or []
                    if product_id not in viewed:
                        viewed.append(product_id)
                    metric.viewed_products = viewed

                elif interaction_type == "click":
                    clicked = metric.clicked_products or []
                    if product_id not in clicked:
                        clicked.append(product_id)
                    metric.clicked_products = clicked

                elif interaction_type == "add_to_cart":
                    cart_adds = metric.added_to_cart or []
                    if product_id not in cart_adds:
                        cart_adds.append(product_id)
                    metric.added_to_cart = cart_adds

                elif interaction_type == "purchase":
                    purchases = metric.purchased_products or []
                    if product_id not in purchases:
                        purchases.append(product_id)
                    metric.purchased_products = purchases

                # Recalculate conversion rate
                recommended_count = len(metric.recommended_products or [])
                purchased_count = len(metric.purchased_products or [])
                metric.conversion_rate = (
                    purchased_count / recommended_count if recommended_count > 0 else 0
                )

                # Calculate click-through rate
                clicked_count = len(metric.clicked_products or [])
                metric.click_through_rate = (
                    clicked_count / recommended_count if recommended_count > 0 else 0
                )

                self.db.commit()

            logger.debug(
                f"Logged {interaction_type} interaction for user {user_id}, product {product_id}"
            )

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error logging recommendation interaction: {e}")

    def _serialize_model_config(self, config: MLModelConfig) -> Dict[str, Any]:
        """Serialize model configuration to dictionary"""
        return {
            "id": str(config.id),
            "model_name": config.model_name,
            "model_type": config.model_type,
            "parameters": config.parameters,
            "is_active": config.is_active,
            "training_schedule": config.training_schedule,
            "performance_threshold": float(config.performance_threshold)
            if config.performance_threshold
            else 0.0,
            "last_trained_at": config.last_trained_at.isoformat()
            if config.last_trained_at
            else None,
            "next_training_at": config.next_training_at.isoformat()
            if config.next_training_at
            else None,
            "model_version": config.model_version,
            "description": config.description,
            "created_at": config.created_at.isoformat(),
            "updated_at": config.updated_at.isoformat() if config.updated_at else None,
            "created_by": str(config.created_by) if config.created_by else None,
            "updated_by": str(config.updated_by) if config.updated_by else None,
        }

    def _serialize_training_history(
        self, record: ModelTrainingHistory
    ) -> Dict[str, Any]:
        """Serialize training history record to dictionary"""
        return {
            "id": str(record.id),
            "model_config_id": str(record.model_config_id),
            "model_name": record.model_config.model_name,
            "model_type": record.model_config.model_type,
            "training_status": record.training_status,
            "training_metrics": record.training_metrics,
            "training_parameters": record.training_parameters,
            "error_message": record.error_message,
            "training_data_stats": record.training_data_stats,
            "model_performance": record.model_performance,
            "training_duration_seconds": record.training_duration_seconds,
            "started_at": record.started_at.isoformat(),
            "completed_at": record.completed_at.isoformat()
            if record.completed_at
            else None,
            "initiated_by": str(record.initiated_by) if record.initiated_by else None,
        }

    def _sync_config_with_recommendation_service(self, config: MLModelConfig):
        """Apply configuration changes directly to the ML system"""
        try:
            # Direct logical implementation instead of HTTP calls
            from app.services.ml_engine_service import MLEngineService

            ml_engine = MLEngineService(self.db)
            result = ml_engine.update_model_configuration(
                model_type=config.model_type,
                parameters=config.parameters,
                is_active=config.is_active,
                config_id=str(config.id),
            )

            if result["success"]:
                logger.info(f"Successfully updated ML engine config {config.id}")
            else:
                logger.error(
                    f"Failed to update ML engine config: {result.get('error')}"
                )

        except Exception as e:
            logger.error(f"Error updating ML engine config: {e}")

    def _send_training_request(
        self, model_type: str, parameters: Dict, training_id: str
    ) -> Dict[str, Any]:
        """Start training directly in the ML engine"""
        try:
            from app.services.ml_engine_service import MLEngineService

            ml_engine = MLEngineService(self.db)
            result = ml_engine.start_training(
                model_type=model_type, parameters=parameters, training_id=training_id
            )

            return result

        except Exception as e:
            return {"success": False, "error": str(e)}

    def _empty_performance_metrics(self) -> Dict[str, Any]:
        """Return empty performance metrics structure"""
        return {
            "period_days": 30,
            "total_recommendations": 0,
            "overall_conversion_rate": 0.0,
            "total_revenue": 0.0,
            "conversion_by_type": {},
            "revenue_by_type": {},
            "daily_metrics": [],
            "top_performing_products": [],
        }

    def _empty_conversion_analytics(self) -> Dict[str, Any]:
        """Return empty conversion analytics structure"""
        return {
            "period_days": 30,
            "total_conversions": 0,
            "total_conversion_value": 0.0,
            "average_conversion_value": 0.0,
            "average_time_to_conversion_minutes": 0.0,
            "conversion_funnel": {},
            "daily_conversions": [],
        }

    def _get_daily_performance_metrics(
        self, start_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get daily aggregated performance metrics"""
        try:
            # Query daily metrics
            daily_metrics = (
                self.db.query(
                    func.date(RecommendationMetrics.created_at).label("date"),
                    func.count(RecommendationMetrics.id).label("total_recommendations"),
                    func.avg(RecommendationMetrics.conversion_rate).label(
                        "avg_conversion_rate"
                    ),
                    func.sum(RecommendationMetrics.revenue_generated).label(
                        "total_revenue"
                    ),
                )
                .filter(RecommendationMetrics.created_at >= start_date)
                .group_by(func.date(RecommendationMetrics.created_at))
                .order_by("date")
                .all()
            )

            return [
                {
                    "date": metric.date.isoformat(),
                    "total_recommendations": metric.total_recommendations,
                    "avg_conversion_rate": float(metric.avg_conversion_rate)
                    if metric.avg_conversion_rate
                    else 0.0,
                    "total_revenue": float(metric.total_revenue)
                    if metric.total_revenue
                    else 0.0,
                }
                for metric in daily_metrics
            ]

        except Exception as e:
            logger.error(f"Error getting daily performance metrics: {e}")
            return []

    def _get_top_performing_products(
        self, start_date: datetime, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top performing products from recommendations"""
        try:
            # This would require more complex JSON querying
            # For now, return empty list - implement based on your specific needs
            return []

        except Exception as e:
            logger.error(f"Error getting top performing products: {e}")
            return []

    def _get_daily_conversion_metrics(
        self, start_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get daily conversion metrics"""
        try:
            daily_conversions = (
                self.db.query(
                    func.date(RecommendationConversion.created_at).label("date"),
                    func.count(RecommendationConversion.id).label("total_conversions"),
                    func.sum(RecommendationConversion.conversion_value).label(
                        "total_value"
                    ),
                    func.avg(RecommendationConversion.time_to_conversion_minutes).label(
                        "avg_time_to_conversion"
                    ),
                )
                .filter(RecommendationConversion.created_at >= start_date)
                .group_by(func.date(RecommendationConversion.created_at))
                .order_by("date")
                .all()
            )

            return [
                {
                    "date": conversion.date.isoformat(),
                    "total_conversions": conversion.total_conversions,
                    "total_value": float(conversion.total_value)
                    if conversion.total_value
                    else 0.0,
                    "avg_time_to_conversion": float(conversion.avg_time_to_conversion)
                    if conversion.avg_time_to_conversion
                    else 0.0,
                }
                for conversion in daily_conversions
            ]

        except Exception as e:
            logger.error(f"Error getting daily conversion metrics: {e}")
            return []

    def _analyze_conversion_funnel(
        self, conversions: List[RecommendationConversion]
    ) -> Dict[str, Any]:
        """Analyze conversion funnel from recommendation conversions"""
        try:
            funnel_steps = {
                "recommendation_shown": len(conversions),
                "product_clicked": 0,
                "added_to_cart": 0,
                "purchased": 0,
            }

            for conversion in conversions:
                if conversion.final_conversion:
                    # Analyze the conversion funnel data
                    funnel_data = conversion.conversion_funnel or {}
                    if funnel_data.get("clicked"):
                        funnel_steps["product_clicked"] += 1
                    if funnel_data.get("added_to_cart"):
                        funnel_steps["added_to_cart"] += 1
                    if funnel_data.get("purchased"):
                        funnel_steps["purchased"] += 1

            # Calculate conversion rates between steps
            total_shown = funnel_steps["recommendation_shown"]
            return {
                "steps": funnel_steps,
                "conversion_rates": {
                    "click_rate": funnel_steps["product_clicked"] / total_shown
                    if total_shown > 0
                    else 0,
                    "cart_rate": funnel_steps["added_to_cart"] / total_shown
                    if total_shown > 0
                    else 0,
                    "purchase_rate": funnel_steps["purchased"] / total_shown
                    if total_shown > 0
                    else 0,
                },
            }

        except Exception as e:
            logger.error(f"Error analyzing conversion funnel: {e}")
            return {"steps": {}, "conversion_rates": {}}
