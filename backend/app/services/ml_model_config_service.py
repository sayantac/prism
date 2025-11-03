# app/services/ml_model_config_service.py
"""
Service for managing ML model configurations and parameters
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.ml_models import MLModelConfig, ModelTrainingHistory

settings = get_settings()
logger = logging.getLogger(__name__)


class MLModelConfigService:
    """Manage ML model configurations and parameters"""

    def __init__(self, db: Session):
        self.db = db
        self.default_configs = self._load_default_configurations()

    def _load_default_configurations(self) -> Dict[str, Dict[str, Any]]:
        """Load default configurations for different model types"""
        return {
            "als": {
                "factors": 100,
                "regularization": 0.01,
                "iterations": 50,
                "alpha": 1.0,
                "random_state": 42,
                "use_native": True,
                "use_cg": True,
                "use_gpu": False,
            },
            "lightgbm": {
                "objective": "binary",
                "metric": "binary_logloss",
                "boosting_type": "gbdt",
                "num_leaves": 31,
                "learning_rate": 0.05,
                "feature_fraction": 0.9,
                "bagging_fraction": 0.8,
                "bagging_freq": 5,
                "max_depth": -1,
                "min_data_in_leaf": 20,
                "verbose": 0,
                "num_boost_round": 1000,
                "early_stopping_rounds": 100,
            },
            "kmeans": {
                "n_clusters": 8,
                "init": "k-means++",
                "n_init": 10,
                "max_iter": 300,
                "tol": 1e-4,
                "random_state": 42,
                "algorithm": "auto",
            },
            "content_based": {
                "similarity_threshold": 0.5,
                "max_recommendations": 50,
                "use_tfidf": True,
                "ngram_range": [1, 2],
                "min_df": 2,
                "max_df": 0.8,
                "stop_words": "english",
            },
        }

    def get_model_types(self) -> List[Dict[str, Any]]:
        """Get available model types with descriptions"""
        return [
            {
                "type": "als",
                "name": "Alternating Least Squares",
                "description": "Collaborative filtering using matrix factorization",
                "use_case": "User-item recommendations based on implicit feedback",
                "supported_parameters": list(self.default_configs["als"].keys()),
            },
            {
                "type": "lightgbm",
                "name": "LightGBM Reorder Prediction",
                "description": "Gradient boosting for predicting user reorder behavior",
                "use_case": "Predict which products users are likely to reorder",
                "supported_parameters": list(self.default_configs["lightgbm"].keys()),
            },
            {
                "type": "kmeans",
                "name": "K-Means Clustering",
                "description": "User segmentation using RFM analysis",
                "use_case": "Group users based on recency, frequency, and monetary behavior",
                "supported_parameters": list(self.default_configs["kmeans"].keys()),
            },
            {
                "type": "content_based",
                "name": "Content-Based Filtering",
                "description": "Product recommendations based on content similarity",
                "use_case": "Recommend similar products based on features and descriptions",
                "supported_parameters": list(
                    self.default_configs["content_based"].keys()
                ),
            },
        ]

    def get_default_config(self, model_type: str) -> Dict[str, Any]:
        """Get default configuration for a model type"""
        if model_type not in self.default_configs:
            raise ValueError(f"Unknown model type: {model_type}")

        return self.default_configs[model_type].copy()

    def validate_config_parameters(
        self, model_type: str, parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate and sanitize configuration parameters"""
        if model_type not in self.default_configs:
            raise ValueError(f"Unknown model type: {model_type}")

        validated_params = {}
        default_params = self.default_configs[model_type]

        # Validate ALS parameters
        if model_type == "als":
            validated_params["factors"] = self._validate_int_range(
                parameters.get("factors", default_params["factors"]), 10, 500
            )
            validated_params["regularization"] = self._validate_float_range(
                parameters.get("regularization", default_params["regularization"]),
                0.001,
                1.0,
            )
            validated_params["iterations"] = self._validate_int_range(
                parameters.get("iterations", default_params["iterations"]), 10, 200
            )
            validated_params["alpha"] = self._validate_float_range(
                parameters.get("alpha", default_params["alpha"]), 0.1, 10.0
            )
            validated_params["random_state"] = parameters.get(
                "random_state", default_params["random_state"]
            )
            validated_params["use_native"] = bool(
                parameters.get("use_native", default_params["use_native"])
            )
            validated_params["use_cg"] = bool(
                parameters.get("use_cg", default_params["use_cg"])
            )
            validated_params["use_gpu"] = bool(
                parameters.get("use_gpu", default_params["use_gpu"])
            )

        # Validate LightGBM parameters
        elif model_type == "lightgbm":
            validated_params["objective"] = parameters.get(
                "objective", default_params["objective"]
            )
            validated_params["metric"] = parameters.get(
                "metric", default_params["metric"]
            )
            validated_params["boosting_type"] = parameters.get(
                "boosting_type", default_params["boosting_type"]
            )
            validated_params["num_leaves"] = self._validate_int_range(
                parameters.get("num_leaves", default_params["num_leaves"]), 10, 1000
            )
            validated_params["learning_rate"] = self._validate_float_range(
                parameters.get("learning_rate", default_params["learning_rate"]),
                0.01,
                0.5,
            )
            validated_params["feature_fraction"] = self._validate_float_range(
                parameters.get("feature_fraction", default_params["feature_fraction"]),
                0.1,
                1.0,
            )
            validated_params["bagging_fraction"] = self._validate_float_range(
                parameters.get("bagging_fraction", default_params["bagging_fraction"]),
                0.1,
                1.0,
            )
            validated_params["bagging_freq"] = self._validate_int_range(
                parameters.get("bagging_freq", default_params["bagging_freq"]), 1, 20
            )
            validated_params["max_depth"] = parameters.get(
                "max_depth", default_params["max_depth"]
            )
            validated_params["min_data_in_leaf"] = self._validate_int_range(
                parameters.get("min_data_in_leaf", default_params["min_data_in_leaf"]),
                1,
                100,
            )
            validated_params["verbose"] = parameters.get(
                "verbose", default_params["verbose"]
            )
            validated_params["num_boost_round"] = self._validate_int_range(
                parameters.get("num_boost_round", default_params["num_boost_round"]),
                100,
                5000,
            )
            validated_params["early_stopping_rounds"] = self._validate_int_range(
                parameters.get(
                    "early_stopping_rounds", default_params["early_stopping_rounds"]
                ),
                10,
                500,
            )

        # Validate K-Means parameters
        elif model_type == "kmeans":
            validated_params["n_clusters"] = self._validate_int_range(
                parameters.get("n_clusters", default_params["n_clusters"]), 2, 20
            )
            validated_params["init"] = parameters.get("init", default_params["init"])
            validated_params["n_init"] = self._validate_int_range(
                parameters.get("n_init", default_params["n_init"]), 1, 50
            )
            validated_params["max_iter"] = self._validate_int_range(
                parameters.get("max_iter", default_params["max_iter"]), 100, 1000
            )
            validated_params["tol"] = self._validate_float_range(
                parameters.get("tol", default_params["tol"]), 1e-6, 1e-2
            )
            validated_params["random_state"] = parameters.get(
                "random_state", default_params["random_state"]
            )
            validated_params["algorithm"] = parameters.get(
                "algorithm", default_params["algorithm"]
            )

        # Validate Content-Based parameters
        elif model_type == "content_based":
            validated_params["similarity_threshold"] = self._validate_float_range(
                parameters.get(
                    "similarity_threshold", default_params["similarity_threshold"]
                ),
                0.1,
                0.9,
            )
            validated_params["max_recommendations"] = self._validate_int_range(
                parameters.get(
                    "max_recommendations", default_params["max_recommendations"]
                ),
                10,
                100,
            )
            validated_params["use_tfidf"] = bool(
                parameters.get("use_tfidf", default_params["use_tfidf"])
            )
            validated_params["ngram_range"] = parameters.get(
                "ngram_range", default_params["ngram_range"]
            )
            validated_params["min_df"] = self._validate_int_range(
                parameters.get("min_df", default_params["min_df"]), 1, 10
            )
            validated_params["max_df"] = self._validate_float_range(
                parameters.get("max_df", default_params["max_df"]), 0.1, 1.0
            )
            validated_params["stop_words"] = parameters.get(
                "stop_words", default_params["stop_words"]
            )

        return validated_params

    def create_config_preset(
        self,
        name: str,
        model_type: str,
        parameters: Dict[str, Any],
        description: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """Create a configuration preset"""
        try:
            # Validate parameters
            validated_params = self.validate_config_parameters(model_type, parameters)

            # Check if name already exists
            existing = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.model_name == name)
                .first()
            )

            if existing:
                raise ValueError(
                    f"Configuration preset with name '{name}' already exists"
                )

            # Create new preset
            preset = MLModelConfig(
                id=uuid.uuid4(),
                model_name=name,
                model_type=model_type,
                parameters=validated_params,
                description=description,
                training_schedule="manual",
                is_active=False,
                created_by=uuid.UUID(user_id),
            )

            self.db.add(preset)
            self.db.commit()
            self.db.refresh(preset)

            logger.info(f"Created configuration preset: {name} for {model_type}")
            return self._serialize_config(preset)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating config preset: {e}")
            raise

    def clone_config(
        self, config_id: str, new_name: str, user_id: str
    ) -> Dict[str, Any]:
        """Clone an existing configuration"""
        try:
            original = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(config_id))
                .first()
            )

            if not original:
                raise ValueError(f"Configuration not found: {config_id}")

            # Check if new name already exists
            existing = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.model_name == new_name)
                .first()
            )

            if existing:
                raise ValueError(f"Configuration with name '{new_name}' already exists")

            # Create clone
            cloned = MLModelConfig(
                id=uuid.uuid4(),
                model_name=new_name,
                model_type=original.model_type,
                parameters=original.parameters.copy(),
                description=f"Cloned from {original.model_name}",
                training_schedule=original.training_schedule,
                performance_threshold=original.performance_threshold,
                is_active=False,  # Clones are never active by default
                created_by=uuid.UUID(user_id),
            )

            self.db.add(cloned)
            self.db.commit()
            self.db.refresh(cloned)

            logger.info(f"Cloned configuration {config_id} to {new_name}")
            return self._serialize_config(cloned)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error cloning config: {e}")
            raise

    def export_config(self, config_id: str) -> Dict[str, Any]:
        """Export configuration as JSON"""
        config = (
            self.db.query(MLModelConfig)
            .filter(MLModelConfig.id == uuid.UUID(config_id))
            .first()
        )

        if not config:
            raise ValueError(f"Configuration not found: {config_id}")

        return {
            "export_version": "1.0",
            "exported_at": datetime.utcnow().isoformat(),
            "model_name": config.model_name,
            "model_type": config.model_type,
            "parameters": config.parameters,
            "description": config.description,
            "training_schedule": config.training_schedule,
            "performance_threshold": float(config.performance_threshold)
            if config.performance_threshold
            else 0.0,
        }

    def import_config(
        self,
        config_data: Dict[str, Any],
        user_id: str,
        override_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Import configuration from JSON"""
        try:
            # Validate import data
            required_fields = ["model_type", "parameters"]
            for field in required_fields:
                if field not in config_data:
                    raise ValueError(f"Missing required field in import data: {field}")

            # Validate parameters
            validated_params = self.validate_config_parameters(
                config_data["model_type"], config_data["parameters"]
            )

            # Determine name
            import_name = override_name or config_data.get(
                "model_name",
                f"Imported_{config_data['model_type']}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            )

            # Check if name exists
            existing = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.model_name == import_name)
                .first()
            )

            if existing:
                raise ValueError(
                    f"Configuration with name '{import_name}' already exists"
                )

            # Create imported config
            imported = MLModelConfig(
                id=uuid.uuid4(),
                model_name=import_name,
                model_type=config_data["model_type"],
                parameters=validated_params,
                description=config_data.get("description", "Imported configuration"),
                training_schedule=config_data.get("training_schedule", "manual"),
                performance_threshold=config_data.get("performance_threshold", 0.0),
                is_active=False,
                created_by=uuid.UUID(user_id),
            )

            self.db.add(imported)
            self.db.commit()
            self.db.refresh(imported)

            logger.info(f"Imported configuration: {import_name}")
            return self._serialize_config(imported)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error importing config: {e}")
            raise

    def get_config_performance_history(
        self, config_id: str, days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get performance history for a configuration"""
        try:
            history = (
                self.db.query(ModelTrainingHistory)
                .filter(
                    and_(
                        ModelTrainingHistory.model_config_id == uuid.UUID(config_id),
                        ModelTrainingHistory.started_at
                        >= datetime.utcnow() - timedelta(days=days),
                    )
                )
                .order_by(desc(ModelTrainingHistory.started_at))
                .all()
            )

            return [
                {
                    "training_id": str(record.id),
                    "started_at": record.started_at.isoformat(),
                    "completed_at": record.completed_at.isoformat()
                    if record.completed_at
                    else None,
                    "status": record.training_status,
                    "duration_seconds": record.training_duration_seconds,
                    "metrics": record.training_metrics,
                    "performance": record.model_performance,
                }
                for record in history
            ]

        except Exception as e:
            logger.error(f"Error getting config performance history: {e}")
            return []

    def compare_configs(self, config_ids: List[str]) -> Dict[str, Any]:
        """Compare multiple configurations"""
        try:
            configs = []
            for config_id in config_ids:
                config = (
                    self.db.query(MLModelConfig)
                    .filter(MLModelConfig.id == uuid.UUID(config_id))
                    .first()
                )
                if config:
                    configs.append(config)

            if not configs:
                raise ValueError("No valid configurations found")

            comparison = {
                "configs": [self._serialize_config(config) for config in configs],
                "parameter_comparison": self._compare_parameters(configs),
                "performance_comparison": self._compare_performance(configs),
            }

            return comparison

        except Exception as e:
            logger.error(f"Error comparing configs: {e}")
            raise

    def _validate_int_range(self, value: Any, min_val: int, max_val: int) -> int:
        """Validate integer parameter within range"""
        try:
            val = int(value)
            return max(min_val, min(max_val, val))
        except (ValueError, TypeError):
            raise ValueError(f"Invalid integer value: {value}")

    def _validate_float_range(
        self, value: Any, min_val: float, max_val: float
    ) -> float:
        """Validate float parameter within range"""
        try:
            val = float(value)
            return max(min_val, min(max_val, val))
        except (ValueError, TypeError):
            raise ValueError(f"Invalid float value: {value}")

    def _serialize_config(self, config: MLModelConfig) -> Dict[str, Any]:
        """Serialize configuration to dictionary"""
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
            "description": config.description,
            "created_at": config.created_at.isoformat(),
            "updated_at": config.updated_at.isoformat() if config.updated_at else None,
            "last_trained_at": config.last_trained_at.isoformat()
            if config.last_trained_at
            else None,
            "next_training_at": config.next_training_at.isoformat()
            if config.next_training_at
            else None,
            "model_version": config.model_version,
        }

    def _compare_parameters(self, configs: List[MLModelConfig]) -> Dict[str, Any]:
        """Compare parameters across configurations"""
        if not configs:
            return {}

        # Get all unique parameter keys
        all_params = set()
        for config in configs:
            all_params.update(config.parameters.keys())

        comparison = {}
        for param in all_params:
            comparison[param] = {}
            for config in configs:
                comparison[param][config.model_name] = config.parameters.get(
                    param, "Not Set"
                )

        return comparison

    def _compare_performance(self, configs: List[MLModelConfig]) -> Dict[str, Any]:
        """Compare performance metrics across configurations"""
        performance_data = {}

        for config in configs:
            # Get latest training history for each config
            latest_training = (
                self.db.query(ModelTrainingHistory)
                .filter(ModelTrainingHistory.model_config_id == config.id)
                .order_by(desc(ModelTrainingHistory.started_at))
                .first()
            )

            performance_data[config.model_name] = {
                "last_trained": latest_training.started_at.isoformat()
                if latest_training
                else None,
                "status": latest_training.training_status
                if latest_training
                else "Never Trained",
                "metrics": latest_training.model_performance if latest_training else {},
                "duration_seconds": latest_training.training_duration_seconds
                if latest_training
                else 0,
            }

        return performance_data
