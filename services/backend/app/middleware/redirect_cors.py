"""
Middleware to add CORS headers to redirect responses.
FastAPI's automatic redirects don't preserve CORS headers.
"""
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import Headers, MutableHeaders
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RedirectCORSMiddleware(BaseHTTPMiddleware):
    """Add CORS headers to redirect responses"""
    
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # If it's a redirect, add CORS headers
        if 300 <= response.status_code < 400:
            origin = request.headers.get("origin")
            if origin and settings.BACKEND_CORS_ORIGINS:
                allowed_origins = [str(o) for o in settings.BACKEND_CORS_ORIGINS]
                if origin in allowed_origins:
                    # Create new mutable headers
                    response.headers["Access-Control-Allow-Origin"] = origin
                    response.headers["Access-Control-Allow-Credentials"] = "true"
                    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
                    response.headers["Access-Control-Allow-Headers"] = "*"
                    logger.info(f"Added CORS headers to redirect for origin: {origin}")
        
        return response
