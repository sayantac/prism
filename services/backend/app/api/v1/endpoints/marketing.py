"""Marketing and banner endpoints."""
import base64
import logging
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from dateutil import parser

from fastapi import APIRouter, Depends, Form, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_superuser as get_current_active_superuser, get_current_active_user, get_db
from app.core.config import get_settings
from app.models import AdBanner, Product, User, UserSegmentMembership
from app.services.image_generation_service import ImageGenerationService
from app.services.llm_service import LLMService

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== Pydantic Schemas ====================

class PromotionRequest(BaseModel):
    cluster_id: int = Field(..., description="User cluster/segment ID")
    target_product_category: str = Field(..., description="Target product category")
    product_id: Optional[str] = Field(None, description="Specific product ID")
    additional_context: Optional[str] = Field(None, description="Additional promotional context")


class BannerRequest(BaseModel):
    prompt: str = Field(..., description="Banner generation prompt")
    user_id: Optional[str] = Field(None, description="User ID for targeting")
    aspect_ratio: str = Field("16:9", description="Banner aspect ratio")
    product_id: Optional[str] = Field(None, description="Associated product ID")


class PublishBannerRequest(BaseModel):
    banner_id: str = Field(..., description="Banner ID to publish")
    target_audience: Dict[str, Any] = Field(..., description="Audience targeting criteria")
    start_date: str = Field(..., description="Campaign start date")
    end_date: str = Field(..., description="Campaign end date")
    priority: int = Field(5, ge=1, le=10, description="Banner priority (1-10)")


# ==================== Endpoints ====================

