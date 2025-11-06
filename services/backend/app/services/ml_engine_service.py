"""
ML Engine Service - Compatibility Wrapper.
Provides unified interface to modular ML services.
"""
from sqlalchemy.orm import Session

from app.services.ml import (
    ALSModelService,
    ContentModelService,
    KMeansModelService,
    LightGBMModelService,
    MLFeatureService,
    MLModelManager,
    MLTrainingService,
)


class MLEngineService:
    """Unified ML engine service using modular components."""

    def __init__(self, db: Session):
        self.db = db
        self.model_manager = MLModelManager(db)
        self.feature_service = MLFeatureService(db)
        self.als_service = ALSModelService(db)
        self.lightgbm_service = LightGBMModelService(db)
        self.kmeans_service = KMeansModelService(db)
        self.content_service = ContentModelService(db)
        self.training_service = MLTrainingService(db)

    # Model management
    def load_model(self, model_type):
        return self.model_manager.load_model(model_type)

    def save_model(self, model, model_type, metrics=None):
        return self.model_manager.save_model(model, model_type, metrics)

    def get_active_model(self, model_type):
        return self.model_manager.get_active_model(model_type)

    # Feature service
    def prepare_features(self, model_type, user_id=None, product_id=None):
        return self.feature_service.prepare_features(model_type, user_id, product_id)

    # Training
    def train_model(self, model_type, parameters=None):
        return self.training_service.train_model(model_type, parameters)

    def train_all_models(self):
        return self.training_service.train_all_models()

    # Recommendations
    def get_recommendations(self, user_id, model_type=None, limit=10):
        """Get recommendations using specified or best performing model."""
        if model_type == "als":
            return self.als_service.get_recommendations(user_id, limit)
        elif model_type == "lightgbm":
            return self.lightgbm_service.get_recommendations(user_id, limit)
        elif model_type == "kmeans":
            return self.kmeans_service.get_recommendations(user_id, limit)
        elif model_type == "content_based":
            return self.content_service.get_recommendations(user_id, limit)
        else:
            # Use best performing model
            return self.als_service.get_recommendations(user_id, limit)
