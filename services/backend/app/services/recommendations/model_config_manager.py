"""
Model Config Manager Service.
Handles CRUD for ML model configurations.
"""
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.ml_models import MLModelConfig
from app.services.recommendations.base_recommendation_service import BaseRecommendationService

logger = logging.getLogger(__name__)


class ModelConfigManager(BaseRecommendationService):
    """Service for managing ML model configurations."""
    
    def get_model_configs(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """Get all ML model configurations."""
        query = self.db.query(MLModelConfig)

        if active_only:
            query = query.filter(MLModelConfig.is_active == True)

        configs = query.order_by(MLModelConfig.created_at.desc()).all()
        return [self._serialize_model_config(config) for config in configs]

    def create_model_config(
        self, config_data: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """Create a new ML model configuration."""
        try:
            required_fields = ["name", "model_type", "parameters"]
            for field in required_fields:
                if field not in config_data:
                    raise ValueError(f"Missing required field: {field}")

            new_config = MLModelConfig(
                id=uuid.uuid4(),
                name=config_data["name"],
                model_type=config_data["model_type"],
                parameters=config_data["parameters"],
                is_active=config_data.get("is_active", False),
                is_default=config_data.get("is_default", False),
                description=config_data.get("description", ""),
                created_by=uuid.UUID(user_id),
            )

            self.db.add(new_config)
            self.db.commit()
            self.db.refresh(new_config)

            self.logger.info(f"Created model config: {new_config.name}")
            return self._serialize_model_config(new_config)

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating model config: {e}")
            raise

    def update_model_config(
        self, config_id: str, config_data: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """Update model configuration."""
        try:
            config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(config_id))
                .first()
            )
            if not config:
                raise ValueError(f"Model config not found: {config_id}")

            updateable_fields = [
                "name",
                "model_type",
                "parameters",
                "is_active",
                "is_default",
                "description",
            ]

            for field in updateable_fields:
                if field in config_data:
                    setattr(config, field, config_data[field])

            config.updated_by = uuid.UUID(user_id)
            config.updated_at = datetime.utcnow()
            self.db.commit()

            self.logger.info(f"Updated model config: {config_id}")
            return self._serialize_model_config(config)

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating model config: {e}")
            raise

    def activate_model_config(self, config_id: str, user_id: str) -> Dict[str, Any]:
        """Activate a model configuration."""
        try:
            config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(config_id))
                .first()
            )
            if not config:
                raise ValueError(f"Model config not found: {config_id}")

            # Deactivate others of same type
            self.db.query(MLModelConfig).filter(
                and_(
                    MLModelConfig.model_type == config.model_type,
                    MLModelConfig.id != config.id,
                )
            ).update({"is_active": False})

            config.is_active = True
            config.updated_by = uuid.UUID(user_id)
            config.updated_at = datetime.utcnow()
            self.db.commit()

            self.logger.info(f"Activated model config: {config_id}")
            return self._serialize_model_config(config)

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error activating model config: {e}")
            raise

    def deactivate_model_config(self, config_id: str, user_id: str) -> Dict[str, Any]:
        """Deactivate model configuration."""
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

            self.logger.info(f"Deactivated model config: {config_id}")
            return self._serialize_model_config(config)

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deactivating model config: {e}")
            raise

    def delete_model_config(self, config_id: str) -> bool:
        """Delete model configuration."""
        try:
            config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == uuid.UUID(config_id))
                .first()
            )
            if not config:
                return False

            if config.is_active:
                raise ValueError("Cannot delete active model config")

            self.db.delete(config)
            self.db.commit()

            self.logger.info(f"Deleted model config: {config_id}")
            return True

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting model config: {e}")
            raise
