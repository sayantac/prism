"""
Admin System Management Endpoints.

Provides system health, configuration, and monitoring APIs for administrators.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_superuser as get_current_active_superuser, get_db
from app.core.config import get_settings
from app.models import User, Order, Product
from app.services.ml.ml_model_manager import MLModelManager

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


@router.get("/status")
async def get_system_status(
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get comprehensive system health and status information.

    Returns database health, ML model status, service configuration,
    user data statistics, and recent activity metrics.

    **Required Permission:** `system.admin`
    """
    try:
        # Database health check
        try:
            db.execute("SELECT 1")
            database_health = "healthy"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            database_health = "unhealthy"

        # ML Models status
        try:
            model_manager = MLModelManager(settings.MODEL_STORAGE_PATH)
            active_models_status = model_manager.get_cache_status()
            ml_models_active = len([m for m in active_models_status.get("models", {}).values() if m.get("loaded")])
        except Exception as e:
            logger.warning(f"Error checking ML models: {e}")
            ml_models_active = 0

        # Embeddings service status
        embeddings_service = "configured" if settings.AWS_ACCESS_KEY_ID else "not_configured"

        # User data statistics
        total_users = db.query(func.count(User.id)).scalar() or 0
        users_with_usernames = db.query(func.count(User.id)).filter(User.username != None).scalar() or 0
        users_with_addresses = db.query(func.count(User.id)).filter(User.address != None).scalar() or 0

        # Users with viewed products (assuming JSON array in User model)
        users_with_viewed_products = db.query(func.count(User.id)).filter(
            User.viewed_products != None
        ).scalar() or 0

        # Recent activity (last 24 hours)
        last_24h = datetime.utcnow() - timedelta(hours=24)

        orders_24h = db.query(func.count(Order.id)).filter(
            Order.created_at >= last_24h
        ).scalar() or 0

        new_users_24h = db.query(func.count(User.id)).filter(
            User.created_at >= last_24h
        ).scalar() or 0

        cod_orders_24h = db.query(func.count(Order.id)).filter(
            Order.created_at >= last_24h,
            Order.payment_method == "cash_on_delivery"
        ).scalar() or 0

        return {
            "system_health": {
                "database": database_health,
                "ml_models_active": ml_models_active,
                "embeddings_service": embeddings_service,
                "user_data_stats": {
                    "total_users": total_users,
                    "users_with_usernames": users_with_usernames,
                    "users_with_addresses": users_with_addresses,
                    "users_with_viewed_products": users_with_viewed_products,
                }
            },
            "recent_activity": {
                "orders_24h": orders_24h,
                "new_users_24h": new_users_24h,
                "cod_orders_24h": cod_orders_24h,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    except Exception as e:
        logger.error(f"Error getting system status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system status"
        )


@router.get("/config")
async def get_system_configuration(
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get system configuration and settings.

    Returns application name, version, enabled features, model configurations,
    and business settings.

    **Required Permission:** `system.settings`
    """
    try:
        # Determine which recommendation models are enabled
        recommendation_models_enabled = []

        try:
            model_manager = MLModelManager(settings.MODEL_STORAGE_PATH)
            cache_status = model_manager.get_cache_status()
            models = cache_status.get("models", {})

            if models.get("als", {}).get("loaded"):
                recommendation_models_enabled.append("collaborative")
            if models.get("content", {}).get("loaded"):
                recommendation_models_enabled.append("content_based")
            if any(models.values()):
                recommendation_models_enabled.append("ml_models")
        except Exception as e:
            logger.warning(f"Error checking model status: {e}")

        return {
            "app_name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "embedding_model": settings.BEDROCK_EMBEDDING_MODEL,
            "recommendation_models_enabled": recommendation_models_enabled,
            "analytics_retention_days": 365,  # Can be made configurable
            "admin_panel_enabled": True,
            "default_payment_method": "cash_on_delivery",
            "free_shipping_threshold": 50.00,  # Can be made configurable
        }

    except Exception as e:
        logger.error(f"Error getting system configuration: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system configuration"
        )
