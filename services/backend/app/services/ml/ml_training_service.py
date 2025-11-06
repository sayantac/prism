"""
ML Training Orchestration Service.
Handles async training jobs, status tracking, and coordination between models.
"""
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

import pandas as pd
from sqlalchemy.orm import Session

from app.models import Order, OrderItem
from app.services.ml.als_model_service import ALSModelService
from app.services.ml.content_model_service import ContentModelService
from app.services.ml.kmeans_model_service import KMeansModelService
from app.services.ml.lightgbm_model_service import LightGBMModelService
from app.services.ml.ml_feature_service import MLFeatureService
from app.services.ml.ml_model_manager import MLModelManager

logger = logging.getLogger(__name__)


class MLTrainingService:
    """Service for orchestrating ML model training."""
    
    def __init__(self, db: Session, models_dir: str = "ml_models"):
        self.db = db
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.training_jobs: Dict[str, Dict] = {}
        
        # Initialize sub-services
        self.model_manager = MLModelManager(models_dir)
        self.feature_service = MLFeatureService(models_dir)
        self.als_service = ALSModelService(models_dir)
        self.lightgbm_service = LightGBMModelService(models_dir)
        self.kmeans_service = KMeansModelService(models_dir)
        self.content_service = ContentModelService(models_dir)
        
        logger.info("MLTrainingService initialized")
    
    def start_training_async(
        self,
        model_type: str,
        model_name: str,
        parameters: Dict[str, Any],
        callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """
        Start training asynchronously.
        
        Args:
            model_type: Type of model (als, lightgbm, kmeans, content)
            model_name: Name for this training run
            parameters: Model hyperparameters
            callback: Optional callback for progress updates
            
        Returns:
            Dictionary with success status and training_id
        """
        try:
            training_id = str(uuid.uuid4())
            
            if training_id in self.training_jobs:
                return {"success": False, "error": "Training already in progress"}

            # Submit training job to thread pool
            future = self.executor.submit(
                self._train_model_sync,
                training_id,
                model_type,
                model_name,
                parameters,
                callback,
            )

            self.training_jobs[training_id] = {
                "future": future,
                "model_type": model_type,
                "model_name": model_name,
                "started_at": datetime.utcnow(),
                "status": "running",
            }

            logger.info(f"Started async training for {model_type} (ID: {training_id})")
            return {"success": True, "training_id": training_id}

        except Exception as e:
            logger.error(f"Error starting async training: {e}")
            return {"success": False, "error": str(e)}

    def get_training_status(self, training_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of training job.
        
        Args:
            training_id: Training job ID
            
        Returns:
            Dictionary with training status or None if not found
        """
        if training_id not in self.training_jobs:
            return None

        job = self.training_jobs[training_id]
        future = job["future"]

        if future.done():
            try:
                result = future.result()
                job["status"] = "completed" if result["success"] else "failed"
                job["result"] = result
            except Exception as e:
                job["status"] = "failed"
                job["error"] = str(e)

        return {
            "training_id": training_id,
            "status": job["status"],
            "model_type": job["model_type"],
            "model_name": job["model_name"],
            "started_at": job["started_at"].isoformat(),
            "result": job.get("result", {}),
            "error": job.get("error"),
        }

    def cancel_training(self, training_id: str) -> Dict[str, Any]:
        """
        Cancel training job.
        
        Args:
            training_id: Training job ID
            
        Returns:
            Dictionary with success status
        """
        try:
            if training_id not in self.training_jobs:
                return {"success": False, "error": "Training job not found"}

            job = self.training_jobs[training_id]
            future = job["future"]

            if not future.done():
                future.cancel()
                job["status"] = "cancelled"
                logger.info(f"Cancelled training job {training_id}")
                return {"success": True, "message": "Training cancelled"}
            else:
                return {"success": False, "error": "Training already completed"}

        except Exception as e:
            logger.error(f"Error cancelling training: {e}")
            return {"success": False, "error": str(e)}

    def get_training_logs(self, training_id: str, lines: int = 100) -> List[str]:
        """
        Get training logs.
        
        Args:
            training_id: Training job ID
            lines: Number of log lines to return
            
        Returns:
            List of log messages
        """
        if training_id not in self.training_jobs:
            return ["Training job not found"]

        job = self.training_jobs[training_id]
        logs = [
            f"Training started at {job['started_at'].isoformat()}",
            f"Model type: {job['model_type']}",
            f"Model name: {job['model_name']}",
            f"Status: {job['status']}",
        ]

        if "result" in job:
            result = job["result"]
            if "metrics" in result:
                logs.extend([f"Metric {k}: {v}" for k, v in result["metrics"].items()])

        return logs[-lines:]

    def list_training_jobs(self) -> List[Dict[str, Any]]:
        """List all training jobs."""
        jobs = []
        for training_id, job in self.training_jobs.items():
            jobs.append({
                "training_id": training_id,
                "model_type": job["model_type"],
                "model_name": job["model_name"],
                "status": job["status"],
                "started_at": job["started_at"].isoformat(),
            })
        return jobs

    def _train_model_sync(
        self,
        training_id: str,
        model_type: str,
        model_name: str,
        parameters: Dict[str, Any],
        callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """Synchronous training function."""
        try:
            logger.info(f"Starting training for {model_type} (ID: {training_id})")

            # Callback for progress updates
            def update_progress(status: str, metrics: Dict = None):
                if callback:
                    callback(
                        training_id,
                        {
                            "status": status,
                            "metrics": metrics,
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                    )

            update_progress("running", {"progress": 0})

            # Load training data
            training_data = self._load_training_data()
            update_progress("running", {"progress": 20, "message": "Data loaded"})

            # Train based on model type
            if model_type == "als":
                result = self._train_als(training_data, parameters, update_progress)
            elif model_type == "lightgbm":
                result = self._train_lightgbm(training_data, parameters, update_progress)
            elif model_type == "kmeans":
                result = self._train_kmeans(training_data, parameters, update_progress)
            elif model_type == "content":
                result = self._train_content(training_data, parameters, update_progress)
            else:
                raise ValueError(f"Unknown model type: {model_type}")

            # Save model if training successful
            if result["success"]:
                model_path = self.model_manager.save_model(
                    result["model"],
                    model_type,
                    training_id
                )
                result["model_path"] = model_path
                
                # Set as active model
                self.model_manager.set_active_model(model_type, result["model"])

            update_progress("completed", result.get("metrics", {}))
            logger.info(f"Completed training for {model_type} (ID: {training_id})")

            return result

        except Exception as e:
            logger.error(f"Error in training {model_type}: {e}")
            if callback:
                callback(
                    training_id,
                    {
                        "status": "failed",
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                )
            return {"success": False, "error": str(e)}

    def _load_training_data(self) -> Dict[str, pd.DataFrame]:
        """Load training data from database."""
        try:
            # Load user-item interactions
            interactions_query = """
                SELECT 
                    o.user_id,
                    oi.product_id,
                    oi.quantity,
                    oi.unit_price,
                    o.created_at as interaction_date,
                    'purchase' as interaction_type
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE o.status IN ('confirmed', 'shipped', 'delivered')
                ORDER BY o.created_at DESC
                LIMIT 100000
            """

            interactions_df = pd.read_sql(interactions_query, self.db.bind)

            # Load product data
            products_query = """
                SELECT 
                    id, name, category_id, brand, price, description, specification
                FROM products 
                WHERE is_active = true
            """

            products_df = pd.read_sql(products_query, self.db.bind)

            # Load user data
            users_query = """
                SELECT 
                    id, created_at, last_active, is_active
                FROM users 
                WHERE is_active = true
                LIMIT 50000
            """

            users_df = pd.read_sql(users_query, self.db.bind)

            # Calculate RFM features
            rfm_df = self.feature_service.calculate_rfm_features(interactions_df)

            logger.info(
                f"Loaded training data: {len(interactions_df)} interactions, "
                f"{len(products_df)} products, {len(users_df)} users"
            )

            return {
                "interactions": interactions_df,
                "products": products_df,
                "users": users_df,
                "rfm": rfm_df,
            }

        except Exception as e:
            logger.error(f"Error loading training data: {e}")
            raise

    def _train_als(
        self,
        data: Dict[str, pd.DataFrame],
        parameters: Dict[str, Any],
        progress_callback: Callable,
    ) -> Dict[str, Any]:
        """Train ALS model."""
        try:
            interactions_df = data["interactions"]
            
            if len(interactions_df) < 100:
                raise ValueError("Insufficient interaction data for ALS training")

            progress_callback(
                "running", {"progress": 30, "message": "Preparing interaction matrix"}
            )

            # Create interaction matrix
            interaction_matrix, user_mapping, item_mapping = (
                self.feature_service.create_interaction_matrix(interactions_df)
            )

            # Train model
            return self.als_service.train_als_model(
                interaction_matrix,
                user_mapping,
                item_mapping,
                parameters,
                progress_callback
            )

        except Exception as e:
            logger.error(f"Error training ALS model: {e}")
            return {"success": False, "error": str(e)}

    def _train_lightgbm(
        self,
        data: Dict[str, pd.DataFrame],
        parameters: Dict[str, Any],
        progress_callback: Callable,
    ) -> Dict[str, Any]:
        """Train LightGBM model."""
        try:
            interactions_df = data["interactions"]
            rfm_df = data["rfm"]

            progress_callback(
                "running", {"progress": 30, "message": "Preparing reorder features"}
            )

            # Create reorder features
            reorder_df = self.feature_service.create_reorder_features(
                interactions_df, rfm_df
            )

            # Train model
            return self.lightgbm_service.train_lightgbm_model(
                reorder_df, parameters, progress_callback
            )

        except Exception as e:
            logger.error(f"Error training LightGBM model: {e}")
            return {"success": False, "error": str(e)}

    def _train_kmeans(
        self,
        data: Dict[str, pd.DataFrame],
        parameters: Dict[str, Any],
        progress_callback: Callable,
    ) -> Dict[str, Any]:
        """Train KMeans model."""
        try:
            rfm_df = data["rfm"]
            
            # Train model
            return self.kmeans_service.train_kmeans_model(
                rfm_df, parameters, progress_callback
            )

        except Exception as e:
            logger.error(f"Error training K-means model: {e}")
            return {"success": False, "error": str(e)}

    def _train_content(
        self,
        data: Dict[str, pd.DataFrame],
        parameters: Dict[str, Any],
        progress_callback: Callable,
    ) -> Dict[str, Any]:
        """Train content-based model."""
        try:
            products_df = data["products"]
            
            # Train model
            return self.content_service.train_content_model(
                products_df, parameters, progress_callback
            )

        except Exception as e:
            logger.error(f"Error training content-based model: {e}")
            return {"success": False, "error": str(e)}
