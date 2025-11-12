import logging
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func
from sqlalchemy.orm import Session, selectinload

from app.api.deps import (
    PaginationParams,
    get_db,
    get_pagination_params,
)
from app.core.permissions import require_permission
from app.models import Order, OrderItem, Product, User
from app.schemas import MessageResponse, OrderResponse, OrderUpdate, PaginatedResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/orders", response_model=PaginatedResponse)
async def admin_list_orders(
    pagination: PaginationParams = Depends(get_pagination_params),
    status_filter: Optional[str] = Query(
        None, regex="^(pending|confirmed|shipped|delivered|cancelled)$"
    ),
    user_id: Optional[UUID] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    current_user: User = Depends(require_permission("view_orders")),
    db: Session = Depends(get_db),
):
    """Admin: List all orders with filtering"""

    query = (
        db.query(Order)
        .options(selectinload(Order.user))
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )

    if status_filter:
        query = query.filter(Order.status == status_filter)

    if user_id:
        query = query.filter(Order.user_id == user_id)

    if start_date:
        query = query.filter(Order.created_at >= start_date)

    if end_date:
        query = query.filter(Order.created_at <= end_date)

    if min_amount:
        query = query.filter(Order.total_amount >= min_amount)

    if max_amount:
        query = query.filter(Order.total_amount <= max_amount)

    total = query.count()

    orders = (
        query.order_by(desc(Order.created_at))
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )

    pages = (total + pagination.size - 1) // pagination.size

    return PaginatedResponse(
        items=orders,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=pages,
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def admin_get_order(
    order_id: UUID,
    current_user: User = Depends(require_permission("view_orders")),
    db: Session = Depends(get_db),
):
    """Admin: Get order details"""

    order = (
        db.query(Order)
        .options(selectinload(Order.user))
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    return order


@router.put("/orders/{order_id}", response_model=OrderResponse)
async def admin_update_order(
    order_id: UUID,
    order_data: OrderUpdate,
    current_user: User = Depends(require_permission("update_order_status")),
    db: Session = Depends(get_db),
):
    """Admin: Update order"""

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    update_data = order_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)

    if "status" in update_data:
        from app.models import AuditLog

        audit_log = AuditLog(
            user_id=current_user.id,
            action="UPDATE_ORDER_STATUS",
            entity_type="Order",
            entity_id=str(order_id),
            old_values={"status": order.status},
            new_values={"status": update_data["status"]},
        )
        db.add(audit_log)

    db.commit()
    db.refresh(order)

    logger.info(f"Order {order.order_number} updated by {current_user.username}")

    return order


@router.get("/analytics/orders/summary")
async def admin_order_analytics_summary(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission("view_analytics")),
    db: Session = Depends(get_db),
):
    """Admin: Get order analytics summary"""

    since_date = datetime.utcnow() - timedelta(days=days)

    total_orders = db.query(Order).filter(Order.created_at >= since_date).count()

    orders_by_status = (
        db.query(Order.status, func.count(Order.id).label("count"))
        .filter(Order.created_at >= since_date)
        .group_by(Order.status)
        .all()
    )

    total_revenue = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.created_at >= since_date)
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .scalar()
        or 0
    )

    average_order_value = (
        db.query(func.avg(Order.total_amount))
        .filter(Order.created_at >= since_date)
        .scalar()
        or 0
    )

    daily_orders = (
        db.query(
            func.date(Order.created_at).label("date"),
            func.count(Order.id).label("orders"),
            func.sum(Order.total_amount).label("revenue"),
        )
        .filter(Order.created_at >= since_date)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )

    return {
        "period_days": days,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "average_order_value": float(average_order_value),
        "orders_by_status": {status: count for status, count in orders_by_status},
        "daily_trends": [
            {
                "date": str(row.date),
                "orders": row.orders,
                "revenue": float(row.revenue or 0),
            }
            for row in daily_orders
        ],
    }


