"""
Core application constants and default values.
"""

# Default permission definitions for RBAC system
DEFAULT_PERMISSIONS = [
    # User Management
    ("manage_users", "Create, update, delete users"),
    ("view_users", "View user information"),
    ("assign_roles", "Assign roles to users"),
    
    # Product Management
    ("manage_products", "Create, update, delete products"),
    ("view_products", "View product information"),
    ("manage_categories", "Manage product categories"),
    ("manage_inventory", "Manage stock and inventory"),
    
    # Order Management
    ("manage_orders", "View and manage all orders"),
    ("view_orders", "View order information"),
    ("update_order_status", "Update order status"),
    
    # Admin & Analytics
    ("admin_dashboard", "Access admin dashboard"),
    ("view_analytics", "View analytics and reports"),
    ("manage_system", "System configuration"),
    ("view_audit_logs", "View audit logs"),
    ("admin_dashboard_real_time", "Access real-time dashboard metrics"),
    
    # System Health & Settings
    ("view_system_health", "View system health and performance metrics"),
    ("manage_system_settings", "Manage system configuration settings"),
    ("view_system_settings", "View system configuration settings"),
    ("manage_feature_flags", "Control feature flags and A/B tests"),
    ("view_feature_flags", "View feature flags status"),
    ("restart_required_settings", "Modify settings that require system restart"),
    
    # Audit & Compliance
    ("export_audit_logs", "Export audit logs and system activities"),
    ("manage_audit_retention", "Configure audit log retention policies"),
    ("view_admin_activities", "View admin user activities"),
    ("purge_audit_logs", "Delete old audit logs"),
    
    # Performance & Monitoring
    ("view_performance_metrics", "View system performance metrics"),
    ("manage_performance_monitoring", "Configure performance monitoring"),
    ("view_error_logs", "View system error logs and traces"),
    ("manage_system_monitoring", "Configure system monitoring and alerting"),
    
    # Reports & Analytics
    ("create_custom_reports", "Create custom reports and analytics"),
    ("schedule_reports", "Schedule automated reports"),
    ("export_reports", "Export reports in various formats"),
    ("manage_report_schedules", "Manage scheduled report configurations"),
    ("view_advanced_analytics", "Access advanced analytics and insights"),
    
    # Content Management
    ("manage_content", "Manage CMS content, banners, promotions"),
    ("view_content", "View content management section"),
    ("schedule_content", "Schedule content publication"),
    ("manage_email_templates", "Manage system email templates"),
    
    # Security Management
    ("manage_security_settings", "Configure security policies"),
    ("view_security_logs", "View security-related logs"),
    ("manage_user_sessions", "Manage active user sessions"),
    ("force_user_logout", "Force logout users"),
    ("view_login_attempts", "View failed login attempts"),
    
    # System Maintenance
    ("system_maintenance_mode", "Enable/disable maintenance mode"),
    ("clear_system_cache", "Clear application caches"),
    ("manage_database_maintenance", "Perform database maintenance tasks"),
    ("view_system_logs", "View system logs and traces"),
    
    # ML & Recommendations
    ("manage_ml_models", "Manage ML model configurations"),
    ("view_ml_performance", "View ML model performance metrics"),
    ("trigger_ml_training", "Trigger model retraining"),
    ("manage_recommendation_engine", "Configure recommendation algorithms"),
    ("view_recommendation_analytics", "View recommendation performance"),
    
    # User Segmentation & Analytics
    ("view_user_segmentation", "View user segmentation data"),
    ("manage_user_segments", "Create and manage user segments"),
    ("view_customer_lifetime_value", "View customer LTV analytics"),
    ("view_churn_analysis", "View customer churn predictions"),
    ("export_user_analytics", "Export user analytics data"),
    
    # Inventory & Pricing
    ("manage_inventory_alerts", "Configure low stock alerts"),
    ("view_inventory_forecasting", "View demand forecasting"),
    ("manage_pricing", "Manage dynamic pricing rules"),
    ("view_sales_analytics", "View detailed sales analytics"),
    ("manage_promotion_rules", "Create and manage promotion rules"),
    
    # API & Integrations
    ("manage_api_keys", "Manage API keys and integrations"),
    ("view_api_usage", "View API usage statistics"),
    ("manage_webhooks", "Configure webhook endpoints"),
    ("view_integration_logs", "View integration logs"),
    
    # Search & Discovery
    ("manage_search", "Manage search configurations"),
    ("view_search_analytics", "View search analytics"),
    
    # Media Management
    ("upload_files", "Upload files and images"),
    ("manage_media", "Manage media files and assets"),
    
    # Communication
    ("send_notifications", "Send notifications to users"),
    ("manage_notification_templates", "Manage notification templates"),
    ("view_communication_logs", "View communication logs"),
    
    # Data Privacy & Compliance
    ("export_user_data", "Export user data (GDPR compliance)"),
    ("import_data", "Import data from external sources"),
    ("manage_data_retention", "Configure data retention policies"),
    ("anonymize_user_data", "Anonymize user data for privacy"),
    
    # Emergency Access
    ("emergency_access", "Emergency access to override restrictions"),
    ("override_security_checks", "Override security checks when needed"),
    ("emergency_system_shutdown", "Emergency system shutdown capability"),
]
