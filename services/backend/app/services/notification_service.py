import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Notification, Order, Product, User

settings = get_settings()
logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        data: Dict[str, Any] = None,
        scheduled_for: Optional[datetime] = None,
    ):
        """Create a new notification"""
        try:
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                title=title,
                message=message,
                data=data or {},
                scheduled_for=scheduled_for,
            )

            self.db.add(notification)
            self.db.commit()

            logger.info(f"Notification created for user {user_id}: {notification_type}")
            return notification

        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            self.db.rollback()
            return None

    def notify_wishlist_price_drop(
        self, product_id: str, old_price: float, new_price: float
    ):
        """Notify users when wishlist item price drops"""
        try:
            from app.models import wishlist_items

            users_with_product = (
                self.db.query(User)
                .join(wishlist_items, User.id == wishlist_items.c.user_id)
                .filter(wishlist_items.c.product_id == product_id)
                .all()
            )

            product = self.db.query(Product).filter(Product.id == product_id).first()
            if not product:
                return

            price_drop_percentage = ((old_price - new_price) / old_price) * 100

            for user in users_with_product:
                if user.is_active:
                    self.create_notification(
                        user_id=str(user.id),
                        notification_type="wishlist_price_drop",
                        title=f"Price Drop Alert: {product.name}",
                        message=f"Great news! The price of {product.name} has dropped by {price_drop_percentage:.1f}% from ${old_price} to ${new_price}",
                        data={
                            "product_id": product_id,
                            "product_name": product.name,
                            "old_price": old_price,
                            "new_price": new_price,
                            "savings": old_price - new_price,
                        },
                    )

        except Exception as e:
            logger.error(f"Error sending price drop notifications: {str(e)}")

    def notify_back_in_stock(self, product_id: str):
        """Notify users when out-of-stock wishlist item is back in stock"""
        try:
            from app.models import wishlist_items

            users_with_product = (
                self.db.query(User)
                .join(wishlist_items, User.id == wishlist_items.c.user_id)
                .filter(wishlist_items.c.product_id == product_id)
                .all()
            )

            product = self.db.query(Product).filter(Product.id == product_id).first()
            if not product:
                return

            for user in users_with_product:
                if user.is_active:
                    self.create_notification(
                        user_id=str(user.id),
                        notification_type="back_in_stock",
                        title=f"Back in Stock: {product.name}",
                        message=f"{product.name} is now back in stock! Order now before it sells out again.",
                        data={
                            "product_id": product_id,
                            "product_name": product.name,
                            "price": float(product.price),
                            "stock_quantity": product.stock_quantity,
                        },
                    )

        except Exception as e:
            logger.error(f"Error sending back in stock notifications: {str(e)}")

    def notify_order_status_update(
        self, order_id: str, old_status: str, new_status: str
    ):
        """Notify user about order status changes"""
        try:
            order = self.db.query(Order).filter(Order.id == order_id).first()
            if not order:
                return

            status_messages = {
                "confirmed": "Your order has been confirmed and is being prepared for shipment.",
                "shipped": f"Your order has been shipped! Tracking number: {order.tracking_number or 'Will be provided soon'}",
                "delivered": "Your order has been delivered successfully. Thank you for shopping with us!",
                "cancelled": "Your order has been cancelled. If you have any questions, please contact support.",
            }

            if new_status in status_messages:
                self.create_notification(
                    user_id=str(order.user_id),
                    notification_type="order_update",
                    title=f"Order Update: {order.order_number}",
                    message=status_messages[new_status],
                    data={
                        "order_id": order_id,
                        "order_number": order.order_number,
                        "old_status": old_status,
                        "new_status": new_status,
                        "tracking_number": order.tracking_number,
                    },
                )

        except Exception as e:
            logger.error(f"Error sending order status notification: {str(e)}")

    def notify_abandoned_cart(self, user_id: str):
        """Notify user about abandoned cart"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or not user.is_active:
                return

            from app.models import Cart, cart_items

            cart = self.db.query(Cart).filter(Cart.user_id == user_id).first()
            if not cart:
                return

            cart_item_count = (
                self.db.query(cart_items)
                .filter(cart_items.c.cart_id == cart.id)
                .count()
            )

            if cart_item_count > 0:
                self.create_notification(
                    user_id=user_id,
                    notification_type="abandoned_cart",
                    title="Don't forget your cart!",
                    message=f"You have {cart_item_count} item(s) waiting in your cart. Complete your purchase before they're gone!",
                    data={"cart_item_count": cart_item_count},
                )

        except Exception as e:
            logger.error(f"Error sending abandoned cart notification: {str(e)}")

    def notify_personalized_recommendations(self, user_id: str, product_ids: List[str]):
        """Send personalized product recommendations"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or not user.is_active or not product_ids:
                return

            products = (
                self.db.query(Product).filter(Product.id.in_(product_ids[:3])).all()
            )

            product_names = [p.name for p in products]

            self.create_notification(
                user_id=user_id,
                notification_type="recommendations",
                title="New recommendations just for you!",
                message=f"Based on your interests, we think you'll love: {', '.join(product_names)}"
                + (" and more!" if len(product_ids) > 3 else ""),
                data={
                    "recommended_products": product_ids,
                    "recommendation_count": len(product_ids),
                },
            )

        except Exception as e:
            logger.error(f"Error sending recommendation notification: {str(e)}")

    def get_user_notifications(
        self, user_id: str, unread_only: bool = False, limit: int = 50
    ) -> List[Notification]:
        """Get user notifications"""
        try:
            query = self.db.query(Notification).filter(Notification.user_id == user_id)

            if unread_only:
                query = query.filter(Notification.is_read == False)

            notifications = (
                query.order_by(Notification.created_at.desc()).limit(limit).all()
            )

            return notifications

        except Exception as e:
            logger.error(f"Error getting user notifications: {str(e)}")
            return []

    def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        """Mark notification as read"""
        try:
            notification = (
                self.db.query(Notification)
                .filter(Notification.id == notification_id)
                .filter(Notification.user_id == user_id)
                .first()
            )

            if notification:
                notification.is_read = True
                self.db.commit()
                return True

            return False

        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            self.db.rollback()
            return False

    def mark_all_notifications_read(self, user_id: str) -> int:
        """Mark all user notifications as read"""
        try:
            updated_count = (
                self.db.query(Notification)
                .filter(Notification.user_id == user_id)
                .filter(Notification.is_read == False)
                .update({"is_read": True})
            )

            self.db.commit()
            return updated_count

        except Exception as e:
            logger.error(f"Error marking all notifications as read: {str(e)}")
            self.db.rollback()
            return 0

    def cleanup_old_notifications(self, days: int = 90):
        """Clean up old read notifications"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            deleted_count = (
                self.db.query(Notification)
                .filter(Notification.created_at < cutoff_date)
                .filter(Notification.is_read == True)
                .delete()
            )

            self.db.commit()
            logger.info(f"Cleaned up {deleted_count} old notifications")

        except Exception as e:
            logger.error(f"Error cleaning up notifications: {str(e)}")
            self.db.rollback()
