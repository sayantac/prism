# app/api/v1/endpoints/admin/user_segmentation.py
"""
Admin API endpoints for user segmentation management
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_permission
from app.models import User
from app.services.user_analytics_service import UserAnalyticsService
from app.services.user_segmentation_service import UserSegmentationService

router = APIRouter()
logger = logging.getLogger(__name__)


class SegmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    criteria: Dict[str, Any]
    segment_type: str = Field(
        default="custom", pattern="^(custom|rfm|behavioral|ml_cluster)$"
    )
    is_active: bool = Field(default=True)
    auto_update: bool = Field(default=True)
    update_frequency: Optional[str] = Field(None, pattern="^(daily|weekly|monthly)$")


class SegmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    criteria: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    auto_update: Optional[bool] = None
    update_frequency: Optional[str] = Field(None, pattern="^(daily|weekly|monthly)$")


class AddUserToSegment(BaseModel):
    user_id: str
    score: Optional[float] = Field(None, ge=0.0, le=1.0)
    reason: Optional[str] = Field(None, max_length=200)


@router.get("/segments")
async def get_segments(
    active_only: bool = Query(False, description="Only return active segments"),
    include_memberships: bool = Query(False, description="Include membership counts"),
    current_user: User = Depends(require_permission("view_user_segmentation")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get all user segments"""
    try:
        service = UserSegmentationService(db)
        segments = service.get_segments(active_only, include_memberships)

        return {"status": "success", "data": segments, "total_count": len(segments)}

    except Exception as e:
        logger.error(f"Error getting segments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve segments",
        )


