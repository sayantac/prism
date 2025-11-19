"""
ALS Model Service - Collaborative Filtering using Alternating Least Squares.

This module provides collaborative filtering recommendation capabilities using
the ALS (Alternating Least Squares) algorithm. It uses the `implicit` library
when available, with a fallback to a basic matrix factorization implementation.

Collaborative filtering predicts user preferences by finding patterns in
user-item interactions (purchases, views, ratings). ALS is particularly
effective for implicit feedback data (purchases, clicks) and scales well
with large datasets.
"""
import logging
from typing import Any, Callable, Dict, List, Tuple

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix

from app.core.config import get_settings
from app.services.ml.base_ml_service import BaseMLService

settings = get_settings()

# Optional: Import implicit for collaborative filtering if available
try:
    from implicit.als import AlternatingLeastSquares
    IMPLICIT_AVAILABLE = True
except ImportError:
    IMPLICIT_AVAILABLE = False

logger = logging.getLogger(__name__)


class ALSModelService(BaseMLService):
    """
    Service for training and using ALS collaborative filtering models.

    This service implements collaborative filtering using the Alternating Least Squares
    algorithm, which learns latent factors for users and items to predict preferences.

    Key Features:
    - Uses implicit library for optimized ALS implementation
    - Fallback to custom implementation if implicit not available
    - Handles sparse interaction matrices efficiently
    - Provides cold-start handling for new users
    - Supports filtering of already purchased items

    Example Usage:
        >>> als_service = ALSModelService()
        >>> result = als_service.train_als_model(
        ...     interaction_matrix=user_item_matrix,
        ...     user_mapping={1: 0, 2: 1, ...},
        ...     item_mapping={101: 0, 102: 1, ...},
        ...     parameters={"factors": 50, "iterations": 15}
        ... )
        >>> recommendations = als_service.get_recommendations(
        ...     model_data=result["model"],
        ...     user_id=1,
        ...     n_recommendations=10
        ... )
    """
    
    def train_als_model(
        self,
        interaction_matrix,
        user_mapping: Dict[int, int],
        item_mapping: Dict[int, int],
        parameters: Dict[str, Any],
        progress_callback: Callable = None,
    ) -> Dict[str, Any]:
        """
        Train ALS collaborative filtering model.
        
        Args:
            interaction_matrix: Sparse user-item interaction matrix
            user_mapping: Mapping from user IDs to matrix indices
            item_mapping: Mapping from product IDs to matrix indices
            parameters: Model hyperparameters
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary with success status, trained model, and metrics
        """
        try:
            if len(user_mapping) < 10 or len(item_mapping) < 10:
                raise ValueError("Insufficient interaction data for ALS training")

            if progress_callback:
                progress_callback("running", {"progress": 50, "message": "Training ALS model"})

            if IMPLICIT_AVAILABLE:
                # Use implicit library if available
                model = AlternatingLeastSquares(
                    factors=50, regularization=0.1, iterations=20, use_gpu=False
                )

                model.fit(interaction_matrix.T.tocsr())
            else:
                # Basic collaborative filtering implementation
                model = self._basic_collaborative_filtering(
                    interaction_matrix, parameters
                )

            if progress_callback:
                progress_callback("running", {"progress": 80, "message": "Evaluating model"})

            # Calculate metrics
            metrics = self._evaluate_als_model(model, interaction_matrix)

            if progress_callback:
                progress_callback("running", {"progress": 90, "message": "Finalizing model"})

            self.logger.info(f"ALS model trained with {len(user_mapping)} users and {len(item_mapping)} items")

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
            self.logger.error(f"Error training ALS model: {e}")
            return {"success": False, "error": str(e)}

    def get_recommendations(
        self,
        model_data: Dict[str, Any],
        user_id: int,
        n_recommendations: int = 10,
        filter_purchased: bool = True
    ) -> list:
        """
        Get ALS-based recommendations for a user.
        
        Args:
            model_data: Dictionary containing trained model and mappings
            user_id: User ID to get recommendations for
            n_recommendations: Number of recommendations to return
            filter_purchased: Whether to filter out already purchased items
            
        Returns:
            List of recommended product IDs
        """
        try:
            als_model = model_data["als_model"]
            user_mapping = model_data["user_mapping"]
            item_mapping = model_data["item_mapping"]
            interaction_matrix = model_data["interaction_matrix"]

            # Check if user exists in mapping
            if user_id not in user_mapping:
                self.logger.warning(f"User {user_id} not in training data")
                return []

            user_idx = user_mapping[user_id]

            # Validate user index
            if user_idx >= interaction_matrix.shape[0]:
                self.logger.error(
                    f"User index {user_idx} out of bounds for matrix shape {interaction_matrix.shape}"
                )
                return []

            # Get recommendations
            if IMPLICIT_AVAILABLE:
                # Convert to CSR format for efficient slicing
                user_items = interaction_matrix.tocsr()

                # Validate matrix dimensions match model expectations
                model_n_items = als_model.item_factors.shape[0]
                matrix_n_items = user_items.shape[1]

                if model_n_items != matrix_n_items:
                    self.logger.warning(
                        f"Dimension mismatch: model expects {model_n_items} items, "
                        f"but matrix has {matrix_n_items} items. Adjusting matrix..."
                    )
                    # Truncate or pad the interaction matrix to match model dimensions
                    if matrix_n_items > model_n_items:
                        # Truncate to model size (only use first N items that model knows about)
                        user_items = user_items[:, :model_n_items]
                    else:
                        # Pad with zeros for items model was trained on but not in current matrix
                        from scipy.sparse import hstack, csr_matrix
                        padding = csr_matrix((user_items.shape[0], model_n_items - matrix_n_items))
                        user_items = hstack([user_items, padding]).tocsr()

                # Use implicit library
                ids, scores = als_model.recommend(
                    user_idx,
                    user_items[user_idx],
                    N=n_recommendations * 2,  # Get more to filter
                    filter_already_liked_items=filter_purchased
                )

                # Map back to product IDs
                reverse_item_mapping = {v: k for k, v in item_mapping.items()}
                # Filter out indices that don't exist in mapping (additional safety check)
                recommendations = [
                    reverse_item_mapping[idx]
                    for idx in ids[:n_recommendations]
                    if idx in reverse_item_mapping
                ]
            else:
                # Use basic implementation
                recommendations = self._basic_recommend(
                    als_model,
                    user_idx,
                    item_mapping,
                    n_recommendations
                )

            self.logger.info(f"Generated {len(recommendations)} ALS recommendations for user {user_id}")
            return recommendations

        except Exception as e:
            self.logger.error(f"Error getting ALS recommendations: {e}")
            return []

    def _evaluate_als_model(self, model, interaction_matrix) -> Dict[str, float]:
        """Evaluate ALS model performance."""
        try:
            # Basic evaluation metrics
            if IMPLICIT_AVAILABLE:
                # Use implicit's evaluation if available
                metrics = {
                    "num_users": interaction_matrix.shape[0],
                    "num_items": interaction_matrix.shape[1],
                    "sparsity": 1.0 - (interaction_matrix.nnz / (
                        interaction_matrix.shape[0] * interaction_matrix.shape[1]
                    )),
                    "factors": model.factors,
                }
            else:
                metrics = {
                    "num_users": interaction_matrix.shape[0],
                    "num_items": interaction_matrix.shape[1],
                    "sparsity": 1.0 - (interaction_matrix.nnz / (
                        interaction_matrix.shape[0] * interaction_matrix.shape[1]
                    )),
                }

            return metrics

        except Exception as e:
            self.logger.error(f"Error evaluating ALS model: {e}")
            return {}

    def _basic_collaborative_filtering(self, interaction_matrix, parameters):
        """Basic collaborative filtering implementation when implicit is not available."""

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

                # Simple matrix factorization using SGD (Stochastic Gradient Descent)
                for iteration in range(self.iterations):
                    coo = interaction_matrix.tocoo()
                    for i, j, v in zip(coo.row, coo.col, coo.data):
                        error = v - np.dot(self.user_factors[i], self.item_factors[j])

                        # Update factors using gradient descent
                        self.user_factors[i] += self.learning_rate * (
                            error * self.item_factors[j] -
                            self.regularization * self.user_factors[i]
                        )
                        self.item_factors[j] += self.learning_rate * (
                            error * self.user_factors[i] -
                            self.regularization * self.item_factors[j]
                        )

                    logger.debug(f"Completed iteration {iteration + 1}/{self.iterations}")

        model = BasicCollaborativeFilter(
            factors=parameters.get("factors", 100),
            learning_rate=parameters.get("learning_rate", 0.01),
            regularization=parameters.get("regularization", 0.01),
            iterations=parameters.get("iterations", 50),
        )

        model.fit(interaction_matrix)
        return model

    def _basic_recommend(self, model, user_idx, item_mapping, n_recommendations):
        """Get recommendations from basic collaborative filter."""
        # Calculate scores for all items
        scores = np.dot(model.user_factors[user_idx], model.item_factors.T)
        
        # Get top N
        top_indices = np.argsort(scores)[::-1][:n_recommendations]
        
        # Map back to product IDs
        reverse_item_mapping = {v: k for k, v in item_mapping.items()}
        recommendations = [reverse_item_mapping[idx] for idx in top_indices]
        
        return recommendations
