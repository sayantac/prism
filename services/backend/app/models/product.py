"""
Product, Category, and ProductConfig models for e-commerce catalog.
"""
import uuid
from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    DateTime,
    DECIMAL,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Table,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.models.base import Base


# Association table
wishlist_items = Table(
    "wishlist_items",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column(
        "product_id", UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True
    ),
    Column("added_at", DateTime(timezone=True), server_default=func.now()),
)


class ProductCategory(Base):
    """Product category model with hierarchical structure."""
    
    __tablename__ = "product_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("product_categories.id"))
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    products = relationship("Product", back_populates="category")
    parent = relationship("ProductCategory", remote_side=[id])
    children = relationship("ProductCategory", overlaps="parent")


class Product(Base):
    """Product model for e-commerce items."""
    
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("product_categories.id"))
    brand = Column(String, index=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    code = Column(String, unique=True, index=True)
    description = Column(Text)
    specification = Column(Text)
    technical_details = Column(Text)
    product_dimensions = Column(String)
    images = Column(ARRAY(String))
    product_url = Column(String)
    is_amazon_seller = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    stock_quantity = Column(Integer, default=0)
    in_stock = Column(Boolean, default=True)
    is_embedding_generated = Column(Boolean, default=False)
    embedding = Column(Vector(384))
    custom_fields = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # SEO fields
    meta_title = Column(String)
    meta_description = Column(Text)
    tags = Column(ARRAY(String))

    # Relationships
    category = relationship("ProductCategory", back_populates="products")
    config = relationship("ProductConfig", back_populates="product", uselist=False)
    order_items = relationship("OrderItem", back_populates="product")
    wishlisted_by = relationship(
        "User", secondary=wishlist_items, back_populates="wishlist"
    )

    __table_args__ = (
        Index(
            "ix_products_embedding_cosine",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        Index("ix_products_brand_category", "brand", "category_id"),
        Index("ix_products_price_active", "price", "is_active"),
    )


class ProductConfig(Base):
    """Configuration settings for product display and recommendations."""
    
    __tablename__ = "product_config"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), unique=True)
    show_in_search = Column(Boolean, default=True)
    show_in_recommendations = Column(Boolean, default=True)
    reranking_priority = Column(Integer, default=0)
    is_sponsored = Column(Boolean, default=False)
    sponsored_priority = Column(Integer, default=0)
    featured = Column(Boolean, default=False)
    promotion_text = Column(String)
    boost_factor = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="config")
