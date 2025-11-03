import logging
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import AuditLog, Product, SearchAnalytics, User

logger = logging.getLogger(__name__)


class UserBehaviorService:
    def __init__(self, db: Session):
        self.db = db

    def track_product_view(
        self, user_id: str, product_id: str, session_id: Optional[str] = None
    ):
        """Track when user views a product"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return

            if user.viewed_products:
                viewed_list = [
                    str(pid) for pid in user.viewed_products if str(pid) != product_id
                ]
                viewed_list.insert(0, product_id)
                user.viewed_products = viewed_list[-50:]
            else:
                user.viewed_products = [product_id]

            self._log_user_action(
                user_id=user_id,
                action="VIEW_PRODUCT",
                entity_type="Product",
                entity_id=product_id,
                extra_data={"session_id": session_id},
            )

            self.db.commit()

        except Exception as e:
            logger.error(f"Error tracking product view: {str(e)}")
            self.db.rollback()

    def track_cart_add(self, user_id: str, product_id: str, quantity: int):
        """Track when user adds product to cart"""
        try:
            self._log_user_action(
                user_id=user_id,
                action="ADD_TO_CART",
                entity_type="Product",
                entity_id=product_id,
                extra_data={"quantity": quantity},
            )
            self.db.commit()

        except Exception as e:
            logger.error(f"Error tracking cart add: {str(e)}")
            self.db.rollback()

    def track_cart_remove(self, user_id: str, product_id: str):
        """Track when user removes product from cart"""
        try:
            self._log_user_action(
                user_id=user_id,
                action="REMOVE_FROM_CART",
                entity_type="Product",
                entity_id=product_id,
            )
            self.db.commit()

        except Exception as e:
            logger.error(f"Error tracking cart remove: {str(e)}")
            self.db.rollback()

    def track_wishlist_add(self, user_id: str, product_id: str):
        """Track when user adds product to wishlist"""
        try:
            self._log_user_action(
                user_id=user_id,
                action="ADD_TO_WISHLIST",
                entity_type="Product",
                entity_id=product_id,
            )
            self.db.commit()

        except Exception as e:
            logger.error(f"Error tracking wishlist add: {str(e)}")
            self.db.rollback()

    def track_order_placed(self, user_id: str, order_id: str, total_amount: float):
        """Track when user places an order"""
        try:
            self._log_user_action(
                user_id=user_id,
                action="PLACE_ORDER",
                entity_type="Order",
                entity_id=order_id,
                extra_data={"total_amount": total_amount},
            )
            self.db.commit()

        except Exception as e:
            logger.error(f"Error tracking order placement: {str(e)}")
            self.db.rollback()

    def track_search_query(
        self, user_id: str, query: str, results_count: int, session_id: str
    ):
        """Track search query (handled by SearchService)"""

        pass

    def _log_user_action(
        self,
        user_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        extra_data: Optional[Dict[str, Any]] = None,
    ):
        """Log user action to audit log"""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                new_values=extra_data or {},
            )
            self.db.add(audit_log)

        except Exception as e:
            logger.error(f"Error logging user action: {str(e)}")

    @lru_cache(maxsize=100)
    def get_user_interests_from_behavior(self, user_id: str) -> List[str]:
        """Extract user interests from behavior patterns"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or not user.viewed_products:
                return []

            recent_product_ids = (
                user.viewed_products[-20:]
                if len(user.viewed_products) > 20
                else user.viewed_products
            )
            recent_products = (
                self.db.query(Product).filter(Product.id.in_(recent_product_ids)).all()
            )

            category_counts = {}
            brand_counts = {}

            for product in recent_products:
                if product.category:
                    category_name = product.category.name
                    category_counts[category_name] = (
                        category_counts.get(category_name, 0) + 1
                    )

                if product.brand:
                    brand_counts[product.brand] = brand_counts.get(product.brand, 0) + 1

            interests = []

            top_categories = sorted(
                category_counts.items(), key=lambda x: x[1], reverse=True
            )[:3]
            interests.extend([cat[0] for cat in top_categories])

            top_brands = sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)[
                :2
            ]
            interests.extend([brand[0] for brand in top_brands])

            return interests

        except Exception as e:
            logger.error(f"Error extracting user interests: {str(e)}")
            return []

    @lru_cache(maxsize=50)
    def get_user_behavior_stats(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get user behavior statistics"""
        try:
            since_date = datetime.utcnow() - timedelta(days=days)

            action_counts = (
                self.db.query(AuditLog.action, func.count(AuditLog.id).label("count"))
                .filter(AuditLog.user_id == user_id)
                .filter(AuditLog.timestamp >= since_date)
                .group_by(AuditLog.action)
                .all()
            )

            stats = {
                "total_product_views": 0,
                "cart_additions": 0,
                "orders_placed": 0,
                "wishlist_additions": 0,
                "search_queries": 0,
            }

            action_mapping = {
                "VIEW_PRODUCT": "total_product_views",
                "ADD_TO_CART": "cart_additions",
                "PLACE_ORDER": "orders_placed",
                "ADD_TO_WISHLIST": "wishlist_additions",
            }

            for action, count in action_counts:
                if action in action_mapping:
                    stats[action_mapping[action]] = count

            search_count = (
                self.db.query(SearchAnalytics)
                .filter(SearchAnalytics.user_id == user_id)
                .filter(SearchAnalytics.timestamp >= since_date)
                .count()
            )

            stats["search_queries"] = search_count

            return stats

        except Exception as e:
            logger.error(f"Error getting user behavior stats: {str(e)}")
            return {
                "total_product_views": 0,
                "cart_additions": 0,
                "orders_placed": 0,
                "wishlist_additions": 0,
                "search_queries": 0,
            }

    @lru_cache(maxsize=50)
    def get_frequently_viewed_categories(
        self, user_id: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get user's most frequently viewed product categories"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or not user.viewed_products:
                return []

            products = (
                self.db.query(Product)
                .filter(Product.id.in_(user.viewed_products))
                .all()
            )

            category_counts = {}
            for product in products:
                if product.category:
                    cat_name = product.category.name
                    category_counts[cat_name] = category_counts.get(cat_name, 0) + 1

            sorted_categories = sorted(
                category_counts.items(), key=lambda x: x[1], reverse=True
            )[:limit]

            return [
                {"category": cat, "view_count": count}
                for cat, count in sorted_categories
            ]

        except Exception as e:
            logger.error(f"Error getting frequently viewed categories: {str(e)}")
            return []

    @lru_cache(maxsize=50)
    def get_recommended_products_based_on_behavior(
        self, user_id: str, limit: int = 10
    ) -> List[str]:
        """Get product recommendations based on user behavior"""
        try:
            interests = self.get_user_interests_from_behavior(user_id)
            if not interests:
                return []

            recommended_product_ids = []

            for interest in interests:
                from app.models import ProductCategory

                category = (
                    self.db.query(ProductCategory)
                    .filter(ProductCategory.name == interest)
                    .first()
                )

                if category:
                    products = (
                        self.db.query(Product.id)
                        .filter(Product.category_id == category.id)
                        .filter(Product.is_active == True)
                        .filter(Product.in_stock == True)
                        .limit(3)
                        .all()
                    )

                    recommended_product_ids.extend([str(p.id) for p in products])

                if len(recommended_product_ids) < limit:
                    brand_products = (
                        self.db.query(Product.id)
                        .filter(Product.brand == interest)
                        .filter(Product.is_active == True)
                        .filter(Product.in_stock == True)
                        .limit(2)
                        .all()
                    )

                    recommended_product_ids.extend([str(p.id) for p in brand_products])

            return recommended_product_ids[:limit]

        except Exception as e:
            logger.error(f"Error getting behavior-based recommendations: {str(e)}")
            return []

    def update_user_interests(self, user_id: str):
        """Update user interests based on recent behavior"""
        try:
            interests = self.get_user_interests_from_behavior(user_id)

            user = self.db.query(User).filter(User.id == user_id).first()
            if user:
                user.interests = interests[:10]
                self.db.commit()

        except Exception as e:
            logger.error(f"Error updating user interests: {str(e)}")
            self.db.rollback()

    def clean_old_behavior_data(self, days: int = 90):
        """Clean old behavior data to maintain performance"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            deleted_count = (
                self.db.query(AuditLog)
                .filter(AuditLog.timestamp < cutoff_date)
                .filter(
                    AuditLog.action.in_(
                        ["VIEW_PRODUCT", "ADD_TO_CART", "REMOVE_FROM_CART"]
                    )
                )
                .delete()
            )

            self.db.commit()
            logger.info(f"Cleaned {deleted_count} old behavior records")

        except Exception as e:
            logger.error(f"Error cleaning old behavior data: {str(e)}")
            self.db.rollback()
