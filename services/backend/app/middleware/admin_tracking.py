"""
Admin Activity Tracking Middleware.
Tracks admin user activities for audit purposes.
"""
import logging
import time
from typing import Callable, Optional

from fastapi import Request, Response
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.database import SessionLocal

logger = logging.getLogger(__name__)
settings = get_settings()


class AdminActivityTrackingMiddleware(BaseHTTPMiddleware):
    """Track admin user activities."""

    def __init__(self, app):
        super().__init__(app)
        self.admin_paths = ["/admin/", "/api/v1/admin/"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check if this is an admin request
        is_admin_request = any(
            request.url.path.startswith(path) for path in self.admin_paths
        )

        if not is_admin_request:
            return await call_next(request)

        # Get user ID from request
        user_id = await self._get_user_id_from_request(request)

        start_time = time.time()
        response = await call_next(request)

        # Record successful admin activities
        if user_id and response.status_code < 400:
            await self._record_admin_activity(
                user_id=user_id,
                request=request,
                response_time_ms=(time.time() - start_time) * 1000,
            )

        return response

    async def _get_user_id_from_request(self, request: Request) -> Optional[str]:
        """Extract user ID from request JWT token."""
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    payload = jwt.decode(
                        token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                    )
                    return payload.get("sub")
                except JWTError:
                    return None
            return None
        except Exception:
            return None

    async def _record_admin_activity(
        self, user_id: str, request: Request, response_time_ms: float
    ):
        """Record admin activity in database."""
        try:
            from app.models.admin import AdminActivity

            db = SessionLocal()
            try:
                activity = AdminActivity(
                    user_id=user_id,
                    action=f"{request.method} {request.url.path}",
                    resource_type="api_endpoint",
                    resource_id=request.url.path,
                    description=f"Admin API call to {request.url.path}",
                    ip_address=request.client.host,
                    user_agent=request.headers.get("User-Agent"),
                    activity_metadata={
                        "method": request.method,
                        "query_params": dict(request.query_params),
                        "response_time_ms": response_time_ms,
                    },
                )
                db.add(activity)
                db.commit()
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Failed to record admin activity: {e}")
