"""
User Analytics Service - Compatibility Wrapper.
Provides unified interface to modular analytics services.
"""
from sqlalchemy.orm import Session

from app.services.analytics import (
    BehaviorAnalyzer,
    ChurnPredictor,
    CohortAnalyzer,
    UserEventTracker,
)


class UserAnalyticsService:
    """Unified analytics service using modular components."""

    def __init__(self, db: Session):
        self.db = db
        self.event_tracker = UserEventTracker(db)
        self.behavior_analyzer = BehaviorAnalyzer(db)
        self.cohort_analyzer = CohortAnalyzer(db)
        self.churn_predictor = ChurnPredictor(db)

    # Event tracking
    def track_user_event(self, user_id, session_id, event_type, event_data, request_info=None):
        return self.event_tracker.track_user_event(
            user_id, session_id, event_type, event_data, request_info
        )

    # Cohort analysis
    def get_user_cohort_analysis(self, cohort_period, months_back):
        return self.cohort_analyzer.get_user_cohort_analysis(cohort_period, months_back)

    # Behavior analysis
    def get_user_behavior_summary(self, user_id, days=30):
        return self.behavior_analyzer.get_user_behavior_summary(user_id, days)

    # Churn prediction
    def calculate_churn_risk(self, user_id):
        return self.churn_predictor.calculate_churn_risk(user_id)

    # Placeholder methods for endpoints not yet split
    def get_funnel_analysis(self, funnel_steps, days):
        # TODO: Implement or move to behavior_analyzer
        return {"message": "Funnel analysis not yet implemented in modular services"}

    def get_user_segmentation_insights(self, days):
        # TODO: Implement or move to behavior_analyzer
        return {"message": "Segmentation insights not yet implemented in modular services"}

    def get_real_time_metrics(self):
        # TODO: Implement or move to event_tracker
        return {"message": "Real-time metrics not yet implemented in modular services"}
