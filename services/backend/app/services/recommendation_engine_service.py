"""
Recommendation Engine Service - Compatibility Wrapper.
Provides unified interface to modular recommendation services.
"""
from sqlalchemy.orm import Session

from app.services.recommendations import ModelConfigManager, PerformanceTracker


class RecommendationEngineService:
    """Unified recommendation engine service using modular components."""

    def __init__(self, db: Session):
        self.db = db
        self.config_manager = ModelConfigManager(db)
        self.performance_tracker = PerformanceTracker(db)

    # Model config management
    def get_model_configs(self, active_only=False):
        return self.config_manager.get_model_configs(active_only)

    def create_model_config(self, config_data, user_id):
        return self.config_manager.create_model_config(config_data, user_id)

    def update_model_config(self, config_id, config_data, user_id):
        return self.config_manager.update_model_config(config_id, config_data, user_id)

    def activate_model_config(self, config_id, user_id):
        return self.config_manager.activate_model_config(config_id, user_id)

    def deactivate_model_config(self, config_id, user_id):
        return self.config_manager.deactivate_model_config(config_id, user_id)

    def delete_model_config(self, config_id):
        return self.config_manager.delete_model_config(config_id)

    # Performance tracking
    def get_recommendation_performance(self, days=30):
        return self.performance_tracker.get_recommendation_performance(days)

    def get_conversion_analytics(self, days=30):
        return self.performance_tracker.get_conversion_analytics(days)

    def log_recommendation_display(self, user_id, recommendation_ids, context):
        return self.performance_tracker.log_recommendation_display(
            user_id, recommendation_ids, context
        )

    def log_recommendation_interaction(
        self, user_id, recommendation_id, interaction_type, product_id=None
    ):
        return self.performance_tracker.log_recommendation_interaction(
            user_id, recommendation_id, interaction_type, product_id
        )

    # Placeholder methods
    def trigger_model_training(self, model_type, custom_parameters=None):
        # TODO: Move to training coordinator when created
        return {"message": "Training trigger not yet implemented in modular services"}

    def get_training_history(self, model_type=None, limit=50):
        # TODO: Move to training coordinator when created
        return {"message": "Training history not yet implemented in modular services"}
