"""User profile endpoints."""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models import User
from app.schemas import UserResponse, UserUpdate

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile."""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    
    # Check username uniqueness
    if user_update.username and user_update.username != current_user.username:
        existing = (
            db.query(User)
            .filter(User.username == user_update.username)
            .filter(User.id != current_user.id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Username already taken"
            )

    # Check email uniqueness
    if user_update.email and user_update.email != current_user.email:
        existing = (
            db.query(User)
            .filter(User.email == user_update.email)
            .filter(User.id != current_user.id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Email already taken"
            )

    # Update user fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(current_user, field) and value is not None:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    logger.info(f"User profile updated: {current_user.username}")
    return current_user
