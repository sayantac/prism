"""Search and search analytics schemas."""

from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

from app.schemas.common import BaseSchema
from app.schemas.product import ProductSearchResult


class SearchParams(BaseSchema):
    """Search parameters schema."""

    q: str | None = None
    category: str | None = None
    brand: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    in_stock: bool | None = None
    sort_by: str = "relevance"
    sort_order: str = "desc"


class SearchRequest(BaseSchema):
    """Search request schema."""

    query: str | None = None
    category: str | None = None
    brand: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    in_stock: bool | None = None
    sort_by: str = "relevance"
    sort_order: str = "desc"
    page: int = 1
    size: int = 20
    use_vector_search: bool = True


class SearchResponse(BaseSchema):
    """Search response schema."""

    products: List[ProductSearchResult]
    total: int
    page: int
    size: int
    pages: int
    query: str | None = None
    filters_applied: Dict[str, Any]
    search_time_ms: int


class SearchAnalyticsCreate(BaseSchema):
    """Search analytics creation schema."""

    session_id: str
    query: str
    search_type: str
    results_count: int
    response_time_ms: int
    filters_applied: Dict[str, Any] | None = {}
    user_agent: str | None = None
    ip_address: str | None = None


class SearchAnalyticsResponse(SearchAnalyticsCreate):
    """Search analytics response schema."""

    id: UUID
    user_id: UUID | None = None
    clicked_product_id: UUID | None = None
    click_position: int | None = None
    timestamp: datetime
