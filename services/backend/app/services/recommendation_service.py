from functools import lru_cache
from typing import List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models import Product, SearchAnalytics, User
from app.services.search_service import SearchService


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db
        self.search_service = SearchService(db)

    @lru_cache(maxsize=50)
    def get_user_interests(self, user_id: str) -> List[str]:
        """Get user interests with caching"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if user and user.interests:
            return user.interests
        return []

    async def get_similar_products(
        self, product_id: str, limit: int = 10
    ) -> List[Product]:
        """Get products similar to given product using vector similarity"""
        product = self.db.query(Product).filter(Product.id == product_id).first()

        if not product or product.embedding is None:
            return []

        # Use pgvector's cosine_distance method for vector similarity
        similar_products = (
            self.db.query(Product)
            .filter(Product.id != product_id)
            .filter(Product.is_active.is_(True))
            .filter(Product.is_embedding_generated.is_(True))
            .filter(Product.embedding.isnot(None))
            .order_by(Product.embedding.cosine_distance(product.embedding))
            .limit(limit)
            .all()
        )

        return similar_products

    async def get_user_recommendations(
        self, user_id: str, limit: int = 20
    ) -> List[Product]:
        """Get personalized recommendations for user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return await self.get_trending_products(limit)

        recommendations = []

        if user.interests:
            for interest in user.interests[:3]:
                products = await self.search_service.hybrid_search(
                    search_term=interest, size=5, use_vector=True
                )
                recommendations.extend(products[0])

        if user.viewed_products:
            recent_product_id = user.viewed_products[-1]
            similar = await self.get_similar_products(str(recent_product_id), 5)
            recommendations.extend(similar)

        recent_searches = (
            self.db.query(SearchAnalytics)
            .filter(SearchAnalytics.user_id == user_id)
            .order_by(desc(SearchAnalytics.created_at))
            .limit(3)
            .all()
        )

        for search in recent_searches:
            if search.query:
                products = await self.search_service.hybrid_search(
                    search_term=search.query, size=3, use_vector=True
                )
                recommendations.extend(products[0])

        seen_ids = set()
        unique_recommendations = []

        for product in recommendations:
            if product.id not in seen_ids and product.is_active:
                seen_ids.add(product.id)
                unique_recommendations.append(product)

                if len(unique_recommendations) >= limit:
                    break

        if len(unique_recommendations) < limit:
            trending = await self.get_trending_products(
                limit - len(unique_recommendations)
            )
            for product in trending:
                if product.id not in seen_ids:
                    unique_recommendations.append(product)

        return unique_recommendations[:limit]

    async def get_trending_products(self, limit: int = 20) -> List[Product]:
        """Get trending products based on recent activity"""

        trending = (
            self.db.query(Product)
            .filter(Product.is_active == True)
            .filter(Product.in_stock == True)
            .order_by(desc(Product.created_at))
            .limit(limit)
            .all()
        )

        return trending

    async def get_category_recommendations(
        self,
        category_id: str,
        exclude_product_id: Optional[str] = None,
        limit: int = 10,
    ) -> List[Product]:
        """Get recommended products from same category"""
        query = (
            self.db.query(Product)
            .filter(Product.category_id == category_id)
            .filter(Product.is_active == True)
            .filter(Product.in_stock == True)
        )

        if exclude_product_id:
            query = query.filter(Product.id != exclude_product_id)

        query = query.order_by(
            desc(Product.config.has(is_sponsored=True)),
            desc(Product.config.has(featured=True)),
            desc(Product.created_at),
        )

        return query.limit(limit).all()
