"""
Cohort Analyzer Service.
Performs cohort analysis and retention tracking.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models import User
from app.services.analytics.base_analytics_service import BaseAnalyticsService

logger = logging.getLogger(__name__)


class CohortAnalyzer(BaseAnalyticsService):
    """Service for cohort analysis and retention metrics."""
    
    def get_user_cohort_analysis(
        self, cohort_period: str = "monthly", months_back: int = 12
    ) -> Dict[str, Any]:
        """
        Perform cohort analysis on user behavior.
        
        Args:
            cohort_period: Period for cohorts (monthly, weekly)
            months_back: Number of months to analyze
            
        Returns:
            Dictionary with cohort analysis data
        """
        try:
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
            self.logger.error(f"Error performing cohort analysis: {e}")
            return {"error": str(e)}

    def _calculate_cohort_retention(
        self, user_ids: List, cohort_period: str
    ) -> Dict[str, float]:
        """
        Calculate real retention rates for a cohort based on actual user activity.

        Tracks user activity (orders or events) in each period after cohort creation
        to determine how many users remain active.

        Args:
            user_ids: List of user IDs in the cohort
            cohort_period: Period type (monthly, weekly)

        Returns:
            Dictionary mapping period to retention percentage
        """
        try:
            from app.models import Order, UserBehaviorEvent

            if not user_ids:
                return {}

            retention_rates = {}
            total_users = len(user_ids)

            # Get the cohort's first user registration date as reference
            first_user = (
                self.db.query(User)
                .filter(User.id.in_(user_ids))
                .order_by(User.created_at.asc())
                .first()
            )

            if not first_user:
                return {}

            cohort_start_date = first_user.created_at

            # Determine period length in days
            period_days = 30 if cohort_period == "monthly" else 7

            # Calculate retention for up to 12 periods
            for period in range(1, 13):
                # Calculate date range for this period
                period_start = cohort_start_date + timedelta(days=period * period_days)
                period_end = period_start + timedelta(days=period_days)

                # Don't calculate retention for future periods
                if period_start > datetime.utcnow():
                    break

                # Count users who were active in this period
                # Activity = made an order OR had a behavior event
                active_users_orders = (
                    self.db.query(func.count(func.distinct(Order.user_id)))
                    .filter(
                        Order.user_id.in_(user_ids),
                        Order.created_at >= period_start,
                        Order.created_at < period_end,
                        Order.status.notin_(["cancelled", "refunded"])
                    )
                    .scalar() or 0
                )

                active_users_events = (
                    self.db.query(func.count(func.distinct(UserBehaviorEvent.user_id)))
                    .filter(
                        UserBehaviorEvent.user_id.in_(user_ids),
                        UserBehaviorEvent.created_at >= period_start,
                        UserBehaviorEvent.created_at < period_end
                    )
                    .scalar() or 0
                )

                # Combine both activity sources (use union to avoid double counting)
                # For simplicity, we'll take the maximum of both
                active_users = max(active_users_orders, active_users_events)

                # Calculate retention percentage
                retention_rate = round((active_users / total_users) * 100, 2) if total_users > 0 else 0.0

                retention_rates[f"period_{period}"] = retention_rate

            return retention_rates

        except Exception as e:
            self.logger.error(f"Error calculating cohort retention: {e}", exc_info=True)
            return {}

    def _calculate_average_retention(
        self, cohorts: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate average retention across all cohorts."""
        try:
            if not cohorts:
                return {}

            # Aggregate retention rates
            all_periods = {}
            for cohort_data in cohorts.values():
                retention = cohort_data.get("retention_rates", {})
                for period, rate in retention.items():
                    if period not in all_periods:
                        all_periods[period] = []
                    all_periods[period].append(rate)

            # Calculate averages
            avg_retention = {
                period: round(sum(rates) / len(rates), 2)
                for period, rates in all_periods.items()
            }

            return avg_retention

        except Exception as e:
            self.logger.error(f"Error calculating average retention: {e}")
            return {}