@router.get("/analytics/products/top-selling")
async def admin_top_selling_products(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission("view_analytics")),
    db: Session = Depends(get_db),
):
    """Admin: Get top selling products"""

    since_date = datetime.utcnow() - timedelta(days=days)

    top_products = (
        db.query(
            Product.id,
            Product.name,
            Product.brand,
            Product.price,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.total_price).label("total_revenue"),
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.created_at >= since_date)
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .group_by(Product.id, Product.name, Product.brand, Product.price)
        .order_by(desc("total_sold"))
        .limit(limit)
        .all()
    )

    return [
        {
            "product_id": str(row.id),
            "name": row.name,
            "brand": row.brand,
            "price": float(row.price),
            "total_sold": row.total_sold,
            "total_revenue": float(row.total_revenue),
        }
        for row in top_products
    ]


@router.get("/analytics/customers/top-spenders")
async def admin_top_customers(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission("view_analytics")),
    db: Session = Depends(get_db),
):
    """Admin: Get top spending customers"""

    since_date = datetime.utcnow() - timedelta(days=days)

    top_customers = (
        db.query(
            User.id,
            User.username,
            User.email,
            User.first_name,
            User.last_name,
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total_amount).label("total_spent"),
        )
        .join(Order, User.id == Order.user_id)
        .filter(Order.created_at >= since_date)
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .group_by(User.id, User.username, User.email, User.first_name)
        .order_by(desc("total_spent"))
        .limit(limit)
        .all()
    )

    return [
        {
            "user_id": str(row.id),
            "username": row.username,
            "email": row.email,
            "first_name": row.first_name,
            "last_name": row.last_name,
            "total_orders": row.total_orders,
            "total_spent": float(row.total_spent),
        }
        for row in top_customers
    ]


@router.get("/analytics/revenue/monthly")
async def admin_monthly_revenue(
    months: int = Query(12, ge=1, le=24),
    current_user: User = Depends(require_permission("view_analytics")),
    db: Session = Depends(get_db),
):
    """Admin: Get monthly revenue analytics"""

    since_date = datetime.utcnow() - timedelta(days=months * 30)

    monthly_revenue = (
        db.query(
            func.extract("year", Order.created_at).label("year"),
            func.extract("month", Order.created_at).label("month"),
            func.count(Order.id).label("orders"),
            func.sum(Order.total_amount).label("revenue"),
        )
        .filter(Order.created_at >= since_date)
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .group_by(
            func.extract("year", Order.created_at),
            func.extract("month", Order.created_at),
        )
        .order_by(
            func.extract("year", Order.created_at),
            func.extract("month", Order.created_at),
        )
        .all()
    )

    return [
        {
            "year": int(row.year),
            "month": int(row.month),
            "orders": row.orders,
            "revenue": float(row.revenue or 0),
        }
        for row in monthly_revenue
    ]


@router.post("/orders/bulk-update-status")
async def admin_bulk_update_order_status(
    order_ids: List[UUID],
    new_status: str,
    current_user: User = Depends(require_permission("update_order_status")),
    db: Session = Depends(get_db),
):
    """Admin: Bulk update order status"""

    if not order_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No order IDs provided"
        )

    valid_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}",
        )

    updated_count = (
        db.query(Order)
        .filter(Order.id.in_(order_ids))
        .update({"status": new_status}, synchronize_session=False)
    )

    from app.models import AuditLog

    audit_log = AuditLog(
        user_id=current_user.id,
        action="BULK_UPDATE_ORDER_STATUS",
        entity_type="Order",
        entity_id=f"bulk_{len(order_ids)}_orders",
        new_values={
            "new_status": new_status,
            "order_count": updated_count,
            "order_ids": [str(oid) for oid in order_ids],
        },
    )
    db.add(audit_log)

    db.commit()

    return MessageResponse(
        message=f"Successfully updated {updated_count} orders to {new_status}"
    )
