from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, validator

from app.core import permissions


class BaseSchema(BaseModel):
    class Config:
        orm_mode = True
        use_enum_values = True


class UserBase(BaseSchema):
    username: str
    phone: Optional[str]
    email: EmailStr
    full_name: Optional[str] = None
    locale: str = "en"
    interests: Optional[List[str]] = []
    preferences: Optional[Dict[str, Any]] = {}
    address: Optional[Dict[str, Any]] = {}


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseSchema):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    locale: Optional[str] = None
    interests: Optional[List[str]] = None
    preferences: Optional[Dict[str, Any]] = None
    address: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    is_superuser: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    last_active: Optional[datetime] = None
    viewed_products: Optional[List[UUID]] = []
    roles: Any
    permissions: Any


class UserWithRoles(UserResponse):
    roles: List["RoleResponse"] = []


class Token(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseSchema):
    sub: Optional[str] = None


class LoginRequest(BaseSchema):
    username: str
    password: str


class RefreshTokenRequest(BaseSchema):
    refresh_token: str


class PermissionBase(BaseSchema):
    name: str
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    pass


class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime


class RoleBase(BaseSchema):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: Optional[List[int]] = []


class RoleUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    permissions: List[PermissionResponse] = []
    user_count: Optional[int] = 0


class CategoryBase(BaseSchema):
    name: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    display_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: UUID
    is_active: bool
    created_at: datetime
    children: List["CategoryResponse"] = []


class ProductConfigBase(BaseSchema):
    show_in_search: bool = True
    show_in_recommendations: bool = True
    reranking_priority: int = 0
    is_sponsored: bool = False
    sponsored_priority: int = 0
    featured: bool = False
    promotion_text: Optional[str] = None
    boost_factor: float = 1.0


class ProductConfigCreate(ProductConfigBase):
    pass


class ProductConfigUpdate(BaseSchema):
    show_in_search: Optional[bool] = None
    show_in_recommendations: Optional[bool] = None
    reranking_priority: Optional[int] = None
    is_sponsored: Optional[bool] = None
    sponsored_priority: Optional[int] = None
    featured: Optional[bool] = None
    promotion_text: Optional[str] = None
    boost_factor: Optional[float] = None


class ProductConfigResponse(ProductConfigBase):
    id: UUID
    product_id: UUID
    created_at: datetime


class ProductBase(BaseSchema):
    name: str
    category_id: Optional[UUID] = None
    brand: Optional[str] = None
    price: Decimal
    code: Optional[str] = None
    description: Optional[str] = None
    specification: Optional[str] = None
    technical_details: Optional[str] = None
    product_dimensions: Optional[str] = None
    images: Optional[List[str]] = []
    product_url: Optional[str] = None
    is_amazon_seller: bool = False
    stock_quantity: int = 0
    in_stock: bool = True
    custom_fields: Optional[Dict[str, Any]] = {}
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = []


class ProductCreate(ProductBase):
    config: Optional[ProductConfigCreate] = None


class ProductUpdate(BaseSchema):
    name: Optional[str] = None
    category_id: Optional[UUID] = None
    brand: Optional[str] = None
    price: Optional[Decimal] = None
    code: Optional[str] = None
    description: Optional[str] = None
    specification: Optional[str] = None
    technical_details: Optional[str] = None
    product_dimensions: Optional[str] = None
    images: Optional[List[str]] = None
    product_url: Optional[str] = None
    is_amazon_seller: Optional[bool] = None
    is_active: Optional[bool] = None
    stock_quantity: Optional[int] = None
    in_stock: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = None
    config: Optional[ProductConfigUpdate] = None


class ProductResponse(ProductBase):
    id: UUID
    is_active: bool
    is_embedding_generated: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional["CategoryResponse"] = None
    config: Optional[ProductConfigResponse] = None


class ProductSearchResult(ProductResponse):
    similarity_score: Optional[float] = None
    search_rank: Optional[int] = None


class AddressSchema(BaseSchema):
    street: str
    city: str
    state: str
    postal_code: str
    country: str
    phone: Optional[str] = None
    name: Optional[str] = None


