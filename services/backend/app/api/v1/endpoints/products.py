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
    session_id: Optional[str] = Query(None, description="Session ID for analytics"),
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
    db: Session = Depends(get_db),
):
    """Get popular products based on recent purchases"""
    try:
        from app.services.recommendation_service import RecommendationService
        
        rec_service = RecommendationService(db)
        trending = await rec_service.get_trending_products(limit)
        
        return trending

    except Exception as e:
        logger.error(f"Error getting popular products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/customers-who-bought-also-bought")
async def get_customers_who_bought_also_bought(
    product_id: str = Query(..., description="Product ID to find related products"),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Get products similar to the specified product using ML models"""
    try:
        from app.services.recommendation_service import RecommendationService
        
        # Verify product exists
        product = db.query(Product).filter(Product.id == uuid.UUID(product_id)).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Use ML-based recommendation service for product similarity
        rec_service = RecommendationService(db)
        similar_products = await rec_service.get_similar_products(
            product_id=product_id,
            limit=limit
        )
        
        return similar_products

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations for {product_id}: {e}")
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
    db: Session = Depends(get_db),
):
    """Get new arrivals within specified time period"""
    try:
        # Query for recently added products
        from datetime import datetime, timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        new_products = (
            db.query(Product)
            .filter(
                Product.is_active == True,
                Product.created_at >= cutoff_date
            )
            .order_by(Product.created_at.desc())
            .limit(limit)
            .all()
        )
        
        return new_products

    except Exception as e:
        logger.error(f"Error getting new arrivals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations")
async def get_user_recommendations(
    limit: int = Query(default=10, ge=1, le=15),
    use_ml: bool = Query(default=True, description="Use ML models if available"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get personalized recommendations for a user using ML models"""
    try:
        from app.services.recommendation_service import RecommendationService
        
        rec_service = RecommendationService(db)
        
        if not current_user:
            # Return trending recommendations for anonymous users
            recommendations = await rec_service.get_trending_products(limit=limit)
            return {
                "recommendations": recommendations,
                "source": "trending",
                "ml_models_used": ["vector_similarity"],
            }
        
        # Get ML-based user recommendations
        recommendations = await rec_service.get_user_recommendations(
            user_id=str(current_user.id),
            limit=limit
        )
        
        return {
            "recommendations": recommendations,
            "source": "ml_based",
            "ml_models_used": ["vector_similarity", "content_based"],
        }

    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        # Fallback to trending products
        try:
            from app.services.recommendation_service import RecommendationService
            rec_service = RecommendationService(db)
            recommendations = await rec_service.get_trending_products(limit=limit)
            return {
                "recommendations": recommendations,
                "source": "fallback_trending",
                "ml_models_used": [],
            }
        except:
            raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


@router.get("/fbt-recommendations/{product_id}")
async def get_fbt_recommendations(
    product_id: str,
    limit: int = Query(default=4, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Get Frequently Bought Together (FBT) recommendations using ML models"""
    try:
        from app.services.recommendation_service import RecommendationService
        
        # Verify product exists
        product = db.query(Product).filter(Product.id == uuid.UUID(product_id)).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Use ML-based recommendation service for similar products
        rec_service = RecommendationService(db)
        fbt_products = await rec_service.get_similar_products(
            product_id=product_id,
            limit=limit
        )
        
        return fbt_products

    except HTTPException:
        raise
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