@router.post("/segments")
async def create_segment(
    segment_data: SegmentCreate,
    current_user: User = Depends(require_permission("manage_user_segments")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Create a new user segment"""
    try:
        service = UserSegmentationService(db)
        segment = service.create_segment(segment_data.dict(), str(current_user.id))

        return {
            "status": "success",
            "message": "Segment created successfully",
            "data": segment,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating segment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create segment",
        )


@router.put("/segments/{segment_id}")
async def update_segment(
    segment_id: str,
    segment_data: SegmentUpdate,
    current_user: User = Depends(require_permission("manage_user_segments")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Update an existing segment"""
    try:
        service = UserSegmentationService(db)
        segment = service.update_segment(
            segment_id, segment_data.dict(exclude_unset=True), str(current_user.id)
        )

        return {
            "status": "success",
            "message": "Segment updated successfully",
            "data": segment,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating segment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update segment",
        )


@router.delete("/segments/{segment_id}")
async def delete_segment(
    segment_id: str,
    current_user: User = Depends(require_permission("manage_user_segments")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a segment"""
    try:
        service = UserSegmentationService(db)
        success = service.delete_segment(segment_id)

        return {
            "status": "success",
            "message": "Segment deleted successfully",
            "deleted": success,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting segment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete segment",
        )


@router.get("/segments/{segment_id}/members")
async def get_segment_members(
    segment_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_permission("view_user_segmentation")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get members of a specific segment"""
    try:
        service = UserSegmentationService(db)
        members = service.get_segment_members(segment_id, limit, offset)

        return {"status": "success", "data": members}

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting segment members: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve segment members",
        )


@router.post("/segments/{segment_id}/members")
async def add_user_to_segment(
    segment_id: str,
    user_data: AddUserToSegment,
    current_user: User = Depends(require_permission("manage_user_segments")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Add a user to a segment"""
    try:
        service = UserSegmentationService(db)
        result = service.add_user_to_segment(
            user_data.user_id, segment_id, user_data.score, user_data.reason
        )

        return {
            "status": "success",
            "message": "User added to segment successfully",
            "data": result,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding user to segment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add user to segment",
        )


@router.delete("/segments/{segment_id}/members/{user_id}")
async def remove_user_from_segment(
    segment_id: str,
    user_id: str,
    current_user: User = Depends(require_permission("manage_user_segments")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Remove a user from a segment"""
    try:
        service = UserSegmentationService(db)
        result = service.remove_user_from_segment(user_id, segment_id)

        return {
            "status": "success",
            "message": "User removed from segment successfully",
            "data": result,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error removing user from segment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove user from segment",
        )


@router.post("/segments/{segment_id}/refresh")
async def refresh_segment(
    segment_id: str,
    current_user: User = Depends(require_permission("manage_user_segments")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Refresh segment memberships by re-applying rules"""
    try:
        service = UserSegmentationService(db)
        result = service.refresh_segment(segment_id)

        return {
            "status": "success",
            "message": "Segment refreshed successfully",
            "data": result,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error refreshing segment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh segment",
        )


@router.get("/users/{user_id}/segments")
async def get_user_segments(
    user_id: str,
    current_user: User = Depends(require_permission("view_user_segmentation")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get all segments a user belongs to"""
    try:
        service = UserSegmentationService(db)
        segments = service.get_user_segments(user_id)

        return {
            "status": "success",
            "data": {
                "user_id": user_id,
                "segments": segments,
                "total_segments": len(segments),
            },
        }

    except Exception as e:
        logger.error(f"Error getting user segments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user segments",
        )


@router.post("/segments/create-rfm")
async def create_rfm_segments(
    current_user: User = Depends(require_permission("manage_user_segments")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Create standard RFM-based segments"""
    try:
        service = UserSegmentationService(db)
        segments = service.create_rfm_segments()

        return {
            "status": "success",
            "message": "RFM segments created successfully",
            "data": segments,
            "created_count": len(segments),
        }

    except Exception as e:
        logger.error(f"Error creating RFM segments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create RFM segments",
        )


@router.get("/segments/analytics")
async def get_segment_analytics(
    segment_id: Optional[str] = Query(
        None, description="Specific segment ID for analytics"
    ),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission("view_user_segmentation")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get analytics for segments with real conversion rate and average order value calculations.

    Calculates:
    - conversion_rate: Percentage of segment users who made at least one order in the time period
    - avg_order_value: Average order total for segment users in the time period
    """
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import func, distinct
        from app.models import Order, UserSegmentMembership
        from decimal import Decimal

        # Get all segments with their member counts
        segmentation_service = UserSegmentationService(db)
        segments = segmentation_service.get_segments(active_only=False)

        # Calculate date cutoff for analytics
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Transform to the format expected by frontend with real calculations
        segment_performance = []

        for s in segments:
            seg_id = str(s.get("id"))
            seg_name = s.get("name")
            member_count = s.get("member_count", 0)

            # Initialize default values
            conversion_rate = 0.0
            avg_order_value = 0.0

            if member_count > 0:
                try:
                    # Get user IDs in this segment
                    segment_user_ids = (
                        db.query(UserSegmentMembership.user_id)
                        .filter(
                            UserSegmentMembership.segment_id == s.get("id"),
                            UserSegmentMembership.is_active == True
                        )
                        .all()
                    )
                    segment_user_ids = [str(uid[0]) for uid in segment_user_ids]

                    if segment_user_ids:
                        # Calculate conversion rate: % of users who made at least one order
                        users_with_orders = (
                            db.query(func.count(distinct(Order.user_id)))
                            .filter(
                                Order.user_id.in_(segment_user_ids),
                                Order.created_at >= cutoff_date,
                                Order.status.notin_(["cancelled", "refunded"])
                            )
                            .scalar()
                        )

                        conversion_rate = round((users_with_orders / len(segment_user_ids)) * 100, 2)

                        # Calculate average order value
                        total_order_value = (
                            db.query(func.sum(Order.total_amount))
                            .filter(
                                Order.user_id.in_(segment_user_ids),
                                Order.created_at >= cutoff_date,
                                Order.status.notin_(["cancelled", "refunded"])
                            )
                            .scalar()
                        )

                        order_count = (
                            db.query(func.count(Order.id))
                            .filter(
                                Order.user_id.in_(segment_user_ids),
                                Order.created_at >= cutoff_date,
                                Order.status.notin_(["cancelled", "refunded"])
                            )
                            .scalar()
                        )

                        if order_count > 0 and total_order_value:
                            # Convert Decimal to float
                            if isinstance(total_order_value, Decimal):
                                total_order_value = float(total_order_value)
                            avg_order_value = round(total_order_value / order_count, 2)

                except Exception as calc_error:
                    logger.warning(f"Error calculating analytics for segment {seg_id}: {calc_error}")
                    # Keep default 0.0 values if calculation fails

            segment_performance.append({
                "segment_id": seg_id,
                "segment_name": seg_name,
                "user_count": member_count,
                "segment_type": s.get("segment_type", "custom"),
                "is_active": s.get("is_active", False),
                "conversion_rate": conversion_rate,
                "avg_order_value": avg_order_value,
                "days_analyzed": days,
            })

        # Filter by segment_id if provided
        if segment_id:
            segment_performance = [sp for sp in segment_performance if sp["segment_id"] == segment_id]

        return segment_performance

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting segment analytics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve segment analytics",
        )


@router.get("/users/{user_id}/behavior")
async def get_user_behavior_summary(
    user_id: str,
    days: int = Query(30, ge=1, le=365, description="Days to analyze"),
    current_user: User = Depends(require_permission("view_user_analytics")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get comprehensive user behavior summary"""
    try:
        service = UserAnalyticsService(db)
        summary = service.get_user_behavior_summary(user_id, days)

        return {"status": "success", "data": summary}

    except Exception as e:
        logger.error(f"Error getting user behavior summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user behavior summary",
        )


@router.get("/users/{user_id}/insights")
async def get_user_insights_report(
    user_id: str,
    current_user: User = Depends(require_permission("view_user_analytics")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Generate comprehensive insights report for a user"""
    try:
        service = UserAnalyticsService(db)
        insights = service.generate_user_insights_report(user_id)

        return {"status": "success", "data": insights}

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track event",
        )
