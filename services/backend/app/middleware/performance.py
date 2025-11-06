"""
Performance Monitoring Middleware.
Tracks API response times and records metrics.
"""
import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.database import SessionLocal
from app.services.system_health_service import SystemHealthService

logger = logging.getLogger(__name__)


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware to monitor API performance and record metrics."""

    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
            "/static",
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Monitor request performance and record metrics."""
        
        # Skip monitoring for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        start_time = time.time()

        try:
            response = await call_next(request)
            response_time_ms = (time.time() - start_time) * 1000

            # Add response time headers
            response.headers["X-Response-Time"] = f"{response_time_ms:.2f}ms"
            response.headers["X-Timestamp"] = str(int(time.time()))

            # Record metrics asynchronously
            await self._record_metrics_async(
                endpoint=request.url.path,
                method=request.method,
                response_time_ms=response_time_ms,
                status_code=response.status_code,
            )

            return response

        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000

            # Record error metrics
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
        """Record performance metrics asynchronously."""
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
