"""
Error Tracking Middleware.
Tracks and logs application errors.
"""
import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class ErrorTrackingMiddleware(BaseHTTPMiddleware):
    """Track and log application errors."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)

            # Log error responses
            if response.status_code >= 400:
                await self._log_error_response(request, response)

            return response

        except Exception as e:
            await self._log_unhandled_exception(request, e)
            raise

    async def _log_error_response(self, request: Request, response: Response):
        """Log error responses."""
        try:
            error_data = {
                "endpoint": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "user_agent": request.headers.get("User-Agent"),
                "ip_address": request.client.host,
                "timestamp": time.time(),
            }

            if response.status_code >= 500:
                logger.error(f"Server Error {response.status_code}: {error_data}")
            else:
                logger.warning(f"Client Error {response.status_code}: {error_data}")

        except Exception as e:
            logger.error(f"Failed to log error response: {e}")

    async def _log_unhandled_exception(self, request: Request, exception: Exception):
        """Log unhandled exceptions."""
        try:
            error_data = {
                "endpoint": request.url.path,
                "method": request.method,
                "exception_type": type(exception).__name__,
                "exception_message": str(exception),
                "ip_address": request.client.host,
                "timestamp": time.time(),
            }

            logger.exception(f"Unhandled Exception: {error_data}")

        except Exception as e:
            logger.error(f"Failed to log unhandled exception: {e}")
