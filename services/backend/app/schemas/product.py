"""Product, category, and product configuration schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List
from uuid import UUID

from app.schemas.common import BaseSchema


class CategoryBase(BaseSchema):
    """Base category schema."""

    name: str
    description: str | None = None
    parent_id: UUID | None = None
    display_order: int = 0


class CategoryCreate(CategoryBase):
    """Category creation schema."""

    pass


class CategoryUpdate(BaseSchema):
    """Category update schema."""

    name: str | None = None
    description: str | None = None
    parent_id: UUID | None = None
    is_active: bool | None = None
    display_order: int | None = None


class CategoryResponse(CategoryBase):
    """Category response schema."""

    id: UUID
    is_active: bool
    created_at: datetime
    children: List["CategoryResponse"] = []


CategoryResponse.update_forward_refs()


class ProductConfigBase(BaseSchema):
    """Base product configuration schema."""

    show_in_search: bool = True
    show_in_recommendations: bool = True
    reranking_priority: int = 0
    is_sponsored: bool = False
    sponsored_priority: int = 0
    featured: bool = False
    promotion_text: str | None = None
    boost_factor: float = 1.0


class ProductConfigCreate(ProductConfigBase):
    """Product configuration creation schema."""

    pass


class ProductConfigUpdate(BaseSchema):
    """Product configuration update schema."""

    show_in_search: bool | None = None
    show_in_recommendations: bool | None = None
    reranking_priority: int | None = None
    is_sponsored: bool | None = None
    sponsored_priority: int | None = None
    featured: bool | None = None
    promotion_text: str | None = None
    boost_factor: float | None = None


class ProductConfigResponse(ProductConfigBase):
    """Product configuration response schema."""

    id: UUID
    product_id: UUID
    created_at: datetime


class ProductBase(BaseSchema):
    """Base product schema."""

    name: str
    category_id: UUID | None = None
    brand: str | None = None
    price: Decimal
    code: str | None = None
    description: str | None = None
    specification: str | None = None
    technical_details: str | None = None
    product_dimensions: str | None = None
    images: List[str] | None = []
    product_url: str | None = None
    is_amazon_seller: bool = False
    stock_quantity: int = 0
    in_stock: bool = True
    custom_fields: Dict[str, Any] | None = {}
    meta_title: str | None = None
    meta_description: str | None = None
    tags: List[str] | None = []


class ProductCreate(ProductBase):
    """Product creation schema."""

    config: ProductConfigCreate | None = None


class ProductUpdate(BaseSchema):
    """Product update schema."""

    name: str | None = None
    category_id: UUID | None = None
    brand: str | None = None
    price: Decimal | None = None
    code: str | None = None
    description: str | None = None
    specification: str | None = None
    technical_details: str | None = None
    product_dimensions: str | None = None
    images: List[str] | None = None
    product_url: str | None = None
    is_amazon_seller: bool | None = None
    is_active: bool | None = None
    stock_quantity: int | None = None
    in_stock: bool | None = None
    custom_fields: Dict[str, Any] | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    tags: List[str] | None = None
    config: ProductConfigUpdate | None = None


class ProductResponse(ProductBase):
    """Product response schema."""

    id: UUID
    is_active: bool
    is_embedding_generated: bool
    created_at: datetime
    updated_at: datetime | None = None
    category: CategoryResponse | None = None
    config: ProductConfigResponse | None = None


class ProductSearchResult(ProductResponse):
    """Product search result with ranking scores."""

    similarity_score: float | None = None
    search_rank: int | None = None


class ProductAnalytics(BaseSchema):
    """Product analytics schema."""

    product_id: UUID
    product_name: str
    views: int
    searches: int
    orders: int
    revenue: Decimal
    conversion_rate: float
