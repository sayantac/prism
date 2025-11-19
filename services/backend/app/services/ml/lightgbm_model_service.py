"""
LightGBM Model Service - Reorder Prediction using Gradient Boosting.
"""
import logging
from typing import Any, Callable, Dict

import lightgbm as lgb
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score

from app.services.ml.base_ml_service import BaseMLService

logger = logging.getLogger(__name__)


class LightGBMModelService(BaseMLService):
    """Service for training and using LightGBM reorder prediction models."""
    
    def train_lightgbm_model(
        self,
        reorder_df: pd.DataFrame,
        parameters: Dict[str, Any],
        progress_callback: Callable = None,
    ) -> Dict[str, Any]:
        """
        Train LightGBM reorder prediction model.
        
        Args:
            reorder_df: DataFrame with reorder features
            parameters: Model hyperparameters
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary with success status, trained model, and metrics
        """
        try:
            if len(reorder_df) < 50:
                raise ValueError("Insufficient data for reorder prediction training")

            if progress_callback:
                progress_callback("running", {"progress": 50, "message": "Training LightGBM model"})

            # Prepare features and target
            feature_columns = [
                "purchase_frequency",
                "avg_days_between_orders",
                "std_days_between_orders",
                "total_quantity",
                "avg_price",
                "days_since_last_purchase",
            ]

            X = reorder_df[feature_columns].fillna(0)
            y = reorder_df["will_reorder"]

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )

            # Train model
            train_data = lgb.Dataset(X_train, label=y_train)
            valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)

            params = {
                "objective": parameters.get("objective", "binary"),
                "metric": parameters.get("metric", "binary_logloss"),
                "boosting_type": parameters.get("boosting_type", "gbdt"),
                "num_leaves": parameters.get("num_leaves", 31),
                "learning_rate": parameters.get("learning_rate", 0.05),
                "feature_fraction": parameters.get("feature_fraction", 0.9),
                "bagging_fraction": parameters.get("bagging_fraction", 0.8),
                "bagging_freq": parameters.get("bagging_freq", 5),
                "verbose": -1,
            }

            model = lgb.train(
                params,
                train_data,
                valid_sets=[valid_data],
                num_boost_round=parameters.get("num_boost_round", 1000),
                callbacks=[
                    lgb.early_stopping(parameters.get("early_stopping_rounds", 100)),
                    lgb.log_evaluation(0),
                ],
            )

            if progress_callback:
                progress_callback("running", {"progress": 80, "message": "Evaluating model"})

            # Evaluate model
            y_pred = model.predict(X_test, num_iteration=model.best_iteration)
            y_pred_binary = (y_pred > 0.5).astype(int)

            metrics = {
                "accuracy": float(accuracy_score(y_test, y_pred_binary)),
                "precision": float(precision_score(y_test, y_pred_binary, zero_division=0)),
                "recall": float(recall_score(y_test, y_pred_binary, zero_division=0)),
                "best_iteration": model.best_iteration,
                "num_samples": len(reorder_df),
            }

            self.logger.info(f"LightGBM model trained with accuracy: {metrics['accuracy']:.3f}")

            return {
                "success": True,
                "model": {
                    "lgb_model": model,
                    "feature_columns": feature_columns
                },
                "metrics": metrics,
            }

        except Exception as e:
            self.logger.error(f"Error training LightGBM model: {e}")
            return {"success": False, "error": str(e)}

    def predict_reorder(
        self,
        model_data: Dict[str, Any],
        user_features: Dict[str, Any]
    ) -> float:
        """
        Predict reorder probability for a user-product pair.
        
        Args:
            model_data: Dictionary containing trained model
            user_features: Features for prediction
            
        Returns:
            Reorder probability (0-1)
        """
        try:
            lgb_model = model_data["lgb_model"]
            feature_columns = model_data["feature_columns"]

            # Prepare feature vector
            feature_values = [user_features.get(col, 0) for col in feature_columns]
            
            # Predict
            probability = lgb_model.predict(
                [feature_values],
                num_iteration=lgb_model.best_iteration
            )[0]

            return float(probability)

        except Exception as e:
            self.logger.error(f"Error predicting reorder: {e}")
            return 0.0
