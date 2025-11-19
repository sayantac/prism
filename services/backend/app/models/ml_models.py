"""
Database models for ML and recommendation system management.

This module contains models for:
- ML model configurations
- Training runs and metrics
- User segmentation
- Recommendation tracking
"""
import uuid

from sqlalchemy import (
    DECIMAL,
    JSON,
    UUID,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class RecommendationResult(Base):
    __tablename__ = "recommendation_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    session_id = Column(String(100), index=True)

    # Recommendation data
    algorithm = Column(String(50), nullable=False)  # collaborative, content_based, etc.
    score = Column(Numeric(5, 4), nullable=False)
    rank = Column(Integer, nullable=False)

    # Context
    recommendation_type = Column(String(50))  # homepage, product_page, cart, etc.
    context_data = Column(JSON)

    # Tracking
    was_clicked = Column(Boolean, default=False)
    was_purchased = Column(Boolean, default=False)
    click_timestamp = Column(DateTime)

    # Relationships
    product = relationship("Product", back_populates="recommendations")


class MLModelConfig(Base):
    """Configuration for ML models"""

    __tablename__ = "ml_model_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True, unique=True)
    model_type = Column(
        String(100), nullable=False
    )  # 'als', 'lightgbm', 'kmeans', 'content_based'
    description = Column(Text)
    parameters = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=False, index=True)
    is_default = Column(Boolean, default=False)
    accuracy_score = Column(DECIMAL(5, 4))
    precision_score = Column(DECIMAL(5, 4))
    recall_score = Column(DECIMAL(5, 4))
    last_trained = Column(DateTime(timezone=False))
    training_data_version = Column(String(500))
    model_version = Column(String(500))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())

    # Relationships
    training_history = relationship(
        "ModelTrainingHistory", back_populates="model_config"
    )
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    def __repr__(self):
        return f"<MLModelConfig(name='{self.name}', type='{self.model_type}', active={self.is_active})>"


class ModelTrainingHistory(Base):
    """Track ML model training sessions"""

    __tablename__ = "model_training_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_config_id = Column(UUID(as_uuid=True), ForeignKey("ml_model_configs.id"))
    training_status = Column(
        String(50), default="queued", index=True
    )  # 'queued', 'running', 'completed', 'failed'
    training_metrics = Column(JSONB)  # Store accuracy, loss, etc.
    training_parameters = Column(JSONB)  # Parameters used for this training
    error_message = Column(Text)
    training_data_stats = Column(JSONB)  # Dataset statistics
    model_performance = Column(JSONB)  # Validation metrics
    training_duration_seconds = Column(Integer)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    initiated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    model_config = relationship("MLModelConfig", back_populates="training_history")
    initiator = relationship("User")
    model_version = relationship("ModelVersion", back_populates="training_history", uselist=False)

    def __repr__(self):
        return (
            f"<ModelTrainingHistory(id='{self.id}', status='{self.training_status}')>"
        )


class ModelVersion(Base):
    """Track model versions with file paths and metadata"""

    __tablename__ = "model_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_config_id = Column(UUID(as_uuid=True), ForeignKey("ml_model_configs.id"), nullable=False, index=True)
    training_history_id = Column(UUID(as_uuid=True), ForeignKey("model_training_history.id"), index=True)
    version_number = Column(String(50), nullable=False)  # e.g., "v1.0.0", "latest", UUID
    file_path = Column(String(500), nullable=False)  # Path to model file
    file_size_bytes = Column(Integer)  # Size of model file
    is_active = Column(Boolean, default=False, index=True)  # Currently active version
    model_metadata = Column(JSONB)  # Model-specific metadata (encoders, mappings, etc.)
    performance_metrics = Column(JSONB)  # Evaluation metrics
    config_snapshot = Column(JSONB)  # Config used for training this version
    training_data_hash = Column(String(64))  # SHA256 hash of training data for reproducibility
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    model_config = relationship("MLModelConfig", backref="versions")
    training_history = relationship("ModelTrainingHistory", back_populates="model_version")
    creator = relationship("User")

    def __repr__(self):
        return f"<ModelVersion(config_id='{self.model_config_id}', version='{self.version_number}', active={self.is_active})>"


class RecommendationMetrics(Base):
    """Track recommendation performance and conversions"""

    __tablename__ = "recommendation_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    session_id = Column(String(100), index=True)
    recommendation_type = Column(
        String(50), index=True
    )  # 'collaborative', 'content_based', 'popular', 'ml_enhanced'
    recommended_products = Column(JSONB)  # Array of product IDs with scores
    viewed_products = Column(JSONB)  # Products viewed from recommendations
    clicked_products = Column(JSONB)  # Products clicked from recommendations
    added_to_cart = Column(JSONB)  # Products added to cart from recommendations
    purchased_products = Column(JSONB)  # Products purchased from recommendations
    conversion_rate = Column(DECIMAL(5, 4))
    click_through_rate = Column(DECIMAL(5, 4))
    revenue_generated = Column(DECIMAL(10, 2), default=0.0)
    recommendation_context = Column(JSONB)  # Page context, user segment, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<RecommendationMetrics(user_id='{self.user_id}', type='{self.recommendation_type}')>"


