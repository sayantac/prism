"""Common base schemas and utility schemas."""

from typing import Any, List

from pydantic import BaseModel


class BaseSchema(BaseModel):
    """Base schema with common configuration."""

    class Config:
        orm_mode = True
        use_enum_values = True


class MessageResponse(BaseSchema):
    """Generic message response."""

    message: str


class ErrorResponse(BaseSchema):
    """Error response schema."""

    detail: str
    error_code: str | None = None


class PaginatedResponse(BaseSchema):
    """Generic paginated response."""

    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


class FileUploadResponse(BaseSchema):
    """File upload response schema."""

    filename: str
    url: str
    size: int
    content_type: str


class AddressSchema(BaseSchema):
    """Address schema for shipping/billing."""

    street: str
    city: str
    state: str
    postal_code: str
    country: str
    phone: str | None = None
    name: str | None = None
