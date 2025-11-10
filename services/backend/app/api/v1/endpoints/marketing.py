"""Marketing and banner endpoints."""
import logging
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models import AdBanner, User

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/user-banners/{user_id}")
async def get_user_banners(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get active banners for a user based on their segment.
    Returns banners that are currently active and targeted to the user.
    """
    now = datetime.utcnow()
    
    # Get active banners
    banners = (
        db.query(AdBanner)
        .filter(AdBanner.status == "active")
        .filter(AdBanner.start_time <= now)
        .filter(AdBanner.end_time >= now)
        .all()
    )
    
    # Format banners for frontend
    banner_list = []
    for banner in banners:
        banner_list.append({
            "id": str(banner.id),
            "title": banner.title,
            "description": banner.description,
            "image_url": banner.image_url,
            "banner_text": banner.banner_text,
            "call_to_action": banner.call_to_action,
            "product_id": str(banner.product_id) if banner.product_id else None,
            "deal_type": banner.deal_type,
        })
    
    return {"banners": banner_list}
