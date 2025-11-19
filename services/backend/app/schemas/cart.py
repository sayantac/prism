"""Cart and cart item schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import validator

from app.schemas.common import BaseSchema


class CartItemBase(BaseSchema):
    """Base cart item schema."""

    product_id: UUID
    quantity: int = 1


class CartItemCreate(CartItemBase):
    """Cart item creation schema."""

    pass


class CartItemUpdate(BaseSchema):
    """Cart item update schema."""

    quantity: int

    @validator("quantity")
    def validate_quantity(cls, v):
        """Validate quantity is at least 1."""
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class CartItemResponse(BaseSchema):
    """Cart item response schema."""

    product: "ProductResponse"
    quantity: int
    added_at: datetime


class CartResponse(BaseSchema):
    """Cart response schema."""

    id: UUID
    items: list[CartItemResponse] = []
    total_items: int
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime | None = None


# Import at the end to avoid circular imports
from app.schemas.product import ProductResponse  # noqa: E402

CartItemResponse.update_forward_refs()
