"""
Behavior Analyzer Service.
Analyzes user behavior patterns, shopping patterns, and journeys.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models import Order, OrderItem, Product
from app.models.ml_models import UserAnalyticsDaily, UserJourneyEvent
from app.services.analytics.base_analytics_service import BaseAnalyticsService

logger = logging.getLogger(__name__)


class BehaviorAnalyzer(BaseAnalyticsService):
    """Service for analyzing user behavior patterns."""
    
    def get_user_behavior_summary(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get comprehensive user behavior summary.
        
        Args:
            user_id: User ID to analyze
            days: Number of days to analyze
            
        Returns:
            Dictionary with behavior metrics and patterns
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days)

            # Get daily analytics
            daily_analytics = (
                self.db.query(UserAnalyticsDaily)
                .filter(
                    and_(
                        UserAnalyticsDaily.user_id == uuid.UUID(user_id),
                        UserAnalyticsDaily.date >= start_date.date(),
                    )
                )
                .order_by(UserAnalyticsDaily.date)
                .all()
            )

            # Get journey events
            journey_events = (
                self.db.query(UserJourneyEvent)
                .filter(
                    and_(
                        UserJourneyEvent.user_id == uuid.UUID(user_id),
                        UserJourneyEvent.timestamp >= start_date,
                    )
                )
                .order_by(UserJourneyEvent.timestamp)
                .all()
            )

            if not daily_analytics and not journey_events:
                return self._empty_behavior_summary(user_id, days)

            # Calculate aggregated metrics
            total_page_views = sum(day.page_views or 0 for day in daily_analytics)
            total_searches = sum(day.search_queries or 0 for day in daily_analytics)
            total_products_viewed = sum(day.products_viewed or 0 for day in daily_analytics)
            total_cart_additions = sum(day.cart_additions or 0 for day in daily_analytics)
            total_purchases = sum(day.purchases or 0 for day in daily_analytics)
            total_spent = sum(day.total_spent or 0.0 for day in daily_analytics)

            # Analyze journey patterns
            journey_analysis = self._analyze_user_journey(journey_events)
            
            # Analyze device usage
            device_analysis = self._analyze_device_usage(journey_events)
            
            # Get shopping patterns
            shopping_patterns = self._analyze_shopping_patterns(user_id)

            return {
                "user_id": user_id,
                "analysis_period_days": days,
                "metrics": {
                    "total_page_views": total_page_views,
                    "total_searches": total_searches,
                    "total_products_viewed": total_products_viewed,
                    "total_cart_additions": total_cart_additions,
                    "total_purchases": total_purchases,
                    "total_spent": float(total_spent),
                    "avg_daily_page_views": round(total_page_views / days, 2),
                    "avg_daily_searches": round(total_searches / days, 2),
                    "conversion_rate": round(
                        (total_purchases / total_products_viewed * 100)
                        if total_products_viewed > 0
                        else 0,
                        2,
                    ),
                },
                "journey_analysis": journey_analysis,
                "device_analysis": device_analysis,
                "shopping_patterns": shopping_patterns,
                "favorite_categories": self._get_user_favorite_categories(user_id),
            }

        except Exception as e:
            self.logger.error(f"Error getting user behavior summary: {e}")
            return {"error": str(e)}

    def _analyze_user_journey(self, events: List[UserJourneyEvent]) -> Dict[str, Any]:
        """Analyze user journey from events."""
        if not events:
            return {}

        event_types = {}
        for event in events:
            event_type = event.event_type
            event_types[event_type] = event_types.get(event_type, 0) + 1

        # Calculate session metrics
        sessions = {}
        for event in events:
            if event.session_id not in sessions:
                sessions[event.session_id] = {"start": event.timestamp, "events": 1}
            else:
                sessions[event.session_id]["events"] += 1
                sessions[event.session_id]["end"] = event.timestamp

        avg_events_per_session = (
            sum(s["events"] for s in sessions.values()) / len(sessions)
            if sessions
            else 0
        )

        return {
            "total_events": len(events),
            "unique_sessions": len(sessions),
            "event_type_distribution": event_types,
            "avg_events_per_session": round(avg_events_per_session, 2),
        }

    def _analyze_device_usage(self, events: List[UserJourneyEvent]) -> Dict[str, Any]:
        """Analyze device usage patterns."""
        if not events:
            return {}

        devices = {}
        for event in events:
            if event.device_info:
                device_type = event.device_info.get("type", "unknown")
                devices[device_type] = devices.get(device_type, 0) + 1

        return {
            "device_distribution": devices,
            "total_sessions": len(devices),
        }

    def _get_user_favorite_categories(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's favorite product categories."""
        try:
            # Get products from orders
            category_counts = (
                self.db.query(
                    Product.category_id,
                    Product.category,
                    func.count(OrderItem.id).label("count"),
                    func.sum(OrderItem.quantity).label("total_quantity"),
                )
                .join(OrderItem, OrderItem.product_id == Product.id)
                .join(Order, Order.id == OrderItem.order_id)
                .filter(Order.user_id == uuid.UUID(user_id))
                .group_by(Product.category_id, Product.category)
                .order_by(func.count(OrderItem.id).desc())
                .limit(5)
                .all()
            )

            return [
                {
                    "category_id": str(cat.category_id) if cat.category_id else None,
                    "category": cat.category,
                    "purchase_count": cat.count,
                    "total_quantity": cat.total_quantity,
                }
                for cat in category_counts
            ]

        except Exception as e:
            self.logger.error(f"Error getting favorite categories: {e}")
            return []

    def _analyze_shopping_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze shopping patterns."""
        try:
            # Get orders
            orders = (
                self.db.query(Order)
                .filter(Order.user_id == uuid.UUID(user_id))
                .order_by(Order.created_at.desc())
                .limit(50)
                .all()
            )

            if not orders:
                return {}

            # Calculate patterns
            order_hours = [order.created_at.hour for order in orders]
            order_days = [order.created_at.weekday() for order in orders]

            # Find most common ordering time
            from collections import Counter

            hour_distribution = Counter(order_hours)
            day_distribution = Counter(order_days)

            day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

            return {
                "total_orders": len(orders),
                "avg_order_value": round(
                    sum(order.total_amount for order in orders) / len(orders), 2
                ),
                "preferred_hour": hour_distribution.most_common(1)[0][0]
                if hour_distribution
                else None,
                "preferred_day": day_names[day_distribution.most_common(1)[0][0]]
                if day_distribution
                else None,
                "recent_order_frequency_days": self._calculate_order_frequency(orders),
            }

        except Exception as e:
            self.logger.error(f"Error analyzing shopping patterns: {e}")
            return {}

    def _calculate_order_frequency(self, orders: List[Order]) -> float:
        """Calculate average days between orders."""
        if len(orders) < 2:
            return 0.0

        time_diffs = [
            (orders[i - 1].created_at - orders[i].created_at).days
            for i in range(1, len(orders))
        ]

        return round(sum(time_diffs) / len(time_diffs), 1) if time_diffs else 0.0

    def _empty_behavior_summary(self, user_id: str, days: int) -> Dict[str, Any]:
        """Return empty behavior summary structure."""
        return {
            "user_id": user_id,
            "analysis_period_days": days,
            "metrics": {
                "total_page_views": 0,
                "total_searches": 0,
                "total_products_viewed": 0,
                "total_cart_additions": 0,
                "total_purchases": 0,
                "total_spent": 0.0,
                "avg_daily_page_views": 0.0,
                "avg_daily_searches": 0.0,
                "conversion_rate": 0.0,
            },
            "journey_analysis": {},
            "device_analysis": {},
            "shopping_patterns": {},
            "favorite_categories": [],
        }
