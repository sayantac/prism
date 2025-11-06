"""Authentication and authorization schemas."""

from datetime import datetime
from typing import List

from pydantic import validator

from app.schemas.common import BaseSchema


class Token(BaseSchema):
    """JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseSchema):
    """JWT token payload."""

    sub: str | None = None


class LoginRequest(BaseSchema):
    """Login request schema."""

    username: str
    password: str


class RefreshTokenRequest(BaseSchema):
    """Refresh token request schema."""

    refresh_token: str


class PermissionBase(BaseSchema):
    """Base permission schema."""

    name: str
    description: str | None = None


class PermissionCreate(PermissionBase):
    """Permission creation schema."""

    pass


class PermissionResponse(PermissionBase):
    """Permission response schema."""

    id: int
    created_at: datetime


class RoleBase(BaseSchema):
    """Base role schema."""

    name: str
    description: str | None = None


class RoleCreate(RoleBase):
    """Role creation schema."""

    permission_ids: List[int] | None = []


class RoleUpdate(BaseSchema):
    """Role update schema."""

    name: str | None = None
    description: str | None = None
    permission_ids: List[int] | None = None


class RoleResponse(RoleBase):
    """Role response schema."""

    id: int
    created_at: datetime
    permissions: List[PermissionResponse] = []
    user_count: int | None = 0
