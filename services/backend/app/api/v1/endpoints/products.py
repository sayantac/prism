import logging
import os
import uuid
from functools import lru_cache
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import text
from sqlalchemy.orm import Session, selectinload

from app.api.deps import (
    PaginationParams,
    get_current_user_optional,
    get_db,
    get_pagination_params,
)
from app.core.config import get_settings
from app.models import Product, ProductCategory, User
from app.schemas import (
    FileUploadResponse,
    MessageResponse,
    ProductResponse,
    SearchResponse,
)
from app.services.embedding_service import EmbeddingService
from app.services.product_service import product_service
from app.services.search_service import SearchService
from app.services.user_behavior_service import UserBehaviorService


class SearchParams:
    def __init__(
        self,
        q: Optional[str] = None,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        in_stock: Optional[bool] = None,
        sort_by: str = "relevance",
        sort_order: str = "desc",
    ):
        self.q = q
        self.category = category
        self.brand = brand
        self.min_price = min_price
        self.max_price = max_price
        self.in_stock = in_stock
        self.sort_by = sort_by
        self.sort_order = sort_order


def get_search_params(
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    in_stock: Optional[bool] = None,
    sort_by: str = "relevance",
    sort_order: str = "desc",
) -> SearchParams:
    return SearchParams(
        q, category, brand, min_price, max_price, in_stock, sort_by, sort_order
    )


router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


