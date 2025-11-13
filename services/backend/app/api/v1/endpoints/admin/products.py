import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session, selectinload

from app.api.deps import (
    PaginationParams,
    get_db,
    get_pagination_params,
)
from app.core.permissions import require_permission
from app.models import Product, ProductCategory, ProductConfig, User
from app.schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    MessageResponse,
    PaginatedResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.services.embedding_service import EmbeddingService
from app.services.product_service import product_service

router = APIRouter()
logger = logging.getLogger(__name__)


async def generate_product_embedding_task(product_id: str, db: Session):
    """Background task for generating embeddings"""
    try:
        embedding_service = EmbeddingService()
        product = db.query(Product).filter(Product.id == product_id).first()

        if product:
            embedding = await embedding_service.generate_product_embedding(product)
            if embedding:
                product.embedding = embedding
                product.is_embedding_generated = True
                db.commit()
                logger.info(f"Generated embedding for product {product_id}")
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")


@router.get("/products", response_model=PaginatedResponse)
async def admin_list_products(
    pagination: PaginationParams = Depends(get_pagination_params),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    in_stock: Optional[bool] = Query(None),
    sort_by: str = Query("created_at", pattern="^(name|price|created_at|popularity)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search_term: str = Query(None),
    current_user: User = Depends(require_permission("manage_products")),
    db: Session = Depends(get_db),
):
    """Admin: List all products with advanced filtering"""
    # from sqlalchemy import or_

    # query = db.query(Product).options(
    #     selectinload(Product.category), selectinload(Product.config)
    # )

    # if category_id:
    #     query = query.filter(Product.category_id == category_id)

    # if brand:
    #     query = query.filter(Product.brand.ilike(f"%{brand}%"))

    # if is_active is not None:
    #     query = query.filter(Product.is_active == is_active)

    # if in_stock is not None:
    #     query = query.filter(Product.in_stock == in_stock)

    # if is_embedding_generated is not None:
    #     query = query.filter(Product.is_embedding_generated == is_embedding_generated)

    # if search:
    #     query = query.filter(
    #         or_(
    #             Product.name.ilike(f"%{search}%"),
    #             Product.code.ilike(f"%{search}%"),
    #             Product.brand.ilike(f"%{search}%"),
    #         )
    #     )

    # total = query.count()

    # products = (
    #     query.order_by(desc(Product.created_at))
    #     .offset(pagination.offset)
    #     .limit(pagination.size)
    #     .all()
    # )

    # pages = (total + pagination.size - 1) // pagination.size

    products = product_service.list_products_paginated(
        brand=brand,
        category=category,
        in_stock=in_stock,
        max_price=max_price,
        min_price=min_price,
        page=pagination.page,
        size=pagination.size,
        sort_by=sort_by,
        sort_order=sort_order,
        search_term=search_term,
    )

    return products

    # return PaginatedResponse(
    #     items=products,
    #     total=total,
    #     page=pagination.page,
    #     size=pagination.size,
    #     pages=pages,
    # )


@router.post("/products", response_model=ProductResponse)
async def admin_create_product(
    product_data: ProductCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("manage_products")),
    db: Session = Depends(get_db),
):
    """Admin: Create a new product"""

    if product_data.code:
        existing = db.query(Product).filter(Product.code == product_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product code already exists",
            )

    if product_data.category_id:
        category = (
            db.query(ProductCategory)
            .filter(ProductCategory.id == product_data.category_id)
            .first()
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found"
            )

    product_dict = product_data.dict(exclude={"config"})
    product = Product(**product_dict)

    db.add(product)
    db.flush()

    if product_data.config:
        config_dict = product_data.config.dict()
        config_dict["product_id"] = product.id
        config = ProductConfig(**config_dict)
        db.add(config)

    db.commit()
    db.refresh(product)

    background_tasks.add_task(generate_product_embedding_task, str(product.id), db)

    return product


