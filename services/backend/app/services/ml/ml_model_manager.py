"""
ML Model Manager - Handles model loading, saving, and caching.
"""
import logging
import os
import pickle
from typing import Any, Dict, Optional

import joblib

from app.services.ml.base_ml_service import BaseMLService

logger = logging.getLogger(__name__)


class MLModelManager(BaseMLService):
    """Manages ML model persistence and caching."""
    
    def __init__(self, models_dir: str = "ml_models"):
        super().__init__(models_dir)
        self.active_models: Dict[str, Any] = {}
        self._load_saved_models()
    
    def save_model(
        self,
        model_data: Dict[str, Any],
        model_type: str,
        training_id: str
    ) -> str:
        """
        Save a trained model to disk.
        
        Args:
            model_data: Dictionary containing model and metadata
            model_type: Type of model (als, lightgbm, kmeans, content)
            training_id: Unique identifier for this training run
            
        Returns:
            Path to saved model file
        """
        try:
            model_path = self._get_model_path(model_type, training_id)
            
            # Add metadata
            model_data['model_type'] = model_type
            model_data['training_id'] = training_id
            model_data['saved_at'] = str(os.path.getmtime(model_path)) if os.path.exists(model_path) else None
            
            # Save using joblib for better compression
            joblib.dump(model_data, model_path, compress=3)
            
            # Also save as latest
            latest_path = self._get_model_path(model_type)
            joblib.dump(model_data, latest_path, compress=3)
            
            self.logger.info(f"Model saved: {model_path}")
            return model_path
            
        except Exception as e:
            self.logger.error(f"Error saving model: {e}")
            raise
    
    def load_model(self, model_type: str, training_id: str = None) -> Optional[Dict[str, Any]]:
        """
        Load a model from disk.
        
        Args:
            model_type: Type of model to load
            training_id: Specific training ID, or None for latest
            
        Returns:
            Model data dictionary or None if not found
        """
        try:
            model_path = self._get_model_path(model_type, training_id)
            
            if not os.path.exists(model_path):
                self.logger.warning(f"Model not found: {model_path}")
                return None
            
            model_data = joblib.load(model_path)
            self.logger.info(f"Model loaded: {model_path}")
            return model_data
            
        except Exception as e:
            self.logger.error(f"Error loading model: {e}")
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
            # Try to load existing model
            model_data = self.load_model(model_type)
            
            if model_data:
                # Update configuration
                model_data['parameters'] = parameters
                model_data['config_id'] = config_id
                
                # Cache in active models
                self.active_models[model_type] = model_data
                self.logger.info(f"Loaded {model_type} with config {config_id}")
            else:
                # Create placeholder for new model
                self.active_models[model_type] = {
                    'model_type': model_type,
                    'parameters': parameters,
                    'config_id': config_id,
                    'model': None,
                    'status': 'not_trained'
                }
                self.logger.info(f"Created placeholder for {model_type}")
            
            return {
                'success': True,
                'message': f'{model_type} configuration loaded',
                'has_trained_model': model_data is not None
            }
            
        except Exception as e:
            self.logger.error(f"Error loading model with config: {e}")
            return {'success': False, 'error': str(e)}
    
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
        model_types = ['als', 'lightgbm', 'kmeans', 'content']
        
        for model_type in model_types:
            model_data = self.load_model(model_type)
            if model_data:
                self.active_models[model_type] = model_data
                self.logger.info(f"Pre-loaded {model_type} model")
    
    def list_saved_models(self) -> Dict[str, list]:
        """List all saved model files."""
        models = {
            'als': [],
            'lightgbm': [],
            'kmeans': [],
            'content': []
        }
        
        if not os.path.exists(self.models_dir):
            return models
        
        for filename in os.listdir(self.models_dir):
            if filename.endswith('.pkl'):
                for model_type in models.keys():
                    if filename.startswith(model_type):
                        models[model_type].append(filename)
        
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
                    active_training_id = self.active_models[model_type].get('training_id')
                    if active_training_id == training_id:
                        self.remove_active_model(model_type)
                
                return True
            else:
                self.logger.warning(f"Model not found for deletion: {model_path}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error deleting model: {e}")
            return False
