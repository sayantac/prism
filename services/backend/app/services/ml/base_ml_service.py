"""Base ML Service with common functionality for all ML services."""
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _resolve_models_dir(models_dir: Optional[str]) -> Path:
    """Resolve the directory used to persist trained models."""

    settings = get_settings()

    configured_dirs: list[str] = []
    if models_dir:
        configured_dirs.append(models_dir)
    if settings.MODEL_STORAGE_PATH:
        configured_dirs.append(settings.MODEL_STORAGE_PATH)
    configured_dirs.append("ml_models")

    backend_root = Path(__file__).resolve().parents[3]

    resolved_candidates: list[Path] = []
    for candidate in configured_dirs:
        if not candidate:
            continue
        path = Path(candidate)
        if not path.is_absolute():
            path = backend_root / path
        resolved_candidates.append(path)

    # Prefer directories that already contain model artifacts
    for path in resolved_candidates:
        if path.exists():
            try:
                # Look for previously saved pickle artifacts
                if any(path.glob("*.pkl")):
                    path.mkdir(parents=True, exist_ok=True)
                    return path
            except OSError:
                logger.warning("Unable to inspect models directory at %s", path, exc_info=True)

    # Otherwise create or reuse the first writable candidate
    for path in resolved_candidates:
        try:
            path.mkdir(parents=True, exist_ok=True)
            return path
        except OSError:
            logger.warning("Unable to create models directory at %s", path, exc_info=True)

    # Fallback to backend_root/ml_models as a last resort
    fallback = backend_root / "ml_models"
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback


class BaseMLService:
    """Base class for ML services with common utilities."""

    def __init__(self, models_dir: Optional[str] = None):
        resolved_dir = _resolve_models_dir(models_dir)
        self.models_dir = str(resolved_dir)
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