class SearchRequest(BaseSchema):
    query: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock: Optional[bool] = None
    sort_by: str = "relevance"
    sort_order: str = "desc"
    page: int = 1
    size: int = 20
    use_vector_search: bool = True


class SearchResponse(BaseSchema):
    products: List[ProductSearchResult]
    total: int
    page: int
    size: int
    pages: int
    query: Optional[str] = None
    filters_applied: Dict[str, Any]
    search_time_ms: int


class CartItemBase(BaseSchema):
    product_id: UUID
    quantity: int = 1


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseSchema):
    quantity: int

    @validator("quantity")
    def validate_quantity(cls, v):
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class OrderItemBase(BaseSchema):
    product_id: UUID
    quantity: int
    unit_price: Decimal


class OrderBase(BaseSchema):
    shipping_method: str = "standard"
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseSchema):
    status: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    estimated_delivery: Optional[datetime] = None

    @validator("status")
    def validate_status(cls, v):
        if v and v not in ["pending", "confirmed", "shipped", "delivered", "cancelled"]:
            raise ValueError("Invalid order status")
        return v


class SearchAnalyticsCreate(BaseSchema):
    session_id: str
    query: str
    search_type: str
    results_count: int
    response_time_ms: int
    filters_applied: Optional[Dict[str, Any]] = {}
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None


class SearchAnalyticsResponse(SearchAnalyticsCreate):
    id: UUID
    user_id: Optional[UUID] = None
    clicked_product_id: Optional[UUID] = None
    click_position: Optional[int] = None
    timestamp: datetime


class FileUploadResponse(BaseSchema):
    filename: str
    url: str
    size: int
    content_type: str


class PaginatedResponse(BaseSchema):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


class MessageResponse(BaseSchema):
    message: str


class ErrorResponse(BaseSchema):
    detail: str
    error_code: Optional[str] = None


class DashboardStats(BaseSchema):
    total_products: int
    total_users: int
    total_orders: int
    total_revenue: Decimal
    active_products: int
    out_of_stock_products: int
    pending_orders: int
    recent_searches: List[str]


class ProductAnalytics(BaseSchema):
    product_id: UUID
    product_name: str
    views: int
    searches: int
    orders: int
    revenue: Decimal
    conversion_rate: float


class NotificationBase(BaseSchema):
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = {}


class NotificationCreate(NotificationBase):
    user_id: UUID
    scheduled_for: Optional[datetime] = None


class UserBehaviorStats(BaseSchema):
    total_product_views: int
    cart_additions: int
    orders_placed: int
    wishlist_additions: int
    search_queries: int


class FrequentCategory(BaseSchema):
    category: str
    view_count: int


class UserAnalytics(BaseSchema):
    user_id: str
    username: str
    email: str
    full_name: Optional[str]
    total_orders: int
    total_spent: float


class RevenueAnalytics(BaseSchema):
    year: int
    month: int
    orders: int
    revenue: float


class DashboardOverview(BaseSchema):
    products: Dict[str, Any]
    users: Dict[str, Any]
    orders: Dict[str, Any]
    revenue: Dict[str, Any]
    search: Dict[str, Any]
    recent_activity: Dict[str, Any]


CategoryResponse.update_forward_refs()
ProductResponse.update_forward_refs()
UserWithRoles.update_forward_refs()


class CartItemResponse(BaseSchema):
    product: ProductResponse
    quantity: int
    added_at: datetime


class CartResponse(BaseSchema):
    id: UUID
    items: List[CartItemResponse] = []
    total_items: int
    total_amount: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None


class OrderItemResponse(BaseSchema):
    id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    product: ProductResponse


class OrderResponse(BaseSchema):
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
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None


class NotificationResponse(BaseSchema):
    id: UUID
    type: str
    title: str
    message: str
    data: Dict[str, Any]
    is_read: bool
    created_at: datetime


class SearchParams(BaseSchema):
    q: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock: Optional[bool] = None
    sort_by: str = "relevance"
    sort_order: str = "desc"
