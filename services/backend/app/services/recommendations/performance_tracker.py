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
                .filter(RecommendationMetrics.created_at >= since)
                .all()
            )

            if not metrics:
                return self._empty_performance_metrics()

            # Calculate metrics from actual schema fields
            total_displays = len(metrics)  # Each record is a recommendation display
            total_clicks = sum(
                len(m.clicked_products) if m.clicked_products else 0 for m in metrics
            )
            total_conversions = sum(
                len(m.purchased_products) if m.purchased_products else 0 for m in metrics
            )
            total_revenue = sum(float(m.revenue_generated or 0.0) for m in metrics)

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
                recommended_products=recommendation_ids,  # Store as JSONB array
                recommendation_context=context,
                recommendation_type=context.get("type", "unknown"),
                session_id=context.get("session_id"),
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
            # Find the most recent display metric for this user
            metric = (
                self.db.query(RecommendationMetrics)
                .filter(RecommendationMetrics.user_id == uuid.UUID(user_id))
                .order_by(RecommendationMetrics.created_at.desc())
                .first()
            )

            if metric and product_id:
                if interaction_type == "click":
                    clicked = metric.clicked_products or []
                    if product_id not in clicked:
                        clicked.append(product_id)
                    metric.clicked_products = clicked
                    
                elif interaction_type == "conversion":
                    purchased = metric.purchased_products or []
                    if product_id not in purchased:
                        purchased.append(product_id)
                    metric.purchased_products = purchased

                # Recalculate rates
                total_recommended = len(metric.recommended_products or [])
                if total_recommended > 0:
                    metric.click_through_rate = len(metric.clicked_products or []) / total_recommended
                    metric.conversion_rate = len(metric.purchased_products or []) / total_recommended

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
