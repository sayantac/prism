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

    payment_method: str = "cash_on_delivery"
    order_notes: str | None = None


class OrderCreate(OrderBase):
    """Order creation schema."""

    pass


class OrderUpdate(BaseSchema):
    """Order update schema."""

    status: str | None = None
    payment_status: str | None = None
    payment_reference: str | None = None
    order_notes: str | None = None
    admin_notes: str | None = None

    @validator("status")
    def validate_status(cls, v):
        """Validate order status is valid."""
        if v and v not in ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]:
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
    subtotal: Decimal
    tax_amount: Decimal | None = None
    shipping_amount: Decimal | None = None
    discount_amount: Decimal | None = None
    total_amount: Decimal
    payment_method: str
    payment_status: str
    payment_reference: str | None = None
    shipping_address: Dict[str, Any] | None = None
    billing_address: Dict[str, Any] | None = None
    recommendation_source: str | None = None
    recommendation_session_id: str | None = None
    order_notes: str | None = None
    admin_notes: str | None = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime | None = None


# Import at the end to avoid circular imports
from app.schemas.product import ProductResponse  # noqa: E402

OrderItemResponse.update_forward_refs()
