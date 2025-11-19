"""
Schemas package for the e-commerce recommendation system.

This package exports all Pydantic schemas for easy importing throughout the application.

Schemas are organized by domain:
- common: Base schemas, pagination, messages, errors
- auth: Authentication and authorization schemas
- user: User and role schemas
- product: Product, category, and configuration schemas
- cart: Cart and cart item schemas
- order: Order and order item schemas
- search: Search request/response and analytics schemas
- notification: Notification schemas
- analytics: Dashboard and analytics schemas
- admin: Admin-specific schemas (separate file)
"""

# Import common schemas
from app.schemas.common import (
    AddressSchema,
    BaseSchema,
    ErrorResponse,
    FileUploadResponse,
    MessageResponse,
    PaginatedResponse,
)

# Import auth schemas
from app.schemas.auth import (
    LoginRequest,
    PermissionBase,
    PermissionCreate,
    PermissionResponse,
    RefreshTokenRequest,
    RoleBase,
    RoleCreate,
    RoleResponse,
    RoleUpdate,
    Token,
    TokenPayload,
)

# Import user schemas
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserResponse,
    UserUpdate,
    UserWithRoles,
)

# Import product schemas
from app.schemas.product import (
    CategoryBase,
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    ProductAnalytics,
    ProductBase,
    ProductConfigBase,
    ProductConfigCreate,
    ProductConfigResponse,
    ProductConfigUpdate,
    ProductCreate,
    ProductResponse,
    ProductSearchResult,
    ProductUpdate,
)

# Import cart schemas
from app.schemas.cart import (
    CartItemBase,
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
)

# Import order schemas
from app.schemas.order import (
    OrderBase,
    OrderCreate,
    OrderItemBase,
    OrderItemResponse,
    OrderResponse,
    OrderUpdate,
)

# Import search schemas
from app.schemas.search import (
    SearchAnalyticsCreate,
    SearchAnalyticsResponse,
    SearchParams,
    SearchRequest,
    SearchResponse,
)

# Import notification schemas
from app.schemas.notification import (
    NotificationBase,
    NotificationCreate,
    NotificationResponse,
)

# Import analytics schemas
from app.schemas.analytics import (
    DashboardOverview,
    DashboardStats,
    FrequentCategory,
    RevenueAnalytics,
    UserAnalytics,
    UserBehaviorStats,
)

# Export all schemas
__all__ = [
    # Common
    "BaseSchema",
    "MessageResponse",
    "ErrorResponse",
    "PaginatedResponse",
    "FileUploadResponse",
    "AddressSchema",
    # Auth
    "Token",
    "TokenPayload",
    "LoginRequest",
    "RefreshTokenRequest",
    "PermissionBase",
    "PermissionCreate",
    "PermissionResponse",
    "RoleBase",
    "RoleCreate",
    "RoleUpdate",
    "RoleResponse",
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserWithRoles",
    # Product
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "ProductConfigBase",
    "ProductConfigCreate",
    "ProductConfigUpdate",
    "ProductConfigResponse",
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "ProductSearchResult",
    "ProductAnalytics",
    # Cart
    "CartItemBase",
    "CartItemCreate",
    "CartItemUpdate",
    "CartItemResponse",
    "CartResponse",
    # Order
    "OrderItemBase",
    "OrderBase",
    "OrderCreate",
    "OrderUpdate",
    "OrderItemResponse",
    "OrderResponse",
    # Search
    "SearchParams",
    "SearchRequest",
    "SearchResponse",
    "SearchAnalyticsCreate",
    "SearchAnalyticsResponse",
    # Notification
    "NotificationBase",
    "NotificationCreate",
    "NotificationResponse",
    # Analytics
    "DashboardStats",
    "DashboardOverview",
    "UserBehaviorStats",
    "FrequentCategory",
    "UserAnalytics",
    "RevenueAnalytics",
]
