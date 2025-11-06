"""User schemas."""

from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

from pydantic import EmailStr

from app.schemas.common import BaseSchema


class UserBase(BaseSchema):
    """Base user schema."""

    username: str
    phone: str | None
    email: EmailStr
    full_name: str | None = None
    locale: str = "en"
    interests: List[str] | None = []
    preferences: Dict[str, Any] | None = {}
    address: Dict[str, Any] | None = {}


class UserCreate(UserBase):
    """User creation schema."""

    password: str


class UserUpdate(BaseSchema):
    """User update schema."""

    username: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    full_name: str | None = None
    locale: str | None = None
    interests: List[str] | None = None
    preferences: Dict[str, Any] | None = None
    address: Dict[str, Any] | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    """User response schema."""

    id: UUID
    is_active: bool
    is_superuser: bool
    avatar_url: str | None = None
    created_at: datetime
    last_active: datetime | None = None
    viewed_products: List[UUID] | None = []
    roles: Any
    permissions: Any


class UserWithRoles(UserResponse):
    """User response with roles expanded."""

    roles: List["RoleResponse"] = []


# Import at the end to avoid circular imports
from app.schemas.auth import RoleResponse  # noqa: E402

UserWithRoles.update_forward_refs()
