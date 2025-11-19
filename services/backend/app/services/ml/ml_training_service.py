"""
ML Training Orchestration Service.

This module coordinates training of all ML models in the system, handling:
- Asynchronous training job execution
- Status tracking and progress reporting
- Data preparation and feature engineering
- Model validation and deployment

Supports training:
- Collaborative Filtering (ALS)
- Content-Based Filtering (TF-IDF + Embeddings)
- User Segmentation (K-Means, RFM)
- Reorder Prediction (LightGBM)
- Frequently Bought Together (FP-Growth)

Example Usage:
    >>> training_service = MLTrainingService(db_session)
    >>> result = training_service.start_training_async(
    ...     model_type="als",
    ...     model_name="collaborative_v1",
    ...     parameters={"factors": 50, "iterations": 15}
    ... )
    >>> # Check status
    >>> status = training_service.get_training_status(result["training_id"])
"""
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Order, OrderItem
from app.services.fbt_recommender_service import FBTRecommenderService
from app.services.ml.als_model_service import ALSModelService
from app.services.ml.content_model_service import ContentModelService
from app.services.ml.kmeans_model_service import KMeansModelService
from app.services.ml.lightgbm_model_service import LightGBMModelService
from app.services.ml.ml_feature_service import MLFeatureService
from app.services.ml.ml_model_manager import MLModelManager

settings = get_settings()
logger = logging.getLogger(__name__)


class MLTrainingService:
    """
    Service for orchestrating ML model training across all algorithms.

    Manages asynchronous training jobs with progress tracking, coordinates
    data loading and preprocessing, and handles model deployment after
    successful training.

    Features:
    - Async training with ThreadPoolExecutor
    - Progress callbacks for real-time updates
    - Automatic model versioning and deployment
    - Training job management (status, logs, cancellation)
    - Comprehensive error handling and logging

    Example:
        >>> service = MLTrainingService(db_session)
        >>> # Train collaborative filtering
        >>> result = service.start_training_async(
        ...     model_type="als",
        ...     model_name="cf_model_v1",
        ...     parameters={"factors": 50}
        ... )
        >>> # Monitor progress
        >>> status = service.get_training_status(result["training_id"])
        >>> print(status["status"])  # "running", "completed", or "failed"
    """
    
    def __init__(self, db: Session, models_dir: str = None):
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
        training_id: Optional[str] = None,
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
            training_id = training_id or str(uuid.uuid4())
            parameters = parameters or {}
            
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
                "parameters": parameters,
            }

            logger.info(f"Started async training for {model_type} (ID: {training_id})")
            return {"success": True, "training_id": training_id}

        except Exception as e:
            logger.error(f"Error starting async training: {e}")
            return {"success": False, "error": str(e)}

    def train_model(
        self,
        model_type: str,
        model_name: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
        callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """Train a model synchronously on the current thread."""

        training_id = str(uuid.uuid4())
        model_name = model_name or f"{model_type}_manual"
        parameters = parameters or {}

        result = self._train_model_sync(
            training_id,
            model_type,
            model_name,
            parameters,
            callback,
        )

        result.setdefault("training_id", training_id)
        result.setdefault("model_type", model_type)
        result.setdefault("model_name", model_name)
        return result

    def train_all_models(
        self,
        parameters_by_model: Optional[Dict[str, Dict[str, Any]]] = None,
        callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """Train all supported models sequentially."""

        parameters_by_model = parameters_by_model or {}
        training_order = ["als", "content", "kmeans", "lightgbm", "fbt"]

        results: Dict[str, Dict[str, Any]] = {}

        for model_type in training_order:
            params = parameters_by_model.get(model_type, {})
            model_name = f"{model_type}_batch_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
            result = self.train_model(
                model_type=model_type,
                model_name=model_name,
                parameters=params,
                callback=callback,
            )
            results[model_type] = result

        success = all(res.get("success") for res in results.values())
        return {"success": success, "results": results}

    def refresh_model_cache(self) -> Dict[str, Any]:
        """Reload persisted models into the in-memory cache."""

        return self.model_manager.reload_active_models()

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
            parameters = parameters or {}

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
            elif model_type == "fbt":
                result = self._train_fbt(training_data, parameters, update_progress)
            else:
                raise ValueError(f"Unknown model type: {model_type}")

            # Save model if training successful
            if result.get("success"):
                result["training_id"] = training_id
                result["model_type"] = model_type
                result["model_name"] = model_name

                if result.get("model"):
                    save_result = self.model_manager.save_model(
                        result["model"],
                        model_type,
                        training_id,
                        metrics=result.get("metrics"),
                    )
                    result["model_path"] = save_result["model_path"]
                    result["model"] = save_result["model"]

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
                    id, created_at, last_login, is_active
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
        """
        Train content-based filtering model.

        Args:
            data: Training data dictionary
            parameters: Model hyperparameters
            progress_callback: Progress update callback

        Returns:
            Training result dictionary
        """
        try:
            products_df = data["products"]

            # Train model
            return self.content_service.train_content_model(
                products_df, parameters, progress_callback
            )

        except Exception as e:
            logger.error(f"Error training content-based model: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _train_fbt(
        self,
        data: Dict[str, pd.DataFrame],
        parameters: Dict[str, Any],
        progress_callback: Callable,
    ) -> Dict[str, Any]:
        """
        Train Frequently Bought Together (FBT) model using FP-Growth.

        Args:
            data: Training data dictionary (unused, FBT loads from DB directly)
            parameters: FP-Growth parameters (min_support, min_confidence, min_lift)
            progress_callback: Progress update callback

        Returns:
            Training result dictionary with success status and statistics
        """
        try:
            progress_callback(
                "running", {"progress": 30, "message": "Training FP-Growth model"}
            )

            # Initialize FBT service
            fbt_service = FBTRecommenderService(
                db=self.db,
                min_support=parameters.get("min_support", settings.FBT_MIN_SUPPORT),
                min_confidence=parameters.get(
                    "min_confidence", settings.FBT_MIN_CONFIDENCE
                ),
                min_lift=parameters.get("min_lift", settings.FBT_MIN_LIFT),
                max_itemset_size=parameters.get(
                    "max_itemset_size", settings.FBT_MAX_ITEMSET_SIZE
                ),
            )

            progress_callback(
                "running", {"progress": 50, "message": "Mining association rules"}
            )

            # Train model (force retrain)
            fbt_service.train(force_retrain=True)
            fbt_service.save_to_cache()

            progress_callback(
                "running", {"progress": 90, "message": "Finalizing model"}
            )

            # Get model statistics
            stats = fbt_service.get_model_statistics()

            model_payload = {
                "cache_file": fbt_service.cache_file,
                "parameters": {
                    "min_support": fbt_service.min_support,
                    "min_confidence": fbt_service.min_confidence,
                    "min_lift": fbt_service.min_lift,
                    "max_itemset_size": fbt_service.max_itemset_size,
                },
                "trained_at": datetime.utcnow().isoformat(),
            }

            return {
                "success": True,
                "model": model_payload,
                "metrics": {
                    "n_products_with_recommendations": stats.get(
                        "n_products_with_recommendations", 0
                    ),
                    "total_recommendations": stats.get("total_recommendations", 0),
                    "avg_recommendations_per_product": stats.get(
                        "avg_recommendations_per_product", 0
                    ),
                },
            }

        except Exception as e:
            logger.error(f"Error training FBT model: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

