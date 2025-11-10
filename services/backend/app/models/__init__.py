"""
SQLAlchemy models for the e-commerce recommendation system.

This package exports all models for easy importing throughout the application.

Models are organized by domain:
- base: Base declarative class
- user: User, Role, Permission
- product: Product, ProductCategory, ProductConfig
- cart: Cart, CartItem
- order: Order, OrderItem
- analytics: SearchAnalytics, AuditLog, SystemLog
- system: Notification, Currency, Language
- admin: Admin activity tracking
- ml_models: ML and recommendation models
"""

# Import base first
from app.models.base import Base

# Import all domain models
from app.models.user import User, Role, user_roles
from app.models.product import (
    Product,
    ProductCategory,
    ProductConfig,
    wishlist_items,
)
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.analytics import SearchAnalytics, AuditLog, SystemLog
from app.models.system import Notification, Currency, Language
from app.models.admin import (
    AdminActivity,
    FeatureFlag,
    SystemSetting,
    SettingsChangeLog,
)
from app.models.ml_models import (
    MLModelConfig,
    ModelTrainingHistory,
    UserSegment,
    UserSegmentMembership,
    RecommendationMetrics,
    RecommendationConversion,
)
from app.models.marketing import AdBanner, PromotionalBanner

# Export all models
__all__ = [
    # Base
    "Base",
    # User models
    "User",
    "Role",
    "user_roles",
    # Product models
    "Product",
    "ProductCategory",
    "ProductConfig",
    "wishlist_items",
    # Cart models
    "Cart",
    "CartItem",
    # Order models
    "Order",
    "OrderItem",
    # Analytics models
    "SearchAnalytics",
    "AuditLog",
    "SystemLog",
    # System models
    "Notification",
    "Currency",
    "Language",
    # Admin models
    "AdminActivity",
    "FeatureFlag",
    "SystemSetting",
    "SettingsChangeLog",
    # ML models
    "MLModelConfig",
    "ModelTrainingHistory",
    "UserSegment",
    "UserSegmentMembership",
    "RecommendationMetrics",
    "RecommendationConversion",
    # Marketing models
    "AdBanner",
    "PromotionalBanner",
]
