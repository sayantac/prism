"""Admin banner management endpoints."""
from __future__ import annotations

import base64
import json
import logging
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from dateutil import parser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_permission
from app.models import AdBanner, User

logger = logging.getLogger(__name__)
router = APIRouter()

_BANNER_STORAGE_DIR = os.path.join(os.getcwd(), "generated_banners")


class BannerCreateRequest(BaseModel):
    """Request payload for creating a banner from generated content."""

    title: str
    description: Optional[str] = None
    deal_type: Optional[str] = Field("general", description="Type of campaign or deal")
    deal_data: Optional[Any] = Field(None, description="Deal metadata (stringified JSON or dict)")
    prompt: Optional[str] = Field(None, description="Prompt used to generate the banner")
    banner_id: Optional[str] = Field(None, description="Client-side banner identifier")
    image_base64: Optional[str] = Field(None, description="Base64 encoded banner image")
    saved_path: Optional[Any] = Field(None, description="Path(s) returned by generation service")
    image_url: Optional[str] = Field(None, description="Existing banner image URL")
    target_segment: Optional[str] = Field(None, description="Audience segment identifier")
    target_segment_label: Optional[str] = Field(None, description="Human readable segment label")
    product_id: Optional[str] = Field(None, description="Associated product ID")
    start_time: Optional[str] = Field(None, description="Campaign start time (ISO format)")
    end_time: Optional[str] = Field(None, description="Campaign end time (ISO format)")
    call_to_action: Optional[str] = Field(None, description="CTA label for the banner")
    status: Optional[str] = Field("draft", description="Banner status")


class BannerPublishRequest(BaseModel):
    """Request body for publishing a banner."""

    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = Field("published", description="Desired status after publish")


class BannerListResponse(BaseModel):
    """Response wrapper for banner collections."""

    banners: List[Dict[str, Any]]


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None

    try:
        return parser.parse(value)
    except (ValueError, TypeError) as exc:  # pragma: no cover - defensive branch
        logger.warning("Failed to parse datetime '%s': %s", value, exc)
        return None


def _normalize_deal_data(raw: Any, request: BannerCreateRequest) -> str:
    """Persist deal metadata as a JSON string, augmenting with useful fields."""

    metadata: Dict[str, Any]
    if raw is None:
        metadata = {}
    elif isinstance(raw, dict):
        metadata = dict(raw)
    else:
        try:
            parsed = json.loads(raw)
            metadata = parsed if isinstance(parsed, dict) else {"raw": raw}
        except (TypeError, json.JSONDecodeError):
            metadata = {"raw": raw}

    if request.target_segment_label:
        metadata.setdefault("target_segment_label", request.target_segment_label)
    if request.prompt:
        metadata.setdefault("prompt", request.prompt)
    if request.banner_id:
        metadata.setdefault("source_banner_id", request.banner_id)

    return json.dumps(metadata)


def _persist_banner_image(
    *,
    banner_uuid: uuid.UUID,
    image_base64: Optional[str],
    saved_path: Optional[Any],
    fallback_url: Optional[str],
) -> Optional[str]:
    """Persist base64 image data to disk and return relative URL."""

    os.makedirs(_BANNER_STORAGE_DIR, exist_ok=True)

    if image_base64:
        payload = image_base64.split(",", 1)[-1]
        try:
            data = base64.b64decode(payload)
        except (base64.binascii.Error, ValueError) as exc:
            logger.error("Invalid image_base64 payload: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image data provided",
            ) from exc

        filename = f"{banner_uuid}.png"
        file_path = os.path.join(_BANNER_STORAGE_DIR, filename)
        with open(file_path, "wb") as file_handle:
            file_handle.write(data)
        return f"generated_banners/{filename}"

    if saved_path:
        if isinstance(saved_path, list) and saved_path:
            return saved_path[0]
        if isinstance(saved_path, str):
            return saved_path

    return fallback_url


def _extract_metadata(banner: AdBanner) -> Dict[str, Any]:
    """Unpack selected metadata from a banner model."""

    label: Optional[str] = None
    prompt: Optional[str] = None
    deal_payload: Optional[Any] = banner.deal_data

    if banner.deal_data:
        try:
            parsed = json.loads(banner.deal_data)
            if isinstance(parsed, dict):
                label = parsed.get("target_segment_label")
                prompt = parsed.get("prompt")
                deal_payload = banner.deal_data  # Preserve original JSON string
        except json.JSONDecodeError:
            deal_payload = banner.deal_data

    return {
        "target_segment_label": label,
        "prompt": prompt,
        "deal_data": deal_payload,
    }


