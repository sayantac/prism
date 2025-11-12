"""
Churn Predictor Service.
Predicts user churn risk and identifies at-risk users.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.models import Order, User
from app.models.ml_models import UserAnalyticsDaily
from app.services.analytics.base_analytics_service import BaseAnalyticsService

logger = logging.getLogger(__name__)


class ChurnPredictor(BaseAnalyticsService):
    """Service for predicting user churn risk."""
    
    def calculate_churn_risk(self, user_id: str) -> Dict[str, Any]:
        """
        Calculate churn risk score and level for a user.
        
        Args:
            user_id: User ID to analyze
            
        Returns:
            Dictionary with risk score, level, and factors
        """
        try:
            risk_score = self._calculate_churn_risk(user_id)
            risk_level = self._get_risk_level(risk_score)
            risk_factors = self._identify_risk_factors(user_id, risk_score)

            return {
                "user_id": user_id,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "risk_factors": risk_factors,
                "recommendations": self._generate_engagement_recommendations(
                    risk_level, risk_factors
                ),
            }

        except Exception as e:
            self.logger.error(f"Error calculating churn risk: {e}")
            return {"error": str(e)}

    def _calculate_churn_risk(self, user_id: str) -> float:
        """Calculate churn risk score (0-100)."""
        try:
            user = self.db.query(User).filter(User.id == uuid.UUID(user_id)).first()
            if not user:
                return 100.0

            now = datetime.utcnow()

            # Days since last activity
            days_since_activity = (
                (now - user.last_login).days if user.last_login else 365
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
            self.logger.error(f"Error calculating churn risk: {e}")
            return 50.0  # Default medium risk

    def _get_risk_level(self, risk_score: float) -> str:
        """Convert risk score to risk level."""
        if risk_score >= 70:
            return "high"
        elif risk_score >= 40:
            return "medium"
        elif risk_score >= 20:
            return "low"
        else:
            return "very_low"

    def _identify_risk_factors(self, user_id: str, risk_score: float) -> List[str]:
        """Identify specific risk factors for a user."""
        factors = []
        
        try:
            user = self.db.query(User).filter(User.id == uuid.UUID(user_id)).first()
            now = datetime.utcnow()

            if user and user.last_login:
                days_since_activity = (now - user.last_login).days
                if days_since_activity > 60:
                    factors.append("No activity in 60+ days")
                elif days_since_activity > 30:
                    factors.append("No activity in 30+ days")

            last_order = (
                self.db.query(Order)
                .filter(Order.user_id == uuid.UUID(user_id))
                .order_by(desc(Order.created_at))
                .first()
            )
            
            if last_order:
                days_since_order = (now - last_order.created_at).days
                if days_since_order > 90:
                    factors.append("No purchase in 90+ days")
                elif days_since_order > 60:
                    factors.append("No purchase in 60+ days")
            else:
                factors.append("No purchase history")

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

            if recent_activity == 0:
                factors.append("Zero engagement in last 30 days")
            elif recent_activity < 5:
                factors.append("Low engagement in last 30 days")

        except Exception as e:
            self.logger.error(f"Error identifying risk factors: {e}")

        return factors

    def _generate_engagement_recommendations(
        self, risk_level: str, risk_factors: List[str]
    ) -> List[str]:
        """Generate recommendations to reduce churn risk."""
        recommendations = []

        if risk_level in ["high", "medium"]:
            recommendations.append("Send personalized re-engagement email")
            recommendations.append("Offer exclusive discount or promotion")

        if "No purchase" in str(risk_factors):
            recommendations.append("Showcase new arrivals matching user preferences")
            recommendations.append("Remind about items in wishlist")

        if "No activity" in str(risk_factors):
            recommendations.append("Push notification about personalized deals")
            recommendations.append("Email newsletter with trending products")

        if not recommendations:
            recommendations.append("Continue regular engagement campaigns")

        return recommendations
