"""
KMeans Model Service - User Segmentation using Clustering.
"""
import logging
from typing import Any, Callable, Dict

import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

from app.services.ml.base_ml_service import BaseMLService

logger = logging.getLogger(__name__)


class KMeansModelService(BaseMLService):
    """Service for training and using K-means clustering for user segmentation."""
    
    def train_kmeans_model(
        self,
        rfm_df: pd.DataFrame,
        parameters: Dict[str, Any],
        progress_callback: Callable = None,
    ) -> Dict[str, Any]:
        """
        Train K-means clustering model for user segmentation.
        
        Args:
            rfm_df: DataFrame with RFM features
            parameters: Model hyperparameters
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary with success status, trained model, and metrics
        """
        try:
            if progress_callback:
                progress_callback("running", {"progress": 30, "message": "Preparing RFM features"})

            # Prepare RFM features for clustering
            features = [
                "recency",
                "frequency",
                "monetary",
                "unique_products",
                "avg_order_value",
            ]
            rfm_features = rfm_df[features].fillna(0)

            if progress_callback:
                progress_callback("running", {"progress": 50, "message": "Training K-means model"})

            # Scale features
            scaler = StandardScaler()
            rfm_scaled = scaler.fit_transform(rfm_features)

            # Train K-means
            model = KMeans(
                n_clusters=parameters.get("n_clusters", 8),
                init=parameters.get("init", "k-means++"),
                n_init=parameters.get("n_init", 10),
                max_iter=parameters.get("max_iter", 300),
                random_state=parameters.get("random_state", 42),
            )

            clusters = model.fit_predict(rfm_scaled)

            if progress_callback:
                progress_callback("running", {"progress": 80, "message": "Evaluating clusters"})

            # Calculate clustering metrics
            metrics = {
                "silhouette_score": float(silhouette_score(rfm_scaled, clusters)),
                "n_clusters": int(model.n_clusters),
                "inertia": float(model.inertia_),
                "num_users": len(rfm_df),
            }

            # Add cluster labels to RFM data
            rfm_with_clusters = rfm_df.copy()
            rfm_with_clusters["cluster"] = clusters

            self.logger.info(
                f"K-means model trained with {model.n_clusters} clusters, "
                f"silhouette score: {metrics['silhouette_score']:.3f}"
            )

            return {
                "success": True,
                "model": {
                    "kmeans_model": model,
                    "scaler": scaler,
                    "feature_columns": features,
                    "rfm_with_clusters": rfm_with_clusters,
                },
                "metrics": metrics,
            }

        except Exception as e:
            self.logger.error(f"Error training K-means model: {e}")
            return {"success": False, "error": str(e)}

    def predict_cluster(
        self,
        model_data: Dict[str, Any],
        user_features: Dict[str, float]
    ) -> int:
        """
        Predict cluster for a user based on RFM features.
        
        Args:
            model_data: Dictionary containing trained model and scaler
            user_features: Dictionary with RFM feature values
            
        Returns:
            Cluster ID
        """
        try:
            kmeans_model = model_data["kmeans_model"]
            scaler = model_data["scaler"]
            feature_columns = model_data["feature_columns"]

            # Prepare feature vector
            feature_values = [[user_features.get(col, 0) for col in feature_columns]]
            
            # Scale and predict
            features_scaled = scaler.transform(feature_values)
            cluster = kmeans_model.predict(features_scaled)[0]

            return int(cluster)

        except Exception as e:
            self.logger.error(f"Error predicting cluster: {e}")
            return -1

    def get_cluster_profile(
        self,
        model_data: Dict[str, Any],
        cluster_id: int
    ) -> Dict[str, float]:
        """
        Get average feature values for a cluster.
        
        Args:
            model_data: Dictionary containing model with RFM data
            cluster_id: Cluster ID to profile
            
        Returns:
            Dictionary with average feature values
        """
        try:
            rfm_with_clusters = model_data["rfm_with_clusters"]
            feature_columns = model_data["feature_columns"]

            cluster_data = rfm_with_clusters[rfm_with_clusters["cluster"] == cluster_id]
            
            if len(cluster_data) == 0:
                return {}

            profile = {
                col: float(cluster_data[col].mean())
                for col in feature_columns
            }
            profile["cluster_size"] = len(cluster_data)

            return profile

        except Exception as e:
            self.logger.error(f"Error getting cluster profile: {e}")
            return {}
