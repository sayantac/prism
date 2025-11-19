# ecom/api/v1/endpoints/user_behavior.py
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models import User
from app.schemas import ProductResponse
from app.services.recommendation_service import RecommendationService
from app.services.user_behavior_service import UserBehaviorService

router = APIRouter()


@router.get("/stats")
async def get_user_behavior_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user behavior statistics"""

    behavior_service = UserBehaviorService(db)
    stats = behavior_service.get_user_behavior_stats(str(current_user.id), days)

    return stats


@router.get("/interests")
async def get_user_interests(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get user interests derived from behavior"""

    behavior_service = UserBehaviorService(db)
    interests = behavior_service.get_user_interests_from_behavior(str(current_user.id))

    return {"interests": interests}


@router.get("/categories/frequent")
async def get_frequently_viewed_categories(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get frequently viewed categories"""

    behavior_service = UserBehaviorService(db)
    categories = behavior_service.get_frequently_viewed_categories(
        str(current_user.id), limit
    )

    return {"categories": categories}


@router.get("/recommendations/behavior-based", response_model=List[ProductResponse])
async def get_behavior_based_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get recommendations based on user behavior"""

    recommendation_service = RecommendationService(db)
    recommendations = await recommendation_service.get_user_recommendations(
        str(current_user.id), limit
    )

    return recommendations


@router.post("/interests/update")
async def update_user_interests(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Update user interests based on recent behavior"""

    behavior_service = UserBehaviorService(db)
    behavior_service.update_user_interests(str(current_user.id))

    return {"message": "User interests updated successfully"}
