import logging
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, text
from sqlalchemy.orm import Session, selectinload

from app.api.deps import (
    PaginationParams,
    get_current_active_user,
    get_db,
    get_pagination_params,
)
from app.models import Cart, Order, OrderItem, Product, User
from app.schemas import (
    MessageResponse,
    OrderCreate,
    OrderResponse,
    PaginatedResponse,
)
from app.services.user_behavior_service import UserBehaviorService

router = APIRouter()
logger = logging.getLogger(__name__)


def generate_order_number() -> str:
    """Generate unique order number"""
    return f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"


@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create order from cart"""

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty"
        )

    cart_items_query = text("""
        SELECT ci.product_id, ci.quantity 
        FROM cart_items ci 
        WHERE ci.cart_id = :cart_id
    """)
    cart_items_result = db.execute(
        cart_items_query, {"cart_id": str(cart.id)}
    ).fetchall()

    if not cart_items_result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty"
        )

    order_items = []
    total_amount = Decimal("0.00")

    for cart_item in cart_items_result:
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()

        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {cart_item.product_id} is not available",
            )

        if not product.in_stock or product.stock_quantity < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}",
            )

        item_total = product.price * cart_item.quantity
        total_amount += item_total

        order_items.append(
            {
                "product_id": product.id,
                "quantity": cart_item.quantity,
                "unit_price": product.price,
                "total_price": item_total,
            }
        )

    order = Order(
        user_id=current_user.id,
        order_number=generate_order_number(),
        subtotal=total_amount,
        total_amount=total_amount,
        shipping_address=order_data.shipping_address or (current_user.address
        if current_user.address is not None
        else {
            "street": "783, Sneh Nagar",
            "city": "Indore",
            "state": "Madhya Pradesh",
            "zipCode": "452001",
            "country": "India",
        }),
        billing_address=order_data.billing_address or (current_user.address
        if current_user.address is not None
        else {
            "street": "783, Sneh Nagar",
            "city": "Indore",
            "state": "Madhya Pradesh",
            "zipCode": "452001",
            "country": "India",
        }),
        payment_method=order_data.payment_method,
        order_notes=order_data.order_notes,
        recommendation_source=order_data.recommendation_source,
    )

    db.add(order)
    db.flush()

    for item_data in order_items:
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)

        product = (
            db.query(Product).filter(Product.id == item_data["product_id"]).first()
        )

        product.stock_quantity -= item_data["quantity"]
        if product.stock_quantity <= 0:
            product.in_stock = False

    clear_cart_query = text("""
        DELETE FROM cart_items WHERE cart_id = :cart_id
    """)
    db.execute(clear_cart_query, {"cart_id": str(cart.id)})

    behavior_service = UserBehaviorService(db)
    behavior_service.track_order_placed(
        str(current_user.id), str(order.id), float(total_amount)
    )

    db.commit()
    # db.refresh(order)

    logger.info(f"Order created: {order.order_number} for user {current_user.username}")

    return order


@router.get("/")
async def list_orders(
    pagination: PaginationParams = Depends(get_pagination_params),
    status_filter: Optional[str] = Query(
        None, description="Filter orders by status"
    ),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List user's orders"""

    query = (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .filter(Order.user_id == current_user.id)
    )

    if status_filter:
        query = query.filter(Order.status == status_filter)

    total = query.count()

    orders = (
        query.order_by(desc(Order.created_at))
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )

    # Serialize orders to OrderResponse
    from app.schemas.order import OrderResponse
    serialized_orders = [OrderResponse.from_orm(order) for order in orders]

    pages = (total + pagination.size - 1) // pagination.size

    return PaginatedResponse(
        items=serialized_orders,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=pages,
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get order details"""

    order = (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .filter(Order.id == order_id)
        .filter(Order.user_id == current_user.id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    return order


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Cancel order"""

    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .filter(Order.user_id == current_user.id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    if order.status not in ["pending", "confirmed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel order in current status",
        )

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()

        if product:
            product.stock_quantity += item.quantity
            product.in_stock = True

    order.status = "cancelled"
    db.commit()

    logger.info(f"Order cancelled: {order.order_number}")

    return MessageResponse(message="Order cancelled successfully")
