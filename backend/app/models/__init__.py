import uuid
from decimal import Decimal
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    ARRAY,
    DECIMAL,
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Relationship, relationship
from sqlalchemy.sql import func

Base = declarative_base()


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)

cart_items = Table(
    "cart_items",
    Base.metadata,
    Column("cart_id", UUID(as_uuid=True), ForeignKey("carts.id"), primary_key=True),
    Column(
        "product_id", UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True
    ),
    Column("quantity", Integer, default=1),
    Column("added_at", DateTime(timezone=True), server_default=func.now()),
)

wishlist_items = Table(
    "wishlist_items",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column(
        "product_id", UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True
    ),
    Column("added_at", DateTime(timezone=True), server_default=func.now()),
)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    locale = Column(String, default="en")
    avatar_url = Column(String)
    interests = Column(ARRAY(String))
    preferences = Column(JSON)
    address = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_active = Column(DateTime(timezone=True))
    viewed_products = Column(ARRAY(UUID(as_uuid=True)))

    roles = relationship("Role", secondary=user_roles, back_populates="users")
    cart = relationship("Cart", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="user")
    wishlist = relationship(
        "Product", secondary=wishlist_items, back_populates="wishlisted_by"
    )
    search_analytics = relationship("SearchAnalytics", back_populates="user")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship(
        "Permission", secondary=role_permissions, back_populates="roles"
    )


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    roles = relationship(
        "Role", secondary=role_permissions, back_populates="permissions"
    )


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("product_categories.id"))
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    products = relationship("Product", back_populates="category")
    parent = relationship("ProductCategory", remote_side=[id])
    children = relationship("ProductCategory")


class Product(Base):
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

    meta_title = Column(String)
    meta_description = Column(Text)
    tags = Column(ARRAY(String))

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

    product = relationship("Product", back_populates="config")


class CartItem(Base):
    __tablename__ = "cart_item"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")

    __table_args__ = (
        Index("ix_cart_product_unique", "cart_id", "product_id", unique=True),
    )


class Cart(Base):
    __tablename__ = "carts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="cart")
    products = relationship("Product", secondary=cart_items)
    items = relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan"
    )

    cart_items = []
    total_amount = Decimal("0.00")
    total_items = 0


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    order_number = Column(String, unique=True, index=True)
    status = Column(String, default="pending")
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String, default="USD")

    shipping_address = Column(JSON)
    billing_address = Column(JSON)
    shipping_method = Column(String, default="standard")
    estimated_delivery = Column(DateTime(timezone=True))

    payment_method = Column(String, default="cod")
    payment_status = Column(String, default="pending")

    tracking_number = Column(String)
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class SearchAnalytics(Base):
    __tablename__ = "search_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    session_id = Column(String, index=True)
    query = Column(Text, nullable=False)
    search_type = Column(String)
    results_count = Column(Integer)
    clicked_product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=True
    )
    click_position = Column(Integer)
    response_time_ms = Column(Integer)
    filters_applied = Column(JSON)
    user_agent = Column(String)
    ip_address = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="search_analytics")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=True)
    entity_type = Column(String, nullable=True)
    entity_id = Column(String)
    resource_type = Column(String(100), nullable=True, index=True)
    resource_id = Column(String(200), nullable=True, index=True)
    details = Column(Text, nullable=True)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String)
    user_agent = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    session_id = Column(String(100), nullable=True)
    request_id = Column(String(100), nullable=True)


class SystemLog(Base):
    __tablename__ = "logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    level = Column(String, nullable=False)
    logger_name = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    module = Column(String)
    function_name = Column(String)
    line_number = Column(Integer)
    exception = Column(Text)
    extra_data = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_logs_level_timestamp", "level", "timestamp"),
        Index("ix_logs_logger_timestamp", "logger_name", "timestamp"),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON)
    is_read = Column(Boolean, default=False)
    is_sent = Column(Boolean, default=False)
    scheduled_for = Column(DateTime(timezone=True))
    sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Currency(Base):
    __tablename__ = "currencies"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(3), unique=True, nullable=False)
    name = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    exchange_rate = Column(DECIMAL(10, 6), default=1.0)
    is_base = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(5), unique=True, nullable=False)
    name = Column(String, nullable=False)
    native_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
