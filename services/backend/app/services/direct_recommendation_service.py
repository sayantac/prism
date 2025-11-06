# app/services/direct_recommendation_service.py
"""
Direct recommendation service that integrates ML engine with user behavior tracking
No external service dependencies - everything runs within the ecom backend
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session

from app.models import Order, OrderItem, Product
from app.models.ml_models import RecommendationConversion
from app.services.ml_engine_service import MLEngineService
from app.services.recommendation_engine_service import RecommendationEngineService

logger = logging.getLogger(__name__)


class DirectRecommendationService:
    """Direct recommendation service with integrated ML and tracking"""

    def __init__(self, db: Session):
        self.db = db
        self.ml_engine = MLEngineService(db)
        self.tracking_service = RecommendationEngineService(db)

    def get_user_recommendations(
        self, user_id: str, context: Optional[Dict[str, Any]] = None, limit: int = 10
    ) -> Dict[str, Any]:
        """Get personalized recommendations for a user with tracking"""
        try:
            # Generate session ID for tracking
            session_id = context.get("session_id", str(uuid.uuid4()))

            # Get recommendations from ML engine
            recommendations = self.ml_engine.get_recommendations(
                user_id=user_id, model_type=context.get("model_type"), limit=limit
            )

            # Enrich recommendations with product details
            enriched_recommendations = self._enrich_recommendations(recommendations)

            # Determine recommendation type for tracking
            rec_type = self._determine_recommendation_type(recommendations)

            # Log recommendation display
            self.tracking_service.log_recommendation_display(
                user_id=user_id,
                session_id=session_id,
                recommendations=enriched_recommendations,
                recommendation_type=rec_type,
                context=context,
            )

            return {
                "user_id": user_id,
                "session_id": session_id,
                "recommendations": enriched_recommendations,
                "recommendation_type": rec_type,
                "total_count": len(enriched_recommendations),
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting user recommendations: {e}")
            # Fallback to simple recommendations
            return self._get_fallback_recommendations(user_id, limit)

    def get_product_recommendations(
        self, product_id: str, user_id: Optional[str] = None, limit: int = 10
    ) -> Dict[str, Any]:
        """Get product-based recommendations (similar products)"""
        try:
            # Use content-based model for product similarity
            if "content_based" in self.ml_engine.active_models:
                model = self.ml_engine.active_models["content_based"]
                recommendations = self._get_similar_products(product_id, model, limit)
            else:
                # Fallback to category-based recommendations
                recommendations = self._get_category_based_recommendations(
                    product_id, limit
                )

            # Enrich with product details
            enriched_recommendations = self._enrich_recommendations(recommendations)

            return {
                "product_id": product_id,
                "recommendations": enriched_recommendations,
                "recommendation_type": "product_similarity",
                "total_count": len(enriched_recommendations),
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting product recommendations: {e}")
            return {"error": str(e), "recommendations": []}

    def get_trending_recommendations(
        self, user_id: Optional[str] = None, days: int = 7, limit: int = 10
    ) -> Dict[str, Any]:
        """Get trending/popular product recommendations"""
        try:
            # Get popular products from recent orders
            start_date = datetime.utcnow() - timedelta(days=days)

            trending_products = (
                self.db.query(
                    OrderItem.product_id,
                    func.count(OrderItem.id).label("order_count"),
                    func.sum(OrderItem.quantity).label("total_quantity"),
                    func.avg(OrderItem.unit_price).label("avg_price"),
                )
                .join(Order)
                .filter(Order.created_at >= start_date)
                .group_by(OrderItem.product_id)
                .order_by(desc("order_count"))
                .limit(limit)
                .all()
            )

            recommendations = []
            for product in trending_products:
                recommendations.append(
                    {
                        "product_id": str(product.product_id),
                        "score": float(product.order_count) / 100.0,
                        "reason": "trending",
                        "trend_data": {
                            "order_count": product.order_count,
                            "total_quantity": product.total_quantity,
                            "avg_price": float(product.avg_price),
                        },
                    }
                )

            # Enrich with product details
            enriched_recommendations = self._enrich_recommendations(recommendations)

            return {
                "recommendations": enriched_recommendations,
                "recommendation_type": "trending",
                "period_days": days,
                "total_count": len(enriched_recommendations),
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting trending recommendations: {e}")
            return {"error": str(e), "recommendations": []}

    def get_reorder_predictions(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Get products user is likely to reorder"""
        try:
            # Use LightGBM model if available
            if "lightgbm" in self.ml_engine.active_models:
                predictions = self._get_lightgbm_reorder_predictions(user_id, limit)
            else:
                # Fallback to simple reorder prediction
                predictions = self._get_simple_reorder_predictions(user_id, limit)

            # Enrich with product details
            enriched_predictions = self._enrich_recommendations(predictions)

            return {
                "user_id": user_id,
                "predictions": enriched_predictions,
                "prediction_type": "reorder",
                "total_count": len(enriched_predictions),
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting reorder predictions: {e}")
            return {"error": str(e), "predictions": []}

    def track_user_interaction(
        self,
        user_id: str,
        session_id: str,
        interaction_type: str,
        product_id: str,
        additional_data: Optional[Dict] = None,
    ):
        """Track user interaction with recommendations"""
        try:
            # Log interaction with tracking service
            self.tracking_service.log_recommendation_interaction(
                user_id=user_id,
                session_id=session_id,
                interaction_type=interaction_type,
                product_id=product_id,
            )

            # If it's a purchase, calculate conversion
            if interaction_type == "purchase" and additional_data:
                self._record_conversion(
                    user_id, session_id, product_id, additional_data
                )

            logger.debug(
                f"Tracked {interaction_type} for user {user_id}, product {product_id}"
            )

        except Exception as e:
            logger.error(f"Error tracking user interaction: {e}")

    def get_user_segment_recommendations(
        self, user_id: str, limit: int = 10
    ) -> Dict[str, Any]:
        """Get recommendations based on user's segment"""
        try:
            # Use K-means model if available for segmentation
            if "kmeans" in self.ml_engine.active_models:
                segment_recommendations = self._get_segment_based_recommendations(
                    user_id, limit
                )
            else:
                # Fallback to behavioral segmentation
                segment_recommendations = self._get_behavioral_segment_recommendations(
                    user_id, limit
                )

            # Enrich with product details
            enriched_recommendations = self._enrich_recommendations(
                segment_recommendations
            )

            return {
                "user_id": user_id,
                "recommendations": enriched_recommendations,
                "recommendation_type": "segment_based",
                "total_count": len(enriched_recommendations),
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting segment recommendations: {e}")
            return {"error": str(e), "recommendations": []}

    def get_recommendation_performance(self, days: int = 30) -> Dict[str, Any]:
        """Get recommendation performance metrics"""
        return self.tracking_service.get_recommendation_performance(days)

    def get_conversion_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get conversion analytics"""
        return self.tracking_service.get_conversion_analytics(days)

    def _enrich_recommendations(
        self, recommendations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Enrich recommendations with product details"""
        try:
            if not recommendations:
                return []

            # Get product IDs
            product_ids = [rec["product_id"] for rec in recommendations]

            # Query product details
            products = (
                self.db.query(Product)
                .filter(
                    and_(
                        Product.id.in_([uuid.UUID(pid) for pid in product_ids]),
                        Product.is_active == True,
                    )
                )
                .all()
            )

            # Create product lookup
            product_lookup = {str(p.id): p for p in products}

            # Enrich recommendations
            enriched = []
            for rec in recommendations:
                product_id = rec["product_id"]
                if product_id in product_lookup:
                    product = product_lookup[product_id]
                    enriched_rec = rec.copy()
                    enriched_rec.update(
                        {
                            "product_name": product.name,
                            "product_price": float(product.price),
                            "product_brand": product.brand,
                            "category_id": str(product.category_id)
                            if product.category_id
                            else None,
                            "in_stock": product.in_stock,
                            "stock_quantity": product.stock_quantity,
                            "images": product.images or [],
                            "product_url": product.product_url,
                        }
                    )
                    enriched.append(enriched_rec)

            return enriched

        except Exception as e:
            logger.error(f"Error enriching recommendations: {e}")
            return recommendations

    def _determine_recommendation_type(
        self, recommendations: List[Dict[str, Any]]
    ) -> str:
        """Determine the type of recommendation based on the source"""
        if not recommendations:
            return "fallback"

        # Check the reason field in recommendations
        reasons = [rec.get("reason", "unknown") for rec in recommendations]

        if "collaborative_filtering" in reasons:
            return "collaborative"
        elif "content_based" in reasons:
            return "content_based"
        elif "hybrid" in reasons:
            return "hybrid"
        elif "popular" in reasons:
            return "popular"
        else:
            return "mixed"

    def _get_fallback_recommendations(self, user_id: str, limit: int) -> Dict[str, Any]:
        """Fallback recommendations when ML engine fails"""
        try:
            # Simple popular products fallback
            popular_products = (
                self.db.query(
                    OrderItem.product_id, func.count(OrderItem.id).label("order_count")
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
                        "score": 0.5,  # Default score
                        "reason": "fallback_popular",
                    }
                )

            enriched_recommendations = self._enrich_recommendations(recommendations)

            return {
                "user_id": user_id,
                "session_id": str(uuid.uuid4()),
                "recommendations": enriched_recommendations,
                "recommendation_type": "fallback",
                "total_count": len(enriched_recommendations),
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting fallback recommendations: {e}")
            return {
                "user_id": user_id,
                "recommendations": [],
                "recommendation_type": "error",
                "error": str(e),
            }

    def _get_similar_products(
        self, product_id: str, model: Dict, limit: int
    ) -> List[Dict[str, Any]]:
        """Get similar products using content-based model"""
        try:
            similarity_matrix = model["model"]["similarity_matrix"]
            product_ids = model["model"]["product_ids"]

            if product_id not in product_ids:
                return []

            product_idx = product_ids.index(product_id)
            similarity_scores = similarity_matrix[product_idx]

            # Get top similar products
            similar_indices = similarity_scores.argsort()[::-1][
                1 : limit + 1
            ]  # Exclude self

            recommendations = []
            for idx in similar_indices:
                if similarity_scores[idx] > 0.1:  # Minimum similarity threshold
                    recommendations.append(
                        {
                            "product_id": product_ids[idx],
                            "score": float(similarity_scores[idx]),
                            "reason": "product_similarity",
                        }
                    )

            return recommendations

        except Exception as e:
            logger.error(f"Error getting similar products: {e}")
            return []

    def _get_category_based_recommendations(
        self, product_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Fallback to category-based recommendations"""
        try:
            # Get the product's category
            product = (
                self.db.query(Product)
                .filter(Product.id == uuid.UUID(product_id))
                .first()
            )
            if not product or not product.category_id:
                return []

            # Get other products in the same category
            similar_products = (
                self.db.query(Product)
                .filter(
                    and_(
                        Product.category_id == product.category_id,
                        Product.id != product.id,
                        Product.is_active == True,
                        Product.in_stock == True,
                    )
                )
                .order_by(func.random())
                .limit(limit)
                .all()
            )

            recommendations = []
            for similar_product in similar_products:
                recommendations.append(
                    {
                        "product_id": str(similar_product.id),
                        "score": 0.7,  # Default similarity score
                        "reason": "same_category",
                    }
                )

            return recommendations

        except Exception as e:
            logger.error(f"Error getting category-based recommendations: {e}")
            return []

    def _get_lightgbm_reorder_predictions(
        self, user_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Get reorder predictions using LightGBM model"""
        try:
            model_data = self.ml_engine.active_models["lightgbm"]
            lgb_model = model_data["model"]["lgb_model"]
            feature_columns = model_data["model"]["feature_columns"]

            # Get user's purchase history
            user_purchases = (
                self.db.query(OrderItem, Product)
                .join(Product, OrderItem.product_id == Product.id)
                .join(Order)
                .filter(Order.user_id == uuid.UUID(user_id))
                .all()
            )

            if not user_purchases:
                return []

            # Create features for each purchased product
            predictions = []
            for order_item, product in user_purchases:
                # Calculate features (simplified)
                features = {
                    "purchase_frequency": 1,  # Would calculate actual frequency
                    "avg_days_between_orders": 30,  # Would calculate actual
                    "std_days_between_orders": 10,  # Would calculate actual
                    "total_quantity": order_item.quantity,
                    "avg_price": float(order_item.unit_price),
                    "days_since_last_purchase": (
                        datetime.utcnow() - order_item.order.created_at
                    ).days,
                }

                # Create feature vector
                feature_vector = [features.get(col, 0) for col in feature_columns]

                # Predict reorder probability
                reorder_prob = lgb_model.predict([feature_vector])[0]

                if reorder_prob > 0.3:  # Threshold for likely reorder
                    predictions.append(
                        {
                            "product_id": str(product.id),
                            "score": float(reorder_prob),
                            "reason": "reorder_prediction",
                        }
                    )

            # Sort by probability and limit
            predictions.sort(key=lambda x: x["score"], reverse=True)
            return predictions[:limit]

        except Exception as e:
            logger.error(f"Error getting LightGBM reorder predictions: {e}")
            return []

    def _get_simple_reorder_predictions(
        self, user_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Simple reorder prediction based on purchase frequency"""
        try:
            # Get products user has purchased multiple times
            reorder_candidates = (
                self.db.query(
                    OrderItem.product_id,
                    func.count(OrderItem.id).label("purchase_count"),
                    func.max(Order.created_at).label("last_purchase"),
                    func.avg(OrderItem.unit_price).label("avg_price"),
                )
                .join(Order)
                .filter(Order.user_id == uuid.UUID(user_id))
                .group_by(OrderItem.product_id)
                .having(
                    func.count(OrderItem.id) > 1  # Purchased more than once
                )
                .order_by(desc("purchase_count"))
                .limit(limit)
                .all()
            )

            predictions = []
            for candidate in reorder_candidates:
                # Calculate days since last purchase
                days_since = (datetime.utcnow() - candidate.last_purchase).days

                # Simple scoring: higher frequency, lower days since = higher score
                score = min(candidate.purchase_count / 10.0, 1.0) * max(
                    0.1, 1.0 - days_since / 365.0
                )

                predictions.append(
                    {
                        "product_id": str(candidate.product_id),
                        "score": float(score),
                        "reason": "frequent_purchase",
                        "purchase_count": candidate.purchase_count,
                        "days_since_last": days_since,
                    }
                )

            return predictions

        except Exception as e:
            logger.error(f"Error getting simple reorder predictions: {e}")
            return []

    def _get_segment_based_recommendations(
        self, user_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Get recommendations based on K-means user segmentation"""
        try:
            # This would require implementing user segmentation prediction
            # For now, return empty as it needs more complex implementation
            return []

        except Exception as e:
            logger.error(f"Error getting segment-based recommendations: {e}")
            return []

    def _get_behavioral_segment_recommendations(
        self, user_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Fallback behavioral segmentation recommendations"""
        try:
            # Get user's purchase behavior
            user_categories = (
                self.db.query(
                    Product.category_id,
                    func.count(OrderItem.id).label("purchase_count"),
                )
                .join(OrderItem)
                .join(Order)
                .filter(Order.user_id == uuid.UUID(user_id))
                .group_by(Product.category_id)
                .order_by(desc("purchase_count"))
                .limit(3)
                .all()
            )

            if not user_categories:
                return []

            # Get popular products from user's preferred categories
            recommendations = []
            for category in user_categories:
                if category.category_id:
                    category_products = (
                        self.db.query(Product)
                        .filter(
                            and_(
                                Product.category_id == category.category_id,
                                Product.is_active == True,
                                Product.in_stock == True,
                            )
                        )
                        .order_by(func.random())
                        .limit(limit // len(user_categories) + 1)
                        .all()
                    )

                    for product in category_products:
                        recommendations.append(
                            {
                                "product_id": str(product.id),
                                "score": 0.6,
                                "reason": "preferred_category",
                            }
                        )

            return recommendations[:limit]

        except Exception as e:
            logger.error(f"Error getting behavioral segment recommendations: {e}")
            return []

    def _record_conversion(
        self,
        user_id: str,
        session_id: str,
        product_id: str,
        purchase_data: Dict[str, Any],
    ):
        """Record a conversion event"""
        try:
            conversion = RecommendationConversion(
                id=uuid.uuid4(),
                user_id=uuid.UUID(user_id),
                session_id=session_id,
                final_conversion={
                    "product_id": product_id,
                    "purchase_data": purchase_data,
                    "converted_at": datetime.utcnow().isoformat(),
                },
                conversion_value=purchase_data.get("amount", 0.0),
                time_to_conversion_minutes=purchase_data.get("time_to_conversion", 0),
            )

            self.db.add(conversion)
            self.db.commit()

            logger.info(f"Recorded conversion for user {user_id}, product {product_id}")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error recording conversion: {e}")

    def retrain_models(self, model_types: Optional[List[str]] = None) -> Dict[str, Any]:
        """Trigger retraining of ML models"""
        try:
            from app.services.training_management_service import (
                TrainingManagementService,
            )

            training_service = TrainingManagementService(self.db)

            if not model_types:
                model_types = ["als", "lightgbm", "kmeans", "content_based"]

            training_results = []
            for model_type in model_types:
                try:
                    # Get active config for this model type
                    from app.models.ml_models import MLModelConfig

                    config = (
                        self.db.query(MLModelConfig)
                        .filter(
                            and_(
                                MLModelConfig.model_type == model_type,
                                MLModelConfig.is_active == True,
                            )
                        )
                        .first()
                    )

                    if config:
                        result = training_service.start_training(
                            str(config.id),
                            "system",  # System user for automated retraining
                        )
                        training_results.append(result)
                        logger.info(f"Started retraining for {model_type}")
                    else:
                        logger.warning(f"No active config found for {model_type}")

                except Exception as e:
                    logger.error(f"Error starting retraining for {model_type}: {e}")

            return {
                "success": True,
                "training_jobs": training_results,
                "message": f"Started retraining for {len(training_results)} models",
            }

        except Exception as e:
            logger.error(f"Error triggering model retraining: {e}")
            return {"success": False, "error": str(e)}
