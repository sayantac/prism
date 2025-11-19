"""
Rate Limiting Middleware.
Implements simple IP-based rate limiting.
"""
import logging
import time
from typing import Callable

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Simple IP-based rate limiting middleware."""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host
        current_minute = int(time.time() / 60)

        # Clean old minute data
        if current_minute not in self.request_counts:
            self.request_counts = {current_minute: {}}

        # Check rate limit
        ip_requests = self.request_counts[current_minute].get(client_ip, 0)

        if ip_requests >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )

        # Increment counter
        self.request_counts[current_minute][client_ip] = ip_requests + 1

        return await call_next(request)
