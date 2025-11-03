import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_permission
from app.models import AuditLog, Order, Product, SearchAnalytics, User

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/dashboard/overview")
async def admin_dashboard_overview(
    current_user: User = Depends(require_permission("admin_dashboard")),
    db: Session = Depends(get_db),
):
    """Admin: Get comprehensive dashboard overview"""

    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    last_7_days = today - timedelta(days=7)
    last_30_days = today - timedelta(days=30)

    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.is_active == True).count()
    out_of_stock = (
        db.query(Product)
        .filter(and_(Product.is_active == True, Product.in_stock == False))
        .count()
    )

    total_users = db.query(User).filter(User.is_active == True).count()
    new_users_today = db.query(User).filter(func.date(User.created_at) == today).count()

    total_orders = db.query(Order).count()
    orders_today = db.query(Order).filter(func.date(Order.created_at) == today).count()
    orders_pending = db.query(Order).filter(Order.status == "pending").count()

    total_revenue = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .scalar()
        or 0
    )

    revenue_today = (
        db.query(func.sum(Order.total_amount))
        .filter(func.date(Order.created_at) == today)
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .scalar()
        or 0
    )

    revenue_last_7_days = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.created_at >= last_7_days)
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .scalar()
        or 0
    )

    total_searches = db.query(SearchAnalytics).count()
    searches_today = (
        db.query(SearchAnalytics)
        .filter(func.date(SearchAnalytics.timestamp) == today)
        .count()
    )

    recent_orders = db.query(Order).order_by(desc(Order.created_at)).limit(5).all()

    recent_users = (
        db.query(User)
        .filter(User.is_active == True)
        .order_by(desc(User.created_at))
        .limit(5)
        .all()
    )

    return {
        "products": {
            "total": total_products,
            "active": active_products,
            "out_of_stock": out_of_stock,
            "stock_percentage": (active_products - out_of_stock) / active_products * 100
            if active_products
            else 0,
        },
        "users": {"total": total_users, "new_today": new_users_today},
        "orders": {
            "total": total_orders,
            "today": orders_today,
            "pending": orders_pending,
        },
        "revenue": {
            "total": float(total_revenue),
            "today": float(revenue_today),
            "last_7_days": float(revenue_last_7_days),
        },
        "search": {"total": total_searches, "today": searches_today},
        "recent_activity": {
            "orders": [
                {
                    "id": str(order.id),
                    "order_number": order.order_number,
                    "total_amount": float(order.total_amount),
                    "status": order.status,
                    "created_at": order.created_at,
                }
                for order in recent_orders
            ],
            "users": [
                {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "created_at": user.created_at,
                }
                for user in recent_users
            ],
        },
    }


@router.get("/user-behavior/summary")
async def admin_user_behavior_summary(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission("view_analytics")),
    db: Session = Depends(get_db),
):
    """Admin: Get user behavior analytics summary"""

    since_date = datetime.utcnow() - timedelta(days=days)

    user_actions = (
        db.query(AuditLog.action, func.count(AuditLog.id).label("count"))
        .filter(AuditLog.timestamp >= since_date)
        .group_by(AuditLog.action)
        .all()
    )

    most_viewed = (
        db.query(AuditLog.entity_id, func.count(AuditLog.id).label("view_count"))
        .filter(AuditLog.action == "VIEW_PRODUCT")
        .filter(AuditLog.timestamp >= since_date)
        .group_by(AuditLog.entity_id)
        .order_by(desc("view_count"))
        .limit(10)
        .all()
    )

    most_viewed_products = []
    for view_data in most_viewed:
        product = db.query(Product).filter(Product.id == view_data.entity_id).first()

        if product:
            most_viewed_products.append(
                {
                    "product_id": str(product.id),
                    "name": product.name,
                    "brand": product.brand,
                    "view_count": view_data.view_count,
                }
            )

    active_users = (
        db.query(func.count(func.distinct(AuditLog.user_id)))
        .filter(AuditLog.timestamp >= since_date)
        .scalar()
        or 0
    )

    return {
        "period_days": days,
        "active_users": active_users,
        "user_actions": {action: count for action, count in user_actions},
        "most_viewed_products": most_viewed_products,
    }
