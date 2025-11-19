from typing import Dict, Optional

from app.services.base_product_service import BaseProductService


class ProductService(BaseProductService):
    """Enhanced product service using base functionality"""

    def list_products_paginated(
        self,
        page: int = 1,
        size: int = 20,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        in_stock: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        search_term: Optional[str] = None,
    ) -> Dict:
        """Get paginated products with filters"""

        # Build base query
        query = self.build_product_query(include_category=True)

        # Apply filters
        query = self.apply_product_filters(
            query, category, brand, min_price, max_price, in_stock, search_term
        )

        # Apply sorting
        query = self.apply_sorting(query, sort_by, sort_order)

        # Get total count
        total = query.count()

        # Apply pagination
        offset = (page - 1) * size
        products = query.offset(offset).limit(size).all()

        pages = (total + size - 1) // size

        return {
            "items": products,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages,
        }


product_service = ProductService()
