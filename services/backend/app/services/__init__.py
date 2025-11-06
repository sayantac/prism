"""
Business logic services for the e-commerce recommendation system.

Services are organized by domain:
- Admin services: Dashboard, settings, system health
- User services: Analytics, behavior tracking, segmentation
- Product services: Product management, search, recommendations
- Order services: Cart, checkout, order management
- ML services: Recommendation engine, model training, embeddings
"""

# Core services
from app.services.product_service import ProductService
from app.services.recommendation_service import RecommendationService
from app.services.search_service import SearchService
from app.services.user_behavior_service import UserBehaviorService

# Admin services
from app.services.admin_dashboard_service import AdminDashboardService
from app.services.system_health_service import SystemHealthService

__all__ = [
    # Core services
    "ProductService",
    "RecommendationService",
    "SearchService",
    "UserBehaviorService",
    # Admin services
    "AdminDashboardService",
    "SystemHealthService",
]
