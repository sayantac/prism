# app/api/v1/endpoints/admin/user_analytics.py
"""
Admin API endpoints for user analytics
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_permission
from app.models import User
from app.services.user_analytics_service import UserAnalyticsService

router = APIRouter()
logger = logging.getLogger(__name__)


class EventTrackingRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: str
    event_type: str = Field(..., pattern="^[a-zA-Z_]+$")
    event_data: Dict[str, Any] = Field(default_factory=dict)
    request_info: Optional[Dict[str, Any]] = None


@router.post("/track-event")
async def track_user_event(
    event: EventTrackingRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Track a user journey event"""
    try:
        service = UserAnalyticsService(db)
        service.track_user_event(
            event.user_id,
            event.session_id,
            event.event_type,
            event.event_data,
            event.request_info,
        )

        return {"status": "success", "message": "Event tracked successfully"}

    except Exception as e:
        logger.error(f"Error tracking event: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating user insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate user insights",
        )


@router.get("/cohort-analysis")
async def get_cohort_analysis(
    cohort_period: str = Query("monthly", pattern="^(monthly|weekly)$"),
    months_back: int = Query(12, ge=1, le=24),
    current_user: User = Depends(require_permission("view_user_analytics")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Perform cohort analysis on user behavior"""
    try:
        service = UserAnalyticsService(db)
        analysis = service.get_user_cohort_analysis(cohort_period, months_back)

        return {"status": "success", "data": analysis}

    except Exception as e:
        logger.error(f"Error performing cohort analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform cohort analysis",
        )


@router.get("/funnel-analysis")
async def get_funnel_analysis(
    funnel_steps: List[str] = Query(default=[], description="Custom funnel steps"),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission("view_user_analytics")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Analyze conversion funnel"""
    try:
        service = UserAnalyticsService(db)
        analysis = service.get_funnel_analysis(funnel_steps, days)

        return {"status": "success", "data": analysis}

    except Exception as e:
        logger.error(f"Error performing funnel analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform funnel analysis",
        )


@router.get("/segmentation-insights")
async def get_user_segmentation_insights(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission("view_user_segmentation")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get user segmentation insights based on behavior"""
    try:
        service = UserAnalyticsService(db)
        insights = service.get_user_segmentation_insights(days)

        return {"status": "success", "data": insights}

    except Exception as e:
        logger.error(f"Error getting segmentation insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve segmentation insights",
        )


@router.get("/real-time-metrics")
async def get_real_time_metrics(
    current_user: User = Depends(require_permission("view_user_analytics")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get real-time user activity metrics"""
    try:
        service = UserAnalyticsService(db)
        metrics = service.get_real_time_metrics()

        return {"status": "success", "data": metrics}

    except Exception as e:
        logger.error(f"Error getting real-time metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve real-time metrics",
        )

