from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    cart,
    marketing,
    notifications,
    orders,
    products,
    user_behavior,
    users,
    wishlist,
    product_description_ai,
)
from app.api.v1.endpoints.admin import (
    analytics as admin_analytics,
    dashboard as admin_dashboard,
    ml_models as admin_ml_models,
    orders as admin_orders,
    products as admin_products,
    recommendation_engine as admin_recommendation_engine,
    settings as admin_settings,
    system as admin_system,
    user_analytics as admin_user_analytics,
    user_segmentation as admin_user_segmentation,
    users as admin_users,
)

api_router = APIRouter()


api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(marketing.router, prefix="/recommendations", tags=["marketing"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["wishlist"])
api_router.include_router(
    user_behavior.router, prefix="/user/behavior", tags=["user-behavior"]
)
api_router.include_router(
    notifications.router, prefix="/notifications", tags=["notifications"]
)

# Admin endpoints
api_router.include_router(
    admin_dashboard.router, prefix="/admin/dashboard", tags=["admin-dashboard"]
)
api_router.include_router(
    admin_products.router, prefix="/admin/products", tags=["admin-products"]
)
api_router.include_router(
    admin_orders.router, prefix="/admin/orders", tags=["admin-orders"]
)
api_router.include_router(
    admin_users.router, prefix="/admin/users", tags=["admin-users"]
)
api_router.include_router(
    admin_analytics.router, prefix="/admin/analytics", tags=["admin-analytics"]
)
api_router.include_router(
    admin_user_analytics.router,
    prefix="/admin/user-analytics",
    tags=["admin-user-analytics"],
)
api_router.include_router(
    admin_user_segmentation.router,
    prefix="/admin/user-segmentation",
    tags=["admin-user-segmentation"],
)
api_router.include_router(
    admin_recommendation_engine.router,
    prefix="/admin/recommendation-engine",
    tags=["admin-recommendation-engine"],
)
api_router.include_router(
    admin_ml_models.router,
    prefix="/admin/ml-models",
    tags=["admin-ml-models"],
)
api_router.include_router(
    admin_settings.router, prefix="/admin/settings", tags=["admin-settings"]
)
api_router.include_router(
    admin_system.router, prefix="/admin/system", tags=["admin-system"]
)

api_router.include_router(
    product_description_ai.router,
    prefix="/products/description-ai",
    tags=["product-description-ai"],
)