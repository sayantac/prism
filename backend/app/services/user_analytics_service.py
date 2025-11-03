# app/services/user_analytics_service.py
"""
Advanced user analytics service for behavioral analysis and insights
"""

import logging
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, desc, extract, func
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Order, OrderItem, Product, SearchAnalytics, User
from app.models.ml_models import UserAnalyticsDaily, UserJourneyEvent

settings = get_settings()
logger = logging.getLogger(__name__)


class UserAnalyticsService:
    """Advanced user analytics and behavioral analysis"""

    def __init__(self, db: Session):
        self.db = db

    def track_user_event(
        self,
        user_id: Optional[str],
        session_id: str,
        event_type: str,
        event_data: Dict[str, Any],
        request_info: Optional[Dict[str, Any]] = None,
    ):
        """Track a user journey event"""
        try:
            event = UserJourneyEvent(
                id=uuid.uuid4(),
                user_id=uuid.UUID(user_id) if user_id else None,
                session_id=session_id,
                event_type=event_type,
                event_data=event_data,
                page_url=request_info.get("url") if request_info else None,
                referrer=request_info.get("referrer") if request_info else None,
                user_agent=request_info.get("user_agent") if request_info else None,
                ip_address=request_info.get("ip_address") if request_info else None,
                device_info=request_info.get("device_info") if request_info else None,
                geolocation=request_info.get("geolocation") if request_info else None,
            )

            self.db.add(event)
            self.db.commit()

            # Update daily analytics asynchronously
            if user_id:
                self._update_daily_analytics(user_id, event_type, event_data)

            logger.debug(f"Tracked {event_type} event for user {user_id}")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error tracking user event: {e}")

    def get_user_behavior_summary(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive user behavior summary"""
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

            # Calculate aggregated metrics
            total_page_views = sum(day.page_views for day in daily_analytics)
            total_searches = sum(day.search_queries for day in daily_analytics)
            total_products_viewed = sum(day.products_viewed for day in daily_analytics)
            total_cart_additions = sum(day.cart_additions for day in daily_analytics)
            total_session_time = sum(
                day.session_duration_seconds for day in daily_analytics
            )
            total_revenue = sum(
                day.revenue_generated
                for day in daily_analytics
                if day.revenue_generated
            )

            # Analyze journey patterns
            journey_analysis = self._analyze_user_journey(journey_events)

            # Get device preferences
            device_breakdown = self._analyze_device_usage(daily_analytics)

            # Calculate engagement metrics
            engagement_metrics = self._calculate_engagement_metrics(daily_analytics)

            return {
                "user_id": user_id,
                "analysis_period_days": days,
                "summary_metrics": {
                    "total_page_views": total_page_views,
                    "total_searches": total_searches,
                    "total_products_viewed": total_products_viewed,
                    "total_cart_additions": total_cart_additions,
                    "total_session_time_hours": round(total_session_time / 3600, 2),
                    "total_revenue": float(total_revenue),
                    "avg_session_duration_minutes": round(
                        total_session_time / len(daily_analytics) / 60, 2
                    )
                    if daily_analytics
                    else 0,
                    "active_days": len(daily_analytics),
                },
                "journey_analysis": journey_analysis,
                "device_preferences": device_breakdown,
                "engagement_metrics": engagement_metrics,
                "daily_trends": [
                    self._serialize_daily_analytics(day) for day in daily_analytics
                ],
            }

        except Exception as e:
            logger.error(f"Error getting user behavior summary: {e}")
            return self._empty_behavior_summary(user_id, days)

    def get_user_cohort_analysis(
        self, cohort_period: str = "monthly", months_back: int = 12
    ) -> Dict[str, Any]:
        """Perform cohort analysis on user behavior"""
        try:
            # Define cohort based on user registration date
            cohorts = {}

            if cohort_period == "monthly":
                # Group users by registration month
                cohort_data = (
                    self.db.query(
                        extract("year", User.created_at).label("year"),
                        extract("month", User.created_at).label("month"),
                        func.count(User.id).label("cohort_size"),
                        func.array_agg(User.id).label("user_ids"),
                    )
                    .filter(
                        User.created_at
                        >= datetime.utcnow() - timedelta(days=months_back * 30)
                    )
                    .group_by("year", "month")
                    .all()
                )

                for cohort in cohort_data:
                    cohort_key = f"{int(cohort.year)}-{int(cohort.month):02d}"
                    cohorts[cohort_key] = {
                        "cohort_size": cohort.cohort_size,
                        "user_ids": cohort.user_ids,
                        "retention_rates": self._calculate_cohort_retention(
                            cohort.user_ids, cohort_period
                        ),
                    }

            # Calculate average retention rates
            avg_retention = self._calculate_average_retention(cohorts)

            return {
                "cohort_period": cohort_period,
                "analysis_months": months_back,
                "cohorts": cohorts,
                "average_retention_rates": avg_retention,
                "total_cohorts": len(cohorts),
            }

        except Exception as e:
            logger.error(f"Error performing cohort analysis: {e}")
            return {"error": str(e)}

    def get_funnel_analysis(
        self, funnel_steps: List[str], days: int = 30
    ) -> Dict[str, Any]:
        """Analyze conversion funnel"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)

            # Default funnel if none provided
            if not funnel_steps:
                funnel_steps = [
                    "page_view",
                    "search",
                    "product_view",
                    "add_to_cart",
                    "purchase",
                ]

            # Count users at each step
            funnel_data = {}
            for step in funnel_steps:
                if step == "purchase":
                    # Count users who made purchases
                    count = (
                        self.db.query(func.count(func.distinct(Order.user_id)))
                        .filter(Order.created_at >= start_date)
                        .scalar()
                    )
                else:
                    # Count users who performed the event
                    count = (
                        self.db.query(
                            func.count(func.distinct(UserJourneyEvent.user_id))
                        )
                        .filter(
                            and_(
                                UserJourneyEvent.event_type == step,
                                UserJourneyEvent.timestamp >= start_date,
                                UserJourneyEvent.user_id.isnot(None),
                            )
                        )
                        .scalar()
                    )

                funnel_data[step] = count

            # Calculate conversion rates
            conversion_rates = {}
            total_users = funnel_data.get(funnel_steps[0], 0)

            for i, step in enumerate(funnel_steps):
                if i == 0:
                    conversion_rates[step] = 100.0  # First step is always 100%
                else:
                    prev_count = funnel_data.get(funnel_steps[i - 1], 0)
                    current_count = funnel_data.get(step, 0)
                    conversion_rates[step] = (
                        (current_count / prev_count * 100) if prev_count > 0 else 0
                    )

            # Calculate drop-off rates
            drop_off_rates = {}
            for i, step in enumerate(funnel_steps[:-1]):
                current_count = funnel_data.get(step, 0)
                next_count = funnel_data.get(funnel_steps[i + 1], 0)
                drop_off_rates[f"{step}_to_{funnel_steps[i + 1]}"] = (
                    ((current_count - next_count) / current_count * 100)
                    if current_count > 0
                    else 0
                )

            return {
                "funnel_steps": funnel_steps,
                "period_days": days,
                "funnel_counts": funnel_data,
                "conversion_rates": conversion_rates,
                "drop_off_rates": drop_off_rates,
                "overall_conversion": (
                    funnel_data.get(funnel_steps[-1], 0) / total_users * 100
                )
                if total_users > 0
                else 0,
            }

        except Exception as e:
            logger.error(f"Error performing funnel analysis: {e}")
            return {"error": str(e)}

    def get_user_segmentation_insights(self, days: int = 30) -> Dict[str, Any]:
        """Get user segmentation insights based on behavior"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)

            # Segment users based on activity level
            segments = {
                "highly_active": [],
                "moderately_active": [],
                "low_activity": [],
                "inactive": [],
            }

            # Get user activity data
            user_activity = (
                self.db.query(
                    UserAnalyticsDaily.user_id,
                    func.sum(UserAnalyticsDaily.page_views).label("total_page_views"),
                    func.sum(UserAnalyticsDaily.search_queries).label("total_searches"),
                    func.sum(UserAnalyticsDaily.products_viewed).label(
                        "total_products_viewed"
                    ),
                    func.sum(UserAnalyticsDaily.conversion_events).label(
                        "total_conversions"
                    ),
                    func.count(UserAnalyticsDaily.date).label("active_days"),
                )
                .filter(UserAnalyticsDaily.date >= start_date.date())
                .group_by(UserAnalyticsDaily.user_id)
                .all()
            )

            # Categorize users
            for activity in user_activity:
                score = self._calculate_activity_score(activity)
                user_id = str(activity.user_id)

                if score >= 80:
                    segments["highly_active"].append(user_id)
                elif score >= 50:
                    segments["moderately_active"].append(user_id)
                elif score >= 20:
                    segments["low_activity"].append(user_id)
                else:
                    segments["inactive"].append(user_id)

            # Calculate segment characteristics
            segment_characteristics = {}
            for segment_name, user_ids in segments.items():
                if user_ids:
                    characteristics = self._analyze_segment_characteristics(
                        user_ids, start_date
                    )
                    segment_characteristics[segment_name] = characteristics

            return {
                "analysis_period_days": days,
                "segments": {k: len(v) for k, v in segments.items()},
                "segment_user_ids": segments,
                "segment_characteristics": segment_characteristics,
                "total_analyzed_users": len(user_activity),
            }

        except Exception as e:
            logger.error(f"Error getting user segmentation insights: {e}")
            return {"error": str(e)}

    def get_real_time_metrics(self) -> Dict[str, Any]:
        """Get real-time user activity metrics"""
        try:
            now = datetime.utcnow()
            last_hour = now - timedelta(hours=1)
            last_24h = now - timedelta(hours=24)

            # Active users in last hour
            active_users_1h = (
                self.db.query(func.count(func.distinct(UserJourneyEvent.user_id)))
                .filter(
                    and_(
                        UserJourneyEvent.timestamp >= last_hour,
                        UserJourneyEvent.user_id.isnot(None),
                    )
                )
                .scalar()
            )

            # Active users in last 24 hours
            active_users_24h = (
                self.db.query(func.count(func.distinct(UserJourneyEvent.user_id)))
                .filter(
                    and_(
                        UserJourneyEvent.timestamp >= last_24h,
                        UserJourneyEvent.user_id.isnot(None),
                    )
                )
                .scalar()
            )

            # Events in last hour
            events_1h = (
                self.db.query(func.count(UserJourneyEvent.id))
                .filter(UserJourneyEvent.timestamp >= last_hour)
                .scalar()
            )

            # Page views in last hour
            page_views_1h = (
                self.db.query(func.count(UserJourneyEvent.id))
                .filter(
                    and_(
                        UserJourneyEvent.timestamp >= last_hour,
                        UserJourneyEvent.event_type == "page_view",
                    )
                )
                .scalar()
            )

            # Searches in last hour
            searches_1h = (
                self.db.query(func.count(SearchAnalytics.id))
                .filter(SearchAnalytics.timestamp >= last_hour)
                .scalar()
            )

            # Orders in last hour
            orders_1h = (
                self.db.query(func.count(Order.id))
                .filter(Order.created_at >= last_hour)
                .scalar()
            )

            return {
                "timestamp": now.isoformat(),
                "active_users_1h": active_users_1h,
                "active_users_24h": active_users_24h,
                "events_1h": events_1h,
                "page_views_1h": page_views_1h,
                "searches_1h": searches_1h,
                "orders_1h": orders_1h,
                "events_per_minute": round(events_1h / 60, 2) if events_1h > 0 else 0,
                "avg_session_length_minutes": self._calculate_avg_session_length(
                    last_hour
                ),
            }

        except Exception as e:
            logger.error(f"Error getting real-time metrics: {e}")
            return {"error": str(e)}

    def generate_user_insights_report(self, user_id: str) -> Dict[str, Any]:
        """Generate comprehensive insights report for a specific user"""
        try:
            # Get user basic info
            user = self.db.query(User).filter(User.id == uuid.UUID(user_id)).first()
            if not user:
                raise ValueError(f"User not found: {user_id}")

            # Get behavior summary
            behavior_summary = self.get_user_behavior_summary(user_id, days=90)

            # Get purchase history
            orders = (
                self.db.query(Order)
                .filter(Order.user_id == uuid.UUID(user_id))
                .order_by(desc(Order.created_at))
                .all()
            )

            # Calculate customer lifetime value
            clv = sum(
                float(order.total_amount) for order in orders if order.total_amount
            )

            # Get favorite categories
            favorite_categories = self._get_user_favorite_categories(user_id)

            # Get shopping patterns
            shopping_patterns = self._analyze_shopping_patterns(user_id)

            # Predict churn risk
            churn_risk = self._calculate_churn_risk(user_id)

            # Get recommendations for engagement
            engagement_recommendations = self._generate_engagement_recommendations(
                user_id, behavior_summary
            )

            return {
                "user_id": user_id,
                "user_info": {
                    "username": user.username,
                    "email": user.email,
                    "created_at": user.created_at.isoformat(),
                    "last_active": user.last_active.isoformat()
                    if user.last_active
                    else None,
                    "is_active": user.is_active,
                },
                "behavior_summary": behavior_summary,
                "purchase_metrics": {
                    "total_orders": len(orders),
                    "customer_lifetime_value": round(clv, 2),
                    "average_order_value": round(clv / len(orders), 2) if orders else 0,
                    "last_purchase_date": orders[0].created_at.isoformat()
                    if orders
                    else None,
                    "days_since_last_purchase": (
                        datetime.utcnow() - orders[0].created_at
                    ).days
                    if orders
                    else None,
                },
                "preferences": {
                    "favorite_categories": favorite_categories,
                    "shopping_patterns": shopping_patterns,
                },
                "risk_assessment": {
                    "churn_risk_score": churn_risk,
                    "churn_risk_level": self._get_risk_level(churn_risk),
                },
                "recommendations": engagement_recommendations,
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error generating user insights report: {e}")
            return {"error": str(e)}

    def _update_daily_analytics(
        self, user_id: str, event_type: str, event_data: Dict[str, Any]
    ):
        """Update daily analytics for a user"""
        try:
            today = date.today()

            # Get or create daily analytics record
            daily_analytics = (
                self.db.query(UserAnalyticsDaily)
                .filter(
                    and_(
                        UserAnalyticsDaily.user_id == uuid.UUID(user_id),
                        UserAnalyticsDaily.date == today,
                    )
                )
                .first()
            )

            if not daily_analytics:
                daily_analytics = UserAnalyticsDaily(
                    id=uuid.uuid4(), user_id=uuid.UUID(user_id), date=today
                )
                self.db.add(daily_analytics)

            # Update counters based on event type
            if event_type == "page_view":
                daily_analytics.page_views = (daily_analytics.page_views or 0) + 1
            elif event_type == "search":
                daily_analytics.search_queries = (
                    daily_analytics.search_queries or 0
                ) + 1
            elif event_type == "product_view":
                daily_analytics.products_viewed = (
                    daily_analytics.products_viewed or 0
                ) + 1
                # Track unique products
                if event_data.get("product_id"):
                    daily_analytics.unique_products_viewed = (
                        daily_analytics.unique_products_viewed or 0
                    ) + 1
            elif event_type == "add_to_cart":
                daily_analytics.cart_additions = (
                    daily_analytics.cart_additions or 0
                ) + 1
            elif event_type == "remove_from_cart":
                daily_analytics.cart_removals = (daily_analytics.cart_removals or 0) + 1
            elif event_type == "add_to_wishlist":
                daily_analytics.wishlist_additions = (
                    daily_analytics.wishlist_additions or 0
                ) + 1
            elif event_type == "purchase":
                daily_analytics.conversion_events = (
                    daily_analytics.conversion_events or 0
                ) + 1
                if event_data.get("revenue"):
                    daily_analytics.revenue_generated = (
                        daily_analytics.revenue_generated or 0
                    ) + event_data["revenue"]

            # Update device type if available
            if event_data.get("device_type"):
                daily_analytics.device_type = event_data["device_type"]

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating daily analytics: {e}")

    def _analyze_user_journey(
        self, journey_events: List[UserJourneyEvent]
    ) -> Dict[str, Any]:
        """Analyze user journey patterns"""
        if not journey_events:
            return {"total_events": 0, "event_distribution": {}, "common_paths": []}

        # Count event types
        event_counts = defaultdict(int)
        for event in journey_events:
            event_counts[event.event_type] += 1

        # Find common event sequences
        event_sequences = []
        for i in range(len(journey_events) - 1):
            sequence = (
                f"{journey_events[i].event_type} → {journey_events[i + 1].event_type}"
            )
            event_sequences.append(sequence)

        sequence_counts = defaultdict(int)
        for sequence in event_sequences:
            sequence_counts[sequence] += 1

        common_paths = sorted(
            sequence_counts.items(), key=lambda x: x[1], reverse=True
        )[:5]

        return {
            "total_events": len(journey_events),
            "event_distribution": dict(event_counts),
            "common_paths": [
                {"path": path, "count": count} for path, count in common_paths
            ],
            "session_count": len(set(event.session_id for event in journey_events)),
        }

    def _analyze_device_usage(
        self, daily_analytics: List[UserAnalyticsDaily]
    ) -> Dict[str, Any]:
        """Analyze device usage patterns"""
        device_counts = defaultdict(int)
        for day in daily_analytics:
            if day.device_type:
                device_counts[day.device_type] += 1

        total_days = len(daily_analytics)
        device_percentages = (
            {
                device: round(count / total_days * 100, 2)
                for device, count in device_counts.items()
            }
            if total_days > 0
            else {}
        )

        return {
            "device_usage_counts": dict(device_counts),
            "device_usage_percentages": device_percentages,
            "primary_device": max(device_counts.items(), key=lambda x: x[1])[0]
            if device_counts
            else None,
        }

    def _calculate_engagement_metrics(
        self, daily_analytics: List[UserAnalyticsDaily]
    ) -> Dict[str, Any]:
        """Calculate user engagement metrics"""
        if not daily_analytics:
            return {}

        total_sessions = len(daily_analytics)
        total_page_views = sum(day.page_views or 0 for day in daily_analytics)
        total_session_time = sum(
            day.session_duration_seconds or 0 for day in daily_analytics
        )
        total_conversions = sum(day.conversion_events or 0 for day in daily_analytics)

        return {
            "avg_pages_per_session": round(total_page_views / total_sessions, 2)
            if total_sessions > 0
            else 0,
            "avg_session_duration_minutes": round(
                total_session_time / total_sessions / 60, 2
            )
            if total_sessions > 0
            else 0,
            "conversion_rate": round(total_conversions / total_sessions * 100, 2)
            if total_sessions > 0
            else 0,
            "engagement_score": self._calculate_engagement_score(daily_analytics),
        }

    def _calculate_engagement_score(
        self, daily_analytics: List[UserAnalyticsDaily]
    ) -> float:
        """Calculate overall engagement score (0-100)"""
        if not daily_analytics:
            return 0.0

        # Weighted scoring
        weights = {
            "page_views": 0.2,
            "search_queries": 0.15,
            "products_viewed": 0.25,
            "cart_additions": 0.15,
            "session_duration": 0.15,
            "conversions": 0.1,
        }

        scores = []
        for day in daily_analytics:
            day_score = 0
            day_score += (
                min((day.page_views or 0) / 10, 1) * weights["page_views"] * 100
            )
            day_score += (
                min((day.search_queries or 0) / 5, 1) * weights["search_queries"] * 100
            )
            day_score += (
                min((day.products_viewed or 0) / 15, 1)
                * weights["products_viewed"]
                * 100
            )
            day_score += (
                min((day.cart_additions or 0) / 3, 1) * weights["cart_additions"] * 100
            )
            day_score += (
                min((day.session_duration_seconds or 0) / 1800, 1)
                * weights["session_duration"]
                * 100
            )  # 30 minutes max
            day_score += (
                min((day.conversion_events or 0) / 1, 1) * weights["conversions"] * 100
            )
            scores.append(day_score)

        return round(sum(scores) / len(scores), 2)

    def _calculate_activity_score(self, activity) -> float:
        """Calculate activity score for user segmentation"""
        score = 0
        score += (
            min(activity.total_page_views / 100, 1) * 25
        )  # Max 25 points for page views
        score += min(activity.total_searches / 20, 1) * 20  # Max 20 points for searches
        score += (
            min(activity.total_products_viewed / 50, 1) * 25
        )  # Max 25 points for product views
        score += (
            min(activity.total_conversions / 5, 1) * 30
        )  # Max 30 points for conversions
        return score

    def _analyze_segment_characteristics(
        self, user_ids: List[str], start_date: datetime
    ) -> Dict[str, Any]:
        """Analyze characteristics of a user segment"""
        try:
            # Get aggregated data for this segment
            segment_data = (
                self.db.query(
                    func.avg(UserAnalyticsDaily.page_views).label("avg_page_views"),
                    func.avg(UserAnalyticsDaily.search_queries).label("avg_searches"),
                    func.avg(UserAnalyticsDaily.products_viewed).label(
                        "avg_products_viewed"
                    ),
                    func.avg(UserAnalyticsDaily.session_duration_seconds).label(
                        "avg_session_duration"
                    ),
                    func.sum(UserAnalyticsDaily.revenue_generated).label(
                        "total_revenue"
                    ),
                )
                .filter(
                    and_(
                        UserAnalyticsDaily.user_id.in_(
                            [uuid.UUID(uid) for uid in user_ids]
                        ),
                        UserAnalyticsDaily.date >= start_date.date(),
                    )
                )
                .first()
            )

            return {
                "avg_page_views_per_day": round(
                    float(segment_data.avg_page_views or 0), 2
                ),
                "avg_searches_per_day": round(float(segment_data.avg_searches or 0), 2),
                "avg_products_viewed_per_day": round(
                    float(segment_data.avg_products_viewed or 0), 2
                ),
                "avg_session_duration_minutes": round(
                    float(segment_data.avg_session_duration or 0) / 60, 2
                ),
                "total_segment_revenue": round(
                    float(segment_data.total_revenue or 0), 2
                ),
                "segment_size": len(user_ids),
            }

        except Exception as e:
            logger.error(f"Error analyzing segment characteristics: {e}")
            return {}

    def _calculate_avg_session_length(self, since: datetime) -> float:
        """Calculate average session length in minutes"""
        try:
            # Group events by session and calculate session durations
            sessions = (
                self.db.query(
                    UserJourneyEvent.session_id,
                    func.min(UserJourneyEvent.timestamp).label("session_start"),
                    func.max(UserJourneyEvent.timestamp).label("session_end"),
                )
                .filter(UserJourneyEvent.timestamp >= since)
                .group_by(UserJourneyEvent.session_id)
                .all()
            )

            if not sessions:
                return 0.0

            total_duration = 0
            for session in sessions:
                duration = (session.session_end - session.session_start).total_seconds()
                total_duration += duration

            avg_duration_seconds = total_duration / len(sessions)
            return round(avg_duration_seconds / 60, 2)

        except Exception as e:
            logger.error(f"Error calculating average session length: {e}")
            return 0.0

    def _get_user_favorite_categories(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's favorite product categories"""
        try:
            # Get category preferences from orders
            category_data = (
                self.db.query(
                    Product.category_id,
                    func.count(OrderItem.id).label("purchase_count"),
                    func.sum(OrderItem.quantity).label("total_quantity"),
                )
                .join(OrderItem)
                .join(Order)
                .filter(Order.user_id == uuid.UUID(user_id))
                .group_by(Product.category_id)
                .order_by(desc("purchase_count"))
                .limit(5)
                .all()
            )

            favorites = []
            for category in category_data:
                favorites.append(
                    {
                        "category_id": str(category.category_id),
                        "purchase_count": category.purchase_count,
                        "total_quantity": category.total_quantity,
                    }
                )

            return favorites

        except Exception as e:
            logger.error(f"Error getting favorite categories: {e}")
            return []

    def _analyze_shopping_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze user shopping patterns"""
        try:
            orders = (
                self.db.query(Order).filter(Order.user_id == uuid.UUID(user_id)).all()
            )

            if not orders:
                return {}

            # Analyze order timing
            order_hours = [order.created_at.hour for order in orders]
            order_days = [
                order.created_at.weekday() for order in orders
            ]  # 0=Monday, 6=Sunday

            # Most common shopping hours and days
            hour_counts = defaultdict(int)
            day_counts = defaultdict(int)

            for hour in order_hours:
                hour_counts[hour] += 1
            for day in order_days:
                day_counts[day] += 1

            preferred_hour = (
                max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else None
            )
            preferred_day = (
                max(day_counts.items(), key=lambda x: x[1])[0] if day_counts else None
            )

            # Calculate order frequency
            if len(orders) > 1:
                first_order = min(order.created_at for order in orders)
                last_order = max(order.created_at for order in orders)
                days_between = (last_order - first_order).days
                avg_days_between_orders = days_between / (len(orders) - 1)
            else:
                avg_days_between_orders = None

            return {
                "preferred_shopping_hour": preferred_hour,
                "preferred_shopping_day": preferred_day,
                "avg_days_between_orders": round(avg_days_between_orders, 2)
                if avg_days_between_orders
                else None,
                "total_orders": len(orders),
                "order_frequency_pattern": "regular"
                if avg_days_between_orders and avg_days_between_orders < 30
                else "occasional",
            }

        except Exception as e:
            logger.error(f"Error analyzing shopping patterns: {e}")
            return {}

    def _calculate_churn_risk(self, user_id: str) -> float:
        """Calculate churn risk score (0-100)"""
        try:
            user = self.db.query(User).filter(User.id == uuid.UUID(user_id)).first()
            if not user:
                return 100.0

            now = datetime.utcnow()

            # Days since last activity
            days_since_activity = (
                (now - user.last_active).days if user.last_active else 365
            )

            # Days since last order
            last_order = (
                self.db.query(Order)
                .filter(Order.user_id == uuid.UUID(user_id))
                .order_by(desc(Order.created_at))
                .first()
            )
            days_since_order = (now - last_order.created_at).days if last_order else 365

            # Recent activity level
            recent_activity = (
                self.db.query(UserAnalyticsDaily)
                .filter(
                    and_(
                        UserAnalyticsDaily.user_id == uuid.UUID(user_id),
                        UserAnalyticsDaily.date >= (now - timedelta(days=30)).date(),
                    )
                )
                .count()
            )

            # Calculate risk score
            risk_score = 0

            # Activity recency (40% weight)
            if days_since_activity > 60:
                risk_score += 40
            elif days_since_activity > 30:
                risk_score += 20
            elif days_since_activity > 14:
                risk_score += 10

            # Purchase recency (35% weight)
            if days_since_order > 90:
                risk_score += 35
            elif days_since_order > 60:
                risk_score += 25
            elif days_since_order > 30:
                risk_score += 15

            # Recent engagement (25% weight)
            if recent_activity == 0:
                risk_score += 25
            elif recent_activity < 5:
                risk_score += 15
            elif recent_activity < 10:
                risk_score += 5

            return min(risk_score, 100.0)

        except Exception as e:
            logger.error(f"Error calculating churn risk: {e}")
            return 50.0  # Default medium risk

    def _get_risk_level(self, risk_score: float) -> str:
        """Convert risk score to risk level"""
        if risk_score >= 70:
            return "high"
        elif risk_score >= 40:
            return "medium"
        elif risk_score >= 20:
            return "low"
        else:
            return "very_low"

    def _generate_engagement_recommendations(
        self, user_id: str, behavior_summary: Dict[str, Any]
    ) -> List[str]:
        """Generate recommendations to improve user engagement"""
        recommendations = []

        summary_metrics = behavior_summary.get("summary_metrics", {})
        engagement_metrics = behavior_summary.get("engagement_metrics", {})

        # Low activity recommendations
        if summary_metrics.get("total_page_views", 0) < 50:
            recommendations.append(
                "Send personalized product recommendations to increase page views"
            )

        if summary_metrics.get("total_searches", 0) < 10:
            recommendations.append(
                "Encourage search usage with guided search suggestions"
            )

        if engagement_metrics.get("avg_session_duration_minutes", 0) < 5:
            recommendations.append(
                "Improve content engagement with interactive features"
            )

        if engagement_metrics.get("conversion_rate", 0) < 5:
            recommendations.append("Send targeted offers to encourage purchases")

        # Add more sophisticated recommendations based on patterns
        if (
            summary_metrics.get("total_cart_additions", 0) > 0
            and engagement_metrics.get("conversion_rate", 0) < 20
        ):
            recommendations.append("Send cart abandonment reminders with incentives")

        if not recommendations:
            recommendations.append(
                "User shows good engagement - maintain current strategies"
            )

        return recommendations

    def _calculate_cohort_retention(
        self, user_ids: List[str], period: str
    ) -> Dict[str, float]:
        """Calculate retention rates for a cohort"""
        try:
            retention_rates = {}

            for month_offset in range(1, 13):  # Check retention for 12 months
                start_date = datetime.utcnow() - timedelta(days=month_offset * 30)
                end_date = start_date + timedelta(days=30)

                active_users = (
                    self.db.query(func.count(func.distinct(UserJourneyEvent.user_id)))
                    .filter(
                        and_(
                            UserJourneyEvent.user_id.in_(
                                [uuid.UUID(uid) for uid in user_ids]
                            ),
                            UserJourneyEvent.timestamp >= start_date,
                            UserJourneyEvent.timestamp <= end_date,
                        )
                    )
                    .scalar()
                )

                retention_rate = (active_users / len(user_ids) * 100) if user_ids else 0
                retention_rates[f"month_{month_offset}"] = round(retention_rate, 2)

            return retention_rates

        except Exception as e:
            logger.error(f"Error calculating cohort retention: {e}")
            return {}

    def _calculate_average_retention(self, cohorts: Dict[str, Any]) -> Dict[str, float]:
        """Calculate average retention rates across all cohorts"""
        avg_retention = {}

        for month_key in range(1, 13):
            month_str = f"month_{month_key}"
            rates = []

            for cohort_data in cohorts.values():
                retention_rates = cohort_data.get("retention_rates", {})
                if month_str in retention_rates:
                    rates.append(retention_rates[month_str])

            if rates:
                avg_retention[month_str] = round(sum(rates) / len(rates), 2)

        return avg_retention

    def _serialize_daily_analytics(self, day: UserAnalyticsDaily) -> Dict[str, Any]:
        """Serialize daily analytics to dictionary"""
        return {
            "date": day.date.isoformat(),
            "page_views": day.page_views or 0,
            "search_queries": day.search_queries or 0,
            "products_viewed": day.products_viewed or 0,
            "cart_additions": day.cart_additions or 0,
            "session_duration_minutes": round(
                (day.session_duration_seconds or 0) / 60, 2
            ),
            "conversion_events": day.conversion_events or 0,
            "revenue_generated": float(day.revenue_generated or 0),
            "device_type": day.device_type,
        }

    def _empty_behavior_summary(self, user_id: str, days: int) -> Dict[str, Any]:
        """Return empty behavior summary structure"""
        return {
            "user_id": user_id,
            "analysis_period_days": days,
            "summary_metrics": {
                "total_page_views": 0,
                "total_searches": 0,
                "total_products_viewed": 0,
                "total_cart_additions": 0,
                "total_session_time_hours": 0,
                "total_revenue": 0,
                "avg_session_duration_minutes": 0,
                "active_days": 0,
            },
            "journey_analysis": {
                "total_events": 0,
                "event_distribution": {},
                "common_paths": [],
            },
            "device_preferences": {},
            "engagement_metrics": {},
            "daily_trends": [],
        }
