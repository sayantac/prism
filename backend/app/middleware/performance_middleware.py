import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.database import SessionLocal
from app.services.system_health_service import SystemHealthService

logger = logging.getLogger(__name__)


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware to monitor API performance and record metrics"""

    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Monitor request performance and record metrics"""

        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        start_time = time.time()

        try:
            response = await call_next(request)

            response_time_ms = (time.time() - start_time) * 1000

            response.headers["X-Response-Time"] = f"{response_time_ms:.2f}ms"
            response.headers["X-Timestamp"] = str(int(time.time()))

            await self._record_metrics_async(
                endpoint=request.url.path,
                method=request.method,
                response_time_ms=response_time_ms,
                status_code=response.status_code,
            )

            return response

        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000

            await self._record_metrics_async(
                endpoint=request.url.path,
                method=request.method,
                response_time_ms=response_time_ms,
                status_code=500,
            )

            logger.error(f"Error processing request {request.url.path}: {e}")
            raise

    async def _record_metrics_async(
        self, endpoint: str, method: str, response_time_ms: float, status_code: int
    ):
        """Record performance metrics asynchronously"""
        try:
            db = SessionLocal()
            try:
                health_service = SystemHealthService(db)
                await health_service.record_api_metric(
                    endpoint=f"{method} {endpoint}",
                    response_time_ms=response_time_ms,
                    status_code=status_code,
                )
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Failed to record performance metric: {e}")


class DatabaseQueryMonitoringMiddleware:
    """Middleware to monitor database query performance"""

    def __init__(self, db_session):
        self.db = db_session

    async def record_query_metric(self, query_type: str, execution_time_ms: float):
        """Record database query performance metric"""
        try:
            health_service = SystemHealthService(self.db)
            await health_service.record_database_metric(query_type, execution_time_ms)
        except Exception as e:
            logger.error(f"Failed to record database metric: {e}")


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware"""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host
        current_minute = int(time.time() / 60)

        if current_minute not in self.request_counts:
            self.request_counts = {current_minute: {}}

        ip_requests = self.request_counts[current_minute].get(client_ip, 0)

        if ip_requests >= self.requests_per_minute:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )

        self.request_counts[current_minute][client_ip] = ip_requests + 1

        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https: wss:; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp

        return response


class AdminActivityTrackingMiddleware(BaseHTTPMiddleware):
    """Track admin user activities"""

    def __init__(self, app):
        super().__init__(app)
        self.admin_paths = ["/admin/", "/api/v1/admin/"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        is_admin_request = any(
            request.url.path.startswith(path) for path in self.admin_paths
        )

        if not is_admin_request:
            return await call_next(request)

        user_id = await self._get_user_id_from_request(request)

        start_time = time.time()
        response = await call_next(request)

        if user_id and response.status_code < 400:
            await self._record_admin_activity(
                user_id=user_id,
                request=request,
                response_time_ms=(time.time() - start_time) * 1000,
            )

        return response

    async def _get_user_id_from_request(self, request: Request) -> str:
        """Extract user ID from request (implement based on your auth system)"""
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                return "user_id_from_jwt"
            return None
        except Exception:
            return None

    async def _record_admin_activity(
        self, user_id: str, request: Request, response_time_ms: float
    ):
        """Record admin activity in database"""
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


class ErrorTrackingMiddleware(BaseHTTPMiddleware):
    """Track and log application errors"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)

            if response.status_code >= 400:
                await self._log_error_response(request, response)

            return response

        except Exception as e:
            await self._log_unhandled_exception(request, e)
            raise

    async def _log_error_response(self, request: Request, response: Response):
        """Log error responses"""
        try:
            error_data = {
                "endpoint": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "user_agent": request.headers.get("User-Agent"),
                "ip_address": request.client.host,
                "timestamp": time.time(),
            }

            logger.warning(f"HTTP Error {response.status_code}: {error_data}")

        except Exception as e:
            logger.error(f"Failed to log error response: {e}")
