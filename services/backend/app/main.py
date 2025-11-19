from app.middleware import RedirectCORSMiddleware
import argparse
import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.database import SessionLocal, engine
from app.middleware import (
    ErrorTrackingMiddleware,
    PerformanceMonitoringMiddleware,
    # SecurityHeadersMiddleware,
    setup_cors,
)
from app.models import Base
from app.services.system_health_service import SystemMonitor
from app.utils.logging_config import setup_logging
# from app.services.ml_engine_service import MLEngineService

settings = get_settings()


setup_logging()
logger = logging.getLogger(__name__)
system_monitor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global system_monitor

    logger.info("Launch:  Starting up ecommerce backend ...")

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # init_db(db)  # Commented out - database is restored from dump
        await _init_default_admin_settings(db)
        # ml_engine = MLEngineService(db)
        # ml_engine.train_all_models()
        # ml_engine.train_model(model_type="als", model_name="default_als_model")
    finally:
        db.close()

    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)

    try:
        system_monitor = SystemMonitor(SessionLocal)

        import asyncio

        asyncio.create_task(system_monitor.start_monitoring())
        logger.info("Success:  System monitoring started")
    except Exception as e:
        logger.error(f"Error:  Failed to start system monitoring: {e}")

    logger.info("Success:   startup complete")

    yield

    logger.info("Processing  Shutting down...")
    if system_monitor:
        await system_monitor.stop_monitoring()
    logger.info("Success:  Shutdown complete")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION + " - Admin Panel",
    lifespan=lifespan,
)


# ============================================================================
# Middleware Configuration
# ============================================================================
# Order matters! Middleware is executed top-to-bottom for requests
# and bottom-to-top for responses

# 1. Redirect CORS - Add CORS headers to redirects (must be before CORS middleware)
app.add_middleware(RedirectCORSMiddleware)

# 2. CORS - Must be early to handle preflight requests
setup_cors(app)

# 3. Security Headers - Add security headers to all responses
# app.add_middleware(SecurityHeadersMiddleware)

# 4. Error Tracking - Track and log errors
app.add_middleware(ErrorTrackingMiddleware)

# 5. Performance Monitoring - Track response times and metrics
app.add_middleware(PerformanceMonitoringMiddleware)

# Optional middleware (uncomment to enable):
# from app.middleware import RateLimitingMiddleware, AdminActivityTrackingMiddleware
# app.add_middleware(RateLimitingMiddleware, requests_per_minute=60)
# app.add_middleware(AdminActivityTrackingMiddleware)


# ============================================================================
# Static Files
# ============================================================================
app.mount("/static", StaticFiles(directory="static"), name="static")


# @app.middleware("http")
# async def enhanced_log_requests(request: Request, call_next):
#     start_time = time.time()

#     logger.info(
#         f"Web:  {request.method} {request.url.path} - "
#         f"Client: {request.client.host} - "
#         f"User-Agent: {request.headers.get('User-Agent', 'Unknown')[:50]}..."
#     )

#     response = await call_next(request)

#     process_time = time.time() - start_time
#     logger.info(
#         f"Success:  Response: {response.status_code} - "
#         f"Time: {process_time:.4f}s - "
#         f"Path: {request.url.path}"
#     )

#     response.headers["X-Process-Time"] = str(process_time)
#     return response


@app.exception_handler(HTTPException)
async def enhanced_http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(
        f"Warning:  HTTP Exception {exc.status_code} on {request.method} {request.url.path}: {exc.detail}"
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": getattr(exc, "error_code", None),
            "timestamp": time.time(),
            "path": request.url.path,
        },
    )


@app.get("/health")
async def health_check():
    """health check with system status"""
    try:
        db = SessionLocal()
        try:
            from app.services.system_health_service import SystemHealthService

            health_service = SystemHealthService(db)

            db_health = await health_service.check_database_connectivity()

            health_status = {
                "status": "healthy",
                "version": settings.VERSION,
                "timestamp": time.time(),
                "database": db_health,
                "system_monitor": "active"
                if system_monitor and system_monitor.is_running
                else "inactive",
                "features": {
                    "admin_panel": True,
                    "performance_monitoring": True,
                    "real_time_dashboard": True,
                },
            }

            if db_health.get("status") != "healthy":
                health_status["status"] = "degraded"

            return health_status

        finally:
            db.close()

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "version": settings.VERSION,
            "timestamp": time.time(),
            "error": str(e),
        }


@app.get("/admin-info")
async def get_admin_panel_info():
    """Get information about admin panel capabilities"""
    return {
        "admin_panel": {
            "version": "2.0.0",
            "features": [
                "Dashboard",
                "Real-time Metrics",
                "System Health Monitoring",
                "Performance Analytics",
                "Admin Activity Tracking",
                "Feature Flags",
                "System Configuration",
            ],
            "endpoints": {
                "dashboard": "/api/v1/admin/dashboard",
                "health": "/api/v1/admin/dashboard/system-health",
                "real_time": "/api/v1/admin/dashboard/real-time-stats",
                "performance": "/api/v1/admin/dashboard/performance-metrics",
            },
        },
        "monitoring": {
            "performance_tracking": True,
            "error_tracking": True,
            "security_headers": True,
            "rate_limiting": not settings.DEBUG,
            "admin_activity_tracking": True,
        },
    }


app.include_router(api_router, prefix=settings.API_V1_STR)


async def _init_default_admin_settings(db):
    """Initialize default admin settings and feature flags"""
    try:
        from app.models.admin import FeatureFlag, SystemSetting

        default_settings = [
            {
                "category": "general",
                "key": "site_name",
                "value": "Ecommerce Platform",
                "description": "Site display name",
            },
            {
                "category": "general",
                "key": "maintenance_mode",
                "value": "false",
                "data_type": "boolean",
                "description": "Enable maintenance mode",
            },
            {
                "category": "performance",
                "key": "cache_ttl_minutes",
                "value": "60",
                "data_type": "integer",
                "description": "Default cache TTL in minutes",
            },
            {
                "category": "admin",
                "key": "max_dashboard_widgets",
                "value": "12",
                "data_type": "integer",
                "description": "Maximum dashboard widgets per user",
            },
        ]

        for setting_data in default_settings:
            existing = (
                db.query(SystemSetting)
                .filter(
                    SystemSetting.category == setting_data["category"],
                    SystemSetting.key == setting_data["key"],
                )
                .first()
            )

            if not existing:
                setting = SystemSetting(**setting_data)
                db.add(setting)

        default_flags = [
            {
                "name": "enhanced_dashboard",
                "description": "Enable admin dashboard",
                "is_enabled": True,
                "rollout_percentage": 100,
            },
            {
                "name": "real_time_monitoring",
                "description": "Enable real-time system monitoring",
                "is_enabled": True,
                "rollout_percentage": 100,
            },
            {
                "name": "advanced_analytics",
                "description": "Enable advanced analytics features",
                "is_enabled": False,
                "rollout_percentage": 0,
            },
        ]

        for flag_data in default_flags:
            existing = (
                db.query(FeatureFlag)
                .filter(FeatureFlag.name == flag_data["name"])
                .first()
            )

            if not existing:
                flag = FeatureFlag(**flag_data)
                db.add(flag)

        db.commit()
        logger.info("Success:  Default admin settings and feature flags initialized")

    except Exception as e:
        logger.error(f"Error:  Failed to initialize default admin settings: {e}")
        db.rollback()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.LOG_LEVEL.lower(),
    )
