"""
CORS Middleware Configuration.
Handles Cross-Origin Resource Sharing for the API.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def setup_cors(app: FastAPI) -> None:
    """
    Configure CORS middleware for the application.
    
    Args:
        app: FastAPI application instance
    """
    if settings.BACKEND_CORS_ORIGINS:
        logger.info(f"CORS enabled for origins: {settings.BACKEND_CORS_ORIGINS}")
        
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["*"],
            expose_headers=["X-Response-Time", "X-Timestamp"],
            max_age=600,  # Cache preflight requests for 10 minutes
            allow_origin_regex=None,
        )
    else:
        logger.warning(
            "⚠️  CORS origins not configured - API may not be accessible from browser"
        )
