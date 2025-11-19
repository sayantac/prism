from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field, validator


class AdminBaseSchema(BaseModel):
    class Config:
        orm_mode = True
        use_enum_values = True


class SystemSettingBase(AdminBaseSchema):
    category: str
    key: str
    value: Optional[str] = None
    data_type: str = "string"
    description: Optional[str] = None
    is_public: bool = False
    requires_restart: bool = False


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(AdminBaseSchema):
    value: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    requires_restart: Optional[bool] = None


class SystemSettingResponse(SystemSettingBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


class FeatureFlagBase(AdminBaseSchema):
    name: str
    description: Optional[str] = None
    enabled: bool = False
    rollout_percentage: int = 0
    conditions: Optional[Dict[str, Any]] = {}

    @validator("rollout_percentage")
    def validate_rollout_percentage(cls, v):
        if not 0 <= v <= 100:
            raise ValueError("Rollout percentage must be between 0 and 100")
        return v


class SystemMetricCreate(AdminBaseSchema):
    metric_type: str
    metric_name: str
    value: float
    unit: Optional[str] = None
    tags: Optional[Dict[str, Any]] = {}


class SystemMetricResponse(AdminBaseSchema):
    id: UUID
    metric_type: str
    metric_name: str
    value: float
    unit: Optional[str] = None
    tags: Optional[Dict[str, Any]] = {}
    timestamp: datetime


class AdminActivityCreate(AdminBaseSchema):
    user_id: UUID
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    activity_metadata: Optional[Dict[str, Any]] = {}


class AdminActivityResponse(AdminBaseSchema):
    id: UUID
    user_id: UUID
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    activity_metadata: Optional[Dict[str, Any]] = {}
    timestamp: datetime


class ReportScheduleBase(AdminBaseSchema):
    name: str
    report_type: str
    parameters: Optional[Dict[str, Any]] = {}
    schedule_cron: str
    recipients: List[str] = []
    format: str = "csv"
    enabled: bool = True

    @validator("format")
    def validate_format(cls, v):
        allowed_formats = ["csv", "pdf", "excel", "json"]
        if v not in allowed_formats:
            raise ValueError(f"Format must be one of: {allowed_formats}")
        return v

    @validator("recipients")
    def validate_recipients(cls, v):
        import re

        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        for email in v:
            if not re.match(email_pattern, email):
                raise ValueError(f"Invalid email address: {email}")
        return v


class ReportScheduleCreate(ReportScheduleBase):
    created_by: UUID


class ReportScheduleUpdate(AdminBaseSchema):
    name: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    schedule_cron: Optional[str] = None
    recipients: Optional[List[str]] = None
    format: Optional[str] = None
    enabled: Optional[bool] = None

    @validator("format")
    def validate_format(cls, v):
        if v is not None:
            allowed_formats = ["csv", "pdf", "excel", "json"]
            if v not in allowed_formats:
                raise ValueError(f"Format must be one of: {allowed_formats}")
        return v


class ReportScheduleResponse(ReportScheduleBase):
    id: UUID
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


class DashboardStatsResponse(AdminBaseSchema):
    revenue: Dict[str, Any]
    orders: Dict[str, Any]
    users: Dict[str, Any]
    searches: Dict[str, Any]
    conversion: Dict[str, Any]
    timestamp: str


class SystemHealthResponse(AdminBaseSchema):
    timestamp: str
    overall_status: str
    components: Dict[str, Any]


class RecentActivityResponse(AdminBaseSchema):
    activities: List[Dict[str, Any]]
    total_count: int
    filter_applied: Dict[str, Any]


class PerformanceMetricsResponse(AdminBaseSchema):
    timestamp: str
    api_response_time: Dict[str, Any]
    error_rate: Dict[str, Any]
    database_query_time: Dict[str, Any]
    search_response_time: Dict[str, Any]


class QuickStatsResponse(AdminBaseSchema):
    revenue_today: float
    orders_today: int
    new_users_today: int
    system_status: str
    performance_score: int
    generated_at: str


class TrendDataResponse(AdminBaseSchema):
    metric: str
    period_days: int
    data_points: List[Dict[str, Any]]
    summary: Dict[str, Any]
    generated_at: str


class WidgetDataResponse(AdminBaseSchema):
    widget_type: str
    data: Dict[str, Any]
    generated_at: str


class BulkSettingsUpdate(AdminBaseSchema):
    settings: List[Dict[str, Any]]


class BulkFeatureFlagsUpdate(AdminBaseSchema):
    flags: List[Dict[str, Any]]


class AdminSearchParams(AdminBaseSchema):
    query: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    limit: int = 50
    offset: int = 0

    @validator("limit")
    def validate_limit(cls, v):
        if not 1 <= v <= 1000:
            raise ValueError("Limit must be between 1 and 1000")
        return v


class ExportRequest(AdminBaseSchema):
    export_type: str
    format: str = "csv"
    filters: Optional[Dict[str, Any]] = {}
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    @validator("format")
    def validate_format(cls, v):
        allowed_formats = ["csv", "json", "excel"]
        if v not in allowed_formats:
            raise ValueError(f"Format must be one of: {allowed_formats}")
        return v


class ExportResponse(AdminBaseSchema):
    export_id: UUID
    download_url: str
    expires_at: datetime
    file_size: Optional[int] = None
    record_count: Optional[int] = None


class AdminAPIResponse(AdminBaseSchema):
    status: str
    data: Optional[Any] = None
    message: Optional[str] = None
    error_code: Optional[str] = None
    timestamp: Optional[str] = None

    def __init__(self, **data):
        if "timestamp" not in data:
            data["timestamp"] = datetime.utcnow().isoformat()
        super().__init__(**data)


class AdminPaginatedResponse(AdminBaseSchema):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool


class EmailSettingsConfig(AdminBaseSchema):
    smtp_host: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    use_tls: bool = True
    from_email: str
    from_name: str = "Admin Panel"


class SecuritySettingsConfig(AdminBaseSchema):
    session_timeout_minutes: int = 60
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 30
    require_2fa_for_admin: bool = False
    password_min_length: int = 8
    password_require_special_chars: bool = True


class MLSettingsConfig(AdminBaseSchema):
    recommendation_model_version: str = "v1.0"
    enable_collaborative_filtering: bool = True
    enable_content_based_filtering: bool = True
    enable_hybrid_approach: bool = True
    model_retrain_frequency_hours: int = 24
    recommendation_cache_ttl_minutes: int = 60


class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class SettingValue(BaseModel):
    value: Union[str, int, float, bool, dict, list]
    data_type: str
    description: Optional[str] = None
    is_sensitive: bool = False
    last_updated: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None


class SystemSettingsResponse(BaseResponse):
    data: Optional[Dict[str, Dict[str, SettingValue]]] = None


class SettingCategoryUpdate(BaseModel):
    settings: Dict[str, Union[str, int, float, bool, dict, list]] = Field(
        ..., description="Dictionary of setting keys and their new values"
    )

    @validator("settings")
    def validate_settings_not_empty(cls, v):
        if not v:
            raise ValueError("Settings dictionary cannot be empty")
        return v


class SettingUpdate(BaseModel):
    value: Union[str, int, float, bool, dict, list]
    data_type: Optional[str] = None
    description: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None


class FeatureFlagUpdate(BaseModel):
    flags: Dict[str, bool] = Field(
        ..., description="Dictionary of feature flag names and their enabled state"
    )

    @validator("flags")
    def validate_flags_values(cls, v):
        for flag_name, flag_value in v.items():
            if not isinstance(flag_value, bool):
                raise ValueError(f"Feature flag '{flag_name}' must be a boolean value")
        return v


class FeatureFlagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    is_enabled: bool = False
    rollout_percentage: int = Field(0, ge=0, le=100)
    target_groups: Optional[List[str]] = None
    conditions: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None


class FeatureFlagResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_enabled: bool
    rollout_percentage: int
    target_groups: Optional[List[str]]
    conditions: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class SettingsBackupResponse(BaseResponse):
    data: Optional[Dict[str, Any]] = None


class BackupInfo(BaseModel):
    backup_id: str
    created_at: str
    settings_count: int
    backup_size: int
    categories: List[str]
    description: Optional[str] = None
    is_automatic: bool = False


class BackupCreate(BaseModel):
    description: Optional[str] = Field(None, max_length=500)


class BackupRestore(BaseModel):
    backup_id: str
    confirm: bool = Field(..., description="Confirmation that user wants to restore")

    @validator("confirm")
    def validate_confirmation(cls, v):
        if not v:
            raise ValueError("Confirmation is required to restore settings")
        return v


class ValidationRule(BaseModel):
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    min_value: Optional[Union[int, float]] = None
    max_value: Optional[Union[int, float]] = None
    allowed_values: Optional[List[Union[str, int, float]]] = None
    pattern: Optional[str] = None
    required: bool = False


class SettingDefinition(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    key: str = Field(..., min_length=1, max_length=200)
    value: Union[str, int, float, bool, dict, list]
    data_type: str = Field(..., pattern="^(string|integer|float|boolean|json|list)$")
    description: Optional[str] = None
    validation_rules: Optional[ValidationRule] = None
    is_sensitive: bool = False
    is_active: bool = True


class SettingsValidationRequest(BaseModel):
    settings: Dict[str, Dict[str, Union[str, int, float, bool, dict, list]]]


class ValidationError(BaseModel):
    field: str
    error: str


class ValidationWarning(BaseModel):
    field: str
    warning: str


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[ValidationError] = []
    warnings: List[ValidationWarning] = []


class SettingsCategoryInfo(BaseModel):
    name: str
    display_name: str
    description: Optional[str]
    icon: Optional[str]
    sort_order: int = 0
    requires_restart: bool = False
    access_level: str = "admin"


class SettingsCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    sort_order: int = 0
    requires_restart: bool = False
    access_level: str = Field("admin", pattern="^(admin|superuser|system)$")


class SettingsCategoryUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    sort_order: Optional[int] = None
    requires_restart: Optional[bool] = None
    access_level: Optional[str] = Field(None, pattern="^(admin|superuser|system)$")
    is_active: Optional[bool] = None


class SettingsChangeLogEntry(BaseModel):
    id: int
    category: str
    key: str
    old_value: Optional[str]
    new_value: Optional[str]
    change_type: str
    changed_by: int
    changed_at: datetime
    ip_address: Optional[str]
    reason: Optional[str]
    backup_id: Optional[str]

    class Config:
        from_attributes = True


class SettingsChangeLogFilter(BaseModel):
    category: Optional[str] = None
    key: Optional[str] = None
    change_type: Optional[str] = None
    changed_by: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = Field(50, ge=1, le=1000)
    offset: int = Field(0, ge=0)


class SettingsExportRequest(BaseModel):
    categories: Optional[List[str]] = None
    include_sensitive: bool = False
    format: str = Field("json", pattern="^(json|yaml|env)$")


class SettingsImportRequest(BaseModel):
    settings_data: str
    format: str = Field("json", pattern="^(json|yaml|env)$")
    validate_only: bool = False
    merge_strategy: str = Field("replace", pattern="^(replace|merge|skip_existing)$")


class ImportResult(BaseModel):
    success: bool
    imported_count: int
    skipped_count: int
    error_count: int
    errors: List[str] = []
    warnings: List[str] = []


class SettingsSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    categories: Optional[List[str]] = None
    include_values: bool = True
    include_descriptions: bool = True
    limit: int = Field(20, ge=1, le=100)


class SettingsSearchResult(BaseModel):
    category: str
    key: str
    value: Optional[Union[str, int, float, bool, dict, list]]
    description: Optional[str]
    data_type: str
    is_sensitive: bool
    match_score: float


class SettingsSearchResponse(BaseResponse):
    data: Optional[List[SettingsSearchResult]] = None
    total_matches: int
