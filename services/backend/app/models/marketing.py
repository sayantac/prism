"""Marketing and promotional models."""
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class AdBanner(Base):
    """Advertisement banners for promotional campaigns."""
    
    __tablename__ = "ad_banners"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    target_segment = Column(String(100), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    deal_type = Column(String(50))
    deal_data = Column(Text)
    image_url = Column(String(500))
    banner_text = Column(Text)
    call_to_action = Column(String(100))
    start_time = Column(DateTime(timezone=False))
    end_time = Column(DateTime(timezone=False))
    status = Column(String(20))
    click_count = Column(Integer, default=0)
    impression_count = Column(Integer, default=0)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<AdBanner {self.title}>"


class PromotionalBanner(Base):
    """Promotional banners with AI-generated content."""
    
    __tablename__ = "promotional_banners"

    id = Column(String(50), primary_key=True)
    image_path = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=False)
    product_id = Column(String(50))
    product_category = Column(String(100))
    target_audience = Column(JSON)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    created_by = Column(String(50))
    is_published = Column(Boolean, default=False)
    start_date = Column(DateTime(timezone=False))
    end_date = Column(DateTime(timezone=False))

    def __repr__(self):
        return f"<PromotionalBanner {self.id}>"
