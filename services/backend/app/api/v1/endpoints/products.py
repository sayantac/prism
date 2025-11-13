from datetime import datetime
import logging
import os
import uuid
from functools import lru_cache
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
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
    sort_by: str = Query("created_at", pattern="^(name|price|created_at|popularity)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
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
            .filter(ProductCategory.is_active, ProductCategory.parent_id.is_(None))
            .order_by(ProductCategory.sort_order, ProductCategory.name)
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
                "sort_order": cat.sort_order,
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
    from app.services.recommendation_service import RecommendationService
        
    rec_service = RecommendationService(db)
    trending = await rec_service.get_trending_products(limit)
        
    return trending


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


@router.get("/recommendations/new-arrivals", response_model=List[ProductResponse])
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


@router.get("/recommendations/customers-who-bought-also-bought", response_model=List[ProductResponse])
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




@router.get("/new-arrivals", response_model=List[ProductResponse])
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
                Product.is_active,
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
            recommendations_dict = [
                ProductResponse.from_orm(product) for product in recommendations
            ]
            return {
                "recommendations": recommendations_dict,
                "source": "trending",
                "ml_models_used": ["vector_similarity"],
            }
        
        # Get ML-based user recommendations
        recommendations = await rec_service.get_user_recommendations(
            user_id=str(current_user.id),
            limit=limit
        )
        # recommendations_dict = [
        #     ProductResponse.from_orm(product) for product in recommendations
        # ]
        
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
            # recommendations_dict = [
            #     ProductResponse.from_orm(product) for product in recommendations
            # ]
            return {
                "recommendations": recommendations,
                "source": "fallback_trending",
                "ml_models_used": [],
            }
        except Exception as fallback_error:
            logger.error(f"Fallback error: {fallback_error}")
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
        fbt_products = await rec_service.get_fbt_recommendations(
            product_id=product_id,
            limit=limit
        )
        
        return fbt_products

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting FBT recommendations for {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/collaborative")
async def get_collaborative_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Get collaborative filtering (ALS) recommendations for the user.

    Uses user-user and item-item collaborative filtering based on purchase patterns.
    """
    try:
        from app.services.recommendation_service import RecommendationService
        from app.services.ml_engine_service import MLEngineService

        if not current_user:
            # Anonymous users get trending products
            rec_service = RecommendationService(db)
            trending = await rec_service.get_trending_products(limit=limit)
            return trending

        user_id = str(current_user.id)

        # Get ML engine with collaborative filtering model
        ml_engine = MLEngineService(db=db)
        cf_model = ml_engine.active_models.get("als")

        if not cf_model:
            logger.warning("ALS model not available, falling back to trending")
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        # Get collaborative filtering recommendations
        from app.services.ml.als_model_service import ALSModelService
        als_service = ALSModelService()
        product_ids = als_service.get_recommendations(
            model_data=cf_model,
            user_id=current_user.id,
            n_recommendations=limit
        )

        # Enrich with product data
        recommendations = []
        for product_id in product_ids:
            product = db.query(Product).filter(
                Product.id == product_id,
                Product.is_active
            ).first()

            if product:
                    from app.utils import product_to_json
                    recommendations.append({
                        "product_id": str(product.id),
                        "product": product_to_json(product),
                        "score": 0.8,  # ALS doesn't return scores directly
                        "algorithm": "collaborative_filtering",
                        "reason": "Recommended based on users with similar purchase patterns"
                    })

        # Add explanations
        rec_service = RecommendationService(db)
        recommendations = rec_service.explainability_service.enhance_recommendations_with_explanations(
            user_id=user_id,
            recommendations=recommendations,
            segment_name=None
        )

        return recommendations

    except Exception as e:
        logger.error(f"Error getting collaborative recommendations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/content-based" )
async def get_content_based_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Get content-based filtering recommendations.

    Recommends products similar to those the user has purchased before,
    based on product features and embeddings.
    """
    try:
        from app.services.recommendation_service import RecommendationService
        from app.services.ml_engine_service import MLEngineService
        from sqlalchemy import text

        if not current_user:
            # Anonymous users get trending products
            rec_service = RecommendationService(db)
            trending = await rec_service.get_trending_products(limit=limit)
            return trending

        user_id = str(current_user.id)

        # Get user's purchase history: group by product_id and order by most recent order date
        query = text("""
            SELECT oi.product_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = :user_id
                AND o.status NOT IN ('cancelled', 'pending')
            GROUP BY oi.product_id
            ORDER BY MAX(o.created_at) DESC
            LIMIT 5
        """)

        results = db.execute(query, {"user_id": current_user.id}).fetchall()
        purchased_product_ids = [str(r.product_id) for r in results]

        if not purchased_product_ids:
            # No purchase history, return trending
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        # Get content-based model
        ml_engine = MLEngineService(db=db)
        content_model = ml_engine.active_models.get("content")

        if not content_model:
            logger.warning("Content model not available")
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        # Get similar products based on purchase history
        from app.services.ml.content_model_service import ContentModelService
        content_service = ContentModelService()
        product_ids = content_service.get_similar_products(
            model_data=content_model,
            product_ids=purchased_product_ids,
            n_recommendations=limit
        )

        # Enrich with product data
        recommendations = []
        for i, product_id in enumerate(product_ids):
            product = db.query(Product).filter(
                Product.id == product_id,
                Product.is_active
            ).first()

            if product:
                score = 1.0 - (i / len(product_ids)) if product_ids else 0.5
                recommendations.append({
                    "product_id": str(product.id),
                    "product": product,
                    "score": round(score, 4),
                    "algorithm": "content_based",
                    "reason": "Similar to products you've purchased"
                })

        # Add explanations
        rec_service = RecommendationService(db)
        recommendations = rec_service.explainability_service.enhance_recommendations_with_explanations(
            user_id=user_id,
            recommendations=recommendations,
            segment_name=None
        )

        return recommendations

    except Exception as e:
        logger.error(f"Error getting content-based recommendations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/hybrid"  )
async def get_hybrid_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    cf_weight: float = Query(default=0.5, ge=0.0, le=1.0),
    content_weight: float = Query(default=0.3, ge=0.0, le=1.0),
    trending_weight: float = Query(default=0.2, ge=0.0, le=1.0),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Get hybrid recommendations combining multiple algorithms.

    Blends collaborative filtering, content-based, and trending signals
    with configurable weights for optimal diversity and accuracy.

    Parameters:
    - cf_weight: Weight for collaborative filtering (0-1)
    - content_weight: Weight for content-based filtering (0-1)
    - trending_weight: Weight for trending items (0-1)

    Weights will be automatically normalized to sum to 1.0.
    """
    try:
        from app.services.ml.hybrid_recommender_service import HybridRecommenderService
        from app.services.ml_engine_service import MLEngineService

        if not current_user:
            # Anonymous users get trending products
            from app.services.recommendation_service import RecommendationService
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        user_id = current_user.id

        # Get ML models
        ml_engine = MLEngineService(db=db)
        cf_model = ml_engine.active_models.get("als")
        content_model = ml_engine.active_models.get("content")

        # Get hybrid recommendations
        hybrid_service = HybridRecommenderService(db=db)
        hybrid_recs = hybrid_service.get_recommendations(
            user_id=user_id,
            cf_model=cf_model,
            content_model=content_model,
            cf_weight=cf_weight,
            content_weight=content_weight,
            trending_weight=trending_weight,
            n_recommendations=limit
        )

        # Enrich with product data
        recommendations = []
        for rec in hybrid_recs:
            product = db.query(Product).filter(
                Product.id == rec["product_id"],
                Product.is_active
            ).first()

            if product:
                    from app.utils import product_to_json
                    recommendations.append({
                        "product_id": str(product.id),
                        "product": product_to_json(product),
                        "score": rec["score"],
                        "cf_score": rec.get("cf_score", 0.0),
                        "content_score": rec.get("content_score", 0.0),
                        "trending_score": rec.get("trending_score", 0.0),
                        "algorithm": "hybrid",
                        "reason": f"Combined score from multiple algorithms (CF: {cf_weight:.1f}, Content: {content_weight:.1f}, Trending: {trending_weight:.1f})"
                    })

        # Add explanations
        from app.services.recommendation_service import RecommendationService
        rec_service = RecommendationService(db)
        recommendations = rec_service.explainability_service.enhance_recommendations_with_explanations(
            user_id=str(user_id),
            recommendations=recommendations,
            segment_name=None
        )

        return recommendations

    except Exception as e:
        logger.error(f"Error getting hybrid recommendations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/segment-based")
async def get_segment_based_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Get recommendations based on user's behavioral segment.

    Uses K-Means clustering to identify similar users and recommends
    products popular within the user's segment.
    """
    try:
        from app.services.recommendation_service import RecommendationService
        from app.models.ml_models import UserSegmentMembership
        from sqlalchemy import text

        if not current_user:
            # Anonymous users get trending products
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        user_id = current_user.id

        # Get user's segment membership
        segment_membership = db.query(UserSegmentMembership).filter(
            UserSegmentMembership.user_id == user_id,
            UserSegmentMembership.is_active
        ).first()

        if not segment_membership:
            # User not in any segment, return trending
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        # Get popular products within the user's segment
        query = text("""
            WITH segment_users AS (
                SELECT user_id
                FROM user_segment_memberships
                WHERE segment_id = :segment_id
                    AND is_active = true
            ),
            segment_purchases AS (
                SELECT oi.product_id, COUNT(*) as purchase_count
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN segment_users su ON o.user_id = su.user_id
                WHERE o.status NOT IN ('cancelled', 'pending')
                    AND o.user_id != :current_user_id
                GROUP BY oi.product_id
            )
            SELECT sp.product_id, sp.purchase_count
            FROM segment_purchases sp
            JOIN products p ON sp.product_id = p.id
            WHERE p.is_active = true
                AND p.stock_quantity > 0
            ORDER BY sp.purchase_count DESC
            LIMIT :limit
        """)

        results = db.execute(query, {
            "segment_id": segment_membership.segment_id,
            "current_user_id": user_id,
            "limit": limit
        }).fetchall()

        # Enrich with product data
        recommendations = []
        for i, row in enumerate(results):
            product = db.query(Product).filter(Product.id == row.product_id).first()
            if product:
                score = 1.0 - (i / len(results)) if results else 0.5
                recommendations.append({
                    "product_id": str(product.id),
                    "product": product,
                    "score": round(score, 4),
                    "algorithm": "segment_based",
                    "reason": "Popular among users in your segment",
                    "segment_id": str(segment_membership.segment_id),
                    "popularity": row.purchase_count
                })

        # Add explanations
        rec_service = RecommendationService(db)
        recommendations = rec_service.explainability_service.enhance_recommendations_with_explanations(
            user_id=str(user_id),
            recommendations=recommendations,
            segment_name=None
        )

        return recommendations

    except Exception as e:
        logger.error(f"Error getting segment-based recommendations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/reorder-predictions")
async def get_reorder_predictions(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Get reorder predictions ("Buy Again") for the user.

    Uses LightGBM model to predict which previously purchased products
    the user is most likely to reorder based on purchase patterns.
    """
    try:
        from app.services.recommendation_service import RecommendationService
        from app.services.ml_engine_service import MLEngineService
        from sqlalchemy import text

        if not current_user:
            # Anonymous users get trending products
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        user_id = current_user.id

        # Get user's purchase history
        query = text("""
            SELECT
                oi.product_id,
                COUNT(*) as order_count,
                MAX(o.created_at) as last_order_date,
                AVG(oi.quantity) as avg_quantity
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = :user_id
                AND o.status NOT IN ('cancelled', 'pending')
            GROUP BY oi.product_id
            HAVING COUNT(*) >= 2
            ORDER BY MAX(o.created_at) DESC
            LIMIT :limit
        """)

        results = db.execute(query, {"user_id": user_id, "limit": limit * 2}).fetchall()

        if not results:
            # No repeat purchases, return trending
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        # Get ML engine with LightGBM model (if available)
        ml_engine = MLEngineService(db=db)
    # lgbm_model = ml_engine.active_models.get("lightgbm")  # Unused variable removed

        recommendations = []
        for i, row in enumerate(results[:limit]):
            product = db.query(Product).filter(
                Product.id == row.product_id,
                Product.is_active
            ).first()

            if product:
                # Calculate reorder score based on frequency and recency
                days_since_last = (datetime.utcnow() - row.last_order_date).days
                recency_score = max(0, 1 - (days_since_last / 90))  # 90 days decay
                frequency_score = min(1.0, row.order_count / 10)  # Cap at 10 orders
                score = (recency_score * 0.6) + (frequency_score * 0.4)

                recommendations.append({
                    "product_id": str(product.id),
                    "product": product,
                    "score": round(score, 4),
                    "algorithm": "reorder_prediction",
                    "reason": f"You've ordered this {row.order_count} times",
                    "order_count": row.order_count,
                    "last_order_days_ago": days_since_last,
                    "avg_quantity": float(row.avg_quantity)
                })

        # Add explanations
        rec_service = RecommendationService(db)
        recommendations = rec_service.explainability_service.enhance_recommendations_with_explanations(
            user_id=str(user_id),
            recommendations=recommendations,
            segment_name=None
        )

        return recommendations

    except Exception as e:
        logger.error(f"Error getting reorder predictions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/personalized-trending")
async def get_personalized_trending(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Get personalized trending recommendations.

    Returns trending products filtered by the user's preferred categories
    and purchase history for a more relevant trending experience.
    """
    try:
        from app.services.recommendation_service import RecommendationService
        from sqlalchemy import text
        from uuid import UUID as _UUID

        if not current_user:
            # Anonymous users get general trending
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        user_id = current_user.id

        # Get user's preferred categories based on purchase history
        category_query = text("""
            SELECT p.category_id, COUNT(*) as purchase_count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = :user_id
                AND o.status NOT IN ('cancelled', 'pending')
            GROUP BY p.category_id
            ORDER BY COUNT(*) DESC
            LIMIT 3
        """)

        category_results = db.execute(category_query, {"user_id": user_id}).fetchall()
        # Convert category ids to UUID objects only if they are not already UUIDs
        preferred_category_ids = [str(r.category_id) if not isinstance(r.category_id, str) else r.category_id for r in category_results if r.category_id]

        # Get trending products in user's preferred categories
        if preferred_category_ids:
            trending_query = text("""
                WITH product_popularity AS (
                    SELECT
                        p.id as product_id,
                        COUNT(DISTINCT oi.order_id) as order_count,
                        COUNT(DISTINCT CASE
                            WHEN o.created_at >= NOW() - INTERVAL '7 days'
                            THEN oi.order_id
                        END) as recent_orders
                    FROM products p
                    LEFT JOIN order_items oi ON p.id = oi.product_id
                    LEFT JOIN orders o ON oi.order_id = o.id
                        AND o.status NOT IN ('cancelled', 'pending')
                    WHERE p.is_active = true
                        AND p.stock_quantity > 0
                        AND p.category_id = ANY(ARRAY[:category_ids]::uuid[])
                    GROUP BY p.id
                    HAVING COUNT(DISTINCT oi.order_id) > 0
                )
                SELECT
                    product_id,
                    (recent_orders * 2.0 + order_count) / 3.0 as popularity_score
                FROM product_popularity
                ORDER BY popularity_score DESC
                LIMIT :limit
            """)

            results = db.execute(trending_query, {
                "category_ids": preferred_category_ids,
                "limit": limit
            }).fetchall()
        else:
            # No purchase history, return general trending
            rec_service = RecommendationService(db)
            return await rec_service.get_trending_products(limit=limit)

        # Enrich with product data
        recommendations = []
        max_score = max([float(r.popularity_score) for r in results]) if results else 1.0

        from app.utils import product_to_json
        for row in results:
            product = db.query(Product).filter(Product.id == row.product_id).first()
            if product:
                score = float(row.popularity_score) / max_score if max_score > 0 else 0.5
                recommendations.append({
                    "product_id": str(product.id),
                    "product": product_to_json(product),
                    "score": round(score, 4),
                    "algorithm": "personalized_trending",
                    "reason": "Trending in categories you love"
                })

        # Add explanations
        rec_service = RecommendationService(db)
        recommendations = rec_service.explainability_service.enhance_recommendations_with_explanations(
            user_id=str(user_id),
            recommendations=recommendations,
            segment_name=None
        )

        return recommendations

    except Exception as e:
        logger.error(f"Error getting personalized trending: {e}", exc_info=True)
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



@router.get("/{product_id}/similar", response_model=List[ProductResponse])
async def get_similar_products(
    product_id: UUID, limit: int = Query(10, ge=1, le=20), db: Session = Depends(get_db)
):
    """
    Get products similar to the given product using ML-based content similarity.

    Uses embeddings and TF-IDF to find semantically similar products based on
    product features, descriptions, and attributes.
    """
    try:
        from app.services.ml_engine_service import MLEngineService
        from app.services.ml.content_model_service import ContentModelService

        # Verify product exists
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
            )

        # Try ML-based similarity first
        ml_engine = MLEngineService(db=db)
        content_model = ml_engine.active_models.get("content")

        similar_products = []

        if content_model:
            # Use ML content-based model for similarity
            content_service = ContentModelService()
            similar_product_ids = content_service.get_similar_products(
                model_data=content_model,
                product_ids=[product_id],
                n_recommendations=limit
            )

            # Get product objects
            for pid in similar_product_ids:
                similar_product = db.query(Product).filter(
                    Product.id == pid,
                    Product.is_active,
                    Product.in_stock
                ).first()
                if similar_product:
                    similar_products.append(similar_product)

        # Fallback to category/brand similarity if ML model not available or insufficient results
        if len(similar_products) < limit:
            logger.info(f"Using fallback similarity for product {product_id}")

            category_products = (
                db.query(Product)
                .filter(Product.category_id == product.category_id)
                .filter(Product.id != product_id)
                .filter(Product.is_active)
                .filter(Product.in_stock)
                .filter(Product.id.notin_([p.id for p in similar_products]))
                .limit(limit - len(similar_products))
                .all()
            )
            similar_products.extend(category_products)

            # Add brand-based if still not enough
            if len(similar_products) < limit and product.brand:
                brand_products = (
                    db.query(Product)
                    .filter(Product.brand == product.brand)
                    .filter(Product.id != product_id)
                    .filter(Product.is_active)
                    .filter(Product.in_stock)
                    .filter(Product.id.notin_([p.id for p in similar_products]))
                    .limit(limit - len(similar_products))
                    .all()
                )
                similar_products.extend(brand_products)

        return similar_products[:limit]

    except Exception as e:
        logger.error(f"Error getting similar products: {e}", exc_info=True)
        # Fallback to simple category-based similarity on error
        similar_products = (
            db.query(Product)
            .filter(Product.category_id == product.category_id)
            .filter(Product.id != product_id)
            .filter(Product.is_active)
            .filter(Product.in_stock)
            .limit(limit)
            .all()
        )
        return similar_products


@lru_cache(maxsize=50)
def get_product_categories(db: Session):
    """Get all active categories with caching"""
    return (
        db.query(ProductCategory)
        .filter(ProductCategory.is_active)
        .order_by(ProductCategory.sort_order, ProductCategory.name)
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


