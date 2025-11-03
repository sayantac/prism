from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    cart,
    notifications,
    orders,
    products,
    user_behavior,
    wishlist,
)
from app.api.v1.endpoints.admin import dashboard as admin_dashboard
from app.api.v1.endpoints.admin import (
    orders as admin_orders,
)
from app.api.v1.endpoints.admin import (
    products as admin_products,
)
from app.api.v1.endpoints.admin import (
    users as admin_users,
)

api_router = APIRouter()


api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["wishlist"])
api_router.include_router(
    user_behavior.router, prefix="/user/behavior", tags=["user-behavior"]
)
api_router.include_router(
    notifications.router, prefix="/notifications", tags=["notifications"]
)


api_router.include_router(
    admin_products.router, prefix="/admin", tags=["admin-products"]
)
api_router.include_router(admin_users.router, prefix="/admin", tags=["admin-users"])
api_router.include_router(admin_orders.router, prefix="/admin", tags=["admin-orders"])


api_router.include_router(
    admin_dashboard.router, prefix="/admin/dashboard", tags=["admin-dashboard"]
)
