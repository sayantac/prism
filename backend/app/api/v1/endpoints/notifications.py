# ecom/api/v1/endpoints/notifications.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import (
    PaginationParams,
    get_current_active_user,
    get_db,
    get_pagination_params,
)
from app.models import User
from app.schemas import MessageResponse, PaginatedResponse
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def get_notifications(
    pagination: PaginationParams = Depends(get_pagination_params),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user notifications"""

    notification_service = NotificationService(db)
    notifications = notification_service.get_user_notifications(
        str(current_user.id), unread_only=unread_only, limit=pagination.size
    )

    # For simplicity, return all notifications (pagination can be improved)
    return PaginatedResponse(
        items=notifications,
        total=len(notifications),
        page=pagination.page,
        size=pagination.size,
        pages=1,
    )


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark notification as read"""

    notification_service = NotificationService(db)
    success = notification_service.mark_notification_read(
        str(notification_id), str(current_user.id)
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )

    return MessageResponse(message="Notification marked as read")


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Mark all notifications as read"""

    notification_service = NotificationService(db)
    updated_count = notification_service.mark_all_notifications_read(
        str(current_user.id)
    )

    return MessageResponse(message=f"Marked {updated_count} notifications as read")


@router.get("/unread-count")
async def get_unread_notification_count(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get count of unread notifications"""

    from app.models import Notification

    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .filter(Notification.is_read == False)
        .count()
    )

    return {"unread_count": unread_count}
