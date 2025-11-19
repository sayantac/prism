# app/services/audit_service.py

import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.models import AuditLog


class AuditService:
    """
    Service for managing audit logs and tracking system changes.
    """

    def __init__(self, db: Session):
        self.db = db

    async def log_action(
        self,
        user_id: UUID | str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Log an action to the audit trail.

        Args:
            user_id: ID of the user performing the action
            action: Action being performed (e.g., 'SETTINGS_UPDATED', 'USER_CREATED')
            resource_type: Type of resource (e.g., 'system_settings', 'user', 'product')
            resource_id: ID of the specific resource being acted upon
            details: Additional context about the action
            ip_address: IP address of the user
            user_agent: User agent string
            old_values: Previous values (for updates)
            new_values: New values (for updates)
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            user_agent=user_agent,
            old_values=json.dumps(old_values) if old_values else None,
            new_values=json.dumps(new_values) if new_values else None,
        )

        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)

        return audit_log

    async def get_logs(
        self,
        user_id: Optional[UUID | str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AuditLog]:
        """
        Retrieve audit logs with filtering options.
        """
        query = self.db.query(AuditLog)

        # Apply filters
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)

        if action:
            query = query.filter(AuditLog.action == action)

        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)

        if resource_id:
            query = query.filter(AuditLog.resource_id == resource_id)

        if date_from:
            query = query.filter(AuditLog.timestamp >= date_from)

        if date_to:
            query = query.filter(AuditLog.timestamp <= date_to)

        # Order by timestamp (newest first) and apply pagination
        query = query.order_by(desc(AuditLog.timestamp))
        query = query.offset(offset).limit(limit)

        return query.all()

    async def get_user_activity(
        self, user_id: UUID | str, limit: int = 50
    ) -> list[AuditLog]:
        """
        Get recent activity for a specific user.
        """
        return await self.get_logs(user_id=user_id, limit=limit)

    async def get_resource_history(
        self, resource_type: str, resource_id: str, limit: int = 50
    ) -> list[AuditLog]:
        """
        Get change history for a specific resource.
        """
        return await self.get_logs(
            resource_type=resource_type, resource_id=resource_id, limit=limit
        )

    async def get_critical_actions(self, limit: int = 100) -> list[AuditLog]:
        """
        Get critical actions that require monitoring.
        """
        critical_actions = [
            "SETTINGS_UPDATED",
            "FEATURE_FLAGS_UPDATED",
            "USER_DELETED",
            "ADMIN_CREATED",
            "SETTINGS_RESTORED",
            "SYSTEM_CONFIGURATION_CHANGED",
        ]

        query = (
            self.db.query(AuditLog)
            .filter(AuditLog.action.in_(critical_actions))
            .order_by(desc(AuditLog.timestamp))
            .limit(limit)
        )

        return query.all()

    async def search_logs(self, search_term: str, limit: int = 100) -> list[AuditLog]:
        """
        Search audit logs by action, resource type, or details.
        """
        search_pattern = f"%{search_term}%"

        query = (
            self.db.query(AuditLog)
            .filter(
                or_(
                    AuditLog.action.ilike(search_pattern),
                    AuditLog.resource_type.ilike(search_pattern),
                    AuditLog.details.ilike(search_pattern),
                )
            )
            .order_by(desc(AuditLog.timestamp))
            .limit(limit)
        )

        return query.all()

    async def get_action_statistics(
        self, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Get statistics about action frequency.
        """
        query = self.db.query(AuditLog.action, self.db.func.count(AuditLog.id))

        if date_from:
            query = query.filter(AuditLog.timestamp >= date_from)

        if date_to:
            query = query.filter(AuditLog.timestamp <= date_to)

        results = query.group_by(AuditLog.action).all()

        return {action: count for action, count in results}

    async def cleanup_old_logs(self, days_to_keep: int = 90) -> int:
        """
        Clean up audit logs older than specified days.
        Returns the number of deleted records.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

        deleted_count = (
            self.db.query(AuditLog).filter(AuditLog.timestamp < cutoff_date).delete()
        )

        self.db.commit()

        return deleted_count

    def parse_details(self, audit_log: AuditLog) -> Optional[Dict[str, Any]]:
        """
        Parse the JSON details field safely.
        """
        if not audit_log.details:
            return None

        try:
            return json.loads(audit_log.details)
        except json.JSONDecodeError:
            return None

    def parse_old_values(self, audit_log: AuditLog) -> Optional[Dict[str, Any]]:
        """
        Parse the JSON old_values field safely.
        """
        if not audit_log.old_values:
            return None

        try:
            return json.loads(audit_log.old_values)
        except json.JSONDecodeError:
            return None

    def parse_new_values(self, audit_log: AuditLog) -> Optional[Dict[str, Any]]:
        """
        Parse the JSON new_values field safely.
        """
        if not audit_log.new_values:
            return None

        try:
            return json.loads(audit_log.new_values)
        except json.JSONDecodeError:
            return None
