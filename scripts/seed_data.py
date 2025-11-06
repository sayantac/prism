#!/usr/bin/env python3
"""
Data Seeding Script for E-Commerce Recommendation System

This script loads sample data from CSV files into the database:
- Categories from categories-data-from-db.csv
- Products from product_data_120.csv

Usage:
    # From host machine:
    python scripts/seed_data.py
    
    # From Docker container:
    docker-compose exec backend python scripts/seed_data.py
"""

import csv
import logging
import os
import sys
from pathlib import Path
from uuid import UUID

# Detect if running in Docker or from host
if os.path.exists("/app/app"):
    # Running inside Docker container
    sys.path.insert(0, "/app")
    DATA_DIR = Path("/app/data")
else:
    # Running from host machine
    sys.path.insert(0, str(Path(__file__).parent.parent / "services" / "backend"))
    DATA_DIR = Path(__file__).parent.parent / "services" / "backend" / "data"

from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models import Base, Product, ProductCategory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_categories(db: Session, csv_path: str) -> dict:
    """Load categories from CSV file"""
    logger.info(f"Loading categories from {csv_path}")
    
    category_map = {}
    categories_to_create = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            category_id = UUID(row['id'])
            parent_id = UUID(row['parent_id']) if row['parent_id'] and row['parent_id'] != 'NULL' else None
            category_map[str(category_id)] = {
                'id': category_id,
                'name': row['name'],
                'description': row['description'] if row['description'] != 'NULL' else None,
                'parent_id': parent_id,
                'is_active': row['is_active'] == 'True',
                'display_order': int(row['display_order']) if row['display_order'] else 0,
            }
            categories_to_create.append(category_map[str(category_id)])
    
    # Create categories level by level (handle nested hierarchies)
    logger.info("Creating categories in hierarchical order...")
    created_ids = set()
    max_passes = 10  # Safety limit to prevent infinite loops
    pass_num = 0
    
    while len(created_ids) < len(categories_to_create) and pass_num < max_passes:
        pass_num += 1
        created_this_pass = 0
        
        for cat_data in categories_to_create:
            cat_id = str(cat_data['id'])
            
            # Skip if already created
            if cat_id in created_ids:
                continue
            
            # Check if this category can be created (parent exists or no parent)
            parent_id = str(cat_data['parent_id']) if cat_data['parent_id'] else None
            can_create = parent_id is None or parent_id in created_ids
            
            if can_create:
                # Check if category exists by ID OR by name+parent combination
                existing = db.query(ProductCategory).filter(
                    (ProductCategory.id == cat_data['id']) |
                    ((ProductCategory.name == cat_data['name']) & 
                     (ProductCategory.parent_id == cat_data['parent_id']))
                ).first()
                
                if not existing:
                    category = ProductCategory(**cat_data)
                    db.add(category)
                    db.flush()
                    created_ids.add(cat_id)
                    created_this_pass += 1
                else:
                    # Mark as created even if it existed to allow children to be created
                    created_ids.add(cat_id)
        
        logger.info(f"Pass {pass_num}: Created {created_this_pass} categories")
        
        if created_this_pass == 0:
            break  # No progress made, exit
    
    db.commit()
    logger.info(f"Created {len(created_ids)} categories total")
    logger.info(f"✓ Loaded {len(categories_to_create)} categories")
    
    return category_map


def parse_price(price_str: str) -> float:
    """Parse price string like '$4.97' to float"""
    if not price_str or price_str == 'NULL':
        return 0.0
    return float(price_str.replace('$', '').replace(',', ''))


def load_products(db: Session, csv_path: str, category_map: dict) -> None:
    """Load products from CSV file"""
    logger.info(f"Loading products from {csv_path}")
    
    products_created = 0
    products_skipped = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            product_id = UUID(row['id'])
            
            # Check if product already exists
            existing = db.query(Product).filter(Product.id == product_id).first()
            if existing:
                products_skipped += 1
                continue
            
            # Parse category path (e.g., "Baby Products | Gifts | Keepsakes")
            category_path = row['category']
            category_name = category_path.split('|')[-1].strip() if category_path else None
            
            # Find matching category by name
            category_id = None
            if category_name:
                matching_category = db.query(ProductCategory).filter(
                    ProductCategory.name == category_name
                ).first()
                if matching_category:
                    category_id = matching_category.id
            
            # Parse images
            images = []
            if row['images']:
                images = [img.strip() for img in row['images'].split('|') if img.strip()]
            
            # Create product
            product = Product(
                id=product_id,
                name=row['name'],
                description=row['description'] if row['description'] else None,
                price=parse_price(row['price']),
                category_id=category_id,
                is_active=True,
                stock_quantity=100,  # Default stock
                images=images[:5] if images else [],  # Limit to 5 images
            )
            
            db.add(product)
            products_created += 1
            
            # Commit in batches
            if products_created % 50 == 0:
                db.commit()
                logger.info(f"  Created {products_created} products...")
    
    db.commit()
    logger.info(f"✓ Loaded {products_created} products (skipped {products_skipped} existing)")


def seed_database():
    """Main seeding function"""
    logger.info("=" * 60)
    logger.info("Starting database seeding...")
    logger.info("=" * 60)
    
    # Paths to CSV files (set at module level based on environment)
    categories_csv = DATA_DIR / "categories-data-from-db.csv"
    products_csv = DATA_DIR / "product_data_120.csv"
    
    # Check if files exist
    if not categories_csv.exists():
        logger.error(f"Categories file not found: {categories_csv}")
        logger.error(f"DATA_DIR: {DATA_DIR}")
        return
    
    if not products_csv.exists():
        logger.error(f"Products file not found: {products_csv}")
        logger.error(f"DATA_DIR: {DATA_DIR}")
        return
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Load categories first (products reference categories)
        category_map = load_categories(db, str(categories_csv))
        
        # Load products
        load_products(db, str(products_csv), category_map)
        
        logger.info("=" * 60)
        logger.info("✓ Database seeding completed successfully!")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
