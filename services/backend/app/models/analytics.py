"""
Analytics and logging models for tracking user behavior and system events.
"""
import uuid
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class SearchAnalytics(Base):
    """Analytics for search queries and results."""
    
    __tablename__ = "search_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    session_id = Column(String, index=True)
    query = Column(Text, nullable=False)
    search_type = Column(String)
    results_count = Column(Integer)
    clicked_product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=True
    )
    click_position = Column(Integer)
    response_time_ms = Column(Integer)
    filters_applied = Column(JSON)
    user_agent = Column(String)
    ip_address = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="search_analytics")


class AuditLog(Base):
    """Audit log for tracking all system changes."""
    
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=True)
    entity_type = Column(String, nullable=True)
    entity_id = Column(String)
    resource_type = Column(String(100), nullable=True, index=True)
    resource_id = Column(String(200), nullable=True, index=True)
    details = Column(Text, nullable=True)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String)
    user_agent = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    session_id = Column(String(100), nullable=True)
    request_id = Column(String(100), nullable=True)


class SystemLog(Base):
    """System logs for error tracking and debugging."""
    
    __tablename__ = "logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    level = Column(String, nullable=False)
    logger_name = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    module = Column(String)
    function_name = Column(String)
    line_number = Column(Integer)
    exception = Column(Text)
    extra_data = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_logs_level_timestamp", "level", "timestamp"),
        Index("ix_logs_logger_timestamp", "logger_name", "timestamp"),
    )