@router.get("/products/{product_id}", response_model=ProductResponse)
async def admin_get_product(
    product_id: UUID,
    current_user: User = Depends(require_permission("view_products")),
    db: Session = Depends(get_db),
):
    """Admin: Get product details"""

    product = (
        db.query(Product)
        .options(selectinload(Product.category))
        .options(selectinload(Product.config))
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def admin_update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("manage_products")),
    db: Session = Depends(get_db),
):
    """Admin: Update product"""

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    if product_data.code and product_data.code != product.code:
        existing = (
            db.query(Product)
            .filter(Product.code == product_data.code)
            .filter(Product.id != product_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product code already exists",
            )

    update_data = product_data.dict(exclude_unset=True, exclude={"config"})
    for field, value in update_data.items():
        setattr(product, field, value)

    if product_data.config:
        config = (
            db.query(ProductConfig)
            .filter(ProductConfig.product_id == product_id)
            .first()
        )

        if config:
            config_update = product_data.config.dict(exclude_unset=True)
            for field, value in config_update.items():
                setattr(config, field, value)
        else:
            config_dict = product_data.config.dict()
            config_dict["product_id"] = product_id
            config = ProductConfig(**config_dict)
            db.add(config)

    content_fields = [
        "name",
        "description",
        "specification",
        "technical_details",
        "custom_fields",
    ]
    if any(field in update_data for field in content_fields):
        product.is_embedding_generated = False
        background_tasks.add_task(generate_product_embedding_task, str(product_id), db)

    db.commit()
    db.refresh(product)

    return product


@router.delete("/products/{product_id}")
async def admin_delete_product(
    product_id: UUID,
    current_user: User = Depends(require_permission("manage_products")),
    db: Session = Depends(get_db),
):
    """Admin: Delete product (soft delete)"""

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    product.is_active = False
    db.commit()

    return MessageResponse(message="Product deleted successfully")


@router.post("/products/bulk-update")
async def admin_bulk_update_products(
    product_ids: List[UUID],
    update_data: dict,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("manage_products")),
    db: Session = Depends(get_db),
):
    """Admin: Bulk update products"""

    if not product_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No product IDs provided"
        )

    allowed_fields = {
        "is_active",
        "in_stock",
        "stock_quantity",
        "brand",
        "category_id",
        "price",
    }

    invalid_fields = set(update_data.keys()) - allowed_fields
    if invalid_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid fields for bulk update: {invalid_fields}",
        )

    query = db.query(Product).filter(Product.id.in_(product_ids))
    updated_count = query.update(update_data, synchronize_session=False)

    db.commit()

    return MessageResponse(message=f"Successfully updated {updated_count} products")


@router.post("/products/{product_id}/regenerate-embedding")
async def admin_regenerate_embedding(
    product_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("manage_products")),
    db: Session = Depends(get_db),
):
    """Admin: Regenerate product embedding"""

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    product.is_embedding_generated = False
    db.commit()

    background_tasks.add_task(generate_product_embedding_task, str(product_id), db)

    return MessageResponse(message="Embedding regeneration queued")


@router.post("/products/bulk-regenerate-embeddings")
async def admin_bulk_regenerate_embeddings(
    background_tasks: BackgroundTasks,
    category_id: Optional[UUID] = Query(None),
    current_user: User = Depends(require_permission("manage_products")),
    db: Session = Depends(get_db),
):
    """Admin: Bulk regenerate embeddings"""

    query = db.query(Product).filter(Product.is_active == True)

    if category_id:
        query = query.filter(Product.category_id == category_id)

    products = query.all()

    for product in products:
        product.is_embedding_generated = False
        background_tasks.add_task(generate_product_embedding_task, str(product.id), db)

    db.commit()

    return MessageResponse(
        message=f"Queued embedding regeneration for {len(products)} products"
    )


@router.get("/categories", response_model=List[CategoryResponse])
async def admin_list_categories(
    current_user: User = Depends(require_permission("manage_categories")),
    db: Session = Depends(get_db),
):
    """Admin: List all categories"""

    categories = (
        db.query(ProductCategory)
        .order_by(ProductCategory.sort_order, ProductCategory.name)
        .all()
    )

    return categories


@router.post("/categories", response_model=CategoryResponse)
async def admin_create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(require_permission("manage_categories")),
    db: Session = Depends(get_db),
):
    """Admin: Create new category"""

    existing = (
        db.query(ProductCategory)
        .filter(ProductCategory.name == category_data.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name already exists",
        )

    if category_data.parent_id:
        parent = (
            db.query(ProductCategory)
            .filter(ProductCategory.id == category_data.parent_id)
            .first()
        )
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found",
            )

    category = ProductCategory(**category_data.dict())
    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def admin_update_category(
    category_id: UUID,
    category_data: CategoryUpdate,
    current_user: User = Depends(require_permission("manage_categories")),
    db: Session = Depends(get_db),
):
    """Admin: Update category"""

    category = (
        db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )

    if category_data.name and category_data.name != category.name:
        existing = (
            db.query(ProductCategory)
            .filter(ProductCategory.name == category_data.name)
            .filter(ProductCategory.id != category_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name already exists",
            )

    if category_data.parent_id:
        if category_data.parent_id == category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category cannot be its own parent",
            )

        parent = (
            db.query(ProductCategory)
            .filter(ProductCategory.id == category_data.parent_id)
            .first()
        )
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found",
            )

    update_data = category_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)

    return category