@router.get("/")
async def list_products(
    pagination: PaginationParams = Depends(get_pagination_params),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    in_stock: Optional[bool] = Query(None),
    sort_by: str = Query("created_at", regex="^(name|price|created_at|popularity)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    search_term: str = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """List products with filtering and pagination"""

    # query = (
    #     db.query(Product)
    #     .options(
    #         joinedload(Product.category).load_only(
    #             ProductCategory.id, ProductCategory.name
    #         )
    #     )
    #     .filter(Product.is_active == True)
    # )
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

    # if category:
    #     query = query.join(ProductCategory).filter(
    #         ProductCategory.name.ilike(f"%{category}%")
    #     )
    # if brand:
    #     query = query.filter(Product.brand.ilike(f"%{brand}%"))
    # if min_price:
    #     query = query.filter(Product.price >= min_price)
    # if max_price:
    #     query = query.filter(Product.price <= max_price)
    # if in_stock is not None:
    #     query = query.filter(Product.in_stock == in_stock)
    # if sort_by == "name":
    #     order_field = Product.name
    # elif sort_by == "price":
    #     order_field = Product.price
    # elif sort_by == "popularity":
    #     # Add popularity calculation if needed
    #     order_field = Product.created_at  # Fallback
    # else:
    #     order_field = Product.created_at

    # if sort_order == "desc":
    #     order_field = desc(order_field)

    # query = query.order_by(order_field)

    # # Get total count
    # total = query.count()
    # products = query.offset(pagination.offset).limit(pagination.size).all()

    # pages = (total + pagination.size - 1) // pagination.size

    # return {
    #     "products": products,
    #     "total": total,
    #     "page": pagination.page,
    #     "size": pagination.size,
    #     "pages": pages,
    # }
    return products


@router.get("/categories", response_model=List[dict])
async def list_categories(
    top_level_only: bool = Query(True, description="Return only top-level categories"),
    db: Session = Depends(get_db)
):
    """List all product categories"""
    print("Fetching categories")
    
    if top_level_only:
        # Get only root categories (no parent)
        categories = (
            db.query(ProductCategory)
            .filter(ProductCategory.is_active == True, ProductCategory.parent_id == None)
            .order_by(ProductCategory.display_order, ProductCategory.name)
            .all()
        )
    else:
        # Get all categories
        categories = get_product_categories(db)

    root_categories = []

    for cat in categories:
        root_categories.append(
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "display_order": cat.display_order,
                "children": [],
            }
        )

    return root_categories


@router.get("/trending")
async def get_trending_products(
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get trending products based on recent views/purchases"""
    # Simple implementation: return most recently created products
    # TODO: Implement actual trending logic based on analytics
    products = (
        db.query(Product)
        .filter(Product.is_active == True, Product.in_stock == True)
        .order_by(Product.created_at.desc())
        .limit(limit)
        .all()
    )
    return products


@router.get("/search", response_model=SearchResponse)
async def search_products(
    search_params: SearchParams = Depends(get_search_params),
    pagination: PaginationParams = Depends(get_pagination_params),
    use_vector_search: bool = Query(False),
    session_id: str = Query(..., description="Session ID for analytics"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Advanced product search"""

    if not search_params.q:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Search query is required"
        )

    search_service = SearchService(db)

    filters = {
        "category": search_params.category,
        "brand": search_params.brand,
        "min_price": search_params.min_price,
        "max_price": search_params.max_price,
        "in_stock": search_params.in_stock,
    }

    filters = {k: v for k, v in filters.items() if v is not None}

    products, total, search_time_ms = await search_service.hybrid_search(
        search_term=search_params.q,
        filters=filters,
        sort_by=search_params.sort_by,
        sort_order=search_params.sort_order,
        page=pagination.page,
        size=pagination.size,
        use_vector=use_vector_search,
    )

    await search_service.log_search(
        user_id=str(current_user.id) if current_user else None,
        session_id=session_id,
        query=search_params.q,
        search_type="traditional",
        results_count=len(products),
        response_time_ms=search_time_ms,
        filters=filters,
    )

    search_results = []
    for i, product in enumerate(products):
        result = product
        result.search_rank = i + 1
        search_results.append(result)

    pages = (total + pagination.size - 1) // pagination.size

    return SearchResponse(
        products=search_results,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=pages,
        query=search_params.q,
        filters_applied=filters,
        search_time_ms=search_time_ms,
    )


async def generate_product_embedding_task(product_id: str, db: Session):
    """Background task to generate product embeddings"""
    try:
        product = (
            db.query(Product)
            .options(selectinload(Product.category))
            .filter(Product.id == product_id)
            .first()
        )
        if not product:
            return

        embedding_service = EmbeddingService()
        embedding = await embedding_service.generate_product_embedding(product, "en")

        if embedding:
            product.embedding = embedding
            product.is_embedding_generated = True
            db.commit()
            logger.info(f"Generated embedding for product {product_id}")
        else:
            logger.error(f"Failed to generate embedding for product {product_id}")

    except Exception as e:
        logger.error(f"Error in embedding generation task: {str(e)}")
        db.rollback()


@router.get("/recommendations/new-arrivals")
async def get_new_arrivals(
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get newly added products"""
    products = (
        db.query(Product)
        .filter(Product.is_active == True, Product.in_stock == True)
        .order_by(Product.created_at.desc())
        .limit(limit)
        .all()
    )
    return products


@router.get("/recommendations/trending")
async def get_popular_products(
    limit: int = Query(default=20, ge=1, le=100),
    days: int = Query(default=30, ge=1, le=365),
):
    """Get popular products based on recent purchases"""
    try:
        from recommendation.services.database_service import db_service

        popular_products = db_service.get_popular_products(limit, days)

        return popular_products

        return {
            "products": popular_products,
            "period_days": days,
            "total_products": len(popular_products),
        }

    except Exception as e:
        logger.error(f"Error getting popular products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/customers-who-bought-also-bought")
def get_customers_who_bought_also_bought(
    product_id: str = Query(..., description="Product ID to find related products"),
    limit: int = Query(default=10, ge=1, le=50),
):
    """Get products frequently bought together with the specified product"""

    from recommendation.services.database_service import db_service, get_db_session

    try:
        target_product = db_service.get_product_data(product_id=product_id)
        if not target_product:
            raise HTTPException(status_code=404, detail="Product not found")

        query = text("""
            WITH target_orders AS (
                SELECT DISTINCT o.id as order_id
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE oi.product_id = :product_id
                AND o.status IN ('delivered', 'shipped')
            ),
            cooccurrence AS (
                SELECT 
                    p.id, p.name, p.category_id, p.brand, p.price, p.code, 
                    p.description, p.specification, p.technical_details, 
                    p.product_dimensions, p.images, p.product_url, 
                    p.is_amazon_seller, p.is_active, p.stock_quantity, 
                    p.in_stock, p.created_at, p.updated_at, p.meta_title, 
                    p.meta_description, p.tags, pc.name as category_name,
                    COUNT(*) as frequency
                FROM target_orders to_
                JOIN order_items oi ON to_.order_id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                WHERE p.id != :product_id
                AND p.is_active = true
                GROUP BY p.id, p.code, p.name, p.price, p.category_id, pc.name, 
                         p.brand, p.description, p.specification, p.technical_details, 
                         p.product_dimensions, p.images, p.product_url, 
                         p.is_amazon_seller, p.is_active, p.stock_quantity, 
                         p.in_stock, p.created_at, p.updated_at, p.meta_title, 
                         p.meta_description, p.tags
                ORDER BY frequency DESC
                LIMIT :limit
            )
            SELECT * FROM cooccurrence
        """)

        with get_db_session() as session:
            result = session.execute(query, {"product_id": product_id, "limit": limit})

        results = []
        max_freq = 1
        rows = list(result.fetchall())

        if rows:
            max_freq = max(row.frequency for row in rows)

        for row in rows:
            distance = 1.0 - (row.frequency / max_freq)

            results.append(
                {
                    "id": str(row.id),
                    "name": row.name,
                    "category_id": str(row.category_id) if row.category_id else None,
                    "brand": row.brand,
                    "price": float(row.price) if row.price else 0.0,
                    "code": row.code,
                    "description": row.description,
                    "specification": row.specification,
                    "technical_details": row.technical_details,
                    "product_dimensions": row.product_dimensions,
                    "images": row.images or [],
                    "product_url": row.product_url,
                    "is_amazon_seller": row.is_amazon_seller,
                    "is_active": row.is_active,
                    "stock_quantity": row.stock_quantity,
                    "in_stock": row.in_stock,
                    "created_at": row.created_at,
                    "updated_at": row.updated_at,
                    "meta_title": row.meta_title,
                    "meta_description": row.meta_description,
                    "tags": row.tags or [],
                    "category_name": row.category_name,
                    "frequency": row.frequency,
                    "distance": distance,
                }
            )

        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting frequently bought together for {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/personalized", response_model=List[ProductResponse])
async def get_personalized_recommendations(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get personalized product recommendations"""

    if not current_user:
        return await get_popular_products(limit, 30)

    behavior_service = UserBehaviorService(db)
    product_ids = behavior_service.get_recommended_products_based_on_behavior(
        str(current_user.id), limit
    )

    if not product_ids:
        return await get_popular_products(limit, 30)

    recommendations = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .filter(Product.is_active == True)
        .all()
    )

    return recommendations


@router.get("/new-arrivals")
def get_new_arrivals(
    limit: int = Query(default=20, ge=1, le=100),
    days: int = Query(default=30, ge=1, le=365),
):
    """Get new arrivals within specified time period"""

    from recommendation.services.rfm_service import db_service

    try:
        new_products = db_service.get_new_arrivals(limit)
        return new_products

    except Exception as e:
        logger.error(f"Error getting new arrivals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations")
async def get_user_recommendations(
    limit: int = Query(default=10, ge=1, le=15),
    use_ml: bool = Query(default=True, description="Use ML models if available"),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get personalized recommendations for a user"""

    from recommendation.services.ml_recommendation_services import (
        ml_recommendation_service,
    )
    from recommendation.services.recommendation_service import recommendation_service

    try:
        ml_models_used = []
        recommendations = []
        source = "database_fallback"

        # user = db_service.get_user_data(current_user.id)
        if not current_user:
            logger.warning(f"User {current_user.id} not found")
            recommendations = recommendation_service._get_popular_fallback(limit)
            source = "popular_fallback"
        else:
            if use_ml and ml_recommendation_service.als_model:
                logger.info(f"Using ML models for user {current_user.id}")

                try:
                    als_recs = ml_recommendation_service.get_als_recommendations(
                        current_user.id, limit
                    )
                    if als_recs:
                        recommendations.extend(als_recs)
                        ml_models_used.append("als_collaborative_filtering")
                        source = "ml_enhanced"
                        logger.info(
                            f"ALS model returned {len(als_recs)} recommendations"
                        )
                except Exception as e:
                    logger.warning(f"ALS model failed: {e}")

                if (
                    len(recommendations) < limit
                    and ml_recommendation_service.reorder_model
                ):
                    try:
                        reorder_recs = (
                            ml_recommendation_service.get_reorder_predictions(
                                current_user.id, limit - len(recommendations)
                            )
                        )
                        if reorder_recs:
                            recommendations.extend(reorder_recs)
                            ml_models_used.append("reorder_prediction")
                            logger.info(
                                f"Reorder model returned {len(reorder_recs)} recommendations"
                            )
                    except Exception as e:
                        logger.warning(f"Reorder model failed: {e}")

                seen_products = set()
                unique_recommendations = []
                for rec in recommendations:
                    if rec["product_id"] not in seen_products:
                        seen_products.add(rec["product_id"])
                        unique_recommendations.append(rec)
                recommendations = unique_recommendations

            if len(recommendations) < limit:
                logger.info(
                    f"Using database fallback for user {current_user.id} (got {len(recommendations)}, need {limit})"
                )

                db_recs = recommendation_service._get_collaborative_recommendations(
                    current_user.id, limit - len(recommendations)
                )
                if db_recs:
                    recommendations.extend(db_recs)
                    if source == "database_fallback":
                        source = "database_collaborative"

                if len(recommendations) < limit:
                    content_recs = (
                        recommendation_service._get_content_based_recommendations(
                            current_user.id, limit - len(recommendations)
                        )
                    )
                    if content_recs:
                        recommendations.extend(content_recs)
                        if source == "database_fallback":
                            source = "database_content_based"

                if len(recommendations) < limit:
                    popular_recs = recommendation_service._get_popular_fallback(
                        limit - len(recommendations)
                    )
                    recommendations.extend(popular_recs)
                    if not recommendations:
                        source = "popular_fallback"

        return recommendations

        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "source": source,
            "cached": False,
            "ml_models_used": ml_models_used,
        }

    except Exception as e:
        logger.error(f"Error getting recommendations for {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


@router.get("/fbt-recommendations/{product_id}")
def get_fbt_recommendations(
    product_id: str, limit: int = Query(default=10, ge=1, le=50)
):
    """Get Frequently Bought Together (FBT) recommendations"""
    try:
        from recommendation.services.database_service import get_db_session

        query = text("""
            WITH product_baskets AS (
                SELECT 
                    o.id as basket_id,
                    array_agg(oi.product_id) as products
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE o.status IN ('delivered', 'shipped')
                AND o.created_at > NOW() - INTERVAL '6 months'
                GROUP BY o.id
                HAVING COUNT(oi.product_id) > 1
            ),
            target_baskets AS (
                SELECT basket_id, products
                FROM product_baskets
                WHERE :product_id = ANY(products)
            ),
            unnested_products AS (
                SELECT 
                    unnest(products) as product_id,
                    basket_id
                FROM target_baskets
                WHERE array_length(products, 1) > 1
            ),
            fbt_products AS (
                SELECT 
                    product_id,
                    COUNT(*) as support
                FROM unnested_products
                WHERE product_id != :product_id
                GROUP BY product_id
            )
            SELECT 
                p.id, p.name, p.category_id, p.brand, p.price, p.code, 
                p.description, p.specification, p.technical_details, 
                p.product_dimensions, p.images, p.product_url, 
                p.is_amazon_seller, p.is_active, p.stock_quantity, 
                p.in_stock, p.created_at, p.updated_at, p.meta_title, 
                p.meta_description, p.tags, pc.name as category_name,
                f.support,
                ROUND(f.support::numeric / NULLIF((SELECT COUNT(*) FROM target_baskets), 0)::numeric, 3) as confidence
            FROM fbt_products f
            JOIN products p ON f.product_id = p.id
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.is_active = true
            ORDER BY f.support DESC, confidence DESC
            LIMIT :limit
        """)

        with get_db_session() as session:
            result = session.execute(query, {"product_id": product_id, "limit": limit})

        results = []
        for row in result.fetchall():
            confidence = float(row.confidence or 0)
            distance = 1.0 - confidence

            results.append(
                {
                    "id": str(row.id),
                    "name": row.name,
                    "category_id": str(row.category_id) if row.category_id else None,
                    "brand": row.brand,
                    "price": float(row.price) if row.price else 0.0,
                    "code": row.code,
                    "description": row.description,
                    "specification": row.specification,
                    "technical_details": row.technical_details,
                    "product_dimensions": row.product_dimensions,
                    "images": row.images or [],
                    "product_url": row.product_url,
                    "is_amazon_seller": row.is_amazon_seller,
                    "is_active": row.is_active,
                    "stock_quantity": row.stock_quantity,
                    "in_stock": row.in_stock,
                    "created_at": row.created_at,
                    "updated_at": row.updated_at,
                    "meta_title": row.meta_title,
                    "meta_description": row.meta_description,
                    "tags": row.tags or [],
                    "category_name": row.category_name,
                    "support": row.support,
                    "confidence": confidence,
                    "distance": distance,
                }
            )

        return results

    except Exception as e:
        logger.error(f"Error getting FBT recommendations for {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories/{category_id}/products", response_model=List[ProductResponse])
async def get_products_by_category(
    category_id: UUID,
    pagination: PaginationParams = Depends(get_pagination_params),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
):
    """Get products by category"""

    category = (
        db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    )
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )

    search_service = SearchService(db)
    filters = {"category": category.name}

    products, total, _ = await search_service.hybrid_search(
        filters=filters,
        sort_by=sort_by,
        sort_order=sort_order,
        page=pagination.page,
        size=pagination.size,
        use_vector=False,
    )

    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get product by ID"""

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

    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not available"
        )

    if current_user:
        try:
            behavior_service = UserBehaviorService(db)
            behavior_service.track_product_view(str(current_user.id), str(product_id))
        except Exception as e:
            logger.error(f"Error tracking product view: {str(e)}")

    return product


@router.get("/{product_id}/similar", response_model=List[ProductResponse])
async def get_similar_products(
    product_id: UUID, limit: int = Query(10, ge=1, le=20), db: Session = Depends(get_db)
):
    """Get products similar to the given product"""

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    similar_products = (
        db.query(Product)
        .filter(Product.category_id == product.category_id)
        .filter(Product.id != product_id)
        .filter(Product.is_active == True)
        .filter(Product.in_stock == True)
        .limit(limit)
        .all()
    )

    if len(similar_products) < limit and product.brand:
        brand_products = (
            db.query(Product)
            .filter(Product.brand == product.brand)
            .filter(Product.id != product_id)
            .filter(Product.is_active == True)
            .filter(Product.in_stock == True)
            .filter(Product.id.notin_([p.id for p in similar_products]))
            .limit(limit - len(similar_products))
            .all()
        )

        similar_products.extend(brand_products)

    return similar_products


@lru_cache(maxsize=50)
def get_product_categories(db: Session):
    """Get all active categories with caching"""
    return (
        db.query(ProductCategory)
        .filter(ProductCategory.is_active == True)
        .order_by(ProductCategory.display_order, ProductCategory.name)
        .all()
    )


@router.post("/upload-image", response_model=FileUploadResponse)
async def upload_product_image(
    file: UploadFile = File(...), db: Session = Depends(get_db)
):
    """Upload product image"""

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image"
        )

    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{file_extension}' not allowed",
        )

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE} bytes",
        )

    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(settings.UPLOAD_FOLDER, unique_filename)

    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        public_url = f"/static/uploads/{unique_filename}"

        return FileUploadResponse(
            filename=unique_filename,
            url=public_url,
            size=len(content),
            content_type=file.content_type,
        )

    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving file",
        )


@router.post("/search/{search_id}/click")
async def log_search_click(
    search_id: UUID, product_id: UUID, position: int, db: Session = Depends(get_db)
):
    """Log when user clicks on a search result"""

    search_service = SearchService(db)
    search_service.log_search_click(str(search_id), str(product_id), position)

    return MessageResponse(message="Click logged successfully")
