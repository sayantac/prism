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
            "version": config.version,
            "description": config.description,
            "parameters": config.parameters,
            "is_active": config.is_active,
            "is_default": config.is_default,
            "performance_metrics": config.performance_metrics,
            "training_status": config.training_status,
            "last_trained_at": config.last_trained_at.isoformat() if config.last_trained_at else None,
            "created_at": config.created_at.isoformat() if config.created_at else None,
            "created_by": str(config.created_by) if config.created_by else None,
        }
