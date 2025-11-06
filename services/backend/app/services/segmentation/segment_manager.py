"""
Segment Manager Service.
Handles CRUD operations for user segments.
"""
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.models.ml_models import UserSegment, UserSegmentMembership
from app.services.segmentation.base_segmentation_service import BaseSegmentationService
from app.services.segmentation.segment_rule_engine import SegmentRuleEngine

logger = logging.getLogger(__name__)


class SegmentManager(BaseSegmentationService):
    """Service for managing user segments."""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self.rule_engine = SegmentRuleEngine(db)
    
    def create_segment(
        self, segment_data: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """Create a new user segment."""
        try:
            # Validate segment rules
            self.rule_engine.validate_segment_rules(segment_data.get("segment_rules", {}))

            # Create segment
            segment = UserSegment(
                id=uuid.uuid4(),
                name=segment_data["name"],
                description=segment_data.get("description", ""),
                segment_rules=segment_data["segment_rules"],
                segment_type=segment_data.get("segment_type", "custom"),
                is_active=segment_data.get("is_active", True),
                auto_update=segment_data.get("auto_update", True),
                target_size=segment_data.get("target_size"),
                created_by=uuid.UUID(user_id),
            )

            self.db.add(segment)
            self.db.commit()
            self.db.refresh(segment)

            # Apply segment rules to find initial members
            if segment.auto_update:
                self.rule_engine.apply_segment_rules(segment)

            self.logger.info(f"Created user segment: {segment.name}")
            return self._serialize_segment(segment)

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating segment: {e}")
            raise

    def update_segment(
        self, segment_id: str, segment_data: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """Update an existing segment."""
        try:
            segment = (
                self.db.query(UserSegment)
                .filter(UserSegment.id == uuid.UUID(segment_id))
                .first()
            )
            if not segment:
                raise ValueError(f"Segment not found: {segment_id}")

            # Update fields
            updateable_fields = [
                "name",
                "description",
                "segment_rules",
                "is_active",
                "auto_update",
                "target_size",
            ]

            rules_changed = False
            for field in updateable_fields:
                if field in segment_data:
                    if (
                        field == "segment_rules"
                        and segment_data[field] != segment.segment_rules
                    ):
                        self.rule_engine.validate_segment_rules(segment_data[field])
                        rules_changed = True
                    setattr(segment, field, segment_data[field])

            segment.updated_by = uuid.UUID(user_id)
            segment.updated_at = datetime.utcnow()
            segment.last_updated = datetime.utcnow()

            self.db.commit()

            # Re-apply rules if they changed
            if rules_changed and segment.auto_update:
                self.rule_engine.apply_segment_rules(segment)

            self.logger.info(f"Updated segment {segment_id}")
            return self._serialize_segment(segment)

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating segment: {e}")
            raise

    def delete_segment(self, segment_id: str) -> bool:
        """Delete a segment and its memberships."""
        try:
            segment = (
                self.db.query(UserSegment)
                .filter(UserSegment.id == uuid.UUID(segment_id))
                .first()
            )
            
            if not segment:
                return False

            # Delete memberships first
            self.db.query(UserSegmentMembership).filter(
                UserSegmentMembership.segment_id == uuid.UUID(segment_id)
            ).delete()

            # Delete segment
            self.db.delete(segment)
            self.db.commit()

            self.logger.info(f"Deleted segment {segment_id}")
            return True

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting segment: {e}")
            raise

    def get_segments(
        self, filters: Dict[str, Any] = None, limit: int = 50, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get list of segments with optional filters."""
        try:
            query = self.db.query(UserSegment)

            if filters:
                if "is_active" in filters:
                    query = query.filter(UserSegment.is_active == filters["is_active"])
                if "segment_type" in filters:
                    query = query.filter(UserSegment.segment_type == filters["segment_type"])

            segments = (
                query.order_by(desc(UserSegment.created_at))
                .limit(limit)
                .offset(offset)
                .all()
            )

            return [self._serialize_segment(seg) for seg in segments]

        except Exception as e:
            self.logger.error(f"Error getting segments: {e}")
            return []

    def get_segment_by_id(self, segment_id: str) -> Dict[str, Any]:
        """Get segment by ID."""
        try:
            segment = (
                self.db.query(UserSegment)
                .filter(UserSegment.id == uuid.UUID(segment_id))
                .first()
            )
            
            if not segment:
                raise ValueError(f"Segment not found: {segment_id}")

            return self._serialize_segment(segment)

        except Exception as e:
            self.logger.error(f"Error getting segment: {e}")
            raise

    def refresh_segment(self, segment_id: str) -> Dict[str, Any]:
        """Refresh segment by re-applying rules."""
        try:
            segment = (
                self.db.query(UserSegment)
                .filter(UserSegment.id == uuid.UUID(segment_id))
                .first()
            )
            
            if not segment:
                raise ValueError(f"Segment not found: {segment_id}")

            # Re-apply rules
            self.rule_engine.apply_segment_rules(segment)

            return {
                "success": True,
                "segment_id": segment_id,
                "new_size": segment.actual_size,
                "updated_at": segment.last_updated.isoformat() if segment.last_updated else None,
            }

        except Exception as e:
            self.logger.error(f"Error refreshing segment: {e}")
            raise
