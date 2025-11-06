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
        """Calculate retention rates for a cohort."""
        try:
            retention_rates = {}
            
            # For simplicity, calculating basic retention
            # In production, you'd track actual user activity per period
            total_users = len(user_ids)
            
            # Mock retention calculation - replace with actual activity tracking
            for period in range(1, 13):
                # Calculate users still active after N periods
                # This is simplified - you'd query actual user activity
                retention_rate = max(0, 100 - (period * 8))  # Example decay
                retention_rates[f"period_{period}"] = retention_rate

            return retention_rates

        except Exception as e:
            self.logger.error(f"Error calculating cohort retention: {e}")
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
