import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_active_user, get_db
from app.models import Product, User
from app.schemas import MessageResponse, ProductResponse
from app.services.user_behavior_service import UserBehaviorService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[ProductResponse])
async def get_wishlist(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get user's wishlist"""

    user = (
        db.query(User)
        .options(selectinload(User.wishlist))
        .filter(User.id == current_user.id)
        .first()
    )

    if not user:
        return []

    active_wishlist = [product for product in user.wishlist if product.is_active]

    return active_wishlist


@router.post("/{product_id}")
async def add_to_wishlist(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Add product to wishlist"""

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .filter(Product.is_active == True)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    user = (
        db.query(User)
        .options(selectinload(User.wishlist))
        .filter(User.id == current_user.id)
        .first()
    )

    if product in user.wishlist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product already in wishlist",
        )

    user.wishlist.append(product)

    behavior_service = UserBehaviorService(db)
    behavior_service.track_wishlist_add(str(current_user.id), str(product_id))

    db.commit()

    return MessageResponse(message="Product added to wishlist")


@router.delete("/{product_id}")
async def remove_from_wishlist(
    product_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Remove product from wishlist"""

    user = (
        db.query(User)
        .options(selectinload(User.wishlist))
        .filter(User.id == current_user.id)
        .first()
    )

    product = None
    for wishlist_product in user.wishlist:
        if wishlist_product.id == product_id:
            product = wishlist_product
            break

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in wishlist",
        )

    user.wishlist.remove(product)
    db.commit()

    return MessageResponse(message="Product removed from wishlist")
