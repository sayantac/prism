import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.admin import SettingsBackup, SystemSetting


class SettingsService:
    def __init__(self, db: Session):
        self.db = db

    async def get_all_settings(self) -> Dict[str, Dict[str, Any]]:
        """
        Retrieve all system settings organized by category.
        """
        settings_query = (
            self.db.query(SystemSetting).filter(SystemSetting.is_active == True).all()
        )

        categorized_settings = {}
        for setting in settings_query:
            category = setting.category
            if category not in categorized_settings:
                categorized_settings[category] = {}

            categorized_settings[category][setting.key] = {
                "value": self._parse_setting_value(setting.value, setting.data_type),
                "data_type": setting.data_type,
                "description": setting.description,
                "is_sensitive": setting.is_sensitive,
                "last_updated": setting.updated_at.isoformat()
                if setting.updated_at
                else None,
                "validation_rules": json.loads(setting.validation_rules)
                if setting.validation_rules
                else None,
            }

        return categorized_settings

    async def get_settings_by_category(self, category: str) -> Dict[str, Any]:
        """
        Get all settings for a specific category.
        """
        settings_query = (
            self.db.query(SystemSetting)
            .filter(
                and_(
                    SystemSetting.category == category, SystemSetting.is_active == True
                )
            )
            .all()
        )

        category_settings = {}
        for setting in settings_query:
            category_settings[setting.key] = {
                "value": self._parse_setting_value(setting.value, setting.data_type),
                "data_type": setting.data_type,
                "description": setting.description,
                "is_sensitive": setting.is_sensitive,
                "last_updated": setting.updated_at.isoformat()
                if setting.updated_at
                else None,
            }

        return category_settings

    async def update_category_settings(
        self, category: str, settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update all settings in a category.
        """
        updated_settings = {}

        for key, value in settings.items():
            setting = (
                self.db.query(SystemSetting)
                .filter(
                    and_(
                        SystemSetting.category == category,
                        SystemSetting.key == key,
                        SystemSetting.is_active == True,
                    )
                )
                .first()
            )

            if setting:
                validation_result = await self._validate_setting_value(
                    value, setting.data_type, setting.validation_rules
                )

                if not validation_result["is_valid"]:
                    raise ValueError(
                        f"Invalid value for {key}: {validation_result['error']}"
                    )

                setting.value = self._serialize_setting_value(value, setting.data_type)
                setting.updated_at = datetime.utcnow()

                updated_settings[key] = {
                    "value": value,
                    "data_type": setting.data_type,
                    "description": setting.description,
                    "is_sensitive": setting.is_sensitive,
                    "last_updated": setting.updated_at.isoformat(),
                }
            else:
                new_setting = SystemSetting(
                    category=category,
                    key=key,
                    value=self._serialize_setting_value(value, "string"),
                    data_type="string",
                    description=f"Auto-created setting for {key}",
                    is_sensitive=False,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                self.db.add(new_setting)

                updated_settings[key] = {
                    "value": value,
                    "data_type": "string",
                    "description": f"Auto-created setting for {key}",
                    "is_sensitive": False,
                    "last_updated": datetime.utcnow().isoformat(),
                }

        self.db.commit()
        return updated_settings

    async def get_feature_flags(self) -> Dict[str, bool]:
        """
        Get all feature flags (settings in the 'feature_flags' category).
        """
        feature_flags_query = (
            self.db.query(SystemSetting)
            .filter(
                and_(
                    SystemSetting.category == "feature_flags",
                    SystemSetting.is_active == True,
                )
            )
            .all()
        )

        feature_flags = {}
        for flag in feature_flags_query:
            feature_flags[flag.key] = self._parse_setting_value(flag.value, "boolean")

        return feature_flags

    async def update_feature_flags(self, flags: Dict[str, bool]) -> Dict[str, bool]:
        """
        Update feature flags.
        """
        updated_flags = {}

        for flag_name, flag_value in flags.items():
            flag = (
                self.db.query(SystemSetting)
                .filter(
                    and_(
                        SystemSetting.category == "feature_flags",
                        SystemSetting.key == flag_name,
                        SystemSetting.is_active == True,
                    )
                )
                .first()
            )

            if flag:
                flag.value = str(flag_value).lower()
                flag.updated_at = datetime.utcnow()
            else:
                new_flag = SystemSetting(
                    category="feature_flags",
                    key=flag_name,
                    value=str(flag_value).lower(),
                    data_type="boolean",
                    description=f"Feature flag for {flag_name}",
                    is_sensitive=False,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                self.db.add(new_flag)

            updated_flags[flag_name] = flag_value

        self.db.commit()
        return updated_flags

    async def validate_settings(self, settings_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate settings configuration.
        """
        validation_result = {"is_valid": True, "errors": [], "warnings": []}

        for category, category_settings in settings_data.items():
            if not isinstance(category_settings, dict):
                validation_result["errors"].append(
                    f"Category '{category}' must contain a dictionary of settings"
                )
                validation_result["is_valid"] = False
                continue

            for key, value in category_settings.items():
                setting = (
                    self.db.query(SystemSetting)
                    .filter(
                        and_(
                            SystemSetting.category == category,
                            SystemSetting.key == key,
                            SystemSetting.is_active == True,
                        )
                    )
                    .first()
                )

                if setting:
                    value_validation = await self._validate_setting_value(
                        value, setting.data_type, setting.validation_rules
                    )

                    if not value_validation["is_valid"]:
                        validation_result["errors"].append(
                            f"{category}.{key}: {value_validation['error']}"
                        )
                        validation_result["is_valid"] = False
                else:
                    validation_result["warnings"].append(
                        f"Setting '{category}.{key}' does not exist and will be created"
                    )

        return validation_result

    async def create_settings_backup(self) -> Dict[str, Any]:
        """
        Create a backup of all current settings.
        """

        all_settings = await self.get_all_settings()

        backup_id = str(uuid.uuid4())
        backup = SettingsBackup(
            backup_id=backup_id,
            settings_data=json.dumps(all_settings),
            created_at=datetime.utcnow(),
        )

        self.db.add(backup)
        self.db.commit()

        return {
            "backup_id": backup_id,
            "created_at": backup.created_at.isoformat(),
            "settings_count": sum(
                len(cat_settings) for cat_settings in all_settings.values()
            ),
            "backup_size": len(backup.settings_data),
        }

    async def restore_settings_backup(self, backup_id: str) -> Dict[str, Any]:
        """
        Restore settings from a backup.
        """

        backup = (
            self.db.query(SettingsBackup)
            .filter(SettingsBackup.backup_id == backup_id)
            .first()
        )

        if not backup:
            raise ValueError(f"Backup with ID {backup_id} not found")

        backup_settings = json.loads(backup.settings_data)

        restored_count = 0

        for category, category_settings in backup_settings.items():
            for key, setting_info in category_settings.items():
                existing_setting = (
                    self.db.query(SystemSetting)
                    .filter(
                        and_(
                            SystemSetting.category == category,
                            SystemSetting.key == key,
                            SystemSetting.is_active == True,
                        )
                    )
                    .first()
                )

                if existing_setting:
                    existing_setting.value = self._serialize_setting_value(
                        setting_info["value"], setting_info["data_type"]
                    )
                    existing_setting.updated_at = datetime.utcnow()
                else:
                    new_setting = SystemSetting(
                        category=category,
                        key=key,
                        value=self._serialize_setting_value(
                            setting_info["value"], setting_info["data_type"]
                        ),
                        data_type=setting_info["data_type"],
                        description=setting_info["description"],
                        is_sensitive=setting_info["is_sensitive"],
                        is_active=True,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    self.db.add(new_setting)

                restored_count += 1

        self.db.commit()

        return {
            "backup_id": backup_id,
            "backup_timestamp": backup.created_at.isoformat(),
            "restored_count": restored_count,
        }

    async def list_settings_backups(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        List available settings backups.
        """
        backups = (
            self.db.query(SettingsBackup)
            .order_by(SettingsBackup.created_at.desc())
            .limit(limit)
            .all()
        )

        backup_list = []
        for backup in backups:
            settings_data = json.loads(backup.settings_data)
            backup_list.append(
                {
                    "backup_id": backup.backup_id,
                    "created_at": backup.created_at.isoformat(),
                    "settings_count": sum(
                        len(cat_settings) for cat_settings in settings_data.values()
                    ),
                    "backup_size": len(backup.settings_data),
                    "categories": list(settings_data.keys()),
                }
            )

        return backup_list

    async def delete_settings_backup(self, backup_id: str) -> Dict[str, Any]:
        """
        Delete a settings backup.
        """
        backup = (
            self.db.query(SettingsBackup)
            .filter(SettingsBackup.backup_id == backup_id)
            .first()
        )

        if not backup:
            raise ValueError(f"Backup with ID {backup_id} not found")

        backup_info = {
            "backup_id": backup_id,
            "backup_timestamp": backup.created_at.isoformat(),
        }

        self.db.delete(backup)
        self.db.commit()

        return backup_info

    async def get_valid_categories(self) -> List[str]:
        """
        Get all valid setting categories.
        """
        categories = self.db.query(SystemSetting.category).distinct().all()
        return [cat[0] for cat in categories]

    async def get_settings_categories_info(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about all settings categories.
        """
        categories_info = {
            "general": {
                "name": "General Settings",
                "description": "Basic application configuration",
                "icon": "settings",
            },
            "security": {
                "name": "Security Settings",
                "description": "Authentication and security configuration",
                "icon": "shield",
            },
            "email": {
                "name": "Email Settings",
                "description": "Email server and notification configuration",
                "icon": "mail",
            },
            "payment": {
                "name": "Payment Settings",
                "description": "Payment gateway and transaction configuration",
                "icon": "credit-card",
            },
            "feature_flags": {
                "name": "Feature Flags",
                "description": "Enable/disable application features",
                "icon": "flag",
            },
            "api": {
                "name": "API Settings",
                "description": "API configuration and rate limits",
                "icon": "code",
            },
            "analytics": {
                "name": "Analytics Settings",
                "description": "Analytics and tracking configuration",
                "icon": "bar-chart",
            },
            "ml": {
                "name": "Machine Learning",
                "description": "ML model and algorithm configuration",
                "icon": "brain",
            },
        }

        actual_categories = await self.get_valid_categories()

        for category in actual_categories:
            if category not in categories_info:
                categories_info[category] = {
                    "name": category.replace("_", " ").title(),
                    "description": f"Configuration for {category}",
                    "icon": "settings",
                }

        return categories_info

    def _parse_setting_value(self, value: str, data_type: str) -> Any:
        """
        Parse setting value based on its data type.
        """
        if data_type == "boolean":
            return value.lower() in ("true", "1", "yes", "on")
        elif data_type == "integer":
            return int(value)
        elif data_type == "float":
            return float(value)
        elif data_type == "json":
            return json.loads(value)
        elif data_type == "list":
            return json.loads(value) if value.startswith("[") else value.split(",")
        else:
            return value

    def _serialize_setting_value(self, value: Any, data_type: str) -> str:
        """
        Serialize setting value for storage.
        """
        if data_type in ("json", "list"):
            return json.dumps(value)
        elif data_type == "boolean":
            return str(value).lower()
        else:
            return str(value)

    async def _validate_setting_value(
        self, value: Any, data_type: str, validation_rules: Optional[str]
    ) -> Dict[str, Any]:
        """
        Validate a setting value against its data type and rules.
        """
        result = {"is_valid": True, "error": None}

        try:
            if data_type == "integer":
                int(value)
            elif data_type == "float":
                float(value)
            elif data_type == "boolean":
                if not isinstance(value, bool) and str(value).lower() not in (
                    "true",
                    "false",
                    "1",
                    "0",
                    "yes",
                    "no",
                    "on",
                    "off",
                ):
                    result["is_valid"] = False
                    result["error"] = "Value must be a valid boolean"
            elif data_type == "json":
                if isinstance(value, str):
                    json.loads(value)
            elif data_type == "list":
                if isinstance(value, str) and not (
                    value.startswith("[") or "," in value
                ):
                    result["is_valid"] = False
                    result["error"] = (
                        "Value must be a valid list or comma-separated string"
                    )

            if validation_rules and result["is_valid"]:
                rules = (
                    json.loads(validation_rules)
                    if isinstance(validation_rules, str)
                    else validation_rules
                )

                if "min_length" in rules and len(str(value)) < rules["min_length"]:
                    result["is_valid"] = False
                    result["error"] = (
                        f"Value must be at least {rules['min_length']} characters long"
                    )

                if "max_length" in rules and len(str(value)) > rules["max_length"]:
                    result["is_valid"] = False
                    result["error"] = (
                        f"Value must be no more than {rules['max_length']} characters long"
                    )

                if "min_value" in rules and float(value) < rules["min_value"]:
                    result["is_valid"] = False
                    result["error"] = f"Value must be at least {rules['min_value']}"

                if "max_value" in rules and float(value) > rules["max_value"]:
                    result["is_valid"] = False
                    result["error"] = f"Value must be no more than {rules['max_value']}"

                if "allowed_values" in rules and value not in rules["allowed_values"]:
                    result["is_valid"] = False
                    result["error"] = (
                        f"Value must be one of: {', '.join(map(str, rules['allowed_values']))}"
                    )

                if "pattern" in rules:
                    import re

                    if not re.match(rules["pattern"], str(value)):
                        result["is_valid"] = False
                        result["error"] = "Value does not match required pattern"

        except (ValueError, TypeError, json.JSONDecodeError) as e:
            result["is_valid"] = False
            result["error"] = f"Invalid {data_type} value: {str(e)}"

        return result
