"""ML Model Manager - Handles model loading, saving, and caching with DB integration."""
import hashlib
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

import joblib
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.ml_models import MLModelConfig, ModelTrainingHistory, ModelVersion
from app.services.ml.base_ml_service import BaseMLService

logger = logging.getLogger(__name__)
settings = get_settings()


class MLModelManager(BaseMLService):
    """Singleton manager for ML model persistence, caching, and version control."""

    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(MLModelManager, cls).__new__(cls)
        return cls._instance

    def __init__(self, models_dir: str = None, db: Session = None):
        # Prevent re-initialization
        if self._initialized:
            return

        super().__init__(models_dir)
        self.active_models: Dict[str, Any] = {}
        self.db = db  # Optional DB session
        self._initialized = True

        # Load saved models on first initialization
        if not self.active_models:
            self._load_saved_models()

        self.logger.info("MLModelManager singleton initialized")

    @classmethod
    def get_instance(cls, models_dir: str = None, db: Session = None):
        """Get or create the singleton instance."""
        if cls._instance is None:
            cls._instance = cls(models_dir=models_dir, db=db)
        elif db is not None and cls._instance.db is None:
            # Update DB session if provided
            cls._instance.db = db
        return cls._instance

    @classmethod
    def reset_instance(cls):
        """Reset singleton instance (for testing)."""
        cls._instance = None
        cls._initialized = False

    def set_db_session(self, db: Session):
        """Set or update the database session."""
        self.db = db

    def save_model(
        self,
        model_data: Dict[str, Any],
        model_type: str,
        training_id: str,
        config_id: Optional[UUID] = None,
        training_history_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        metrics: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Persist a trained model artifact and update active cache with DB tracking.

        Args:
            model_data: Model data to save
            model_type: Type of model (als, kmeans, etc.)
            training_id: Training run identifier
            config_id: ML config ID from database
            training_history_id: Training history record ID
            user_id: User who created the model
            metrics: Performance metrics

        Returns:
            Dictionary with save results and paths
        """
        try:
            model_payload = dict(model_data or {})
            metadata = {
                "model_type": model_type,
                "training_id": training_id,
                "saved_at": datetime.utcnow().isoformat(),
                "metrics": metrics or model_payload.get("metrics"),
                "config_id": str(config_id) if config_id else None,
            }
            model_payload.update({k: v for k, v in metadata.items() if v is not None})

            # Save model file
            model_path = self._get_model_path(model_type, training_id)
            latest_path = self._get_model_path(model_type)

            joblib.dump(model_payload, model_path, compress=3)
            joblib.dump(model_payload, latest_path, compress=3)

            # Get file size
            file_size = os.path.getsize(model_path)

            # Update active cache
            self.active_models[model_type] = model_payload

            # Save version to database if DB session available
            version_id = None
            if self.db and config_id:
                version_id = self._save_model_version_to_db(
                    config_id=config_id,
                    training_history_id=training_history_id,
                    version_number=training_id,
                    file_path=model_path,
                    file_size=file_size,
                    model_metadata=model_payload.get("model", {}),
                    performance_metrics=metrics,
                    config_snapshot=model_payload.get("parameters", {}),
                    user_id=user_id,
                )

                # Cleanup old versions
                self._cleanup_old_versions(config_id)

            self.logger.info(f"Model saved: {model_path} (DB version: {version_id})")

            return {
                "model_path": model_path,
                "latest_path": latest_path,
                "model": model_payload,
                "version_id": version_id,
                "file_size": file_size,
            }

        except Exception as exc:
            self.logger.error(f"Error saving model: {exc}", exc_info=True)
            raise

    def load_model(
        self,
        model_type: str,
        training_id: str = None,
        version_id: UUID = None
    ) -> Optional[Dict[str, Any]]:
        """
        Load a model from disk or database.

        Args:
            model_type: Type of model to load
            training_id: Specific training ID, or None for latest
            version_id: Specific version ID from database

        Returns:
            Model data dictionary or None if not found
        """
        try:
            # Try to load from DB version if version_id provided
            if version_id and self.db:
                return self._load_model_from_db_version(version_id)

            # Load from file system
            model_path = self._get_model_path(model_type, training_id)

            if not os.path.exists(model_path):
                self.logger.warning(f"Model not found: {model_path}")
                return None

            model_data = joblib.load(model_path)
            self.logger.info(f"Model loaded: {model_path}")
            return model_data

        except Exception as exc:
            self.logger.error(f"Error loading model: {exc}", exc_info=True)
            return None

    def load_model_with_config(
        self,
        model_type: str,
        parameters: Dict[str, Any],
        config_id: str
    ) -> Dict[str, Any]:
        """
        Load or create a model with specific configuration.

        Args:
            model_type: Type of model
            parameters: Model hyperparameters
            config_id: Configuration identifier

        Returns:
            Dictionary with success status and message
        """
        try:
            model_data = self.load_model(model_type)

            if model_data:
                model_data["parameters"] = parameters
                model_data["config_id"] = config_id
                self.active_models[model_type] = model_data
                self.logger.info(f"Loaded {model_type} with config {config_id}")
            else:
                self.active_models[model_type] = {
                    "model_type": model_type,
                    "parameters": parameters,
                    "config_id": config_id,
                    "model": None,
                    "status": "not_trained",
                }
                self.logger.info(f"Created placeholder for {model_type}")

            return {
                "success": True,
                "message": f"{model_type} configuration loaded",
                "has_trained_model": model_data is not None,
            }

        except Exception as exc:
            self.logger.error(f"Error loading model with config: {exc}", exc_info=True)
            return {"success": False, "error": str(exc)}

    def get_active_model(self, model_type: str) -> Optional[Dict[str, Any]]:
        """Get active model from cache."""
        return self.active_models.get(model_type)

    def set_active_model(self, model_type: str, model_data: Dict[str, Any]):
        """Set active model in cache."""
        self.active_models[model_type] = model_data
        self.logger.info(f"Set active model: {model_type}")

    def remove_active_model(self, model_type: str):
        """Remove model from active cache."""
        if model_type in self.active_models:
            del self.active_models[model_type]
            self.logger.info(f"Removed active model: {model_type}")

    def _load_saved_models(self):
        """Load all saved models on startup."""
        model_types = ["als", "lightgbm", "kmeans", "content", "fbt"]

        for model_type in model_types:
            model_data = self.load_model(model_type)
            if model_data:
                self.active_models[model_type] = model_data
                self.logger.info(f"Pre-loaded {model_type} model")

    def list_saved_models(self, model_type: Optional[str] = None) -> Dict[str, list]:
        """
        List all saved model files.

        Args:
            model_type: Optional filter for specific model type

        Returns:
            Dictionary mapping model types to list of saved versions
        """
        model_types_to_check = (
            [model_type] if model_type else ["als", "lightgbm", "kmeans", "content", "fbt"]
        )
        models = {mt: [] for mt in model_types_to_check}

        if not os.path.exists(self.models_dir):
            return models

        for filename in os.listdir(self.models_dir):
            if filename.endswith(".pkl"):
                for mt in model_types_to_check:
                    if filename.startswith(mt):
                        file_path = os.path.join(self.models_dir, filename)
                        file_stat = os.stat(file_path)
                        models[mt].append(
                            {
                                "filename": filename,
                                "path": file_path,
                                "size_bytes": file_stat.st_size,
                                "modified_at": datetime.fromtimestamp(
                                    file_stat.st_mtime
                                ).isoformat(),
                            }
                        )

        return models

    def delete_model(self, model_type: str, training_id: str = None) -> bool:
        """Delete a saved model file."""
        try:
            model_path = self._get_model_path(model_type, training_id)

            if os.path.exists(model_path):
                os.remove(model_path)
                self.logger.info(f"Deleted model: {model_path}")

                # Remove from active models if present
                if model_type in self.active_models:
                    active_training_id = self.active_models[model_type].get("training_id")
                    if active_training_id == training_id:
                        self.remove_active_model(model_type)

                return True
            else:
                self.logger.warning(f"Model not found for deletion: {model_path}")
                return False

        except Exception as e:
            self.logger.error(f"Error deleting model: {e}")
            return False

    def reload_active_models(self) -> Dict[str, Any]:
        """Force reload of saved models into the active cache."""
        self.active_models.clear()
        self._load_saved_models()
        return self.active_models

    # ========== Database Integration Methods ==========

    def _save_model_version_to_db(
        self,
        config_id: UUID,
        training_history_id: Optional[UUID],
        version_number: str,
        file_path: str,
        file_size: int,
        model_metadata: Dict[str, Any],
        performance_metrics: Dict[str, Any],
        config_snapshot: Dict[str, Any],
        user_id: Optional[UUID],
    ) -> Optional[UUID]:
        """Save model version record to database."""
        if not self.db:
            return None

        try:
            # Create version record
            model_version = ModelVersion(
                model_config_id=config_id,
                training_history_id=training_history_id,
                version_number=version_number,
                file_path=file_path,
                file_size_bytes=file_size,
                is_active=True,  # New versions are active by default
                model_metadata=model_metadata,
                performance_metrics=performance_metrics,
                config_snapshot=config_snapshot,
                created_by=user_id,
            )

            # Deactivate other versions for this config
            self.db.query(ModelVersion).filter(
                ModelVersion.model_config_id == config_id,
                ModelVersion.is_active == True,
            ).update({"is_active": False})

            self.db.add(model_version)
            self.db.commit()
            self.db.refresh(model_version)

            self.logger.info(
                f"Saved model version {version_number} to DB with ID {model_version.id}"
            )
            return model_version.id

        except Exception as e:
            self.logger.error(f"Error saving model version to DB: {e}", exc_info=True)
            self.db.rollback()
            return None

    def _load_model_from_db_version(self, version_id: UUID) -> Optional[Dict[str, Any]]:
        """Load model from database version record."""
        if not self.db:
            return None

        try:
            version = (
                self.db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
            )

            if not version or not os.path.exists(version.file_path):
                self.logger.warning(f"Model version {version_id} not found or file missing")
                return None

            model_data = joblib.load(version.file_path)
            self.logger.info(f"Loaded model from DB version {version_id}")
            return model_data

        except Exception as e:
            self.logger.error(f"Error loading model from DB version: {e}", exc_info=True)
            return None

    def _cleanup_old_versions(self, config_id: UUID):
        """
        Cleanup old model versions, keeping only the most recent N versions.

        Uses MODEL_VERSION_LIMIT from settings.
        """
        if not self.db:
            return

        try:
            version_limit = settings.MODEL_VERSION_LIMIT

            # Get all versions for this config, ordered by creation date
            versions = (
                self.db.query(ModelVersion)
                .filter(ModelVersion.model_config_id == config_id)
                .order_by(ModelVersion.created_at.desc())
                .all()
            )

            # Keep only the most recent N versions
            if len(versions) > version_limit:
                versions_to_delete = versions[version_limit:]

                for version in versions_to_delete:
                    # Delete file if exists
                    if os.path.exists(version.file_path):
                        try:
                            os.remove(version.file_path)
                            self.logger.info(f"Deleted old model file: {version.file_path}")
                        except Exception as e:
                            self.logger.warning(f"Could not delete file {version.file_path}: {e}")

                    # Delete DB record
                    self.db.delete(version)

                self.db.commit()
                self.logger.info(
                    f"Cleaned up {len(versions_to_delete)} old versions for config {config_id}"
                )

        except Exception as e:
            self.logger.error(f"Error cleaning up old versions: {e}", exc_info=True)
            self.db.rollback()

    def get_model_versions(
        self, config_id: UUID, active_only: bool = False
    ) -> List[ModelVersion]:
        """
        Get all versions for a model config.

        Args:
            config_id: Model config ID
            active_only: Only return active version

        Returns:
            List of ModelVersion records
        """
        if not self.db:
            return []

        try:
            query = self.db.query(ModelVersion).filter(
                ModelVersion.model_config_id == config_id
            )

            if active_only:
                query = query.filter(ModelVersion.is_active == True)

            return query.order_by(ModelVersion.created_at.desc()).all()

        except Exception as e:
            self.logger.error(f"Error getting model versions: {e}", exc_info=True)
            return []

    def activate_model_version(self, version_id: UUID) -> bool:
        """
        Activate a specific model version.

        Args:
            version_id: Version ID to activate

        Returns:
            Success status
        """
        if not self.db:
            return False

        try:
            version = (
                self.db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
            )

            if not version:
                self.logger.warning(f"Version {version_id} not found")
                return False

            # Deactivate other versions for this config
            self.db.query(ModelVersion).filter(
                ModelVersion.model_config_id == version.model_config_id,
                ModelVersion.is_active == True,
            ).update({"is_active": False})

            # Activate this version
            version.is_active = True
            self.db.commit()

            # Update active cache
            model_config = (
                self.db.query(MLModelConfig)
                .filter(MLModelConfig.id == version.model_config_id)
                .first()
            )
            if model_config:
                model_data = self._load_model_from_db_version(version_id)
                if model_data:
                    self.set_active_model(model_config.model_type, model_data)

            self.logger.info(f"Activated model version {version_id}")
            return True

        except Exception as e:
            self.logger.error(f"Error activating model version: {e}", exc_info=True)
            self.db.rollback()
            return False

    def delete_model_version(self, version_id: UUID) -> bool:
        """
        Delete a specific model version.

        Args:
            version_id: Version ID to delete

        Returns:
            Success status
        """
        if not self.db:
            return False

        try:
            version = (
                self.db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
            )

            if not version:
                return False

            # Don't delete if it's the active version
            if version.is_active:
                self.logger.warning(f"Cannot delete active version {version_id}")
                return False

            # Delete file
            if os.path.exists(version.file_path):
                try:
                    os.remove(version.file_path)
                except Exception as e:
                    self.logger.warning(f"Could not delete file: {e}")

            # Delete DB record
            self.db.delete(version)
            self.db.commit()

            self.logger.info(f"Deleted model version {version_id}")
            return True

        except Exception as e:
            self.logger.error(f"Error deleting model version: {e}", exc_info=True)
            self.db.rollback()
            return False
