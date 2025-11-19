from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_superuser, get_db
from app.models import User
from app.schemas.admin import (
    FeatureFlagUpdate,
    SettingCategoryUpdate,
    SettingsBackupResponse,
    SystemSettingsResponse,
)
from app.services.audit_service import AuditService
from app.services.settings_service import SettingsService
from app.utils.audit_utils import (
    get_client_ip,
    get_user_agent,
)

router = APIRouter()


@router.get("/settings", response_model=SystemSettingsResponse)
async def get_all_settings(
    *,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Get all system settings categorized by type.
    """
    try:
        settings_service = SettingsService(db)
        settings = await settings_service.get_all_settings()

        audit_service = AuditService(db)
        await audit_service.log_action(
            user_id=current_user.id,
            action="SETTINGS_VIEWED",
            resource_type="system_settings",
            details={"categories_accessed": list(settings.keys())},
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )

        return SystemSettingsResponse(
            success=True, data=settings, message="Settings retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve settings: {str(e)}",
        )


@router.put("/settings/category/{category}")
async def update_setting_category(
    *,
    category: str,
    settings_update: SettingCategoryUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Update all settings in a specific category.
    """
    try:
        settings_service = SettingsService(db)

        valid_categories = await settings_service.get_valid_categories()
        if category not in valid_categories:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Settings category '{category}' not found",
            )

        current_settings = await settings_service.get_settings_by_category(category)

        updated_settings = await settings_service.update_category_settings(
            category=category, settings=settings_update.settings
        )

        audit_service = AuditService(db)
        await audit_service.log_action(
            user_id=current_user.id,
            action="SETTINGS_UPDATED",
            resource_type="system_settings",
            resource_id=category,
            details={
                "category": category,
                "changes_count": len(settings_update.settings),
            },
            old_values=current_settings,
            new_values=settings_update.settings,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )

        return {
            "success": True,
            "data": updated_settings,
            "message": f"Settings for category '{category}' updated successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update settings: {str(e)}",
        )


@router.get("/settings/feature-flags")
async def get_feature_flags(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Get all feature flags and their current states.
    """
    try:
        settings_service = SettingsService(db)
        feature_flags = await settings_service.get_feature_flags()

        audit_service = AuditService(db)
        await audit_service.log_action(
            user_id=current_user.id,
            action="FEATURE_FLAGS_VIEWED",
            resource_type="feature_flags",
            details={"flags_count": len(feature_flags)},
        )

        return {
            "success": True,
            "data": feature_flags,
            "message": "Feature flags retrieved successfully",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve feature flags: {str(e)}",
        )


@router.put("/settings/feature-flags")
async def update_feature_flags(
    *,
    feature_flags_update: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Update feature flags configuration.
    """
    try:
        settings_service = SettingsService(db)

        current_flags = await settings_service.get_feature_flags()

        updated_flags = await settings_service.update_feature_flags(
            feature_flags_update.flags
        )

        changes = []
        for flag_name, new_value in feature_flags_update.flags.items():
            old_value = current_flags.get(flag_name)
            if old_value != new_value:
                changes.append(
                    {"flag": flag_name, "old_value": old_value, "new_value": new_value}
                )

        audit_service = AuditService(db)
        await audit_service.log_action(
            user_id=current_user.id,
            action="FEATURE_FLAGS_UPDATED",
            resource_type="feature_flags",
            details={
                "changes": changes,
                "total_flags": len(feature_flags_update.flags),
            },
        )

        return {
            "success": True,
            "data": updated_flags,
            "message": f"Feature flags updated successfully. {len(changes)} changes applied.",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update feature flags: {str(e)}",
        )


@router.post("/settings/validate")
async def validate_settings(
    *,
    settings_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Validate settings configuration before applying.
    """
    try:
        settings_service = SettingsService(db)
        validation_result = await settings_service.validate_settings(settings_data)

        audit_service = AuditService(db)
        await audit_service.log_action(
            user_id=current_user.id,
            action="SETTINGS_VALIDATED",
            resource_type="system_settings",
            details={
                "validation_passed": validation_result["is_valid"],
                "errors_count": len(validation_result.get("errors", [])),
                "warnings_count": len(validation_result.get("warnings", [])),
            },
        )

        return {
            "success": True,
            "data": validation_result,
            "message": "Settings validation completed",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Settings validation failed: {str(e)}",
        )


@router.post("/settings/backup", response_model=SettingsBackupResponse)
async def backup_settings(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Create a backup of current system settings.
    """
    try:
        settings_service = SettingsService(db)
        backup_info = await settings_service.create_settings_backup()

        audit_service = AuditService(db)
        await audit_service.log_action(
            user_id=current_user.id,
            action="SETTINGS_BACKUP_CREATED",
            resource_type="system_settings",
            resource_id=backup_info["backup_id"],
            details={
                "backup_id": backup_info["backup_id"],
                "settings_count": backup_info["settings_count"],
                "backup_size": backup_info["backup_size"],
            },
        )

        return SettingsBackupResponse(
            success=True,
            data=backup_info,
            message="Settings backup created successfully",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create settings backup: {str(e)}",
        )


@router.post("/settings/restore/{backup_id}")
async def restore_settings(
    *,
    backup_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Restore settings from a backup.
    """
    try:
        settings_service = SettingsService(db)

        current_settings = await settings_service.get_all_settings()

        restore_info = await settings_service.restore_settings_backup(backup_id)

        audit_service = AuditService(db)
        await audit_service.log_action(
            user_id=current_user.id,
            action="SETTINGS_RESTORED",
            resource_type="system_settings",
            resource_id=backup_id,
            details={
                "backup_id": backup_id,
                "restored_settings_count": restore_info["restored_count"],
                "backup_timestamp": restore_info["backup_timestamp"],
            },
        )

        return {
            "success": True,
            "data": restore_info,
            "message": f"Settings restored successfully from backup {backup_id}",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore settings: {str(e)}",
        )


@router.get("/settings/backups")
async def list_settings_backups(
    *,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    List available settings backups.
    """
    try:
        settings_service = SettingsService(db)
        backups = await settings_service.list_settings_backups(limit=limit)

        return {
            "success": True,
            "data": backups,
            "message": f"Retrieved {len(backups)} settings backups",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve settings backups: {str(e)}",
        )


@router.delete("/settings/backup/{backup_id}")
async def delete_settings_backup(
    *,
    backup_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Delete a settings backup.
    """
    try:
        settings_service = SettingsService(db)
        deletion_info = await settings_service.delete_settings_backup(backup_id)

        audit_service = AuditService(db)
        await audit_service.log_action(
            user_id=current_user.id,
            action="SETTINGS_BACKUP_DELETED",
            resource_type="system_settings",
            resource_id=backup_id,
            details={
                "backup_id": backup_id,
                "backup_timestamp": deletion_info.get("backup_timestamp"),
            },
        )

        return {
            "success": True,
            "data": deletion_info,
            "message": f"Settings backup {backup_id} deleted successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete settings backup: {str(e)}",
        )


@router.get("/settings/categories")
async def get_settings_categories(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """
    Get all available settings categories with descriptions.
    """
    try:
        settings_service = SettingsService(db)
        categories = await settings_service.get_settings_categories_info()

        return {
            "success": True,
            "data": categories,
            "message": "Settings categories retrieved successfully",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve settings categories: {str(e)}",
        )
