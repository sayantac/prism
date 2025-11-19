"""
System configuration models for notifications, currencies, and languages.
"""
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    DECIMAL,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class Notification(Base):
    """User notifications model."""
    
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON)
    is_read = Column(Boolean, default=False)
    is_sent = Column(Boolean, default=False)
    scheduled_for = Column(DateTime(timezone=True))
    sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Currency(Base):
    """Currency configuration for multi-currency support."""
    
    __tablename__ = "currencies"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(3), unique=True, nullable=False)
    name = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    exchange_rate = Column(DECIMAL(10, 6), default=1.0)
    is_base = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Language(Base):
    """Language configuration for multi-language support."""
    
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(5), unique=True, nullable=False)
    name = Column(String, nullable=False)
    native_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
