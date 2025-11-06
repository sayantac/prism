import logging
from typing import List, Optional

from app.core.config import get_settings
from app.models import Product

settings = get_settings()
logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        pass

    async def generate_product_embedding(
        self, product: Product, language: str = "en"
    ) -> Optional[List[float]]:
        try:
            text_content = self._create_product_text(product)
            # ye baad m krunga
            mock_embedding = [0.1] * 1536
            logger.info(f"Generated mock embedding for product {product.id}")
            return mock_embedding

        except Exception as e:
            logger.error(
                f"Error generating embedding for product {product.id}: {str(e)}"
            )
            return None

    def _create_product_text(self, product: Product) -> str:
        """Create text representation of product for embedding"""
        text_parts = []

        if product.name:
            text_parts.append(product.name)

        if product.brand:
            text_parts.append(f"Brand: {product.brand}")

        if product.description:
            text_parts.append(product.description)

        if product.specification:
            text_parts.append(product.specification)

        if product.technical_details:
            text_parts.append(product.technical_details)

        if product.category and hasattr(product.category, "name"):
            text_parts.append(f"Category: {product.category.name}")

        return " ".join(text_parts)
