"""
Cart and CartItem models for shopping cart functionality.
"""
import uuid
from decimal import Decimal
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Table,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


# Association table (legacy - keeping for backward compatibility)
cart_items_legacy = Table(
    "cart_items",
    Base.metadata,
    Column("cart_id", UUID(as_uuid=True), ForeignKey("carts.id"), primary_key=True),
    Column(
        "product_id", UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True
    ),
    Column("quantity", Integer, default=1),
    Column("added_at", DateTime(timezone=True), server_default=func.now()),
)


class CartItem(Base):
    """Individual item in a shopping cart."""
    
    __tablename__ = "cart_item"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")

    __table_args__ = (
        Index("ix_cart_product_unique", "cart_id", "product_id", unique=True),
    )


class Cart(Base):
    """Shopping cart model for users."""
    
    __tablename__ = "carts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="cart")
    products = relationship("Product", secondary=cart_items_legacy)
    items = relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan"
    )

    # Computed properties (not stored in DB)
    cart_items = []
    total_amount = Decimal("0.00")
    total_items = 0