@router.delete("/categories/{category_id}")
async def admin_delete_category(
    category_id: UUID,
    current_user: User = Depends(require_permission("manage_categories")),
    db: Session = Depends(get_db),
):
    """Admin: Delete category"""

    category = (
        db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )

    product_count = db.query(Product).filter(Product.category_id == category_id).count()

    if product_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category with {product_count} products",
        )

    subcategory_count = (
        db.query(ProductCategory)
        .filter(ProductCategory.parent_id == category_id)
        .count()
    )

    if subcategory_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category with {subcategory_count} subcategories",
        )

    db.delete(category)
    db.commit()

    return MessageResponse(message="Category deleted successfully")


@router.get("/analytics/dashboard")
async def admin_dashboard_stats(
    current_user: User = Depends(require_permission("admin_dashboard")),
    db: Session = Depends(get_db),
):
    """Admin: Get dashboard statistics"""

    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.is_active == True).count()
    out_of_stock = (
        db.query(Product)
        .filter(and_(Product.is_active == True, Product.in_stock == False))
        .count()
    )

    total_users = db.query(User).filter(User.is_active == True).count()

    from app.models import SearchAnalytics

    recent_searches = (
        db.query(SearchAnalytics.query)
        .order_by(desc(SearchAnalytics.timestamp))
        .limit(10)
        .all()
    )

    search_queries = [search[0] for search in recent_searches]

    top_categories = (
        db.query(ProductCategory.name, func.count(Product.id).label("product_count"))
        .join(Product, ProductCategory.id == Product.category_id)
        .filter(Product.is_active == True)
        .group_by(ProductCategory.id, ProductCategory.name)
        .order_by(desc("product_count"))
        .limit(5)
        .all()
    )

    return {
        "total_products": total_products,
        "active_products": active_products,
        "out_of_stock_products": out_of_stock,
        "total_users": total_users,
        "recent_searches": search_queries,
        "top_categories": [
            {"name": cat[0], "product_count": cat[1]} for cat in top_categories
        ],
    }


@router.get("/analytics/products/top-viewed")
async def admin_top_viewed_products(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_permission("view_analytics")),
    db: Session = Depends(get_db),
):
    """Admin: Get most viewed products"""

    products = (
        db.query(Product)
        .filter(Product.is_active == True)
        .order_by(desc(Product.created_at))
        .limit(limit)
        .all()
    )

    return [
        {
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "price": product.price,
            "views": 0,
        }
        for product in products
    ]


@router.get("/analytics/search/popular-queries")
async def admin_popular_search_queries(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(require_permission("view_search_analytics")),
    db: Session = Depends(get_db),
):
    """Admin: Get popular search queries"""

    from datetime import datetime, timedelta

    from app.models import SearchAnalytics

    since_date = datetime.utcnow() - timedelta(days=days)

    popular_queries = (
        db.query(
            SearchAnalytics.query, func.count(SearchAnalytics.id).label("search_count")
        )
        .filter(SearchAnalytics.timestamp >= since_date)
        .group_by(SearchAnalytics.query)
        .order_by(desc("search_count"))
        .limit(limit)
        .all()
    )

    return [{"query": query[0], "search_count": query[1]} for query in popular_queries]


@router.get("/inventory/low-stock")
async def admin_low_stock_products(
    threshold: int = Query(10, ge=0),
    current_user: User = Depends(require_permission("manage_inventory")),
    db: Session = Depends(get_db),
):
    """Admin: Get products with low stock"""

    low_stock_products = (
        db.query(Product)
        .filter(Product.is_active == True)
        .filter(Product.stock_quantity <= threshold)
        .order_by(Product.stock_quantity)
        .all()
    )

    return [
        {
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "stock_quantity": product.stock_quantity,
            "price": product.price,
        }
        for product in low_stock_products
    ]


@router.post("/inventory/bulk-update-stock")
async def admin_bulk_update_stock(
    updates: List[dict],
    current_user: User = Depends(require_permission("manage_inventory")),
    db: Session = Depends(get_db),
):
    """Admin: Bulk update product stock quantities"""

    updated_count = 0

    for update in updates:
        product_id = update.get("product_id")
        stock_quantity = update.get("stock_quantity")

        if not product_id or stock_quantity is None:
            continue

        product = db.query(Product).filter(Product.id == product_id).first()

        if product:
            product.stock_quantity = stock_quantity
            product.in_stock = stock_quantity > 0
            updated_count += 1

    db.commit()

    return MessageResponse(
        message=f"Successfully updated stock for {updated_count} products"
    )