class UserSegment(Base):
    """Custom user segments for targeted campaigns"""

    __tablename__ = "user_segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text)
    segment_type = Column(
        String(50)
    )  # 'rfm', 'behavioral', 'custom', 'ml_cluster'
    criteria = Column(
        JSONB
    )  # Complex rules for segment membership
    is_active = Column(Boolean, default=True, index=True)
    auto_update = Column(Boolean, default=True)  # Automatically update memberships
    update_frequency = Column(String(20))  # 'daily', 'weekly', 'monthly'
    member_count = Column(Integer, default=0)  # Current segment size
    last_updated = Column(DateTime(timezone=False))
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())

    # Relationships
    memberships = relationship("UserSegmentMembership", back_populates="segment")

    def __repr__(self):
        return f"<UserSegment(name='{self.name}', type='{self.segment_type}', size={self.member_count})>"


class UserSegmentMembership(Base):
    """Track user membership in segments"""

    __tablename__ = "user_segment_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    segment_id = Column(UUID(as_uuid=True), ForeignKey("user_segments.id"))
    membership_score = Column(DECIMAL(5, 4))  # Confidence score for membership
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    last_evaluated = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, index=True)
    assignment_reason = Column(String(200))  # Why user was assigned to segment

    # Relationships
    user = relationship("User")
    segment = relationship("UserSegment", back_populates="memberships")

    __table_args__ = (
        {"schema": None},  # Use default schema
    )

    def __repr__(self):
        return f"<UserSegmentMembership(user_id='{self.user_id}', segment_id='{self.segment_id}')>"


class UserAnalyticsDaily(Base):
    """Daily aggregated user analytics"""

    __tablename__ = "user_analytics_daily"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    date = Column(Date, nullable=False, index=True)
    page_views = Column(Integer, default=0)
    search_queries = Column(Integer, default=0)
    products_viewed = Column(Integer, default=0)
    unique_products_viewed = Column(Integer, default=0)
    cart_additions = Column(Integer, default=0)
    cart_removals = Column(Integer, default=0)
    wishlist_additions = Column(Integer, default=0)
    session_duration_seconds = Column(Integer, default=0)
    bounce_rate = Column(DECIMAL(5, 4))
    conversion_events = Column(Integer, default=0)
    revenue_generated = Column(DECIMAL(10, 2), default=0.0)
    device_type = Column(String(50))  # 'desktop', 'mobile', 'tablet'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<UserAnalyticsDaily(user_id='{self.user_id}', date='{self.date}')>"


class UserJourneyEvent(Base):
    """Track detailed user journey events"""

    __tablename__ = "user_journey_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    session_id = Column(String(100), index=True)
    event_type = Column(
        String(50), nullable=False, index=True
    )  # 'page_view', 'search', 'product_view', etc.
    event_data = Column(JSONB)  # Event-specific data
    page_url = Column(String(500))
    referrer = Column(String(500))
    user_agent = Column(String(1000))
    ip_address = Column(String(45))
    device_info = Column(JSONB)
    geolocation = Column(JSONB)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<UserJourneyEvent(event_type='{self.event_type}', user_id='{self.user_id}')>"


class RecommendationConversion(Base):
    """Track conversion rates for recommendations"""

    __tablename__ = "recommendation_conversions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    session_id = Column(String(100), index=True)
    recommendation_request_id = Column(
        String(100), index=True
    )  # Link to specific recommendation request
    recommended_products = Column(JSONB)  # Original recommendations with scores
    interactions = Column(JSONB)  # Detailed interaction tracking
    final_conversion = Column(JSONB)  # Final purchase details
    conversion_value = Column(DECIMAL(10, 2), default=0.0)
    time_to_conversion_minutes = Column(
        Integer
    )  # Time from recommendation to conversion
    conversion_funnel = Column(JSONB)  # Track the conversion funnel steps
    a_b_test_variant = Column(String(50))  # A/B testing variant
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<RecommendationConversion(user_id='{self.user_id}', value={self.conversion_value})>"


class SystemAlert(Base):
    """System alerts for monitoring"""

    __tablename__ = "system_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_type = Column(
        String(50), nullable=False, index=True
    )  # 'performance', 'error', 'security', 'ml_model'
    severity = Column(
        String(20), default="medium", index=True
    )  # 'low', 'medium', 'high', 'critical'
    title = Column(String(200), nullable=False)
    description = Column(Text)
    alert_data = Column(JSONB)  # Alert-specific data
    source_component = Column(String(100))  # Component that generated the alert
    is_acknowledged = Column(Boolean, default=False, index=True)
    is_resolved = Column(Boolean, default=False, index=True)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    acknowledged_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    acknowledger = relationship("User", foreign_keys=[acknowledged_by])
    resolver = relationship("User", foreign_keys=[resolved_by])

    def __repr__(self):
        return f"<SystemAlert(type='{self.alert_type}', severity='{self.severity}', resolved={self.is_resolved})>"


class InventoryForecast(Base):
    """Inventory demand forecasting"""

    __tablename__ = "inventory_forecasts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    forecast_period_days = Column(Integer, default=30)
    predicted_demand = Column(Integer)
    confidence_interval_lower = Column(Integer)
    confidence_interval_upper = Column(Integer)
    current_stock = Column(Integer)
    recommended_order_quantity = Column(Integer)
    stockout_probability = Column(DECIMAL(5, 4))
    seasonal_factor = Column(DECIMAL(5, 4))
    trend_factor = Column(DECIMAL(5, 4))
    forecast_accuracy = Column(DECIMAL(5, 4))  # From previous predictions
    model_used = Column(String(50))  # Forecasting model used
    forecast_date = Column(Date, default=func.current_date())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product")

    def __repr__(self):
        return f"<InventoryForecast(product_id='{self.product_id}', demand={self.predicted_demand})>"
