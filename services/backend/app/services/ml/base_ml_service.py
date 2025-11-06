"""
Base ML Service with common functionality for all ML services.
"""
import logging
import os
from typing import Any, Dict

logger = logging.getLogger(__name__)


class BaseMLService:
    """Base class for ML services with common utilities."""
    
    def __init__(self, models_dir: str = "ml_models"):
        self.models_dir = models_dir
        os.makedirs(self.models_dir, exist_ok=True)
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def _get_model_path(self, model_type: str, training_id: str = None) -> str:
        """Get the file path for a model."""
        if training_id:
            return os.path.join(self.models_dir, f"{model_type}_{training_id}.pkl")
        return os.path.join(self.models_dir, f"{model_type}_latest.pkl")
    
    def _log_training_progress(self, step: str, metrics: Dict[str, Any] = None):
        """Log training progress."""
        msg = f"Training step: {step}"
        if metrics:
            msg += f" | Metrics: {metrics}"
        self.logger.info(msg)