@router.post("/generate-promotion")
async def generate_promotional_content(
    request: PromotionRequest,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Generate personalized promotional content using Gemini AI.

    Creates targeted ad copy based on user cluster/segment and product category.

    **Required Permission:** `system.ml_models`
    """
    try:
        llm_service = LLMService()

        # Get cluster/segment name
        segment_name = f"Cluster {request.cluster_id}"  # Can be enhanced with actual segment lookup

        # Build context for LLM
        context = f"""Generate promotional ad content for:
Segment: {segment_name}
Product Category: {request.target_product_category}
"""
        if request.product_id:
            product = db.query(Product).filter(Product.id == request.product_id).first()
            if product:
                context += f"Product: {product.name}\n"

        if request.additional_context:
            context += f"Context: {request.additional_context}\n"

        # Generate promotional text
        ad_content = llm_service.generate_personalized_ad_copy(
            cluster_id=request.cluster_id,
            target_product_category=request.target_product_category,
            additional_context=request.additional_context
        )

        return {
            "ad_content": ad_content
        }

    except Exception as e:
        logger.error(f"Error generating promotion: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate promotional content"
        )


@router.post("/generate-banner")
async def generate_ai_banner(
    request: BannerRequest,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Generate AI banner image using Google Imagen.

    Creates a marketing banner based on the provided prompt.

    **Required Permission:** `system.ml_models`
    """
    try:
        image_service = ImageGenerationService()

        # Generate unique banner ID
        banner_id = f"banner_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"

        # Generate output path
        settings = get_settings()

        output_dir = os.path.join(os.getcwd(), "generated_banners")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{banner_id}.jpg")

        # Generate image
        result = await image_service.generate_image(
            prompt=request.prompt,
            output_path=output_path,
            aspect_ratio=request.aspect_ratio
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image generation failed: {result.get('error')}"
            )

        return {
            "banner_id": banner_id,
            "image_base64": result.get("image_base64"),
            "saved_path": result.get("filename"),
            "prompt": request.prompt,
            "product_id": request.product_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating banner: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate banner"
        )


@router.get("/banner/{banner_id}")
async def get_banner_details(
    banner_id: str,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get details of a generated banner.

    Returns banner metadata, image data, and targeting information.

    **Required Permission:** `system.ml_models`
    """
    try:
        # Look up banner in database
        banner = db.query(AdBanner).filter(AdBanner.id == banner_id).first()

        if not banner:
            # Check if it's a file-based banner
            banner_path = os.path.join(os.getcwd(), "generated_banners", f"{banner_id}.jpg")

            if os.path.exists(banner_path):
                # Read the file
                with open(banner_path, "rb") as f:
                    image_bytes = f.read()
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')

                return {
                    "id": banner_id,
                    "image_base64": image_base64,
                    "saved_path": banner_path,
                    "prompt": "N/A - file-based banner",
                    "created_at": datetime.utcfromtimestamp(os.path.getctime(banner_path)).isoformat() + "Z",
                    "is_published": False
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Banner not found: {banner_id}"
                )

        # Return banner from database
        return {
            "id": str(banner.id),
            "image_base64": banner.image_url,  # Could be base64 or URL
            "saved_path": banner.image_url,
            "prompt": banner.description or "N/A",
            "product_id": str(banner.product_id) if banner.product_id else None,
            "product_category": banner.deal_type,
            "target_audience": {
                "cluster_ids": [],  # Would need additional fields in model
                "priority": 5
            },
            "created_at": banner.created_at.isoformat() + "Z" if banner.created_at else None,
            "created_by": str(banner.created_by) if hasattr(banner, 'created_by') else None,
            "is_published": banner.status == "active",
            "start_date": banner.start_time.isoformat() + "Z" if banner.start_time else None,
            "end_date": banner.end_time.isoformat() + "Z" if banner.end_time else None,
            "priority": 5  # Default
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting banner details: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve banner details"
        )


@router.post("/publish-banner")
async def publish_banner_with_targeting(
    request: PublishBannerRequest,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Publish a banner with audience targeting.

    Makes a banner live with specified targeting criteria and date range.

    **Required Permission:** `system.ml_models`
    """
    try:
        # Parse dates
        start_date = parser.parse(request.start_date)
        end_date = parser.parse(request.end_date)

        # Check if banner exists
        banner = db.query(AdBanner).filter(AdBanner.id == request.banner_id).first()

        if banner:
            # Update existing banner
            banner.status = "active"
            banner.start_time = start_date
            banner.end_time = end_date
            # target_audience would be stored in additional fields if model supports
            db.commit()
        else:
            # Create new banner record
            new_banner = AdBanner(
                id=uuid.UUID(request.banner_id) if len(request.banner_id) == 36 else uuid.uuid4(),
                title=f"Banner {request.banner_id}",
                description=str(request.target_audience),
                status="active",
                start_time=start_date,
                end_time=end_date,
                image_url=f"generated_banners/{request.banner_id}.jpg",
                created_at=datetime.utcnow()
            )
            db.add(new_banner)
            db.commit()

        logger.info(f"Published banner: {request.banner_id}")

        return {
            "message": "Banner published successfully",
            "banner_id": request.banner_id
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error publishing banner: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish banner"
        )


@router.post("/personalized-promotion")
async def generate_complete_personalized_campaign(
    user_id: str = Form(...),
    target_product_category: str = Form(...),
    product_id: Optional[str] = Form(None),
    additional_context: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Generate a complete personalized campaign (text + banner).

    Creates both promotional text and banner image in one call.

    **Required Permission:** `system.ml_models`
    """
    try:
        # Get user's segment
        user_segment = db.query(UserSegmentMembership).filter(
            UserSegmentMembership.user_id == user_id,
            UserSegmentMembership.is_active == True
        ).first()

        segment_info = {
            "id": 0,
            "name": "General",
            "description": "General user segment"
        }

        if user_segment and user_segment.segment:
            segment_info = {
                "id": str(user_segment.segment_id),
                "name": user_segment.segment.name,
                "description": user_segment.segment.description or ""
            }

        # Generate promotional text
        llm_service = LLMService()
        promotional_text = llm_service.generate_personalized_ad_copy(
            cluster_id=0,  # Could map from segment
            target_product_category=target_product_category,
            additional_context=additional_context
        )

        # Generate banner
        image_service = ImageGenerationService()
        banner_prompt = f"Create a modern e-commerce banner for {target_product_category}"
        if additional_context:
            banner_prompt += f" with {additional_context} theme"

        banner_id = f"banner_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        output_dir = os.path.join(os.getcwd(), "generated_banners")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{banner_id}.jpg")

        banner_result = await image_service.generate_image(
            prompt=banner_prompt,
            output_path=output_path,
            aspect_ratio="16:9"
        )

        banner_data = {
            "id": banner_id,
            "image_base64": banner_result.get("image_base64") if banner_result.get("success") else None,
            "saved_path": banner_result.get("filename") if banner_result.get("success") else None
        }

        return {
            "user_id": user_id,
            "segment": segment_info,
            "promotional_text": promotional_text,
            "banner": banner_data,
            "target_product_category": target_product_category,
            "product_id": product_id,
            "additional_context": additional_context
        }

    except Exception as e:
        logger.error(f"Error generating personalized campaign: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate personalized campaign"
        )


@router.get("/user-banners/{user_id}")
async def get_user_banners(
    user_id: str,
    limit: int = 3,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get active banners for a user based on their segment.

    Returns banners that are currently active and targeted to the user.

    **Required Permission:** `analytics.view`
    """
    now = datetime.utcnow()

    # Get active banners
    banners = (
        db.query(AdBanner)
        .filter(AdBanner.status == "active")
        .filter(AdBanner.start_time <= now)
        .filter(AdBanner.end_time >= now)
        .limit(limit)
        .all()
    )

    # Format banners for frontend
    banner_list = []
    for banner in banners:
        banner_list.append({
            "id": str(banner.id),
            "image_base64": banner.image_url if banner.image_url else None,
            "product_id": str(banner.product_id) if banner.product_id else None,
            "product_category": banner.deal_type,
            "priority": 5  # Default priority
        })

    return {
        "user_id": user_id,
        "banners": banner_list
    }
