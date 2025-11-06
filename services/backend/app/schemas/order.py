"""Order and order item schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List
from uuid import UUID

from pydantic import validator

from app.schemas.common import BaseSchema


class OrderItemBase(BaseSchema):
    """Base order item schema."""

    product_id: UUID
    quantity: int
    unit_price: Decimal


class OrderBase(BaseSchema):
    """Base order schema."""

    shipping_method: str = "standard"
    notes: str | None = None


class OrderCreate(OrderBase):
    """Order creation schema."""

    pass


class OrderUpdate(BaseSchema):
    """Order update schema."""

    status: str | None = None
    tracking_number: str | None = None
    notes: str | None = None
    estimated_delivery: datetime | None = None

    @validator("status")
    def validate_status(cls, v):
        """Validate order status is valid."""
        if v and v not in ["pending", "confirmed", "shipped", "delivered", "cancelled"]:
            raise ValueError("Invalid order status")
        return v


class OrderItemResponse(BaseSchema):
    """Order item response schema."""

    id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    product: "ProductResponse"


class OrderResponse(BaseSchema):
    """Order response schema."""

    id: UUID
    order_number: str
    status: str
    total_amount: Decimal
    currency: str
    payment_method: str
    payment_status: str
    shipping_address: Dict[str, Any]
    billing_address: Dict[str, Any]
    shipping_method: str
    tracking_number: str | None = None
    estimated_delivery: datetime | None = None
    notes: str | None = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime | None = None


# Import at the end to avoid circular imports
from app.schemas.product import ProductResponse  # noqa: E402

OrderItemResponse.update_forward_refs()
