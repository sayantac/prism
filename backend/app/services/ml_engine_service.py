# app/services/ml_engine_service.py
"""
ML Engine Service - Direct integration with machine learning algorithms
Handles training, inference, and model management without external service calls
"""

import logging
import os
import pickle
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional

import joblib
import lightgbm as lgb
import numpy as np

# ML Libraries
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

# Optional: Import implicit for collaborative filtering if available
try:
    from implicit.als import AlternatingLeastSquares
    from implicit.nearest_neighbours import ItemItemRecommender

    IMPLICIT_AVAILABLE = True
except ImportError:
    IMPLICIT_AVAILABLE = False


from app.core.config import get_settings
from app.models import Order, OrderItem

settings = get_settings()
logger = logging.getLogger(__name__)


class MLEngineService:
    """Direct ML engine implementation"""

    def __init__(self, db: Session):
        self.db = db
        self.models_dir = "ml_models"
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.training_jobs = {}  # Track active training jobs
        self.active_models = {}  # Cache for loaded models

        # Ensure models directory exists
        os.makedirs(self.models_dir, exist_ok=True)

        # Load existing models on startup
        self._load_saved_models()

    def update_model_configuration(
        self,
        model_type: str,
        parameters: Dict[str, Any],
        is_active: bool,
        config_id: str,
    ) -> Dict[str, Any]:
        """Update model configuration and reload if active"""
        try:
            if is_active:
                # Load or reload the model with new parameters
                self._load_model_with_config(model_type, parameters, config_id)
                logger.info(
                    f"Updated and reloaded {model_type} model with config {config_id}"
                )
            else:
                # Remove from active models if deactivated
                if model_type in self.active_models:
                    del self.active_models[model_type]
                logger.info(f"Deactivated {model_type} model")

            return {"success": True, "message": f"{model_type} configuration updated"}

        except Exception as e:
            logger.error(f"Error updating model configuration: {e}")
            return {"success": False, "error": str(e)}

    def start_training_async(
        self,
        training_id: str,
        model_type: str,
        model_name: str,
        parameters: Dict[str, Any],
        callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """Start training asynchronously"""
        try:
            if training_id in self.training_jobs:
                return {"success": False, "error": "Training already in progress"}

            # Submit training job to thread pool
            future = self.executor.submit(
                self._train_model_sync,
                training_id,
                model_type,
                model_name,
                parameters,
                callback,
            )

            self.training_jobs[training_id] = {
                "future": future,
                "model_type": model_type,
                "started_at": datetime.utcnow(),
                "status": "running",
            }

            logger.info(f"Started async training for {model_type} (ID: {training_id})")
            return {"success": True, "training_id": training_id}

        except Exception as e:
            logger.error(f"Error starting async training: {e}")
            return {"success": False, "error": str(e)}

    def get_training_status(self, training_id: str) -> Optional[Dict[str, Any]]:
        """Get status of training job"""
        if training_id not in self.training_jobs:
            return None

        job = self.training_jobs[training_id]
        future = job["future"]

        if future.done():
            try:
                result = future.result()
                job["status"] = "completed" if result["success"] else "failed"
                job["result"] = result
            except Exception as e:
                job["status"] = "failed"
                job["error"] = str(e)

        return {
            "training_id": training_id,
            "status": job["status"],
            "model_type": job["model_type"],
            "started_at": job["started_at"].isoformat(),
            "result": job.get("result", {}),
            "error": job.get("error"),
        }

    def cancel_training(self, training_id: str) -> Dict[str, Any]:
        """Cancel training job"""
        try:
            if training_id not in self.training_jobs:
                return {"success": False, "error": "Training job not found"}

            job = self.training_jobs[training_id]
            future = job["future"]

            if not future.done():
                future.cancel()
                job["status"] = "cancelled"
                logger.info(f"Cancelled training job {training_id}")
                return {"success": True, "message": "Training cancelled"}
            else:
                return {"success": False, "error": "Training already completed"}

        except Exception as e:
            logger.error(f"Error cancelling training: {e}")
            return {"success": False, "error": str(e)}

    def get_training_logs(self, training_id: str, lines: int = 100) -> List[str]:
        """Get training logs (simulate with progress info)"""
        if training_id not in self.training_jobs:
            return ["Training job not found"]

        job = self.training_jobs[training_id]
        logs = [
            f"Training started at {job['started_at'].isoformat()}",
            f"Model type: {job['model_type']}",
            f"Status: {job['status']}",
        ]

        if "result" in job:
            result = job["result"]
            if "metrics" in result:
                logs.extend([f"Metric {k}: {v}" for k, v in result["metrics"].items()])

        return logs[-lines:]

    def get_recommendations(
        self, user_id: str, model_type: str = None, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Generate recommendations using active models"""
        try:
            # Determine which model to use
            if model_type and model_type in self.active_models:
                model = self.active_models[model_type]
            elif "als" in self.active_models:
                model = self.active_models["als"]
            elif "content_based" in self.active_models:
                model = self.active_models["content_based"]
            else:
                # Fallback to basic recommendations
                return self._get_popular_recommendations(limit)

            # Generate recommendations based on model type
            if model["type"] == "als":
                return self._get_als_recommendations(user_id, model, limit)
            elif model["type"] == "content_based":
                return self._get_content_recommendations(user_id, model, limit)
            elif model["type"] == "hybrid":
                return self._get_hybrid_recommendations(user_id, limit)
            else:
                return self._get_popular_recommendations(limit)

        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return self._get_popular_recommendations(limit)

    def _train_model_sync(
        self,
        training_id: str,
        model_type: str,
        model_name: str,
        parameters: Dict[str, Any],
        callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """Synchronous training function"""
        try:
            logger.info(f"Starting training for {model_type} (ID: {training_id})")

            # Callback for progress updates
            def update_progress(status: str, metrics: Dict = None):
                if callback:
                    callback(
                        training_id,
                        {
                            "status": status,
                            "metrics": metrics,
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                    )

            update_progress("running", {"progress": 0})

            # Load training data
            training_data = self._load_training_data()
            update_progress("running", {"progress": 20, "message": "Data loaded"})

            # Train based on model type
            if model_type == "als":
                result = self._train_als_model(
                    training_data, parameters, update_progress
                )
            elif model_type == "lightgbm":
                result = self._train_lightgbm_model(
                    training_data, parameters, update_progress
                )
            elif model_type == "kmeans":
                result = self._train_kmeans_model(
                    training_data, parameters, update_progress
                )
            elif model_type == "content_based":
                result = self._train_content_model(
                    training_data, parameters, update_progress
                )
            else:
                raise ValueError(f"Unknown model type: {model_type}")

            # Save model
            model_path = self._save_model(result["model"], model_type, training_id)
            result["model_path"] = model_path

            # Update active models if training successful
            if result["success"]:
                self.active_models[model_type] = {
                    "type": model_type,
                    "model": result["model"],
                    "parameters": parameters,
                    "trained_at": datetime.utcnow(),
                    "training_id": training_id,
                }

            update_progress("completed", result.get("metrics", {}))
            logger.info(f"Completed training for {model_type} (ID: {training_id})")

            return result

        except Exception as e:
            logger.error(f"Error in training {model_type}: {e}")
            if callback:
                callback(
                    training_id,
                    {
                        "status": "failed",
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                )
            return {"success": False, "error": str(e)}

    def _load_training_data(self) -> Dict[str, pd.DataFrame]:
        """Load training data from database"""
        try:
            # Load user-item interactions
            interactions_query = """
                SELECT 
                    o.user_id,
                    oi.product_id,
                    oi.quantity,
                    oi.unit_price,
                    o.created_at as interaction_date,
                    'purchase' as interaction_type
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE o.status IN ('confirmed', 'shipped', 'delivered')
                ORDER BY o.created_at DESC
                LIMIT 100000
            """

            interactions_df = pd.read_sql(interactions_query, self.db.bind)

            # Load product data
            products_query = """
                SELECT 
                    id, name, category_id, brand, price, description, specification
                FROM products 
                WHERE is_active = true
            """

            products_df = pd.read_sql(products_query, self.db.bind)

            # Load user data
            users_query = """
                SELECT 
                    id, created_at, last_active, is_active
                FROM users 
                WHERE is_active = true
                LIMIT 50000
            """

            users_df = pd.read_sql(users_query, self.db.bind)

            # Calculate RFM features
            rfm_df = self._calculate_rfm_features(interactions_df)

            logger.info(
                f"Loaded training data: {len(interactions_df)} interactions, {len(products_df)} products, {len(users_df)} users"
            )

            return {
                "interactions": interactions_df,
                "products": products_df,
                "users": users_df,
                "rfm": rfm_df,
            }

        except Exception as e:
            logger.error(f"Error loading training data: {e}")
            raise

    def _train_als_model(
        self,
        data: Dict[str, pd.DataFrame],
        parameters: Dict[str, Any],
        progress_callback: Callable,
    ) -> Dict[str, Any]:
        """Train ALS collaborative filtering model"""
        try:
            interactions_df = data["interactions"]

            if len(interactions_df) < 100:
                raise ValueError("Insufficient interaction data for ALS training")

            progress_callback(
                "running", {"progress": 30, "message": "Preparing interaction matrix"}
            )

            # Create user-item interaction matrix
            interaction_matrix, user_mapping, item_mapping = (
                self._create_interaction_matrix(interactions_df)
            )

            progress_callback(
                "running", {"progress": 50, "message": "Training ALS model"}
            )

            if IMPLICIT_AVAILABLE:
                # Use implicit library if available
                model = AlternatingLeastSquares(
                    factors=parameters.get("factors", 100),
                    regularization=parameters.get("regularization", 0.01),
                    iterations=parameters.get("iterations", 50),
                    alpha=parameters.get("alpha", 1.0),
                    random_state=parameters.get("random_state", 42),
                )

                model.fit(interaction_matrix.T.tocsr())

            else:
                # Basic collaborative filtering implementation
                model = self._basic_collaborative_filtering(
                    interaction_matrix, parameters
                )

            progress_callback(
                "running", {"progress": 80, "message": "Evaluating model"}
            )

            # Calculate metrics
            metrics = self._evaluate_als_model(
                model, interaction_matrix, user_mapping, item_mapping
            )

            progress_callback(
                "running", {"progress": 90, "message": "Finalizing model"}
            )

            return {
                "success": True,
                "model": {
                    "als_model": model,
                    "user_mapping": user_mapping,
                    "item_mapping": item_mapping,
                    "interaction_matrix": interaction_matrix,
                },
                "metrics": metrics,
            }

        except Exception as e:
            logger.error(f"Error training ALS model: {e}")
            return {"success": False, "error": str(e)}

    def _train_lightgbm_model(
        self,
        data: Dict[str, pd.DataFrame],
        parameters: Dict[str, Any],
        progress_callback: Callable,
    ) -> Dict[str, Any]:
        """Train LightGBM reorder prediction model"""
        try:
            interactions_df = data["interactions"]
            rfm_df = data["rfm"]

            progress_callback(
                "running", {"progress": 30, "message": "Preparing reorder features"}
            )

            # Create reorder prediction features
            reorder_df = self._create_reorder_features(interactions_df, rfm_df)

            if len(reorder_df) < 50:
                raise ValueError("Insufficient data for reorder prediction training")

            progress_callback(
                "running", {"progress": 50, "message": "Training LightGBM model"}
            )

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

            progress_callback(
                "running", {"progress": 80, "message": "Evaluating model"}
            )

            # Evaluate model
            y_pred = model.predict(X_test, num_iteration=model.best_iteration)
            y_pred_binary = (y_pred > 0.5).astype(int)

            from sklearn.metrics import accuracy_score, precision_score, recall_score

            metrics = {
                "accuracy": accuracy_score(y_test, y_pred_binary),
                "precision": precision_score(y_test, y_pred_binary),
                "recall": recall_score(y_test, y_pred_binary),
                "best_iteration": model.best_iteration,
            }

            return {
                "success": True,
                "model": {"lgb_model": model, "feature_columns": feature_columns},
                "metrics": metrics,
            }

        except Exception as e:
            logger.error(f"Error training LightGBM model: {e}")
            return {"success": False, "error": str(e)}

    def _train_kmeans_model(
        self,
        data: Dict[str, pd.DataFrame],
        parameters: Dict[str, Any],
        progress_callback: Callable,
    ) -> Dict[str, Any]:
        """Train K-means clustering model for user segmentation"""
        try:
            rfm_df = data["rfm"]

            progress_callback(
                "running", {"progress": 30, "message": "Preparing RFM features"}
            )

            # Prepare RFM features for clustering
            features = [
                "recency",
                "frequency",
                "monetary",
                "unique_products",
                "avg_order_value",
            ]
            rfm_features = rfm_df[features].fillna(0)

            progress_callback(
                "running", {"progress": 50, "message": "Training K-means model"}
            )

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

            progress_callback(
                "running", {"progress": 80, "message": "Evaluating clusters"}
            )

            # Calculate clustering metrics
            from sklearn.metrics import silhouette_score

            metrics = {
                "silhouette_score": silhouette_score(rfm_scaled, clusters),
                "n_clusters": model.n_clusters,
                "inertia": model.inertia_,
            }

            # Add cluster labels to RFM data
            rfm_df["cluster"] = clusters

            return {
                "success": True,
                "model": {
                    "kmeans_model": model,
                    "scaler": scaler,
                    "feature_columns": features,
                    "rfm_with_clusters": rfm_df,
                },
                "metrics": metrics,
            }

        except Exception as e:
            logger.error(f"Error training K-means model: {e}")
            return {"success": False, "error": str(e)}

    def _train_content_model(
        self,
        data: Dict[str, pd.DataFrame],
        parameters: Dict[str, Any],
        progress_callback: Callable,
    ) -> Dict[str, Any]:
        """Train content-based filtering model"""
        try:
            products_df = data["products"]

            progress_callback(
                "running", {"progress": 30, "message": "Preparing product features"}
            )

            # Combine text features
            products_df["combined_features"] = (
                products_df["name"].fillna("")
                + " "
                + products_df["description"].fillna("")
                + " "
                + products_df["specification"].fillna("")
                + " "
                + products_df["brand"].fillna("")
            )

            progress_callback(
                "running", {"progress": 50, "message": "Creating TF-IDF vectors"}
            )

            # Create TF-IDF vectors
            vectorizer = TfidfVectorizer(
                max_features=parameters.get("max_features", 5000),
                ngram_range=tuple(parameters.get("ngram_range", [1, 2])),
                min_df=parameters.get("min_df", 2),
                max_df=parameters.get("max_df", 0.8),
                stop_words=parameters.get("stop_words", "english"),
            )

            tfidf_matrix = vectorizer.fit_transform(products_df["combined_features"])

            progress_callback(
                "running", {"progress": 70, "message": "Calculating similarity matrix"}
            )

            # Calculate cosine similarity
            similarity_matrix = cosine_similarity(tfidf_matrix)

            progress_callback(
                "running", {"progress": 90, "message": "Finalizing model"}
            )

            metrics = {
                "n_products": len(products_df),
                "n_features": tfidf_matrix.shape[1],
                "sparsity": 1.0
                - (tfidf_matrix.nnz / (tfidf_matrix.shape[0] * tfidf_matrix.shape[1])),
            }

            return {
                "success": True,
                "model": {
                    "vectorizer": vectorizer,
                    "similarity_matrix": similarity_matrix,
                    "product_ids": products_df["id"].tolist(),
                    "products_df": products_df,
                },
                "metrics": metrics,
            }

        except Exception as e:
            logger.error(f"Error training content-based model: {e}")
            return {"success": False, "error": str(e)}

    def _create_interaction_matrix(self, interactions_df: pd.DataFrame):
        """Create user-item interaction matrix"""
        # Create mappings
        users = interactions_df["user_id"].unique()
        items = interactions_df["product_id"].unique()

        user_mapping = {user: idx for idx, user in enumerate(users)}
        item_mapping = {item: idx for idx, item in enumerate(items)}

        # Create matrix
        from scipy.sparse import csr_matrix

        rows = interactions_df["user_id"].map(user_mapping)
        cols = interactions_df["product_id"].map(item_mapping)
        data = interactions_df["quantity"]

        matrix = csr_matrix((data, (rows, cols)), shape=(len(users), len(items)))

        return matrix, user_mapping, item_mapping

    def _calculate_rfm_features(self, interactions_df: pd.DataFrame) -> pd.DataFrame:
        """Calculate RFM features for users"""
        try:
            # Convert interaction_date to datetime
            interactions_df["interaction_date"] = pd.to_datetime(
                interactions_df["interaction_date"]
            )
            current_date = interactions_df["interaction_date"].max()

            # Calculate RFM metrics
            rfm = (
                interactions_df.groupby("user_id")
                .agg(
                    {
                        "interaction_date": [
                            lambda x: (current_date - x.max()).days,  # Recency
                            "count",  # Frequency
                        ],
                        "unit_price": ["sum", "mean"],  # Monetary
                        "product_id": "nunique",  # Unique products
                        "quantity": "sum",  # Total quantity
                    }
                )
                .round(2)
            )

            # Flatten column names
            rfm.columns = [
                "recency",
                "frequency",
                "monetary",
                "avg_order_value",
                "unique_products",
                "total_quantity",
            ]
            rfm = rfm.reset_index()

            # Calculate additional features
            user_orders = (
                interactions_df.groupby("user_id")["interaction_date"]
                .apply(list)
                .reset_index()
            )
            user_orders["days_between_orders"] = user_orders["interaction_date"].apply(
                lambda dates: [
                    (dates[i] - dates[i - 1]).days for i in range(1, len(dates))
                ]
                if len(dates) > 1
                else [0]
            )

            user_orders["avg_days_between_orders"] = user_orders[
                "days_between_orders"
            ].apply(lambda x: np.mean(x) if x else 0)
            user_orders["std_days_between_orders"] = user_orders[
                "days_between_orders"
            ].apply(lambda x: np.std(x) if len(x) > 1 else 0)

            # Merge additional features
            rfm = rfm.merge(
                user_orders[
                    ["user_id", "avg_days_between_orders", "std_days_between_orders"]
                ],
                on="user_id",
                how="left",
            )

            return rfm

        except Exception as e:
            logger.error(f"Error calculating RFM features: {e}")
            return pd.DataFrame()

    def _create_reorder_features(
        self, interactions_df: pd.DataFrame, rfm_df: pd.DataFrame
    ) -> pd.DataFrame:
        """Create features for reorder prediction"""
        try:
            # Get user-product combinations
            user_products = (
                interactions_df.groupby(["user_id", "product_id"])
                .agg(
                    {
                        "interaction_date": ["count", "max"],
                        "quantity": "sum",
                        "unit_price": "mean",
                    }
                )
                .reset_index()
            )

            user_products.columns = [
                "user_id",
                "product_id",
                "purchase_frequency",
                "last_purchase",
                "total_quantity",
                "avg_price",
            ]

            # Calculate days since last purchase
            current_date = interactions_df["interaction_date"].max()
            user_products["days_since_last_purchase"] = (
                current_date - user_products["last_purchase"]
            ).dt.days

            # Merge with RFM features
            reorder_df = user_products.merge(
                rfm_df[
                    ["user_id", "avg_days_between_orders", "std_days_between_orders"]
                ],
                on="user_id",
                how="left",
            )

            # Create target variable (will reorder)
            # Simple heuristic: users who purchased the product more than once are likely to reorder
            reorder_df["will_reorder"] = (reorder_df["purchase_frequency"] > 1).astype(
                int
            )

            return reorder_df

        except Exception as e:
            logger.error(f"Error creating reorder features: {e}")
            return pd.DataFrame()

    def _basic_collaborative_filtering(self, interaction_matrix, parameters):
        """Basic collaborative filtering implementation when implicit is not available"""

        class BasicCollaborativeFilter:
            def __init__(
                self,
                factors=100,
                learning_rate=0.01,
                regularization=0.01,
                iterations=50,
            ):
                self.factors = factors
                self.learning_rate = learning_rate
                self.regularization = regularization
                self.iterations = iterations

            def fit(self, interaction_matrix):
                self.n_users, self.n_items = interaction_matrix.shape

                # Initialize user and item factors
                self.user_factors = np.random.normal(
                    0, 0.1, (self.n_users, self.factors)
                )
                self.item_factors = np.random.normal(
                    0, 0.1, (self.n_items, self.factors)
                )

                # Convert to dense for simplicity (in production, use sparse operations)
                self.interactions = interaction_matrix.toarray()

                # Training loop
                for iteration in range(self.iterations):
                    for u in range(self.n_users):
                        for i in range(self.n_items):
                            if self.interactions[u, i] > 0:
                                # Calculate prediction error
                                prediction = np.dot(
                                    self.user_factors[u], self.item_factors[i]
                                )
                                error = self.interactions[u, i] - prediction

                                # Update factors
                                user_feature = self.user_factors[u].copy()
                                self.user_factors[u] += self.learning_rate * (
                                    error * self.item_factors[i]
                                    - self.regularization * self.user_factors[u]
                                )
                                self.item_factors[i] += self.learning_rate * (
                                    error * user_feature
                                    - self.regularization * self.item_factors[i]
                                )

                return self

            def recommend(self, user_id, N=10):
                # Calculate scores for all items
                scores = np.dot(self.user_factors[user_id], self.item_factors.T)

                # Get top N items (excluding already interacted items)
                interacted_items = set(np.where(self.interactions[user_id] > 0)[0])
                recommendations = []

                for item_id in np.argsort(scores)[::-1]:
                    if item_id not in interacted_items:
                        recommendations.append((item_id, scores[item_id]))
                    if len(recommendations) >= N:
                        break

                return recommendations

        model = BasicCollaborativeFilter(
            factors=parameters.get("factors", 100),
            learning_rate=parameters.get("learning_rate", 0.01),
            regularization=parameters.get("regularization", 0.01),
            iterations=parameters.get("iterations", 50),
        )

        return model.fit(interaction_matrix)

    def _evaluate_als_model(
        self, model, interaction_matrix, user_mapping, item_mapping
    ):
        """Evaluate ALS model performance"""
        try:
            # Simple evaluation metrics
            total_interactions = interaction_matrix.nnz
            n_users, n_items = interaction_matrix.shape

            metrics = {
                "total_users": n_users,
                "total_items": n_items,
                "total_interactions": total_interactions,
                "sparsity": 1.0 - (total_interactions / (n_users * n_items)),
                "avg_interactions_per_user": total_interactions / n_users,
                "coverage": n_items,  # All items can be recommended
            }

            return metrics

        except Exception as e:
            logger.error(f"Error evaluating ALS model: {e}")
            return {}

    def _get_als_recommendations(
        self, user_id: str, model: Dict, limit: int
    ) -> List[Dict[str, Any]]:
        """Generate ALS-based recommendations"""
        try:
            als_model = model["model"]["als_model"]
            user_mapping = model["model"]["user_mapping"]
            item_mapping = model["model"]["item_mapping"]

            # Check if user exists in mapping
            if user_id not in user_mapping:
                return self._get_popular_recommendations(limit)

            user_idx = user_mapping[user_id]

            if IMPLICIT_AVAILABLE and hasattr(als_model, "recommend"):
                # Use implicit library recommend method
                recommended_items, scores = als_model.recommend(
                    user_idx, model["model"]["interaction_matrix"][user_idx], N=limit
                )

                recommendations = []
                reverse_item_mapping = {v: k for k, v in item_mapping.items()}

                for item_idx, score in zip(recommended_items, scores):
                    product_id = reverse_item_mapping.get(item_idx)
                    if product_id:
                        recommendations.append(
                            {
                                "product_id": str(product_id),
                                "score": float(score),
                                "reason": "collaborative_filtering",
                            }
                        )

                return recommendations

            else:
                # Use basic collaborative filtering
                recommended_items = als_model.recommend(user_idx, limit)
                reverse_item_mapping = {v: k for k, v in item_mapping.items()}

                recommendations = []
                for item_idx, score in recommended_items:
                    product_id = reverse_item_mapping.get(item_idx)
                    if product_id:
                        recommendations.append(
                            {
                                "product_id": str(product_id),
                                "score": float(score),
                                "reason": "collaborative_filtering",
                            }
                        )

                return recommendations

        except Exception as e:
            logger.error(f"Error generating ALS recommendations: {e}")
            return self._get_popular_recommendations(limit)

    def _get_content_recommendations(
        self, user_id: str, model: Dict, limit: int
    ) -> List[Dict[str, Any]]:
        """Generate content-based recommendations"""
        try:
            similarity_matrix = model["model"]["similarity_matrix"]
            product_ids = model["model"]["product_ids"]
            products_df = model["model"]["products_df"]

            # Get user's recent purchases
            recent_orders = (
                self.db.query(OrderItem)
                .join(Order)
                .filter(Order.user_id == uuid.UUID(user_id))
                .order_by(Order.created_at.desc())
                .limit(10)
                .all()
            )

            if not recent_orders:
                return self._get_popular_recommendations(limit)

            # Get similarity scores for user's purchased products
            recommended_products = set()
            product_scores = {}

            for order_item in recent_orders:
                product_id = str(order_item.product_id)
                if product_id in product_ids:
                    product_idx = product_ids.index(product_id)

                    # Get similar products
                    similarity_scores = similarity_matrix[product_idx]

                    # Get top similar products
                    for i, score in enumerate(similarity_scores):
                        similar_product_id = product_ids[i]
                        if similar_product_id != product_id and score > 0.1:
                            if similar_product_id not in product_scores:
                                product_scores[similar_product_id] = 0
                            product_scores[similar_product_id] += score

            # Sort and limit recommendations
            sorted_products = sorted(
                product_scores.items(), key=lambda x: x[1], reverse=True
            )[:limit]

            recommendations = []
            for product_id, score in sorted_products:
                recommendations.append(
                    {
                        "product_id": product_id,
                        "score": float(score),
                        "reason": "content_based",
                    }
                )

            return recommendations

        except Exception as e:
            logger.error(f"Error generating content recommendations: {e}")
            return self._get_popular_recommendations(limit)

    def _get_hybrid_recommendations(
        self, user_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Generate hybrid recommendations combining multiple models"""
        try:
            recommendations = []

            # Get recommendations from different models
            if "als" in self.active_models:
                als_recs = self._get_als_recommendations(
                    user_id, self.active_models["als"], limit // 2
                )
                recommendations.extend(als_recs)

            if "content_based" in self.active_models:
                content_recs = self._get_content_recommendations(
                    user_id, self.active_models["content_based"], limit // 2
                )
                recommendations.extend(content_recs)

            # Remove duplicates and re-score
            seen_products = set()
            unique_recommendations = []

            for rec in recommendations:
                if rec["product_id"] not in seen_products:
                    seen_products.add(rec["product_id"])
                    rec["reason"] = "hybrid"
                    unique_recommendations.append(rec)

            # Sort by score and limit
            unique_recommendations.sort(key=lambda x: x["score"], reverse=True)
            return unique_recommendations[:limit]

        except Exception as e:
            logger.error(f"Error generating hybrid recommendations: {e}")
            return self._get_popular_recommendations(limit)

    def _get_popular_recommendations(self, limit: int) -> List[Dict[str, Any]]:
        """Fallback to popular product recommendations"""
        try:
            # Get most popular products based on recent orders
            popular_products = (
                self.db.query(
                    OrderItem.product_id,
                    func.count(OrderItem.id).label("order_count"),
                    func.sum(OrderItem.quantity).label("total_quantity"),
                )
                .join(Order)
                .filter(Order.created_at >= datetime.utcnow() - timedelta(days=30))
                .group_by(OrderItem.product_id)
                .order_by(desc("order_count"))
                .limit(limit)
                .all()
            )

            recommendations = []
            for product in popular_products:
                recommendations.append(
                    {
                        "product_id": str(product.product_id),
                        "score": float(product.order_count) / 100.0,  # Normalize score
                        "reason": "popular",
                    }
                )

            return recommendations

        except Exception as e:
            logger.error(f"Error generating popular recommendations: {e}")
            return []

    def _load_saved_models(self):
        """Load saved models on startup"""
        try:
            for model_file in os.listdir(self.models_dir):
                if model_file.endswith(".pkl"):
                    model_type = model_file.replace(".pkl", "").split("_")[0]
                    try:
                        model_path = os.path.join(self.models_dir, model_file)
                        with open(model_path, "rb") as f:
                            model_data = joblib.load(f)

                        self.active_models[model_type] = model_data
                        logger.info(f"Loaded saved model: {model_type}")

                    except Exception as e:
                        logger.error(f"Error loading model {model_file}: {e}")

        except Exception as e:
            logger.error(f"Error loading saved models: {e}")

    def _save_model(self, model_data: Dict, model_type: str, training_id: str) -> str:
        """Save trained model"""
        try:
            model_filename = f"{model_type}_{training_id}.pkl"
            model_path = os.path.join(self.models_dir, model_filename)

            with open(model_path, "wb") as f:
                pickle.dump(
                    {
                        "type": model_type,
                        "model": model_data,
                        "trained_at": datetime.utcnow(),
                        "training_id": training_id,
                    },
                    f,
                )

            logger.info(f"Saved model to {model_path}")
            return model_path

        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise

    def _load_model_with_config(
        self, model_type: str, parameters: Dict[str, Any], config_id: str
    ):
        """Load model with specific configuration"""
        try:
            # For now, just update parameters in active models
            # In production, you might want to retrain or reload with new parameters
            if model_type in self.active_models:
                self.active_models[model_type]["parameters"] = parameters
                self.active_models[model_type]["config_id"] = config_id
                logger.info(f"Updated {model_type} model parameters")
            else:
                logger.warning(
                    f"Model {model_type} not loaded, parameters saved for next training"
                )

        except Exception as e:
            logger.error(f"Error loading model with config: {e}")
            raise
