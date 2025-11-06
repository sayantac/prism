"""Analytics and dashboard schemas."""

from decimal import Decimal
from typing import Any, Dict, List
from uuid import UUID

from app.schemas.common import BaseSchema


class DashboardStats(BaseSchema):
    """Dashboard statistics schema."""

    total_products: int
    total_users: int
    total_orders: int
    total_revenue: Decimal
    active_products: int
    out_of_stock_products: int
    pending_orders: int
    recent_searches: List[str]


class DashboardOverview(BaseSchema):
    """Dashboard overview schema."""

    products: Dict[str, Any]
    users: Dict[str, Any]
    orders: Dict[str, Any]
    revenue: Dict[str, Any]
    search: Dict[str, Any]
    recent_activity: Dict[str, Any]


class UserBehaviorStats(BaseSchema):
    """User behavior statistics schema."""

    total_product_views: int
    cart_additions: int
    orders_placed: int
    wishlist_additions: int
    search_queries: int


class FrequentCategory(BaseSchema):
    """Frequent category schema."""

    category: str
    view_count: int


class UserAnalytics(BaseSchema):
    """User analytics schema."""

    user_id: str
    username: str
    email: str
    full_name: str | None
    total_orders: int
    total_spent: float


class RevenueAnalytics(BaseSchema):
    """Revenue analytics schema."""

    year: int
    month: int
    orders: int
    revenue: float
