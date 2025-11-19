"""Notification schemas."""

from datetime import datetime
from typing import Any, Dict
from uuid import UUID

from app.schemas.common import BaseSchema


class NotificationBase(BaseSchema):
    """Base notification schema."""

    type: str
    title: str
    message: str
    data: Dict[str, Any] | None = {}


class NotificationCreate(NotificationBase):
    """Notification creation schema."""

    user_id: UUID
    scheduled_for: datetime | None = None


class NotificationResponse(BaseSchema):
    """Notification response schema."""

    id: UUID
    type: str
    title: str
    message: str
    data: Dict[str, Any]
    is_read: bool
    created_at: datetime
