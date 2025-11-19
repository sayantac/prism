"""
Base Recommendation Service.
"""
import logging
from datetime import datetime
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.models.ml_models import MLModelConfig

logger = logging.getLogger(__name__)


class BaseRecommendationService:
    """Base class for recommendation services."""
    
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def _serialize_model_config(self, config: MLModelConfig) -> Dict[str, Any]:
        """Serialize model config to dictionary."""
        return {
            "id": str(config.id),
            "name": config.name,
            "model_type": config.model_type,
            "version": config.model_version,
            "description": config.description,
            "parameters": config.parameters,
            "is_active": config.is_active,
            "is_default": config.is_default,
            "accuracy_score": float(config.accuracy_score) if config.accuracy_score else None,
            "precision_score": float(config.precision_score) if config.precision_score else None,
            "recall_score": float(config.recall_score) if config.recall_score else None,
            "last_trained": config.last_trained.isoformat() if config.last_trained else None,
            "training_data_version": config.training_data_version,
            "created_at": config.created_at.isoformat() if config.created_at else None,
            "created_by": str(config.created_by) if config.created_by else None,
        }
