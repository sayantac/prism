import logging
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_active_user, get_db
from app.core.config import get_settings
from app.models import Cart, Product, User
from app.schemas import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
    MessageResponse,
)
from app.services.user_behavior_service import UserBehaviorService

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


@router.get("/", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get user's cart"""

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    cart_items = []
    total_amount = Decimal("0.00")
    total_items = 0

    query = text("""
        SELECT ci.product_id, ci.quantity, ci.created_at, 
               p.id, p.name, p.brand, p.price, p.description, p.images, 
               p.stock_quantity, p.in_stock, p.is_active
        FROM cart_items ci 
        JOIN products p ON ci.product_id = p.id 
        WHERE ci.user_id = :user_id AND p.is_active = true
    """)

    result = db.execute(query, {"user_id": str(current_user.id)})

    for row in result:
        product = (
            db.query(Product)
            .options(selectinload(Product.category))
            .filter(Product.id == row.product_id)
            .first()
        )

        if product:
            item_total = product.price * row.quantity
            total_amount += item_total
            total_items += row.quantity

            cart_items.append(
                CartItemResponse(
                    product=product, quantity=row.quantity, added_at=row.created_at
                )
            )

    return CartResponse(
        id=cart.id,
        items=cart_items,
        total_items=total_items,
        total_amount=total_amount,
        created_at=cart.created_at,
        updated_at=cart.updated_at,
    )


@router.post("/items")
async def add_to_cart(
    item_data: CartItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Add item to cart"""

    product = db.query(Product).filter(Product.id == item_data.product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Product is not available"
        )

    if not product.in_stock or product.stock_quantity < item_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock"
        )

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    existing_query = text("""
        SELECT quantity FROM cart_items 
        WHERE cart_id = :cart_id AND product_id = :product_id
    """)
    existing_result = db.execute(
        existing_query,
        {"cart_id": str(cart.id), "product_id": str(item_data.product_id)},
    ).fetchone()

    if existing_result:
        new_quantity = existing_result.quantity + item_data.quantity
        if new_quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Total quantity exceeds available stock",
            )

        update_query = text("""
            UPDATE cart_items 
            SET quantity = :quantity 
            WHERE cart_id = :cart_id AND product_id = :product_id
        """)
        db.execute(
            update_query,
            {
                "quantity": new_quantity,
                "cart_id": str(cart.id),
                "product_id": str(item_data.product_id),
            },
        )
    else:
        insert_query = text("""
            INSERT INTO cart_items (cart_id, product_id, quantity, added_at) 
            VALUES (:cart_id, :product_id, :quantity, NOW())
        """)
        db.execute(
            insert_query,
            {
                "cart_id": str(cart.id),
                "product_id": str(item_data.product_id),
                "quantity": item_data.quantity,
            },
        )

    behavior_service = UserBehaviorService(db)
    behavior_service.track_cart_add(
        str(current_user.id), str(item_data.product_id), item_data.quantity
    )

    db.commit()

    return MessageResponse(message="Item added to cart successfully")


@router.put("/items/{product_id}")
async def update_cart_item(
    product_id: UUID,
    item_data: CartItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update cart item quantity"""

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found"
        )

    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    if item_data.quantity > product.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity exceeds available stock",
        )

    update_query = text("""
        UPDATE cart_items 
        SET quantity = :quantity 
        WHERE cart_id = :cart_id AND product_id = :product_id
    """)
    result = db.execute(
        update_query,
        {
            "quantity": item_data.quantity,
            "cart_id": str(cart.id),
            "product_id": str(product_id),
        },
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in cart"
        )

    db.commit()

    return MessageResponse(message="Cart item updated successfully")


@router.delete("/items/{product_id}")
async def remove_from_cart(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Remove item from cart"""

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found"
        )

    delete_query = text("""
        DELETE FROM cart_items 
        WHERE cart_id = :cart_id AND product_id = :product_id
    """)
    result = db.execute(
        delete_query, {"cart_id": str(cart.id), "product_id": str(product_id)}
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in cart"
        )

    db.commit()

    return MessageResponse(message="Item removed from cart successfully")


@router.delete("/clear")
async def clear_cart(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Clear all items from cart"""

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()

    if cart:
        clear_query = text("""
            DELETE FROM cart_items WHERE cart_id = :cart_id
        """)
        db.execute(clear_query, {"cart_id": str(cart.id)})
        db.commit()

    return MessageResponse(message="Cart cleared successfully")
