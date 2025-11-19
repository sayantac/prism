"""
User Event Tracker Service.
Handles tracking and storage of user journey events.
"""
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.ml_models import UserAnalyticsDaily, UserJourneyEvent
from app.services.analytics.base_analytics_service import BaseAnalyticsService

logger = logging.getLogger(__name__)


class UserEventTracker(BaseAnalyticsService):
    """Service for tracking user events and journey."""
    
    def track_user_event(
        self,
        user_id: Optional[str],
        session_id: str,
        event_type: str,
        event_data: Dict[str, Any],
        request_info: Optional[Dict[str, Any]] = None,
    ):
        """
        Track a user journey event.
        
        Args:
            user_id: User ID (optional for anonymous users)
            session_id: Session identifier
            event_type: Type of event (page_view, click, etc.)
            event_data: Event-specific data
            request_info: Request metadata (url, user_agent, etc.)
        """
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

            self.logger.debug(f"Tracked {event_type} event for user {user_id}")

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error tracking user event: {e}")
    
    def _update_daily_analytics(
        self, user_id: str, event_type: str, event_data: Dict[str, Any]
    ):
        """Update daily analytics aggregations."""
        try:
            today = datetime.utcnow().date()
            
            # Get or create daily analytics record
            daily = (
                self.db.query(UserAnalyticsDaily)
                .filter(
                    UserAnalyticsDaily.user_id == uuid.UUID(user_id),
                    UserAnalyticsDaily.date == today,
                )
                .first()
            )

            if not daily:
                daily = UserAnalyticsDaily(
                    id=uuid.uuid4(),
                    user_id=uuid.UUID(user_id),
                    date=today,
                    page_views=0,
                    search_queries=0,
                    products_viewed=0,
                    cart_additions=0,
                    purchases=0,
                    total_spent=0.0,
                    session_duration_minutes=0,
                )
                self.db.add(daily)

            # Update metrics based on event type
            if event_type == "page_view":
                daily.page_views = (daily.page_views or 0) + 1
            elif event_type == "search":
                daily.search_queries = (daily.search_queries or 0) + 1
            elif event_type == "product_view":
                daily.products_viewed = (daily.products_viewed or 0) + 1
            elif event_type == "cart_add":
                daily.cart_additions = (daily.cart_additions or 0) + 1
            elif event_type == "purchase":
                daily.purchases = (daily.purchases or 0) + 1
                if "amount" in event_data:
                    daily.total_spent = (daily.total_spent or 0.0) + event_data["amount"]

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating daily analytics: {e}")
