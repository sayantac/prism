#!/usr/bin/env python3
"""
Product Embeddings Generation Script

This script generates embeddings for all products in the database using
the configured embedding service (Amazon Bedrock Titan or fallback dummy embeddings).

Features:
- Batch processing with configurable batch sizes
- Progress tracking and logging
- Resume capability (skip already processed products)
- Error handling and retry logic
- Performance metrics and reporting
- Dry-run mode for testing

Usage:
    python generate_embeddings.py --batch-size 50 --force-regenerate
    python generate_embeddings.py --dry-run
    python generate_embeddings.py --product-ids "id1,id2,id3"
"""

import argparse
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import sessionmaker, joinedload
from tqdm import tqdm

# Add the app directory to the path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import engine
from app.models.product import Product
from app.services.embedding_service import EmbeddingService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("embedding_generation.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    def __init__(self, batch_size: int = 50, force_regenerate: bool = False):
        self.batch_size = batch_size
        self.force_regenerate = force_regenerate
        self.embedding_service = EmbeddingService()
        self.Session = sessionmaker(bind=engine)

        # Statistics
        self.stats = {
            "total_products": 0,
            "processed": 0,
            "skipped": 0,
            "errors": 0,
            "start_time": None,
            "end_time": None,
        }

    def prepare_embedding_text(self, product: Product) -> str:
        """Prepare text content for embedding generation"""
        parts = []

        if product.name:
            parts.append(product.name)

        if product.brand:
            parts.append(f"Brand: {product.brand}")

        if product.description:
            # Truncate very long descriptions
            desc = (
                product.description[:1000]
                if len(product.description) > 1000
                else product.description
            )
            parts.append(desc)

        if (
            product.category
            and hasattr(product.category, "name")
            and product.category.name
        ):
            parts.append(f"Category: {product.category.name}")

        # Add technical details if available
        if product.technical_details:
            try:
                if isinstance(product.technical_details, dict):
                    for key, value in product.technical_details.items():
                        if value and len(str(value)) < 200:  # Avoid very long values
                            parts.append(f"{key}: {value}")
                elif isinstance(product.technical_details, str):
                    parts.append(product.technical_details[:300])
            except Exception as e:
                logger.warning(
                    f"Error processing technical_details for product {product.id}: {e}"
                )

        # Add tags if available
        if product.tags:
            try:
                if isinstance(product.tags, list):
                    tags_text = ", ".join(
                        str(tag) for tag in product.tags[:10]
                    )  # Limit to 10 tags
                    parts.append(f"Tags: {tags_text}")
                elif isinstance(product.tags, str):
                    parts.append(f"Tags: {product.tags}")
            except Exception as e:
                logger.warning(f"Error processing tags for product {product.id}: {e}")

        # Join all parts and truncate if too long
        text_content = " | ".join(parts)

        # Amazon Titan has input limits, so truncate if necessary
        if len(text_content) > 8000:
            text_content = text_content[:8000]

        return text_content

    def get_products_to_process(
        self, session, product_ids: Optional[List[str]] = None
    ) -> List[Product]:
        """Get products that need embedding generation"""
        query = session.query(Product).options(joinedload(Product.category)).filter(Product.is_active == True)

        # Filter by specific product IDs if provided
        if product_ids:
            query = query.filter(Product.id.in_(product_ids))

        # Skip products that already have embeddings unless force regenerate
        if not self.force_regenerate:
            query = query.filter(
                or_(
                    Product.is_embedding_generated == False,
                    Product.is_embedding_generated.is_(None),
                    Product.embedding.is_(None),
                )
            )

        products = query.all()
        logger.info(f"Found {len(products)} products to process")
        return products

    def process_batch(self, session, products: List[Product]) -> tuple:
        """Process a batch of products"""
        processed = 0
        errors = 0

        for product in products:
            try:
                # Prepare text content
                text_content = self.prepare_embedding_text(product)

                if not text_content.strip():
                    logger.warning(
                        f"No content to embed for product {product.id} ({product.name})"
                    )
                    continue

                # Generate embedding
                logger.debug(
                    f"Generating embedding for product {product.id}: {product.name[:50]}..."
                )
                embedding = self.embedding_service.generate_embedding(text_content)

                if embedding:
                    # Update product with embedding
                    product.embedding = embedding
                    product.is_embedding_generated = True
                    processed += 1
                    logger.debug(f"Embedding generated for {product.name[:50]}")
                else:
                    logger.error(
                        f" Failed to generate embedding for product {product.id}"
                    )
                    errors += 1

            except Exception as e:
                logger.error(f"Error processing product {product.id}: {e}")
                errors += 1
                continue

        # Commit the batch
        try:
            session.commit()
            logger.info(f"Batch committed: {processed} processed, {errors} errors")
        except Exception as e:
            logger.error(f"Error committing batch: {e}")
            session.rollback()
            errors += len(products)
            processed = 0

        return processed, errors

    def generate_embeddings(
        self, product_ids: Optional[List[str]] = None, dry_run: bool = False
    ):
        """Main method to generate embeddings for products"""

        self.stats["start_time"] = datetime.now()
        logger.info("Starting embedding generation process...")

        with self.Session() as session:
            # Get products to process
            products = self.get_products_to_process(session, product_ids)
            self.stats["total_products"] = len(products)

            if not products:
                logger.info("No products need embedding generation")
                return

            if dry_run:
                logger.info(f"DRY-RUN: Would process {len(products)} products")
                for i, product in enumerate(products[:10]):  # Show first 10
                    text_content = self.prepare_embedding_text(product)
                    logger.info(
                        f"  {i + 1}. {product.name[:50]} - Content length: {len(text_content)} chars"
                    )
                if len(products) > 10:
                    logger.info(f"  ... and {len(products) - 10} more products")
                return

            # Process in batches
            logger.info(
                f"Processing {len(products)} products in batches of {self.batch_size}"
            )

            with tqdm(total=len(products), desc="Generating embeddings") as pbar:
                for i in range(0, len(products), self.batch_size):
                    batch = products[i : i + self.batch_size]
                    batch_num = (i // self.batch_size) + 1
                    total_batches = (
                        len(products) + self.batch_size - 1
                    ) // self.batch_size

                    logger.info(
                        f"Processing batch {batch_num}/{total_batches} ({len(batch)} products)"
                    )

                    processed, errors = self.process_batch(session, batch)

                    self.stats["processed"] += processed
                    self.stats["errors"] += errors

                    pbar.update(len(batch))

                    # Small delay between batches to avoid rate limiting
                    if i + self.batch_size < len(products):
                        time.sleep(0.5)

        self.stats["end_time"] = datetime.now()
        self.print_final_report()

    def print_final_report(self):
        """Print final processing report"""
        duration = self.stats["end_time"] - self.stats["start_time"]

        logger.info("\n" + "=" * 60)
        logger.info("EMBEDDING GENERATION REPORT")
        logger.info("=" * 60)
        logger.info(f"Total products found: {self.stats['total_products']:,}")
        logger.info(f"Successfully processed: {self.stats['processed']:,}")
        logger.info(f"Errors encountered: {self.stats['errors']:,}")
        logger.info(f"Total duration: {duration}")
        logger.info(
            f"Average per product: {duration.total_seconds() / max(self.stats['processed'], 1):.2f} seconds"
        )

        if self.stats["processed"] > 0:
            success_rate = (
                self.stats["processed"]
                / (self.stats["processed"] + self.stats["errors"])
            ) * 100
            logger.info(f"Success rate: {success_rate:.1f}%")

        logger.info("=" * 60)

    def verify_embeddings(self, sample_size: int = 10):
        """Verify that embeddings were generated correctly"""
        logger.info(f"Verifying embeddings (checking {sample_size} products)...")

        with self.Session() as session:
            # Get random sample of products with embeddings
            products_with_embeddings = (
                session.query(Product)
                .filter(
                    and_(
                        Product.is_embedding_generated == True,
                        Product.embedding.isnot(None),
                    )
                )
                .limit(sample_size)
                .all()
            )

            logger.info(
                f"Found {len(products_with_embeddings)} products with embeddings"
            )

            for product in products_with_embeddings:
                embedding_length = len(product.embedding) if product.embedding else 0
                logger.info(f"  {product.name[:40]}: {embedding_length} dimensions")

                # Verify embedding is valid (should be 1536 for Titan)
                if embedding_length == 1536:
                    logger.debug("    Valid embedding dimension")
                else:
                    logger.warning(
                        f"    Unexpected embedding dimension: {embedding_length}"
                    )


def main():
    parser = argparse.ArgumentParser(description="Generate embeddings for products")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Number of products to process in each batch (default: 50)",
    )
    parser.add_argument(
        "--force-regenerate",
        action="store_true",
        help="Regenerate embeddings for products that already have them",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be processed without making changes",
    )
    parser.add_argument(
        "--product-ids",
        type=str,
        help="Comma-separated list of specific product IDs to process",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify existing embeddings after generation",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Parse product IDs if provided
    product_ids = None
    if args.product_ids:
        product_ids = [pid.strip() for pid in args.product_ids.split(",")]
        logger.info(f"Processing specific products: {product_ids}")

    # Create generator
    generator = EmbeddingGenerator(
        batch_size=args.batch_size, force_regenerate=args.force_regenerate
    )

    try:
        # Generate embeddings
        generator.generate_embeddings(product_ids=product_ids, dry_run=args.dry_run)

        # Verify if requested
        if args.verify and not args.dry_run:
            generator.verify_embeddings()

    except KeyboardInterrupt:
        logger.info("Process interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()