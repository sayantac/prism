"""
Content-Based Model Service - Product Recommendations using TF-IDF.
"""
import logging
from typing import Any, Callable, Dict, List

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services.ml.base_ml_service import BaseMLService

logger = logging.getLogger(__name__)


class ContentModelService(BaseMLService):
    """Service for training and using content-based filtering models."""
    
    def train_content_model(
        self,
        products_df: pd.DataFrame,
        parameters: Dict[str, Any],
        progress_callback: Callable = None,
    ) -> Dict[str, Any]:
        """
        Train content-based filtering model using TF-IDF.
        
        Args:
            products_df: DataFrame with product information
            parameters: Model hyperparameters
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary with success status, trained model, and metrics
        """
        try:
            if progress_callback:
                progress_callback("running", {"progress": 30, "message": "Preparing product features"})

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

            # Calculate cosine similarity
            similarity_matrix = cosine_similarity(tfidf_matrix)

            if progress_callback:
                progress_callback("running", {"progress": 90, "message": "Finalizing model"})

            metrics = {
                "n_products": len(products_df),
                "n_features": tfidf_matrix.shape[1],
                "sparsity": 1.0
                - (tfidf_matrix.nnz / (tfidf_matrix.shape[0] * tfidf_matrix.shape[1])),
            }

            self.logger.info(
                f"Content model trained with {metrics['n_products']} products, "
                f"{metrics['n_features']} features"
            )

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
            self.logger.error(f"Error training content-based model: {e}")
            return {"success": False, "error": str(e)}

    def get_recommendations(
        self,
        model_data: Dict[str, Any],
        product_id: int,
        n_recommendations: int = 10
    ) -> List[int]:
        """
        Get content-based recommendations for a product.
        
        Args:
            model_data: Dictionary containing trained model
            product_id: Product ID to get recommendations for
            n_recommendations: Number of recommendations to return
            
        Returns:
            List of recommended product IDs
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
                similarity_scores,
                key=lambda x: x[1],
                reverse=True
            )[1:n_recommendations + 1]

            # Get product IDs
            recommendations = [product_ids[idx] for idx, _ in similarity_scores]

            self.logger.info(
                f"Generated {len(recommendations)} content-based recommendations "
                f"for product {product_id}"
            )
            return recommendations

        except Exception as e:
            self.logger.error(f"Error getting content-based recommendations: {e}")
            return []

    def get_similar_products(
        self,
        model_data: Dict[str, Any],
        product_ids: List[int],
        n_recommendations: int = 10
    ) -> List[int]:
        """
        Get products similar to a list of products (e.g., user's purchase history).
        
        Args:
            model_data: Dictionary containing trained model
            product_ids: List of product IDs
            n_recommendations: Number of recommendations to return
            
        Returns:
            List of recommended product IDs
        """
        try:
            similarity_matrix = model_data["similarity_matrix"]
            all_product_ids = model_data["product_ids"]

            # Get indices for input products
            product_indices = [
                all_product_ids.index(pid) for pid in product_ids
                if pid in all_product_ids
            ]

            if not product_indices:
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

            return recommendations

        except Exception as e:
            self.logger.error(f"Error getting similar products: {e}")
            return []
