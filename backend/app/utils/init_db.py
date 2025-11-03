import logging

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.permissions import DEFAULT_PERMISSIONS
from app.core.security import get_password_hash
from app.models import Permission, Role, User

settings = get_settings()
logger = logging.getLogger(__name__)


def init_db(db: Session) -> None:
    """Initialize database with default data"""

    logger.info("Creating default permissions...")
    for perm_name, perm_desc in DEFAULT_PERMISSIONS:
        permission = db.query(Permission).filter(Permission.name == perm_name).first()
        if not permission:
            permission = Permission(name=perm_name, description=perm_desc)
            db.add(permission)

    db.commit()

    logger.info("Creating default roles...")

    super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
    if not super_admin_role:
        super_admin_role = Role(
            name="super_admin", description="Super administrator with all permissions"
        )
        db.add(super_admin_role)
        db.flush()

        all_permissions = db.query(Permission).all()
        super_admin_role.permissions = all_permissions

    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(
            name="admin", description="Administrator with management permissions"
        )
        db.add(admin_role)
        db.flush()

        admin_perms = [
            "manage_products",
            "view_products",
            "manage_categories",
            "manage_inventory",
            "view_orders",
            "update_order_status",
            "admin_dashboard",
            "view_analytics",
            "upload_files",
            "manage_users",
            "view_users",
            "assign_roles",
            "manage_products",
            "view_products",
            "manage_categories",
            "manage_inventory",
            "manage_orders",
            "view_orders",
            "update_order_status",
            "admin_dashboard",
            "view_analytics",
            "manage_system",
            "view_audit_logs",
            "admin_dashboard_real_time",
            "view_system_health",
            "manage_system_settings",
            "view_system_settings",
            "manage_feature_flags",
            "view_feature_flags",
            "restart_required_settings",
            "export_audit_logs",
            "manage_audit_retention",
            "view_admin_activities",
            "purge_audit_logs",
            "view_performance_metrics",
            "manage_performance_monitoring",
            "view_error_logs",
            "manage_system_monitoring",
            "create_custom_reports",
            "schedule_reports",
            "export_reports",
            "manage_report_schedules",
            "view_advanced_analytics",
            "manage_content",
            "view_content",
            "schedule_content",
            "manage_email_templates",
            "manage_security_settings",
            "view_security_logs",
            "manage_user_sessions",
            "force_user_logout",
            "view_login_attempts",
            "system_maintenance_mode",
            "clear_system_cache",
            "manage_database_maintenance",
            "view_system_logs",
            "manage_ml_models",
            "view_ml_performance",
            "trigger_ml_training",
            "manage_recommendation_engine",
            "view_recommendation_analytics",
            "view_user_segmentation",
            "manage_user_segments",
            "view_customer_lifetime_value",
            "view_churn_analysis",
            "export_user_analytics",
            "manage_inventory_alerts",
            "view_inventory_forecasting",
            "manage_pricing",
            "view_sales_analytics",
            "manage_promotion_rules",
            "manage_api_keys",
            "view_api_usage",
            "manage_webhooks",
            "view_integration_logs",
            "manage_search",
            "view_search_analytics",
            "upload_files",
            "manage_media",
            "send_notifications",
            "manage_notification_templates",
            "view_communication_logs",
            "export_user_data",
            "import_data",
            "manage_data_retention",
            "anonymize_user_data",
            "emergency_access",
            "override_security_checks",
            "emergency_system_shutdown",
        ]
        permissions = (
            db.query(Permission).filter(Permission.name.in_(admin_perms)).all()
        )
        admin_role.permissions = permissions

    manager_role = db.query(Role).filter(Role.name == "manager").first()
    if not manager_role:
        manager_role = Role(
            name="manager", description="Manager with limited admin access"
        )
        db.add(manager_role)
        db.flush()

        manager_perms = [
            "view_products",
            "manage_inventory",
            "view_orders",
            "update_order_status",
            "view_analytics",
        ]
        permissions = (
            db.query(Permission).filter(Permission.name.in_(manager_perms)).all()
        )
        manager_role.permissions = permissions

    customer_role = db.query(Role).filter(Role.name == "customer").first()
    if not customer_role:
        customer_role = Role(name="customer", description="Regular customer account")
        db.add(customer_role)

    db.commit()

    logger.info("Creating default superuser...")
    superuser = (
        db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    )
    if not superuser:
        superuser = User(
            username="admin",
            email=settings.FIRST_SUPERUSER_EMAIL,
            full_name="System Administrator",
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            is_superuser=True,
            is_active=True,
        )
        db.add(superuser)
        db.flush()

        superuser.roles = [super_admin_role]

        db.commit()

        logger.info(f"Superuser created: {settings.FIRST_SUPERUSER_EMAIL}")
    else:
        logger.info("Superuser already exists")
