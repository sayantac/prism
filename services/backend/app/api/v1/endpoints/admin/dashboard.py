import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_permission
from app.models import User
from app.services.admin_dashboard_service import AdminDashboardService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/real-time-stats")
async def get_real_time_stats(
    current_user: User = Depends(require_permission("admin_dashboard")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get real-time business metrics including:
    - Revenue (today, 24h, growth)
    - Orders (count, growth, hourly)
    - Users (new, active)
    - Searches and conversions
    """
    try:
        dashboard_service = AdminDashboardService(db)
        stats = dashboard_service.get_real_time_stats()

        return {
            "status": "success",
            "data": stats,
            "generated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting real-time stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve real-time statistics",
        )


@router.get("/system-health")
async def get_system_health(
    current_user: User = Depends(require_permission("view_system_health")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get comprehensive system health status:
    - Database connectivity and performance
    - API response times and error rates
    - ML models status
    """
    try:
        dashboard_service = AdminDashboardService(db)
        health_data = dashboard_service.get_system_health()

        return {"status": "success", "data": health_data}

    except Exception as e:
        logger.error(f"Error getting system health: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system health data",
        )


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(50, ge=1, le=200, description="Number of activities to return"),
    hours: int = Query(24, ge=1, le=168, description="Hours to look back"),
    activity_type: str = Query(None, description="Filter by activity type"),
    current_user: User = Depends(require_permission("view_audit_logs")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get recent admin and system activities:
    - User actions (login, logout, changes)
    - Data modifications (CRUD operations)
    """
    try:
        dashboard_service = AdminDashboardService(db)
        activities = dashboard_service.get_recent_activity(limit=limit)

        if activity_type:
            activities = [a for a in activities if a.get("type") == activity_type]

        return {
            "status": "success",
            "data": {
                "activities": activities,
                "total_count": len(activities),
                "filter_applied": {
                    "hours": hours,
                    "limit": limit,
                    "activity_type": activity_type,
                },
            },
        }

    except Exception as e:
        logger.error(f"Error getting recent activity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recent activities",
        )


@router.get("/performance-metrics")
async def get_performance_metrics(
    current_user: User = Depends(require_permission("view_system_health")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get system performance metrics:
    - API response times (avg, min, max)
    - Database query performance
    - Error rates and trends
    - Search performance metrics
    """
    try:
        dashboard_service = AdminDashboardService(db)
        metrics = dashboard_service.get_performance_metrics()

        return {"status": "success", "data": metrics}

    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve performance metrics",
        )


@router.get("/quick-stats")
async def get_quick_stats(
    current_user: User = Depends(require_permission("admin_dashboard")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get condensed dashboard stats for quick overview:
    - Key metrics summary
    - System status indicators
    """
    try:
        dashboard_service = AdminDashboardService(db)

        real_time_stats = dashboard_service.get_real_time_stats()
        health_data = dashboard_service.get_system_health()

        quick_stats = {
            "revenue_today": real_time_stats.get("revenue", {}).get("today", 0),
            "orders_today": real_time_stats.get("orders", {}).get("today", 0),
            "new_users_today": real_time_stats.get("users", {}).get("new_today", 0),
            "system_status": health_data.get("overall_status", "unknown"),
            "performance_score": _calculate_performance_score(health_data),
        }

        return {
            "status": "success",
            "data": quick_stats,
            "generated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting quick stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quick statistics",
        )


@router.get("/trends")
async def get_dashboard_trends(
    days: int = Query(7, ge=1, le=30, description="Number of days to analyze"),
    metric: str = Query(
        "revenue",
        pattern="^(revenue|orders|users|searches)$",
        description="Metric to trend",
    ),
    current_user: User = Depends(require_permission("admin_dashboard")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get trend data for dashboard charts:
    - Revenue trends over time
    - Order volume trends
    - User registration trends
    - Search activity trends
    """
    try:
        dashboard_service = AdminDashboardService(db)

        trend_data = {
            "metric": metric,
            "period_days": days,
            "data_points": _generate_trend_data(metric, days, db),
            "summary": {
                "total": 0,
                "average": 0,
                "growth_rate": 0,
                "trend_direction": "stable",
            },
        }

        return {
            "status": "success",
            "data": trend_data,
            "generated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting dashboard trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trend data",
        )


@router.get("/widget-data/{widget_type}")
async def get_widget_data(
    widget_type: str,
    current_user: User = Depends(require_permission("admin_dashboard")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get data for specific dashboard widgets:
    - revenue_chart
    - orders_chart
    - users_chart
    - top_products
    - recent_orders
    - system_status
    """
    try:
        dashboard_service = AdminDashboardService(db)

        widget_data = {}

        if widget_type == "revenue_chart":
            widget_data = _get_revenue_chart_data(dashboard_service)
        elif widget_type == "orders_chart":
            widget_data = _get_orders_chart_data(dashboard_service)
        elif widget_type == "users_chart":
            widget_data = _get_users_chart_data(dashboard_service)
        elif widget_type == "top_products":
            widget_data = _get_top_products_data(db)
        elif widget_type == "recent_orders":
            widget_data = _get_recent_orders_data(db)
        elif widget_type == "system_status":
            widget_data = dashboard_service.get_system_health()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown widget type: {widget_type}",
            )

        return {
            "status": "success",
            "widget_type": widget_type,
            "data": widget_data,
            "generated_at": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting widget data for {widget_type}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve {widget_type} data",
        )


def _calculate_performance_score(health_data: Dict[str, Any]) -> int:
    """Calculate overall performance score (0-100)"""
    try:
        components = health_data.get("components", {})
        if not components:
            return 50

        scores = []
        for component_name, component_data in components.items():
            status = component_data.get("status", "unknown")
            if status == "healthy":
                scores.append(100)
            elif status == "warning":
                scores.append(70)
            elif status == "critical":
                scores.append(30)
            else:
                scores.append(50)

        return int(sum(scores) / len(scores))
    except Exception:
        return 50


def _generate_trend_data(metric: str, days: int, db: Session) -> List[Dict[str, Any]]:
    """Generate trend data points for the specified metric"""
    try:
        from datetime import date, timedelta

        data_points = []
        base_date = date.today() - timedelta(days=days - 1)

        for i in range(days):
            current_date = base_date + timedelta(days=i)

            if metric == "revenue":
                value = _get_daily_revenue(db, current_date)
            elif metric == "orders":
                value = _get_daily_orders(db, current_date)
            elif metric == "users":
                value = _get_daily_users(db, current_date)
            elif metric == "searches":
                value = _get_daily_searches(db, current_date)
            else:
                value = 0

            data_points.append({"date": current_date.isoformat(), "value": value})

        return data_points
    except Exception as e:
        logger.error(f"Error generating trend data: {e}")
        return []


def _get_daily_revenue(db: Session, date) -> float:
    """Get revenue for a specific date"""
    try:
        from sqlalchemy import func

        from app.models import Order

        start_date = datetime.combine(date, datetime.min.time())
        end_date = start_date + timedelta(days=1)

        result = (
            db.query(func.sum(Order.total_amount))
            .filter(Order.created_at >= start_date)
            .filter(Order.created_at < end_date)
            .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
            .scalar()
        )

        return float(result) if result else 0.0
    except Exception:
        return 0.0


def _get_daily_orders(db: Session, date) -> int:
    """Get order count for a specific date"""
    try:
        from sqlalchemy import func

        from app.models import Order

        start_date = datetime.combine(date, datetime.min.time())
        end_date = start_date + timedelta(days=1)

        result = (
            db.query(func.count(Order.id))
            .filter(Order.created_at >= start_date)
            .filter(Order.created_at < end_date)
            .scalar()
        )

        return result or 0
    except Exception:
        return 0


def _get_daily_users(db: Session, date) -> int:
    """Get new user count for a specific date"""
    try:
        from sqlalchemy import func

        from app.models import User

        start_date = datetime.combine(date, datetime.min.time())
        end_date = start_date + timedelta(days=1)

        result = (
            db.query(func.count(User.id))
            .filter(User.created_at >= start_date)
            .filter(User.created_at < end_date)
            .scalar()
        )

        return result or 0
    except Exception:
        return 0


def _get_daily_searches(db: Session, date) -> int:
    """Get search count for a specific date"""
    try:
        from sqlalchemy import func

        from app.models import SearchAnalytics

        start_date = datetime.combine(date, datetime.min.time())
        end_date = start_date + timedelta(days=1)

        result = (
            db.query(func.count(SearchAnalytics.id))
            .filter(SearchAnalytics.timestamp >= start_date)
            .filter(SearchAnalytics.timestamp < end_date)
            .scalar()
        )

        return result or 0
    except Exception:
        return 0


def _get_revenue_chart_data(dashboard_service: AdminDashboardService) -> Dict[str, Any]:
    """Get revenue chart data for widget"""

    return {
        "chart_type": "line",
        "title": "Revenue Trend",
        "data": [],
        "labels": [],
        "currency": "USD",
    }


def _get_orders_chart_data(dashboard_service: AdminDashboardService) -> Dict[str, Any]:
    """Get orders chart data for widget"""

    return {"chart_type": "bar", "title": "Orders Trend", "data": [], "labels": []}


def _get_users_chart_data(dashboard_service: AdminDashboardService) -> Dict[str, Any]:
    """Get users chart data for widget"""

    return {
        "chart_type": "area",
        "title": "User Registration Trend",
        "data": [],
        "labels": [],
    }


def _get_top_products_data(db: Session) -> Dict[str, Any]:
    """Get top selling products data"""
    try:
        from datetime import timedelta

        from sqlalchemy import desc, func

        from app.models import Order, OrderItem, Product

        last_7_days = datetime.utcnow() - timedelta(days=7)

        top_products = (
            db.query(
                Product.id,
                Product.name,
                Product.price,
                func.sum(OrderItem.quantity).label("total_sold"),
                func.sum(OrderItem.total_price).label("total_revenue"),
            )
            .join(OrderItem, Product.id == OrderItem.product_id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.created_at >= last_7_days)
            .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
            .group_by(Product.id, Product.name, Product.price)
            .order_by(desc("total_sold"))
            .limit(10)
            .all()
        )

        products_data = []
        for product in top_products:
            products_data.append(
                {
                    "id": str(product.id),
                    "name": product.name,
                    "price": float(product.price),
                    "total_sold": product.total_sold,
                    "total_revenue": float(product.total_revenue),
                }
            )

        return {
            "title": "Top Selling Products (Last 7 Days)",
            "products": products_data,
        }

    except Exception as e:
        logger.error(f"Error getting top products data: {e}")
        return {"title": "Top Selling Products", "products": []}


def _get_recent_orders_data(db: Session) -> Dict[str, Any]:
    """Get recent orders data"""
    try:
        from sqlalchemy import desc

        from app.models import Order, User

        recent_orders = (
            db.query(Order)
            .join(User, Order.user_id == User.id)
            .order_by(desc(Order.created_at))
            .limit(10)
            .all()
        )

        orders_data = []
        for order in recent_orders:
            orders_data.append(
                {
                    "id": str(order.id),
                    "order_number": order.order_number,
                    "customer_name": order.user.first_name if order.user else "Unknown",
                    "total_amount": float(order.total_amount),
                    "status": order.status,
                    "created_at": order.created_at.isoformat(),
                }
            )

        return {"title": "Recent Orders", "orders": orders_data}

    except Exception as e:
        logger.error(f"Error getting recent orders data: {e}")
        return {"title": "Recent Orders", "orders": []}
