import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, desc, distinct, func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_permission
from app.models import (
    AuditLog, ProductCategory as Category,
    Order,
    OrderItem,
    Product,
    RecommendationResult,
    SearchAnalytics,
    User,
    UserSegment,
    UserSegmentMembership,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/dashboard/overview")
async def admin_dashboard_overview(
    current_user: User = Depends(require_permission("admin_dashboard")),
    db: Session = Depends(get_db),
):
    """Admin: Get comprehensive dashboard overview"""

    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    last_7_days = today - timedelta(days=7)
    last_30_days = today - timedelta(days=30)

    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.is_active == True).count()
    out_of_stock = (
        db.query(Product)
        .filter(and_(Product.is_active == True, Product.in_stock == False))
        .count()
    )

    total_users = db.query(User).filter(User.is_active == True).count()
    new_users_today = db.query(User).filter(func.date(User.created_at) == today).count()

    total_orders = db.query(Order).count()
    orders_today = db.query(Order).filter(func.date(Order.created_at) == today).count()
    orders_pending = db.query(Order).filter(Order.status == "pending").count()

    total_revenue = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .scalar()
        or 0
    )

    revenue_today = (
        db.query(func.sum(Order.total_amount))
        .filter(func.date(Order.created_at) == today)
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .scalar()
        or 0
    )

    revenue_last_7_days = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.created_at >= last_7_days)
        .filter(Order.status.in_(["confirmed", "shipped", "delivered"]))
        .scalar()
        or 0
    )

    total_searches = db.query(SearchAnalytics).count()
    searches_today = (
        db.query(SearchAnalytics)
        .filter(func.date(SearchAnalytics.timestamp) == today)
        .count()
    )

    recent_orders = db.query(Order).order_by(desc(Order.created_at)).limit(5).all()

    recent_users = (
        db.query(User)
        .filter(User.is_active == True)
        .order_by(desc(User.created_at))
        .limit(5)
        .all()
    )

    return {
        "products": {
            "total": total_products,
            "active": active_products,
            "out_of_stock": out_of_stock,
            "stock_percentage": (active_products - out_of_stock) / active_products * 100
            if active_products
            else 0,
        },
        "users": {"total": total_users, "new_today": new_users_today},
        "orders": {
            "total": total_orders,
            "today": orders_today,
            "pending": orders_pending,
        },
        "revenue": {
            "total": float(total_revenue),
            "today": float(revenue_today),
            "last_7_days": float(revenue_last_7_days),
        },
        "search": {"total": total_searches, "today": searches_today},
        "recent_activity": {
            "orders": [
                {
                    "id": str(order.id),
                    "order_number": order.order_number,
                    "total_amount": float(order.total_amount),
                    "status": order.status,
                    "created_at": order.created_at,
                }
                for order in recent_orders
            ],
            "users": [
                {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "created_at": user.created_at,
                }
                for user in recent_users
            ],
        },
    }


@router.get("/user-behavior/summary")
async def admin_user_behavior_summary(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission("view_analytics")),
    db: Session = Depends(get_db),
):
    """Admin: Get user behavior analytics summary"""

    since_date = datetime.utcnow() - timedelta(days=days)

    user_actions = (
        db.query(AuditLog.action, func.count(AuditLog.id).label("count"))
        .filter(AuditLog.timestamp >= since_date)
        .group_by(AuditLog.action)
        .all()
    )

    most_viewed = (
        db.query(AuditLog.entity_id, func.count(AuditLog.id).label("view_count"))
        .filter(AuditLog.action == "VIEW_PRODUCT")
        .filter(AuditLog.timestamp >= since_date)
        .group_by(AuditLog.entity_id)
        .order_by(desc("view_count"))
        .limit(10)
        .all()
    )

    most_viewed_products = []
    for view_data in most_viewed:
        product = db.query(Product).filter(Product.id == view_data.entity_id).first()

        if product:
            most_viewed_products.append(
                {
                    "product_id": str(product.id),
                    "name": product.name,
                    "brand": product.brand,
                    "view_count": view_data.view_count,
                }
            )

    active_users = (
        db.query(func.count(func.distinct(AuditLog.user_id)))
        .filter(AuditLog.timestamp >= since_date)
        .scalar()
        or 0
    )

    return {
        "period_days": days,
        "active_users": active_users,
        "user_actions": {action: count for action, count in user_actions},
        "most_viewed_products": most_viewed_products,
    }


