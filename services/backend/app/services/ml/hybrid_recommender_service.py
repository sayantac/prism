"""
Hybrid Recommender Service.

This module combines multiple recommendation algorithms to provide more
accurate and diverse recommendations. It blends collaborative filtering,
content-based filtering, and trending signals with configurable weights
to create a unified recommendation score.

The hybrid approach addresses limitations of individual algorithms:
- Cold start: Content-based helps when collaborative filtering lacks data
- Diversity: Mixing algorithms provides varied recommendations
- Accuracy: Ensemble methods typically outperform single algorithms
"""
import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.services.ml.als_model_service import ALSModelService
from app.services.ml.content_model_service import ContentModelService

settings = get_settings()
logger = logging.getLogger(__name__)


class HybridRecommenderService:
    """
    Hybrid recommendation system combining multiple algorithms.

    Blends recommendations from:
    1. Collaborative Filtering (ALS) - user-user and item-item patterns
    2. Content-Based Filtering - product similarity based on features
    3. Trending/Popularity - recent popular items

    Weights can be adjusted based on:
    - User history length (more history = higher CF weight)
    - Item metadata availability (more metadata = higher content weight)
    - Recency (newer users = higher trending weight)

    Example Usage:
        >>> hybrid = HybridRecommenderService(db_session)
        >>> recs = hybrid.get_recommendations(
        ...     user_id=123,
        ...     cf_weight=0.5,
        ...     content_weight=0.3,
        ...     trending_weight=0.2,
        ...     n_recommendations=10
        ... )
    """

    def __init__(self, db: Session, models_dir: Optional[str] = None):
        """
        Initialize hybrid recommender with database session.

        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        self.als_service = ALSModelService(models_dir)
        self.content_service = ContentModelService(models_dir)

    def get_recommendations(
        self,
        user_id: int,
        cf_model: Optional[Dict[str, Any]] = None,
        content_model: Optional[Dict[str, Any]] = None,
        cf_weight: float = 0.5,
        content_weight: float = 0.3,
        trending_weight: float = 0.2,
        n_recommendations: int = 10,
        category_filter: Optional[str] = None,
        exclude_purchased: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Generate hybrid recommendations combining multiple algorithms.

        Args:
            user_id: User ID to generate recommendations for
            cf_model: Trained collaborative filtering model (optional)
            content_model: Trained content-based model (optional)
            cf_weight: Weight for collaborative filtering (0-1)
            content_weight: Weight for content-based filtering (0-1)
            trending_weight: Weight for trending items (0-1)
            n_recommendations: Number of recommendations to return
            category_filter: Optional category to filter recommendations
            exclude_purchased: Whether to exclude already purchased items

        Returns:
            List of recommendation dicts with product info and scores

        Note:
            Weights should sum to 1.0 for proper score normalization.
            If they don't sum to 1.0, they will be normalized automatically.

        Example:
            >>> recs = hybrid.get_recommendations(
            ...     user_id=123,
            ...     cf_weight=0.6,
            ...     content_weight=0.4,
            ...     n_recommendations=10
            ... )
            >>> # [{"product_id": 456, "score": 0.85, "algorithm": "hybrid", ...}, ...]
        """
        try:
            # Normalize weights to sum to 1.0
            total_weight = cf_weight + content_weight + trending_weight
            if total_weight == 0:
                logger.warning("All weights are 0, using equal weights")
                cf_weight = content_weight = trending_weight = 1.0 / 3
                total_weight = 1.0

            cf_weight /= total_weight
            content_weight /= total_weight
            trending_weight /= total_weight

            logger.info(
                f"Generating hybrid recommendations for user {user_id}: "
                f"CF={cf_weight:.2f}, Content={content_weight:.2f}, "
                f"Trending={trending_weight:.2f}"
            )

            # Collect recommendations from each algorithm
            recommendations_by_product = {}

            # 1. Collaborative Filtering Recommendations
            if cf_weight > 0 and cf_model:
                cf_recs = self._get_collaborative_recommendations(
                    user_id, cf_model, n_recommendations * 3
                )
                for rec in cf_recs:
                    product_id = rec["product_id"]
                    if product_id not in recommendations_by_product:
                        recommendations_by_product[product_id] = {
                            "product_id": product_id,
                            "cf_score": 0.0,
                            "content_score": 0.0,
                            "trending_score": 0.0,
                        }
                    recommendations_by_product[product_id]["cf_score"] = rec.get(
                        "score", 0.5
                    )

            # 2. Content-Based Recommendations
            if content_weight > 0 and content_model:
                content_recs = self._get_content_based_recommendations(
                    user_id, content_model, n_recommendations * 3
                )
                for rec in content_recs:
                    product_id = rec["product_id"]
                    if product_id not in recommendations_by_product:
                        recommendations_by_product[product_id] = {
                            "product_id": product_id,
                            "cf_score": 0.0,
                            "content_score": 0.0,
                            "trending_score": 0.0,
                        }
                    recommendations_by_product[product_id]["content_score"] = rec.get(
                        "score", 0.5
                    )

            # 3. Trending Recommendations
            if trending_weight > 0:
                trending_recs = self._get_trending_recommendations(
                    n_recommendations * 2, category_filter
                )
                for rec in trending_recs:
                    product_id = rec["product_id"]
                    if product_id not in recommendations_by_product:
                        recommendations_by_product[product_id] = {
                            "product_id": product_id,
                            "cf_score": 0.0,
                            "content_score": 0.0,
                            "trending_score": 0.0,
                        }
                    recommendations_by_product[product_id]["trending_score"] = rec.get(
                        "score", 0.5
                    )

            # Calculate hybrid scores
            hybrid_recommendations = []
            for product_id, scores in recommendations_by_product.items():
                hybrid_score = (
                    cf_weight * scores["cf_score"]
                    + content_weight * scores["content_score"]
                    + trending_weight * scores["trending_score"]
                )

                hybrid_recommendations.append(
                    {
                        "product_id": product_id,
                        "score": round(hybrid_score, 4),
                        "cf_score": round(scores["cf_score"], 4),
                        "content_score": round(scores["content_score"], 4),
                        "trending_score": round(scores["trending_score"], 4),
                        "algorithm": "hybrid",
                    }
                )

            # Sort by hybrid score (descending)
            hybrid_recommendations.sort(key=lambda x: x["score"], reverse=True)

            # Filter out purchased items if requested
            if exclude_purchased:
                purchased_ids = self._get_user_purchased_products(user_id)
                hybrid_recommendations = [
                    rec
                    for rec in hybrid_recommendations
                    if rec["product_id"] not in purchased_ids
                ]

            # Return top N
            result = hybrid_recommendations[:n_recommendations]

            logger.info(
                f"Generated {len(result)} hybrid recommendations for user {user_id}"
            )
            return result

        except Exception as e:
            logger.error(
                f"Error generating hybrid recommendations: {e}", exc_info=True
            )
            return []

    def _get_collaborative_recommendations(
        self, user_id: int, cf_model: Dict[str, Any], limit: int
    ) -> List[Dict[str, Any]]:
        """
        Get collaborative filtering recommendations.

        Args:
            user_id: User ID
            cf_model: Trained CF model
            limit: Number of recommendations

        Returns:
            List of recommendations with scores
        """
        try:
            product_ids = self.als_service.get_recommendations(
                model_data=cf_model, user_id=user_id, n_recommendations=limit
            )

            # Convert to dict format with scores
            # (ALS scores are implicit, use normalized rank)
            recommendations = []
            for i, product_id in enumerate(product_ids):
                # Higher rank = higher score (linear decay)
                score = 1.0 - (i / len(product_ids)) if product_ids else 0.5
                recommendations.append({"product_id": product_id, "score": score})

            return recommendations

        except Exception as e:
            logger.error(f"Error getting CF recommendations: {e}", exc_info=True)
            return []

    def _get_content_based_recommendations(
        self, user_id: int, content_model: Dict[str, Any], limit: int
    ) -> List[Dict[str, Any]]:
        """
        Get content-based recommendations based on user's purchase history.

        Args:
            user_id: User ID
            content_model: Trained content-based model
            limit: Number of recommendations

        Returns:
            List of recommendations with similarity scores
        """
        try:
            # Get user's purchase history
            purchased_products = self._get_user_purchased_products(user_id)

            if not purchased_products:
                logger.debug(f"User {user_id} has no purchase history")
                return []

            # Get similar products based on purchase history
            product_ids = self.content_service.get_similar_products(
                model_data=content_model,
                product_ids=list(purchased_products)[:5],  # Use last 5 purchases
                n_recommendations=limit,
            )

            # Convert to dict format with scores
            recommendations = []
            for i, product_id in enumerate(product_ids):
                # Similarity-based score (linear decay)
                score = 1.0 - (i / len(product_ids)) if product_ids else 0.5
                recommendations.append({"product_id": product_id, "score": score})

            return recommendations

        except Exception as e:
            logger.error(
                f"Error getting content-based recommendations: {e}", exc_info=True
            )
            return []

    def _get_trending_recommendations(
        self, limit: int, category_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get trending/popular product recommendations.

        Based on recent sales and views (last 7 days).

        Args:
            limit: Number of recommendations
            category_filter: Optional category to filter by

        Returns:
            List of trending products with popularity scores
        """
        try:
            query = """
                WITH product_popularity AS (
                    SELECT
                        p.id as product_id,
                        COUNT(DISTINCT oi.order_id) as order_count,
                        SUM(oi.quantity) as total_quantity,
                        COUNT(DISTINCT CASE
                            WHEN o.created_at >= NOW() - INTERVAL '7 days'
                            THEN oi.order_id
                        END) as recent_orders
                    FROM products p
                    LEFT JOIN order_items oi ON p.id = oi.product_id
                    LEFT JOIN orders o ON oi.order_id = o.id
                        AND o.status NOT IN ('cancelled', 'pending')
                    WHERE p.is_active = true
                        AND p.stock_quantity > 0
            """

            if category_filter:
                query += " AND p.category_id = :category_filter"

            query += """
                    GROUP BY p.id
                    HAVING COUNT(DISTINCT oi.order_id) > 0
                )
                SELECT
                    product_id,
                    (recent_orders * 2.0 + order_count) / 3.0 as popularity_score
                FROM product_popularity
                ORDER BY popularity_score DESC
                LIMIT :limit
            """

            from sqlalchemy import text

            params = {"limit": limit}
            if category_filter:
                params["category_filter"] = category_filter

            results = self.db.execute(text(query), params).fetchall()

            # Normalize scores to 0-1 range
            max_score = max([float(r.popularity_score) for r in results]) if results else 1.0

            recommendations = [
                {
                    "product_id": r.product_id,
                    "score": float(r.popularity_score) / max_score if max_score > 0 else 0.5,
                }
                for r in results
            ]

            return recommendations

        except Exception as e:
            logger.error(f"Error getting trending recommendations: {e}", exc_info=True)
            return []

    def _get_user_purchased_products(self, user_id: int) -> set:
        """
        Get set of product IDs the user has already purchased.

        Args:
            user_id: User ID

        Returns:
            Set of product IDs
        """
        try:
            from sqlalchemy import text

            query = text("""
                SELECT DISTINCT oi.product_id
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE o.user_id = :user_id
                AND o.status NOT IN ('cancelled', 'pending')
            """)

            results = self.db.execute(query, {"user_id": user_id}).fetchall()
            return {r.product_id for r in results}

        except Exception as e:
            logger.error(
                f"Error getting user purchased products: {e}", exc_info=True
            )
            return set()

    def get_adaptive_recommendations(
        self,
        user_id: int,
        cf_model: Optional[Dict[str, Any]] = None,
        content_model: Optional[Dict[str, Any]] = None,
        n_recommendations: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Get recommendations with adaptive weighting based on user profile.

        Automatically adjusts algorithm weights based on:
        - User history length (more history = higher CF weight)
        - Account age (newer users = higher trending weight)
        - Purchase diversity (more diverse = higher content weight)

        Args:
            user_id: User ID
            cf_model: Trained CF model
            content_model: Trained content model
            n_recommendations: Number of recommendations

        Returns:
            List of recommendations with adaptive weights

        Example:
            >>> # New user with little history -> trending weighted
            >>> recs = hybrid.get_adaptive_recommendations(user_id=123)
            >>>
            >>> # Established user with lots of history -> CF weighted
            >>> recs = hybrid.get_adaptive_recommendations(user_id=456)
        """
        try:
            # Get user profile statistics
            user_stats = self._get_user_statistics(user_id)

            # Adaptive weight calculation
            purchase_count = user_stats.get("purchase_count", 0)
            account_age_days = user_stats.get("account_age_days", 0)

            # Weight calculation rules:
            # - New users (< 30 days): More trending
            # - Few purchases (< 5): More content-based
            # - Many purchases (>= 5): More collaborative

            if account_age_days < 30 or purchase_count < 3:
                # New or inactive user: trending-focused
                cf_weight = 0.2
                content_weight = 0.3
                trending_weight = 0.5
            elif purchase_count < 10:
                # Moderate history: balanced with content focus
                cf_weight = 0.3
                content_weight = 0.5
                trending_weight = 0.2
            else:
                # Established user: CF-focused
                cf_weight = 0.6
                content_weight = 0.3
                trending_weight = 0.1

            logger.info(
                f"Adaptive weights for user {user_id} "
                f"(purchases={purchase_count}, age={account_age_days}d): "
                f"CF={cf_weight}, Content={content_weight}, Trending={trending_weight}"
            )

            return self.get_recommendations(
                user_id=user_id,
                cf_model=cf_model,
                content_model=content_model,
                cf_weight=cf_weight,
                content_weight=content_weight,
                trending_weight=trending_weight,
                n_recommendations=n_recommendations,
            )

        except Exception as e:
            logger.error(
                f"Error generating adaptive recommendations: {e}", exc_info=True
            )
            # Fallback to default weights
            return self.get_recommendations(
                user_id=user_id,
                cf_model=cf_model,
                content_model=content_model,
                n_recommendations=n_recommendations,
            )

    def _get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        """
        Get user statistics for adaptive weighting.

        Args:
            user_id: User ID

        Returns:
            Dict with user stats (purchase_count, account_age_days, etc.)
        """
        try:
            from sqlalchemy import text

            query = text("""
                SELECT
                    COUNT(DISTINCT o.id) as purchase_count,
                    EXTRACT(DAY FROM (NOW() - u.created_at)) as account_age_days,
                    COUNT(DISTINCT p.category_id) as category_diversity
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                    AND o.status NOT IN ('cancelled', 'pending')
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE u.id = :user_id
                GROUP BY u.id, u.created_at
            """)

            result = self.db.execute(query, {"user_id": user_id}).fetchone()

            if result:
                return {
                    "purchase_count": result.purchase_count or 0,
                    "account_age_days": result.account_age_days or 0,
                    "category_diversity": result.category_diversity or 0,
                }

            return {"purchase_count": 0, "account_age_days": 0, "category_diversity": 0}

        except Exception as e:
            logger.error(f"Error getting user statistics: {e}", exc_info=True)
            return {"purchase_count": 0, "account_age_days": 0, "category_diversity": 0}


def get_hybrid_recommender_service(db: Session) -> HybridRecommenderService:
    """
    Get instance of HybridRecommenderService.

    Args:
        db: SQLAlchemy database session

    Returns:
        HybridRecommenderService instance

    Example:
        >>> from app.database import get_db
        >>> db = next(get_db())
        >>> service = get_hybrid_recommender_service(db)
        >>> recs = service.get_adaptive_recommendations(user_id=123)
    """
    return HybridRecommenderService(db)
