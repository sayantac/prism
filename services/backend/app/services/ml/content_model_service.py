"""
Content-Based Model Service - Product Recommendations using TF-IDF and Embeddings.

This module provides content-based filtering using both traditional TF-IDF
vectorization and modern semantic embeddings (via AWS Bedrock). It can compute
product similarity based on textual features and use these similarities to
recommend products.

Content-based filtering recommends items similar to those a user has interacted
with, based on item features rather than user-user or item-item patterns.
"""
import logging
from typing import Any, Callable, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import get_settings
from app.services.ml.base_ml_service import BaseMLService

settings = get_settings()
logger = logging.getLogger(__name__)


class ContentModelService(BaseMLService):
    """
    Service for training and using content-based filtering models.

    Supports two approaches:
    1. TF-IDF vectorization with cosine similarity (traditional)
    2. Semantic embeddings via AWS Bedrock (modern, captures deeper meaning)

    The hybrid approach combines both methods for robust recommendations.

    Example Usage:
        >>> content_service = ContentModelService()
        >>> # Train TF-IDF model
        >>> result = content_service.train_content_model(
        ...     products_df=products_df,
        ...     parameters={"max_features": 5000}
        ... )
        >>> # Get recommendations
        >>> recs = content_service.get_recommendations(
        ...     model_data=result["model"],
        ...     product_id=123,
        ...     n_recommendations=10
        ... )
    """

    def train_content_model(
        self,
        products_df: pd.DataFrame,
        parameters: Dict[str, Any],
        progress_callback: Optional[Callable] = None,
        use_embeddings: bool = False,
        embeddings_dict: Optional[Dict[int, List[float]]] = None,
    ) -> Dict[str, Any]:
        """
        Train content-based filtering model using TF-IDF and/or embeddings.

        Args:
            products_df: DataFrame with columns: id, name, description, specification, brand
            parameters: Model hyperparameters:
                - max_features: Maximum number of TF-IDF features (default: 5000)
                - ngram_range: N-gram range for TF-IDF (default: [1, 2])
                - min_df: Minimum document frequency (default: 2)
                - max_df: Maximum document frequency (default: 0.8)
                - stop_words: Stop words to remove (default: "english")
            progress_callback: Optional callback(status, {progress, message})
            use_embeddings: Whether to use Bedrock embeddings
            embeddings_dict: Pre-computed embeddings {product_id: embedding_vector}

        Returns:
            Dictionary with:
                - success: bool
                - model: dict with vectorizer, similarity_matrix, product_ids, etc.
                - metrics: dict with model statistics

        Raises:
            ValueError: If products_df is empty or missing required columns
        """
        try:
            if products_df.empty:
                raise ValueError("products_df cannot be empty")

            required_cols = ["id", "name"]
            missing_cols = [col for col in required_cols if col not in products_df.columns]
            if missing_cols:
                raise ValueError(f"Missing required columns: {missing_cols}")

            if progress_callback:
                progress_callback("running", {"progress": 30, "message": "Preparing product features"})

            # Combine text features for TF-IDF
            products_df = products_df.copy()
            products_df["combined_features"] = (
                products_df["name"].fillna("")
                + " "
                + products_df.get("description", pd.Series("")).fillna("")
                + " "
                + products_df.get("specification", pd.Series("")).fillna("")
                + " "
                + products_df.get("brand", pd.Series("")).fillna("")
                + " "
                + products_df.get("technical_details", pd.Series("")).fillna("")
            )

            if progress_callback:
                progress_callback("running", {"progress": 50, "message": "Creating TF-IDF vectors"})

            # Create TF-IDF vectors
            vectorizer = TfidfVectorizer(
                max_features=parameters.get("max_features", 5000),
                ngram_range=tuple(parameters.get("ngram_range", [1, 2])),
                min_df=parameters.get("min_df", 2),
                max_df=parameters.get("max_df", 0.8),
                stop_words=parameters.get("stop_words", "english"),
            )

            tfidf_matrix = vectorizer.fit_transform(products_df["combined_features"])

            if progress_callback:
                progress_callback("running", {"progress": 70, "message": "Calculating similarity matrix"})

            # Calculate TF-IDF cosine similarity
            tfidf_similarity = cosine_similarity(tfidf_matrix)

            # Optionally incorporate embeddings
            embedding_similarity = None
            if use_embeddings and embeddings_dict:
                logger.info("Computing embedding-based similarity")
                embedding_similarity = self._compute_embedding_similarity(
                    products_df["id"].tolist(), embeddings_dict
                )

            # Combine similarities if both are available
            if embedding_similarity is not None:
                # Weighted combination: 60% TF-IDF, 40% embeddings
                tfidf_weight = parameters.get("tfidf_weight", 0.6)
                embedding_weight = 1.0 - tfidf_weight
                final_similarity = (
                    tfidf_weight * tfidf_similarity +
                    embedding_weight * embedding_similarity
                )
                logger.info(
                    f"Combined similarity: {tfidf_weight*100}% TF-IDF, "
                    f"{embedding_weight*100}% embeddings"
                )
            else:
                final_similarity = tfidf_similarity

            if progress_callback:
                progress_callback("running", {"progress": 90, "message": "Finalizing model"})

            metrics = {
                "n_products": len(products_df),
                "n_features": tfidf_matrix.shape[1],
                "tfidf_sparsity": 1.0 - (
                    tfidf_matrix.nnz / (tfidf_matrix.shape[0] * tfidf_matrix.shape[1])
                ),
                "uses_embeddings": use_embeddings and embeddings_dict is not None,
                "avg_similarity": float(np.mean(final_similarity)),
            }

            self.logger.info(
                f"Content model trained with {metrics['n_products']} products, "
                f"{metrics['n_features']} TF-IDF features, "
                f"embeddings: {metrics['uses_embeddings']}"
            )

            return {
                "success": True,
                "model": {
                    "vectorizer": vectorizer,
                    "tfidf_matrix": tfidf_matrix,
                    "similarity_matrix": final_similarity,
                    "product_ids": products_df["id"].tolist(),
                    "products_df": products_df,
                    "embeddings_dict": embeddings_dict if use_embeddings else None,
                },
                "metrics": metrics,
            }

        except Exception as e:
            self.logger.error(f"Error training content-based model: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _compute_embedding_similarity(
        self, product_ids: List[int], embeddings_dict: Dict[int, List[float]]
    ) -> np.ndarray:
        """
        Compute cosine similarity matrix from product embeddings.

        Args:
            product_ids: List of product IDs in order
            embeddings_dict: Dictionary mapping product IDs to embedding vectors

        Returns:
            Similarity matrix (n_products x n_products)
        """
        # Build embedding matrix
        embeddings_list = []
        for pid in product_ids:
            if pid in embeddings_dict:
                embeddings_list.append(embeddings_dict[pid])
            else:
                # Use zero vector for missing embeddings
                embedding_dim = settings.BEDROCK_EMBEDDING_DIMENSION
                embeddings_list.append([0.0] * embedding_dim)
                logger.warning(f"Missing embedding for product {pid}, using zero vector")

        embeddings_matrix = np.array(embeddings_list)

        # Compute cosine similarity
        similarity = cosine_similarity(embeddings_matrix)
        return similarity

    def get_recommendations(
        self, model_data: Dict[str, Any], product_id: int, n_recommendations: int = 10
    ) -> List[int]:
        """
        Get content-based recommendations for a product.

        Finds products most similar to the given product based on
        content features (text, embeddings).

        Args:
            model_data: Dictionary containing trained model components
            product_id: Product ID to get recommendations for
            n_recommendations: Number of recommendations to return

        Returns:
            List of recommended product IDs, ordered by similarity

        Example:
            >>> recs = content_service.get_recommendations(
            ...     model_data=trained_model,
            ...     product_id=123,
            ...     n_recommendations=5
            ... )
        """
        try:
            similarity_matrix = model_data["similarity_matrix"]
            product_ids = model_data["product_ids"]

            # Find product index
            if product_id not in product_ids:
                self.logger.warning(f"Product {product_id} not in training data")
                return []

            product_idx = product_ids.index(product_id)

            # Get similarity scores
            similarity_scores = list(enumerate(similarity_matrix[product_idx]))

            # Sort by similarity (excluding the product itself)
            similarity_scores = sorted(
                similarity_scores, key=lambda x: x[1], reverse=True
            )[1 : n_recommendations + 1]

            # Get product IDs
            recommendations = [product_ids[idx] for idx, _ in similarity_scores]

            self.logger.info(
                f"Generated {len(recommendations)} content-based recommendations "
                f"for product {product_id}"
            )
            return recommendations

        except Exception as e:
            self.logger.error(
                f"Error getting content-based recommendations: {e}", exc_info=True
            )
            return []

    def get_similar_products(
        self,
        model_data: Dict[str, Any],
        product_ids: List[int],
        n_recommendations: int = 10,
    ) -> List[int]:
        """
        Get products similar to a list of products (e.g., user's purchase history).

        Aggregates similarity across multiple seed products to find
        items that are similar to the user's overall preferences.

        Args:
            model_data: Dictionary containing trained model
            product_ids: List of product IDs (user's history)
            n_recommendations: Number of recommendations to return

        Returns:
            List of recommended product IDs

        Example:
            >>> # Get recommendations based on user's purchase history
            >>> recs = content_service.get_similar_products(
            ...     model_data=trained_model,
            ...     product_ids=[101, 102, 103],  # User's purchases
            ...     n_recommendations=10
            ... )
        """
        try:
            similarity_matrix = model_data["similarity_matrix"]
            all_product_ids = model_data["product_ids"]

            # Get indices for input products
            product_indices = [
                all_product_ids.index(pid)
                for pid in product_ids
                if pid in all_product_ids
            ]

            if not product_indices:
                self.logger.warning("None of the input products found in training data")
                return []

            # Average similarity scores across all input products
            avg_similarity = similarity_matrix[product_indices].mean(axis=0)

            # Get top recommendations (excluding input products)
            recommendations = []
            for idx in avg_similarity.argsort()[::-1]:
                product_id = all_product_ids[idx]
                if product_id not in product_ids:
                    recommendations.append(product_id)
                if len(recommendations) >= n_recommendations:
                    break

            self.logger.info(
                f"Generated {len(recommendations)} recommendations based on "
                f"{len(product_ids)} seed products"
            )
            return recommendations

        except Exception as e:
            self.logger.error(f"Error getting similar products: {e}", exc_info=True)
            return []

    def get_product_similarity_scores(
        self, model_data: Dict[str, Any], product_id1: int, product_id2: int
    ) -> Optional[float]:
        """
        Get similarity score between two specific products.

        Args:
            model_data: Dictionary containing trained model
            product_id1: First product ID
            product_id2: Second product ID

        Returns:
            Similarity score (0-1), or None if products not found

        Example:
            >>> score = content_service.get_product_similarity_scores(
            ...     model_data=trained_model,
            ...     product_id1=101,
            ...     product_id2=102
            ... )
        """
        try:
            similarity_matrix = model_data["similarity_matrix"]
            product_ids = model_data["product_ids"]

            if product_id1 not in product_ids or product_id2 not in product_ids:
                return None

            idx1 = product_ids.index(product_id1)
            idx2 = product_ids.index(product_id2)

            return float(similarity_matrix[idx1, idx2])

        except Exception as e:
            self.logger.error(f"Error getting similarity scores: {e}", exc_info=True)
            return None

    def get_most_similar_by_category(
        self,
        model_data: Dict[str, Any],
        product_id: int,
        category: str,
        n_recommendations: int = 10,
    ) -> List[int]:
        """
        Get similar products filtered by category.

        Args:
            model_data: Dictionary containing trained model
            product_id: Source product ID
            category: Target category to filter by
            n_recommendations: Number of recommendations

        Returns:
            List of recommended product IDs from the specified category

        Example:
            >>> # Get similar electronics
            >>> recs = content_service.get_most_similar_by_category(
            ...     model_data=trained_model,
            ...     product_id=123,
            ...     category="Electronics",
            ...     n_recommendations=5
            ... )
        """
        try:
            similarity_matrix = model_data["similarity_matrix"]
            product_ids = model_data["product_ids"]
            products_df = model_data["products_df"]

            if product_id not in product_ids:
                return []

            product_idx = product_ids.index(product_id)

            # Filter by category
            if "category" in products_df.columns:
                category_mask = products_df["category"] == category
                category_indices = products_df[category_mask].index.tolist()
            else:
                logger.warning("No category column in products_df")
                return []

            # Get similarity scores for products in category
            similarity_scores = [
                (idx, similarity_matrix[product_idx, idx])
                for idx in category_indices
                if product_ids[idx] != product_id
            ]

            # Sort and get top N
            similarity_scores.sort(key=lambda x: x[1], reverse=True)
            recommendations = [
                product_ids[idx] for idx, _ in similarity_scores[:n_recommendations]
            ]

            return recommendations

        except Exception as e:
            self.logger.error(
                f"Error getting category-filtered recommendations: {e}", exc_info=True
            )
            return []
