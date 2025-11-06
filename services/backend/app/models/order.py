"""
Order and OrderItem models for e-commerce transactions.
"""
import uuid
from sqlalchemy import (
    Column,
    DateTime,
    DECIMAL,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Order(Base):
    """Customer order model."""
    
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    order_number = Column(String, unique=True, index=True)
    status = Column(String, default="pending")
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String, default="USD")

    # Shipping information
    shipping_address = Column(JSON)
    billing_address = Column(JSON)
    shipping_method = Column(String, default="standard")
    estimated_delivery = Column(DateTime(timezone=True))

    # Payment information
    payment_method = Column(String, default="cod")
    payment_status = Column(String, default="pending")

    # Tracking and notes
    tracking_number = Column(String)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    """Individual item within an order."""
    
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
