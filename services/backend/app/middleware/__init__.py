"""
Middleware Package.
Provides HTTP middleware for the FastAPI application.
"""

from app.middleware.admin_tracking import AdminActivityTrackingMiddleware
from app.middleware.cors import setup_cors
from app.middleware.error_tracking import ErrorTrackingMiddleware
from app.middleware.performance import PerformanceMonitoringMiddleware
from app.middleware.rate_limit import RateLimitingMiddleware
from app.middleware.redirect_cors import RedirectCORSMiddleware
from app.middleware.security import SecurityHeadersMiddleware

__all__ = [
    "setup_cors",
    "SecurityHeadersMiddleware",
    "PerformanceMonitoringMiddleware",
    "RateLimitingMiddleware",
    "ErrorTrackingMiddleware",
    "AdminActivityTrackingMiddleware",
]
