#!/usr/bin/env python3
"""
Cleanup script to remove duplicate categories from the database.
Keeps the first occurrence of each name+parent combination.
"""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import func
from app.database import SessionLocal
from app.models.product import ProductCategory, Product
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def cleanup_duplicates():
    """Remove duplicate categories, keeping the first occurrence"""
    db = SessionLocal()
    
    try:
        # Find all categories grouped by name and parent_id
        categories = db.query(ProductCategory).order_by(ProductCategory.id).all()
        
        seen = {}  # (name, parent_id) -> first_category_id
        duplicates_to_delete = []
        products_to_update = {}  # old_cat_id -> new_cat_id
        
        for cat in categories:
            key = (cat.name, str(cat.parent_id) if cat.parent_id else None)
            
            if key in seen:
                # This is a duplicate
                logger.info(f"Found duplicate: {cat.name} (id: {cat.id}, parent: {cat.parent_id})")
                duplicates_to_delete.append(cat.id)
                products_to_update[cat.id] = seen[key]
            else:
                # First occurrence, keep this one
                seen[key] = cat.id
        
        logger.info(f"Found {len(duplicates_to_delete)} duplicate categories to remove")
        
        if not duplicates_to_delete:
            logger.info("No duplicates found!")
            return
        
        # Update products that reference duplicate categories
        updated_products = 0
        for old_id, new_id in products_to_update.items():
            result = db.query(Product).filter(Product.category_id == old_id).update(
                {Product.category_id: new_id}
            )
            updated_products += result
            logger.info(f"Updated {result} products from category {old_id} to {new_id}")
        
        db.commit()
        logger.info(f"Updated {updated_products} products total")
        
        # Update child categories that reference duplicate categories as parent
        updated_children = 0
        for old_id, new_id in products_to_update.items():
            result = db.query(ProductCategory).filter(
                ProductCategory.parent_id == old_id
            ).update({ProductCategory.parent_id: new_id})
            updated_children += result
            if result > 0:
                logger.info(f"Updated {result} child categories from parent {old_id} to {new_id}")
        
        db.commit()
        logger.info(f"Updated {updated_children} child categories total")
        
        # Delete duplicate categories
        deleted = 0
        for dup_id in duplicates_to_delete:
            db.query(ProductCategory).filter(ProductCategory.id == dup_id).delete()
            deleted += 1
        
        db.commit()
        logger.info(f"✓ Deleted {deleted} duplicate categories")
        
        # Show final stats
        total = db.query(func.count(ProductCategory.id)).scalar()
        logger.info(f"✓ Total categories remaining: {total}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error cleaning up duplicates: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Starting duplicate category cleanup...")
    cleanup_duplicates()
    logger.info("Cleanup complete!")
