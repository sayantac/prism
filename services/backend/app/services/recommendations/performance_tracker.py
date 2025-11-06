"""
Recommendation Performance Tracker.
Tracks and analyzes recommendation performance metrics.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.ml_models import RecommendationConversion, RecommendationMetrics
from app.services.recommendations.base_recommendation_service import BaseRecommendationService

logger = logging.getLogger(__name__)


class PerformanceTracker(BaseRecommendationService):
    """Service for tracking recommendation performance."""
    
    def get_recommendation_performance(self, days: int = 30) -> Dict[str, Any]:
        """Get recommendation performance metrics."""
        try:
            since = datetime.utcnow() - timedelta(days=days)

            # Get metrics from database
            metrics = (
                self.db.query(RecommendationMetrics)
                .filter(RecommendationMetrics.timestamp >= since)
                .all()
            )

            if not metrics:
                return self._empty_performance_metrics()

            total_displays = sum(m.total_displays or 0 for m in metrics)
            total_clicks = sum(m.total_clicks or 0 for m in metrics)
            total_conversions = sum(m.total_conversions or 0 for m in metrics)
            total_revenue = sum(m.total_revenue or 0.0 for m in metrics)

            ctr = (total_clicks / total_displays * 100) if total_displays > 0 else 0
            cvr = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0

            return {
                "period_days": days,
                "total_displays": total_displays,
                "total_clicks": total_clicks,
                "total_conversions": total_conversions,
                "total_revenue": float(total_revenue),
                "ctr": round(ctr, 2),
                "cvr": round(cvr, 2),
                "avg_revenue_per_conversion": round(
                    total_revenue / total_conversions, 2
                )
                if total_conversions > 0
                else 0,
            }

        except Exception as e:
            self.logger.error(f"Error getting recommendation performance: {e}")
            return self._empty_performance_metrics()

    def get_conversion_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get conversion analytics."""
        try:
            since = datetime.utcnow() - timedelta(days=days)

            conversions = (
                self.db.query(RecommendationConversion)
                .filter(RecommendationConversion.converted_at >= since)
                .all()
            )

            if not conversions:
                return self._empty_conversion_analytics()

            total_conversions = len(conversions)
            total_revenue = sum(c.conversion_value or 0.0 for c in conversions)
            
            # Group by model type
            by_model = {}
            for conv in conversions:
                model_type = conv.recommendation_model_type or "unknown"
                if model_type not in by_model:
                    by_model[model_type] = {"count": 0, "revenue": 0.0}
                by_model[model_type]["count"] += 1
                by_model[model_type]["revenue"] += conv.conversion_value or 0.0

            return {
                "period_days": days,
                "total_conversions": total_conversions,
                "total_revenue": float(total_revenue),
                "avg_conversion_value": round(total_revenue / total_conversions, 2)
                if total_conversions > 0
                else 0,
                "by_model_type": by_model,
            }

        except Exception as e:
            self.logger.error(f"Error getting conversion analytics: {e}")
            return self._empty_conversion_analytics()

    def log_recommendation_display(
        self,
        user_id: str,
        recommendation_ids: list,
        context: Dict[str, Any],
    ):
        """Log recommendation display event."""
        try:
            metric = RecommendationMetrics(
                id=uuid.uuid4(),
                user_id=uuid.UUID(user_id),
                recommendation_ids=recommendation_ids,
                total_displays=len(recommendation_ids),
                context=context,
            )

            self.db.add(metric)
            self.db.commit()

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error logging recommendation display: {e}")

    def log_recommendation_interaction(
        self,
        user_id: str,
        recommendation_id: str,
        interaction_type: str,
        product_id: str = None,
    ):
        """Log recommendation interaction (click, conversion)."""
        try:
            # Find the display metric
            metric = (
                self.db.query(RecommendationMetrics)
                .filter(
                    RecommendationMetrics.user_id == uuid.UUID(user_id),
                    RecommendationMetrics.recommendation_ids.contains([recommendation_id]),
                )
                .order_by(RecommendationMetrics.timestamp.desc())
                .first()
            )

            if metric:
                if interaction_type == "click":
                    metric.total_clicks = (metric.total_clicks or 0) + 1
                elif interaction_type == "conversion":
                    metric.total_conversions = (metric.total_conversions or 0) + 1

                self.db.commit()

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error logging recommendation interaction: {e}")

    def _empty_performance_metrics(self) -> Dict[str, Any]:
        """Return empty performance metrics structure."""
        return {
            "period_days": 0,
            "total_displays": 0,
            "total_clicks": 0,
            "total_conversions": 0,
            "total_revenue": 0.0,
            "ctr": 0.0,
            "cvr": 0.0,
            "avg_revenue_per_conversion": 0.0,
        }

    def _empty_conversion_analytics(self) -> Dict[str, Any]:
        """Return empty conversion analytics structure."""
        return {
            "period_days": 0,
            "total_conversions": 0,
            "total_revenue": 0.0,
            "avg_conversion_value": 0.0,
            "by_model_type": {},
        }