def _serialize_banner(banner: AdBanner) -> Dict[str, Any]:
    metadata = _extract_metadata(banner)
    return {
        "id": str(banner.id),
        "banner_id": str(banner.id),
        "title": banner.title,
        "description": banner.description,
        "target_segment": banner.target_segment,
        "target_segment_label": metadata.get("target_segment_label"),
        "product_id": str(banner.product_id) if banner.product_id else None,
        "deal_type": banner.deal_type,
        "deal_data": metadata.get("deal_data"),
        "image_url": banner.image_url,
        "status": banner.status,
        "start_time": banner.start_time.isoformat() if banner.start_time else None,
        "end_time": banner.end_time.isoformat() if banner.end_time else None,
        "impression_count": banner.impression_count,
        "click_count": banner.click_count,
        "created_at": banner.created_at.isoformat() if banner.created_at else None,
        "prompt": metadata.get("prompt") or banner.banner_text,
        "call_to_action": banner.call_to_action,
    }


@router.get("", response_model=BannerListResponse)
async def list_banners(
    current_user: User = Depends(require_permission("manage_content")),
    db: Session = Depends(get_db),
) -> BannerListResponse:
    """Return all banners ordered by creation time."""

    banners = (
        db.query(AdBanner)
        .order_by(AdBanner.created_at.desc())
        .all()
    )

    payload = [_serialize_banner(banner) for banner in banners]
    return BannerListResponse(banners=payload)


@router.post("/create-with-generation")
async def create_banner_with_generation(
    request: BannerCreateRequest,
    current_user: User = Depends(require_permission("manage_content")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Persist a generated banner and return the stored record."""

    banner_uuid = uuid.uuid4()

    product_uuid: Optional[uuid.UUID] = None
    if request.product_id:
        try:
            product_uuid = uuid.UUID(str(request.product_id))
        except ValueError:
            logger.warning("Invalid product_id supplied for banner: %s", request.product_id)

    image_url = _persist_banner_image(
        banner_uuid=banner_uuid,
        image_base64=request.image_base64,
        saved_path=request.saved_path,
        fallback_url=request.image_url,
    )

    deal_data = _normalize_deal_data(request.deal_data, request)

    banner = AdBanner(
        id=banner_uuid,
        title=request.title,
        description=request.description,
        target_segment=request.target_segment or "general_audience",
        product_id=product_uuid,
        deal_type=(request.deal_type or "general").lower(),
        deal_data=deal_data,
        image_url=image_url,
        banner_text=request.prompt or request.description,
        call_to_action=request.call_to_action or "Shop Now",
        start_time=_parse_datetime(request.start_time),
        end_time=_parse_datetime(request.end_time),
        status=(request.status or "draft").lower(),
        created_by=current_user.id if current_user else None,
    )

    db.add(banner)
    db.commit()
    db.refresh(banner)

    payload = _serialize_banner(banner)
    payload["image_base64"] = request.image_base64

    return {"banner": payload}


@router.post("/{banner_id}/publish")
async def publish_banner(
    banner_id: str,
    request: BannerPublishRequest,
    current_user: User = Depends(require_permission("manage_content")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Publish a banner by updating status and schedule."""

    try:
        banner_uuid = uuid.UUID(banner_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found") from exc

    banner = db.query(AdBanner).filter(AdBanner.id == banner_uuid).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")

    banner.status = (request.status or "published").lower()
    start = _parse_datetime(request.start_time)
    end = _parse_datetime(request.end_time)
    if start:
        banner.start_time = start
    if end:
        banner.end_time = end

    db.commit()
    db.refresh(banner)

    return {"banner": _serialize_banner(banner)}


@router.post("/{banner_id}/regenerate-image")
async def regenerate_banner_image(
    banner_id: str,
    current_user: User = Depends(require_permission("manage_content")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Placeholder regeneration endpoint that currently returns the stored banner."""

    try:
        banner_uuid = uuid.UUID(banner_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found") from exc

    banner = db.query(AdBanner).filter(AdBanner.id == banner_uuid).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")

    logger.info("Regenerate image requested for banner %s", banner_id)
    # Future work: integrate ImageGenerationService to produce a fresh asset.

    return {"banner": _serialize_banner(banner)}


@router.delete("/{banner_id}")
async def delete_banner(
    banner_id: str,
    current_user: User = Depends(require_permission("manage_content")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a banner and remove its stored image if present."""

    try:
        banner_uuid = uuid.UUID(banner_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found") from exc

    banner = db.query(AdBanner).filter(AdBanner.id == banner_uuid).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")

    image_path = banner.image_url
    db.delete(banner)
    db.commit()

    if image_path:
        try:
            candidate = image_path
            if image_path.startswith("generated_banners/"):
                candidate = os.path.join(os.getcwd(), image_path)
            if os.path.exists(candidate):
                os.remove(candidate)
        except Exception as exc:  # pragma: no cover - best effort cleanup
            logger.warning("Failed to remove banner image '%s': %s", image_path, exc)

    return {"message": "Banner deleted"}
