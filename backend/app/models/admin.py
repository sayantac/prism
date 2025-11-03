import uuid

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models import Base


class SystemMetrics(Base):
    """System performance metrics snapshots"""

    __tablename__ = "system_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_type = Column(String, nullable=False, index=True)
    metric_name = Column(String, nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String)
    tags = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<SystemMetrics {self.metric_name}: {self.value}>"


class AdminActivity(Base):
    """Track admin user activities"""

    __tablename__ = "admin_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    action = Column(String, nullable=False)
    resource_type = Column(String)
    resource_id = Column(String)
    description = Column(Text)
    ip_address = Column(String)
    user_agent = Column(String)
    activity_metadata = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<AdminActivity {self.user_id}: {self.action}>"


class ReportSchedule(Base):
    """Scheduled report configurations"""

    __tablename__ = "report_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    report_type = Column(String, nullable=False)
    parameters = Column(JSON)
    schedule_cron = Column(String)
    recipients = Column(JSON)
    format = Column(String, default="csv")
    enabled = Column(Boolean, default=True)
    last_run = Column(DateTime(timezone=True))
    next_run = Column(DateTime(timezone=True))
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<ReportSchedule {self.name}: {self.schedule_cron}>"


class SystemSetting(Base):
    """
    Model for storing system configuration settings.
    """

    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    key = Column(String(200), nullable=False, index=True)
    value = Column(Text, nullable=False)
    data_type = Column(String(50), nullable=False, default="string")
    description = Column(Text)
    validation_rules = Column(JSON)
    is_sensitive = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)

    __table_args__ = (
        Index("idx_setting_category_key", "category", "key", unique=True),
        Index("idx_setting_active", "is_active"),
        Index("idx_setting_category", "category"),
    )

    def __repr__(self):
        return f"<SystemSetting(category='{self.category}', key='{self.key}', value='{self.value[:50]}...')>"


class SettingsBackup(Base):
    """
    Model for storing settings backups.
    """

    __tablename__ = "settings_backups"

    id = Column(Integer, primary_key=True, index=True)
    backup_id = Column(String(100), unique=True, nullable=False, index=True)
    settings_data = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, nullable=True)
    description = Column(String(500))
    is_automatic = Column(Boolean, default=False)

    __table_args__ = (
        Index("idx_backup_created_at", "created_at"),
        Index("idx_backup_automatic", "is_automatic"),
    )

    def __repr__(self):
        return f"<SettingsBackup(backup_id='{self.backup_id}', created_at='{self.created_at}')>"


class FeatureFlag(Base):
    """
    Specialized model for feature flags (could be used instead of SystemSetting for features).
    """

    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    description = Column(Text)
    is_enabled = Column(Boolean, default=False, nullable=False, index=True)
    rollout_percentage = Column(Integer, default=0)
    target_groups = Column(JSON)
    conditions = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    expires_at = Column(DateTime(timezone=True))

    __table_args__ = (
        Index("idx_feature_flag_enabled", "is_enabled"),
        Index("idx_feature_flag_expires", "expires_at"),
    )

    def __repr__(self):
        return f"<FeatureFlag(name='{self.name}', is_enabled={self.is_enabled})>"


class SettingsCategory(Base):
    """
    Model for organizing settings into categories with metadata.
    """

    __tablename__ = "settings_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    icon = Column(String(50))
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    requires_restart = Column(Boolean, default=False)
    access_level = Column(String(50), default="admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_category_active", "is_active"),
        Index("idx_category_order", "sort_order"),
    )

    def __repr__(self):
        return f"<SettingsCategory(name='{self.name}', display_name='{self.display_name}')>"


class SettingsChangeLog(Base):
    """
    Model for tracking all changes to settings (audit trail).
    """

    __tablename__ = "settings_change_log"

    id = Column(Integer, primary_key=True, index=True)
    setting_id = Column(Integer, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    key = Column(String(200), nullable=False, index=True)
    old_value = Column(Text)
    new_value = Column(Text)
    change_type = Column(String(50), nullable=False)
    changed_by = Column(Integer, nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    reason = Column(Text)
    backup_id = Column(String(100))

    __table_args__ = (
        Index("idx_change_log_setting", "category", "key"),
        Index("idx_change_log_user", "changed_by"),
        Index("idx_change_log_date", "changed_at"),
        Index("idx_change_log_type", "change_type"),
    )

    def __repr__(self):
        return f"<SettingsChangeLog(category='{self.category}', key='{self.key}', change_type='{self.change_type}')>"

    # class AuditLog(Base):
    #     __tablename__ = "audit_logs"

    #     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    #     user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    #     action = Column(String, nullable=True)
    #     entity_type = Column(String, nullable=True)
    #     entity_id = Column(String, nullable=True)
    #     resource_type = Column(String(100), nullable=True, index=True)
    #     resource_id = Column(String(200), nullable=True, index=True)
    #     details = Column(Text, nullable=True)
    #     ip_address = Column(String(45), nullable=True)
    #     user_agent = Column(String(1000), nullable=True)
    #     old_values = Column(JSON)
    #     new_values = Column(JSON)
    #     timestamp = Column(DateTime(timezone=True), server_default=func.now())
    #     session_id = Column(String(100), nullable=True)
    #     request_id = Column(String(100), nullable=True)

    #     __table_args__ = (
    #         # Index("idx_audit_user_timestamp", "user_id", "timestamp"),
    #         # Index("idx_audit_resource", "resource_type", "resource_id"),
    #         # Index("idx_audit_action_timestamp", "action", "timestamp"),
    #         # Index("idx_audit_timestamp", "timestamp"),
    #         Index(
    #             "ix_audit_logs_resource_id", "resource_id", unique=False, if_not_exists=True
    #         ),
    #         {"extend_existing": True},
    #     )

    def __repr__(self):
        return f"<AuditLog(user_id={self.user_id}, action='{self.action}', resource_type='{self.resource_type}')>"