@router.get("/dashboard")
async def get_admin_dashboard_metrics(
    days: int = Query(30, ge=1, le=365, description="Number of days for metrics"),
    current_user: User = Depends(require_permission("analytics.view")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get comprehensive admin dashboard metrics.

    Provides detailed analytics including orders, users, products, search,
    and recommendation performance over the specified time period.

    **Required Permission:** `analytics.view`
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        end_date = datetime.utcnow()

        # Orders metrics
        total_orders = db.query(func.count(Order.id)).filter(
            Order.created_at >= cutoff_date,
            Order.status.notin_(["cancelled", "refunded"])
        ).scalar() or 0

        total_revenue_raw = db.query(func.sum(Order.total_amount)).filter(
            Order.created_at >= cutoff_date,
            Order.status.notin_(["cancelled", "refunded"])
        ).scalar()
        total_revenue = float(total_revenue_raw) if total_revenue_raw else 0.0

        avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0

        # Status breakdown
        status_counts = db.query(Order.status, func.count(Order.id)).filter(
            Order.created_at >= cutoff_date
        ).group_by(Order.status).all()
        status_breakdown = {status: count for status, count in status_counts}

        # Payment method breakdown
        payment_counts = db.query(Order.payment_method, func.count(Order.id)).filter(
            Order.created_at >= cutoff_date,
            Order.status.notin_(["cancelled", "refunded"])
        ).group_by(Order.payment_method).all()
        payment_method_breakdown = {method or "unknown": count for method, count in payment_counts}

        # Recommendation source breakdown
        rec_source_counts = db.query(Order.recommendation_source, func.count(Order.id)).filter(
            Order.created_at >= cutoff_date,
            Order.status.notin_(["cancelled", "refunded"])
        ).group_by(Order.recommendation_source).all()
        recommendation_source_breakdown = {source or "direct": count for source, count in rec_source_counts}

        # Daily trend (last 30 days of period)
        daily_trend = []
        for i in range(min(days, 30)):
            day_start = (end_date - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)

            day_orders = db.query(func.count(Order.id)).filter(
                Order.created_at >= day_start,
                Order.created_at < day_end,
                Order.status.notin_(["cancelled", "refunded"])
            ).scalar() or 0

            day_revenue_raw = db.query(func.sum(Order.total_amount)).filter(
                Order.created_at >= day_start,
                Order.created_at < day_end,
                Order.status.notin_(["cancelled", "refunded"])
            ).scalar()
            day_revenue = float(day_revenue_raw) if day_revenue_raw else 0.0

            daily_trend.insert(0, {
                "date": day_start.strftime("%Y-%m-%d"),
                "orders": day_orders,
                "revenue": round(day_revenue, 2)
            })

        # Users metrics
        new_users = db.query(func.count(User.id)).filter(
            User.created_at >= cutoff_date
        ).scalar() or 0

        active_users = db.query(func.count(distinct(Order.user_id))).filter(
            Order.created_at >= cutoff_date
        ).scalar() or 0

        total_users = db.query(func.count(User.id)).scalar() or 0
        retention_rate = round((active_users / total_users) * 100, 2) if total_users > 0 else 0.0

        users_with_addresses = db.query(func.count(User.id)).filter(
            User.address != None
        ).scalar() or 0

        users_with_viewed_products = db.query(func.count(User.id)).filter(
            User.viewed_products != None
        ).scalar() or 0

        # Products metrics - Top products
        top_products_data = db.query(
            Product.name,
            Product.code,
            func.sum(OrderItem.quantity).label("quantity_sold"),
            func.sum(OrderItem.quantity * OrderItem.price).label("revenue")
        ).join(OrderItem).join(Order).filter(
            Order.created_at >= cutoff_date,
            Order.status.notin_(["cancelled", "refunded"])
        ).group_by(Product.id, Product.name, Product.code).order_by(desc("revenue")).limit(10).all()

        top_products = []
        for prod in top_products_data:
            top_products.append({
                "name": prod.name,
                "code": prod.code,
                "quantity_sold": int(prod.quantity_sold) if prod.quantity_sold else 0,
                "revenue": round(float(prod.revenue), 2) if prod.revenue else 0.0
            })

        # Category performance
        category_performance_data = db.query(
            Category.id,
            Category.name,
            func.count(distinct(Order.id)).label("orders"),
            func.sum(Order.total_amount).label("revenue")
        ).join(Product, Product.category_id == Category.id).join(
            OrderItem, OrderItem.product_id == Product.id
        ).join(Order).filter(
            Order.created_at >= cutoff_date,
            Order.status.notin_(["cancelled", "refunded"])
        ).group_by(Category.id, Category.name).all()

        category_performance = []
        for cat in category_performance_data:
            category_performance.append({
                "category_id": str(cat.id),
                "category_name": cat.name,
                "orders": cat.orders,
                "revenue": round(float(cat.revenue), 2) if cat.revenue else 0.0
            })

        # Search metrics
        total_searches = db.query(func.count(SearchAnalytics.id)).filter(
            SearchAnalytics.created_at >= cutoff_date
        ).scalar() or 0

        searches_with_clicks = db.query(func.count(SearchAnalytics.id)).filter(
            SearchAnalytics.created_at >= cutoff_date,
            SearchAnalytics.clicked_product_id != None
        ).scalar() or 0

        click_through_rate = round((searches_with_clicks / total_searches) * 100, 2) if total_searches > 0 else 0.0

        avg_response_time_raw = db.query(func.avg(SearchAnalytics.response_time_ms)).filter(
            SearchAnalytics.created_at >= cutoff_date,
            SearchAnalytics.response_time_ms != None
        ).scalar()
        average_response_time_ms = round(float(avg_response_time_raw), 0) if avg_response_time_raw else 0

        zero_results = db.query(func.count(SearchAnalytics.id)).filter(
            SearchAnalytics.created_at >= cutoff_date,
            SearchAnalytics.results_count == 0
        ).scalar() or 0

        zero_result_rate = round((zero_results / total_searches) * 100, 2) if total_searches > 0 else 0.0

        unique_queries = db.query(func.count(distinct(SearchAnalytics.query))).filter(
            SearchAnalytics.created_at >= cutoff_date
        ).scalar() or 0

        # Recommendations metrics
        total_recommendations = db.query(func.count(RecommendationResult.id)).filter(
            RecommendationResult.created_at >= cutoff_date
        ).scalar() or 0

        clicked_recommendations = db.query(func.count(RecommendationResult.id)).filter(
            RecommendationResult.created_at >= cutoff_date,
            RecommendationResult.interaction_type == "click"
        ).scalar() or 0

        overall_click_rate = round((clicked_recommendations / total_recommendations) * 100, 2) if total_recommendations > 0 else 0.0

        converted_recommendations = db.query(func.count(RecommendationResult.id)).filter(
            RecommendationResult.created_at >= cutoff_date,
            RecommendationResult.interaction_type == "purchase"
        ).scalar() or 0

        overall_conversion_rate = round((converted_recommendations / total_recommendations) * 100, 2) if total_recommendations > 0 else 0.0

        # Algorithm performance
        algorithms = db.query(distinct(RecommendationResult.algorithm_used)).filter(
            RecommendationResult.created_at >= cutoff_date,
            RecommendationResult.algorithm_used != None
        ).all()

        algorithm_performance = []
        for (algo,) in algorithms:
            algo_total = db.query(func.count(RecommendationResult.id)).filter(
                RecommendationResult.created_at >= cutoff_date,
                RecommendationResult.algorithm_used == algo
            ).scalar() or 0

            algo_clicks = db.query(func.count(RecommendationResult.id)).filter(
                RecommendationResult.created_at >= cutoff_date,
                RecommendationResult.algorithm_used == algo,
                RecommendationResult.interaction_type == "click"
            ).scalar() or 0

            algo_conversions = db.query(func.count(RecommendationResult.id)).filter(
                RecommendationResult.created_at >= cutoff_date,
                RecommendationResult.algorithm_used == algo,
                RecommendationResult.interaction_type == "purchase"
            ).scalar() or 0

            algo_avg_score = db.query(func.avg(RecommendationResult.score)).filter(
                RecommendationResult.created_at >= cutoff_date,
                RecommendationResult.algorithm_used == algo,
                RecommendationResult.score != None
            ).scalar()

            algorithm_performance.append({
                "algorithm": algo,
                "total_recommendations": algo_total,
                "click_rate": round((algo_clicks / algo_total) * 100, 2) if algo_total > 0 else 0.0,
                "conversion_rate": round((algo_conversions / algo_total) * 100, 2) if algo_total > 0 else 0.0,
                "average_score": round(float(algo_avg_score), 2) if algo_avg_score else 0.0
            })

        return {
            "period": {
                "start_date": cutoff_date.isoformat() + "Z",
                "end_date": end_date.isoformat() + "Z"
            },
            "orders": {
                "total_orders": total_orders,
                "total_revenue": round(total_revenue, 2),
                "average_order_value": avg_order_value,
                "status_breakdown": status_breakdown,
                "payment_method_breakdown": payment_method_breakdown,
                "recommendation_source_breakdown": recommendation_source_breakdown,
                "daily_trend": daily_trend
            },
            "users": {
                "new_users": new_users,
                "active_users": active_users,
                "retention_rate": retention_rate,
                "users_with_addresses": users_with_addresses,
                "users_with_viewed_products": users_with_viewed_products
            },
            "products": {
                "top_products": top_products,
                "category_performance": category_performance
            },
            "search": {
                "total_searches": total_searches,
                "click_through_rate": click_through_rate,
                "average_response_time_ms": average_response_time_ms,
                "zero_result_rate": zero_result_rate,
                "unique_queries": unique_queries
            },
            "recommendations": {
                "total_recommendations": total_recommendations,
                "overall_click_rate": overall_click_rate,
                "overall_conversion_rate": overall_conversion_rate,
                "algorithm_performance": algorithm_performance
            }
        }

    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard metrics"
        )


@router.get("/kpis")
async def get_kpis(
    days: int = Query(30, ge=1, le=365, description="Number of days for KPIs"),
    current_user: User = Depends(require_permission("analytics.view")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get Key Performance Indicators (KPIs).

    Returns critical business metrics including conversion rate, revenue per user,
    recommendation performance, search success, and user retention.

    **Required Permission:** `analytics.view`
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Conversion rate: Orders / Unique users with activity
        total_orders = db.query(func.count(distinct(Order.id))).filter(
            Order.created_at >= cutoff_date,
            Order.status.notin_(["cancelled", "refunded"])
        ).scalar() or 0

        active_users = db.query(func.count(distinct(Order.user_id))).filter(
            Order.created_at >= cutoff_date
        ).scalar() or 0

        conversion_rate = round((total_orders / active_users) * 100, 2) if active_users > 0 else 0.0

        # Average order value
        total_revenue_raw = db.query(func.sum(Order.total_amount)).filter(
            Order.created_at >= cutoff_date,
            Order.status.notin_(["cancelled", "refunded"])
        ).scalar()
        total_revenue = float(total_revenue_raw) if total_revenue_raw else 0.0

        average_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0

        # Revenue per user
        total_users = db.query(func.count(User.id)).scalar() or 1
        revenue_per_user = round(total_revenue / total_users, 2)

        # COD adoption rate
        cod_orders = db.query(func.count(Order.id)).filter(
            Order.created_at >= cutoff_date,
            Order.payment_method == "cash_on_delivery"
        ).scalar() or 0

        cod_adoption_rate = round((cod_orders / total_orders) * 100, 2) if total_orders > 0 else 0.0

        # Recommendation metrics
        total_recs = db.query(func.count(RecommendationResult.id)).filter(
            RecommendationResult.created_at >= cutoff_date
        ).scalar() or 0

        clicked_recs = db.query(func.count(RecommendationResult.id)).filter(
            RecommendationResult.created_at >= cutoff_date,
            RecommendationResult.interaction_type == "click"
        ).scalar() or 0

        converted_recs = db.query(func.count(RecommendationResult.id)).filter(
            RecommendationResult.created_at >= cutoff_date,
            RecommendationResult.interaction_type == "purchase"
        ).scalar() or 0

        recommendation_click_rate = round((clicked_recs / total_recs) * 100, 2) if total_recs > 0 else 0.0
        recommendation_conversion_rate = round((converted_recs / total_recs) * 100, 2) if total_recs > 0 else 0.0

        # Algorithm-specific performance
        def get_algorithm_performance(algorithm: str) -> float:
            algo_total = db.query(func.count(RecommendationResult.id)).filter(
                RecommendationResult.created_at >= cutoff_date,
                RecommendationResult.algorithm_used == algorithm
            ).scalar() or 0

            algo_clicks = db.query(func.count(RecommendationResult.id)).filter(
                RecommendationResult.created_at >= cutoff_date,
                RecommendationResult.algorithm_used == algorithm,
                RecommendationResult.interaction_type == "click"
            ).scalar() or 0

            return round((algo_clicks / algo_total) * 100, 2) if algo_total > 0 else 0.0

        collaborative_algorithm_performance = get_algorithm_performance("collaborative")
        content_algorithm_performance = get_algorithm_performance("content_based")
        hybrid_algorithm_performance = get_algorithm_performance("hybrid")

        # Search metrics
        total_searches = db.query(func.count(SearchAnalytics.id)).filter(
            SearchAnalytics.created_at >= cutoff_date
        ).scalar() or 0

        searches_with_results = db.query(func.count(SearchAnalytics.id)).filter(
            SearchAnalytics.created_at >= cutoff_date,
            SearchAnalytics.results_count > 0
        ).scalar() or 0

        search_success_rate = round((searches_with_results / total_searches) * 100, 2) if total_searches > 0 else 0.0

        searches_with_clicks = db.query(func.count(SearchAnalytics.id)).filter(
            SearchAnalytics.created_at >= cutoff_date,
            SearchAnalytics.clicked_product_id != None
        ).scalar() or 0

        search_click_through_rate = round((searches_with_clicks / total_searches) * 100, 2) if total_searches > 0 else 0.0

        avg_search_time = db.query(func.avg(SearchAnalytics.response_time_ms)).filter(
            SearchAnalytics.created_at >= cutoff_date,
            SearchAnalytics.response_time_ms != None
        ).scalar()
        average_search_response_time = round(float(avg_search_time), 0) if avg_search_time else 0

        zero_results = db.query(func.count(SearchAnalytics.id)).filter(
            SearchAnalytics.created_at >= cutoff_date,
            SearchAnalytics.results_count == 0
        ).scalar() or 0

        zero_result_rate = round((zero_results / total_searches) * 100, 2) if total_searches > 0 else 0.0

        # User retention and activation
        user_retention_rate = round((active_users / total_users) * 100, 2) if total_users > 0 else 0.0

        new_users = db.query(func.count(User.id)).filter(
            User.created_at >= cutoff_date
        ).scalar() or 0

        new_user_percentage = round((new_users / total_users) * 100, 2) if total_users > 0 else 0.0

        activated_new_users = db.query(func.count(distinct(User.id))).filter(
            User.created_at >= cutoff_date,
            User.id.in_(
                db.query(Order.user_id).filter(Order.created_at >= cutoff_date)
            )
        ).scalar() or 0

        user_activation_rate = round((activated_new_users / new_users) * 100, 2) if new_users > 0 else 0.0

        return {
            "conversion_rate": conversion_rate,
            "average_order_value": average_order_value,
            "revenue_per_user": revenue_per_user,
            "cod_adoption_rate": cod_adoption_rate,
            "recommendation_click_rate": recommendation_click_rate,
            "recommendation_conversion_rate": recommendation_conversion_rate,
            "collaborative_algorithm_performance": collaborative_algorithm_performance,
            "content_algorithm_performance": content_algorithm_performance,
            "hybrid_algorithm_performance": hybrid_algorithm_performance,
            "search_success_rate": search_success_rate,
            "search_click_through_rate": search_click_through_rate,
            "average_search_response_time": average_search_response_time,
            "zero_result_rate": zero_result_rate,
            "user_retention_rate": user_retention_rate,
            "new_user_percentage": new_user_percentage,
            "user_activation_rate": user_activation_rate
        }

    except Exception as e:
        logger.error(f"Error getting KPIs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve KPIs"
        )


@router.get("/recommendations/performance")
async def get_recommendation_performance(
    algorithm: Optional[str] = Query(None, description="Filter by algorithm (collaborative, content_based, hybrid)"),
    days: int = Query(30, ge=1, le=365, description="Time period in days"),
    current_user: User = Depends(require_permission("analytics.view_detailed")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get detailed recommendation performance analytics.

    Provides algorithm-specific metrics including click rates, conversions,
    daily performance trends, and top performing products.

    **Required Permission:** `analytics.view_detailed`
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        end_date = datetime.utcnow()

        # Build base query
        query_filter = [RecommendationResult.created_at >= cutoff_date]
        if algorithm:
            query_filter.append(RecommendationResult.algorithm_used == algorithm)

        # Total recommendations
        total_recommendations = db.query(func.count(RecommendationResult.id)).filter(
            *query_filter
        ).scalar() or 0

        # Total clicks
        total_clicks = db.query(func.count(RecommendationResult.id)).filter(
            *query_filter,
            RecommendationResult.interaction_type == "click"
        ).scalar() or 0

        # Total conversions
        total_conversions = db.query(func.count(RecommendationResult.id)).filter(
            *query_filter,
            RecommendationResult.interaction_type == "purchase"
        ).scalar() or 0

        # Rates
        click_rate = round((total_clicks / total_recommendations) * 100, 2) if total_recommendations > 0 else 0.0
        conversion_rate = round((total_conversions / total_recommendations) * 100, 2) if total_recommendations > 0 else 0.0

        # Average score
        avg_score_raw = db.query(func.avg(RecommendationResult.score)).filter(
            *query_filter,
            RecommendationResult.score != None
        ).scalar()
        average_score = round(float(avg_score_raw), 2) if avg_score_raw else 0.0

        # Performance by day (last 30 days)
        performance_by_day = []
        for i in range(min(days, 30)):
            day_start = (end_date - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)

            day_filter = query_filter + [
                RecommendationResult.created_at >= day_start,
                RecommendationResult.created_at < day_end
            ]

            day_recs = db.query(func.count(RecommendationResult.id)).filter(*day_filter).scalar() or 0
            day_clicks = db.query(func.count(RecommendationResult.id)).filter(
                *day_filter,
                RecommendationResult.interaction_type == "click"
            ).scalar() or 0
            day_conversions = db.query(func.count(RecommendationResult.id)).filter(
                *day_filter,
                RecommendationResult.interaction_type == "purchase"
            ).scalar() or 0

            performance_by_day.insert(0, {
                "date": day_start.strftime("%Y-%m-%d"),
                "recommendations": day_recs,
                "clicks": day_clicks,
                "conversions": day_conversions
            })

        # Top performing products
        top_products_data = db.query(
            RecommendationResult.product_id,
            Product.name,
            func.count(RecommendationResult.id).label("recommendations"),
            func.sum(func.cast(RecommendationResult.interaction_type == "click", db.Integer)).label("clicks"),
            func.sum(func.cast(RecommendationResult.interaction_type == "purchase", db.Integer)).label("conversions")
        ).join(Product, Product.id == RecommendationResult.product_id).filter(
            *query_filter
        ).group_by(RecommendationResult.product_id, Product.name).order_by(
            desc("conversions")
        ).limit(10).all()

        top_performing_products = []
        for prod in top_products_data:
            prod_click_rate = round((prod.clicks / prod.recommendations) * 100, 2) if prod.recommendations > 0 else 0.0
            top_performing_products.append({
                "product_id": str(prod.product_id),
                "product_name": prod.name,
                "recommendations": prod.recommendations,
                "clicks": prod.clicks,
                "conversions": prod.conversions,
                "click_rate": prod_click_rate
            })

        return {
            "algorithm": algorithm or "all",
            "period_days": days,
            "total_recommendations": total_recommendations,
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "click_rate": click_rate,
            "conversion_rate": conversion_rate,
            "average_score": average_score,
            "performance_by_day": performance_by_day,
            "top_performing_products": top_performing_products
        }

    except Exception as e:
        logger.error(f"Error getting recommendation performance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recommendation performance"
        )


@router.get("/segments/performance")
async def get_segment_performance(
    current_user: User = Depends(require_permission("analytics.view_detailed")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get segment performance metrics.

    Returns performance statistics for all user segments including member counts,
    order activity, revenue metrics, and average order values.

    **Required Permission:** `analytics.view_detailed`
    """
    try:
        # Get all active segments
        segments = db.query(UserSegment).filter(UserSegment.is_active == True).all()

        segment_data = []

        for segment in segments:
            # Get member count
            member_count = db.query(func.count(UserSegmentMembership.id)).filter(
                UserSegmentMembership.segment_id == segment.id,
                UserSegmentMembership.is_active == True
            ).scalar() or 0

            # Get segment user IDs
            segment_user_ids = db.query(UserSegmentMembership.user_id).filter(
                UserSegmentMembership.segment_id == segment.id,
                UserSegmentMembership.is_active == True
            ).all()
            segment_user_ids = [str(uid[0]) for uid in segment_user_ids]

            # Calculate metrics
            orders_count = 0
            total_revenue = 0.0
            avg_order_value = 0.0

            if segment_user_ids:
                orders_count = db.query(func.count(Order.id)).filter(
                    Order.user_id.in_(segment_user_ids),
                    Order.status.notin_(["cancelled", "refunded"])
                ).scalar() or 0

                revenue_raw = db.query(func.sum(Order.total_amount)).filter(
                    Order.user_id.in_(segment_user_ids),
                    Order.status.notin_(["cancelled", "refunded"])
                ).scalar()
                total_revenue = float(revenue_raw) if revenue_raw else 0.0

                avg_order_value = round(total_revenue / orders_count, 2) if orders_count > 0 else 0.0

            revenue_per_member = round(total_revenue / member_count, 2) if member_count > 0 else 0.0

            segment_data.append({
                "segment_name": segment.name,
                "member_count": member_count,
                "orders_count": orders_count,
                "avg_order_value": avg_order_value,
                "total_revenue": round(total_revenue, 2),
                "revenue_per_member": revenue_per_member
            })

        return {
            "segments": segment_data
        }

    except Exception as e:
        logger.error(f"Error getting segment performance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve segment performance"
        )
