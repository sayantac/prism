from functools import lru_cache
from typing import List

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import User


@lru_cache(maxsize=128)
def get_user_permissions(user_id: str, db: Session) -> List[str]:
    """Get user permissions with caching"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []

    permissions = set()
    for role in user.roles:
        for permission in role.permissions:
            permissions.add(permission.name)

    return list(permissions)


def require_permission(permission_name: str):
    """Decorator to require specific permission"""

    def permission_dependency(
        current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
    ):
        if not current_user or not db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        if current_user.is_superuser:
            return current_user

        user_permissions = get_user_permissions(str(current_user.id), db)

        if permission_name not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission_name}' required",
            )

        return current_user

    return permission_dependency


def require_permissions(*permission_names: str):
    """Decorator to require multiple permissions (ALL required)"""

    def permission_dependency(
        current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
    ):
        if not current_user or not db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        if current_user.is_superuser:
            return current_user

        user_permissions = get_user_permissions(str(current_user.id), db)

        missing_permissions = []
        for perm in permission_names:
            if perm not in user_permissions:
                missing_permissions.append(perm)

        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permissions: {', '.join(missing_permissions)}",
            )

        return current_user

    return permission_dependency


def require_any_permission(*permission_names: str):
    """Decorator to require any one of the specified permissions"""

    def permission_dependency(
        current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
    ):
        if not current_user or not db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        if current_user.is_superuser:
            return current_user

        user_permissions = get_user_permissions(str(current_user.id), db)

        for perm in permission_names:
            if perm in user_permissions:
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"One of these permissions required: {', '.join(permission_names)}",
        )

    return permission_dependency


DEFAULT_PERMISSIONS = [
    ("manage_users", "Create, update, delete users"),
    ("view_users", "View user information"),
    ("assign_roles", "Assign roles to users"),
    ("manage_products", "Create, update, delete products"),
    ("view_products", "View product information"),
    ("manage_categories", "Manage product categories"),
    ("manage_inventory", "Manage stock and inventory"),
    ("manage_orders", "View and manage all orders"),
    ("view_orders", "View order information"),
    ("update_order_status", "Update order status"),
    ("admin_dashboard", "Access admin dashboard"),
    ("view_analytics", "View analytics and reports"),
    ("manage_system", "System configuration"),
    ("view_audit_logs", "View audit logs"),
    ("admin_dashboard_real_time", "Access real-time dashboard metrics"),
    ("view_system_health", "View system health and performance metrics"),
    ("manage_system_settings", "Manage system configuration settings"),
    ("view_system_settings", "View system configuration settings"),
    ("manage_feature_flags", "Control feature flags and A/B tests"),
    ("view_feature_flags", "View feature flags status"),
    ("restart_required_settings", "Modify settings that require system restart"),
    ("export_audit_logs", "Export audit logs and system activities"),
    ("manage_audit_retention", "Configure audit log retention policies"),
    ("view_admin_activities", "View admin user activities"),
    ("purge_audit_logs", "Delete old audit logs"),
    ("view_performance_metrics", "View system performance metrics"),
    ("manage_performance_monitoring", "Configure performance monitoring"),
    ("view_error_logs", "View system error logs and traces"),
    ("manage_system_monitoring", "Configure system monitoring and alerting"),
    ("create_custom_reports", "Create custom reports and analytics"),
    ("schedule_reports", "Schedule automated reports"),
    ("export_reports", "Export reports in various formats"),
    ("manage_report_schedules", "Manage scheduled report configurations"),
    ("view_advanced_analytics", "Access advanced analytics and insights"),
    ("manage_content", "Manage CMS content, banners, promotions"),
    ("view_content", "View content management section"),
    ("schedule_content", "Schedule content publication"),
    ("manage_email_templates", "Manage system email templates"),
    ("manage_security_settings", "Configure security policies"),
    ("view_security_logs", "View security-related logs"),
    ("manage_user_sessions", "Manage active user sessions"),
    ("force_user_logout", "Force logout users"),
    ("view_login_attempts", "View failed login attempts"),
    ("system_maintenance_mode", "Enable/disable maintenance mode"),
    ("clear_system_cache", "Clear application caches"),
    ("manage_database_maintenance", "Perform database maintenance tasks"),
    ("view_system_logs", "View system logs and traces"),
    ("manage_ml_models", "Manage ML model configurations"),
    ("view_ml_performance", "View ML model performance metrics"),
    ("trigger_ml_training", "Trigger model retraining"),
    ("manage_recommendation_engine", "Configure recommendation algorithms"),
    ("view_recommendation_analytics", "View recommendation performance"),
    ("view_user_segmentation", "View user segmentation data"),
    ("manage_user_segments", "Create and manage user segments"),
    ("view_customer_lifetime_value", "View customer LTV analytics"),
    ("view_churn_analysis", "View customer churn predictions"),
    ("export_user_analytics", "Export user analytics data"),
    ("manage_inventory_alerts", "Configure low stock alerts"),
    ("view_inventory_forecasting", "View demand forecasting"),
    ("manage_pricing", "Manage dynamic pricing rules"),
    ("view_sales_analytics", "View detailed sales analytics"),
    ("manage_promotion_rules", "Create and manage promotion rules"),
    ("manage_api_keys", "Manage API keys and integrations"),
    ("view_api_usage", "View API usage statistics"),
    ("manage_webhooks", "Configure webhook endpoints"),
    ("view_integration_logs", "View integration logs"),
    ("manage_search", "Manage search configurations"),
    ("view_search_analytics", "View search analytics"),
    ("upload_files", "Upload files and images"),
    ("manage_media", "Manage media files and assets"),
    ("send_notifications", "Send notifications to users"),
    ("manage_notification_templates", "Manage notification templates"),
    ("view_communication_logs", "View communication logs"),
    ("export_user_data", "Export user data (GDPR compliance)"),
    ("import_data", "Import data from external sources"),
    ("manage_data_retention", "Configure data retention policies"),
    ("anonymize_user_data", "Anonymize user data for privacy"),
    ("emergency_access", "Emergency access to override restrictions"),
    ("override_security_checks", "Override security checks when needed"),
    ("emergency_system_shutdown", "Emergency system shutdown capability"),
]
