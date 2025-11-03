import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Order, User
from app.models.ml_models import UserSegment, UserSegmentMembership

settings = get_settings()
logger = logging.getLogger(__name__)


class UserSegmentationService:
    """Manage user segments and automated segmentation rules"""

    def __init__(self, db: Session):
        self.db = db

    def create_segment(
        self, segment_data: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """Create a new user segment"""
        try:
            # Validate segment rules
            self._validate_segment_rules(segment_data.get("segment_rules", {}))

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
                self._apply_segment_rules(segment)

            logger.info(f"Created user segment: {segment.name} by user {user_id}")
            return self._serialize_segment(segment)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating segment: {e}")
            raise

    def update_segment(
        self, segment_id: str, segment_data: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """Update an existing segment"""
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
                        self._validate_segment_rules(segment_data[field])
                        rules_changed = True
                    setattr(segment, field, segment_data[field])

            segment.updated_by = uuid.UUID(user_id)
            segment.updated_at = datetime.utcnow()
            segment.last_updated = datetime.utcnow()

            self.db.commit()

            # Re-apply rules if they changed and auto-update is enabled
            if rules_changed and segment.auto_update:
                self._apply_segment_rules(segment)

            logger.info(f"Updated segment {segment_id} by user {user_id}")
            return self._serialize_segment(segment)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating segment: {e}")
            raise

    def delete_segment(self, segment_id: str) -> bool:
        """Delete a segment and its memberships"""
        try:
            segment = (
                self.db.query(UserSegment)
                .filter(UserSegment.id == uuid.UUID(segment_id))
                .first()
            )
            if not segment:
                raise ValueError(f"Segment not found: {segment_id}")

            # Delete memberships first
            self.db.query(UserSegmentMembership).filter(
                UserSegmentMembership.segment_id == segment.id
            ).delete()

            # Delete segment
            self.db.delete(segment)
            self.db.commit()

            logger.info(f"Deleted segment {segment_id}")
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting segment: {e}")
            raise

    def get_segments(
        self, active_only: bool = False, include_memberships: bool = False
    ) -> List[Dict[str, Any]]:
        """Get all segments with optional filters"""
        try:
            query = self.db.query(UserSegment)

            if active_only:
                query = query.filter(UserSegment.is_active == True)

            segments = query.order_by(UserSegment.created_at.desc()).all()

            result = []
            for segment in segments:
                segment_data = self._serialize_segment(segment)

                if include_memberships:
                    memberships = (
                        self.db.query(UserSegmentMembership)
                        .filter(UserSegmentMembership.segment_id == segment.id)
                        .count()
                    )
                    segment_data["current_membership_count"] = memberships

                result.append(segment_data)

            return result

        except Exception as e:
            logger.error(f"Error getting segments: {e}")
            return []

    def get_segment_members(
        self, segment_id: str, limit: int = 100, offset: int = 0
    ) -> Dict[str, Any]:
        """Get members of a specific segment"""
        try:
            segment = (
                self.db.query(UserSegment)
                .filter(UserSegment.id == uuid.UUID(segment_id))
                .first()
            )
            if not segment:
                raise ValueError(f"Segment not found: {segment_id}")

            # Get memberships with user details
            memberships = (
                self.db.query(UserSegmentMembership, User)
                .join(User, UserSegmentMembership.user_id == User.id)
                .filter(
                    and_(
                        UserSegmentMembership.segment_id == segment.id,
                        UserSegmentMembership.is_active == True,
                    )
                )
            )
            # Get memberships with user details
            memberships = (
                self.db.query(UserSegmentMembership, User)
                .join(User, UserSegmentMembership.user_id == User.id)
                .filter(
                    and_(
                        UserSegmentMembership.segment_id == segment.id,
                        UserSegmentMembership.is_active == True,
                    )
                )
                .order_by(desc(UserSegmentMembership.assigned_at))
                .offset(offset)
                .limit(limit)
                .all()
            )

            # Get total count
            total_count = (
                self.db.query(UserSegmentMembership)
                .filter(
                    and_(
                        UserSegmentMembership.segment_id == segment.id,
                        UserSegmentMembership.is_active == True,
                    )
                )
                .count()
            )

            members = []
            for membership, user in memberships:
                members.append(
                    {
                        "user_id": str(user.id),
                        "username": user.username,
                        "email": user.email,
                        "assigned_at": membership.assigned_at.isoformat(),
                        "membership_score": float(membership.membership_score)
                        if membership.membership_score
                        else 0.0,
                        "assignment_reason": membership.assignment_reason,
                    }
                )

            return {
                "segment_id": segment_id,
                "segment_name": segment.name,
                "members": members,
                "total_count": total_count,
                "returned_count": len(members),
                "offset": offset,
                "limit": limit,
            }

        except Exception as e:
            logger.error(f"Error getting segment members: {e}")
            raise

    def add_user_to_segment(
        self,
        user_id: str,
        segment_id: str,
        score: Optional[float] = None,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Manually add a user to a segment"""
        try:
            # Check if user exists
            user = self.db.query(User).filter(User.id == uuid.UUID(user_id)).first()
            if not user:
                raise ValueError(f"User not found: {user_id}")

            # Check if segment exists
            segment = (
                self.db.query(UserSegment)
                .filter(UserSegment.id == uuid.UUID(segment_id))
                .first()
            )
            if not segment:
                raise ValueError(f"Segment not found: {segment_id}")

            # Check if membership already exists
            existing = (
                self.db.query(UserSegmentMembership)
                .filter(
                    and_(
                        UserSegmentMembership.user_id == user.id,
                        UserSegmentMembership.segment_id == segment.id,
                    )
                )
                .first()
            )

            if existing:
                # Update existing membership
                existing.is_active = True
                existing.membership_score = score
                existing.assignment_reason = reason or "Manual assignment"
                existing.last_evaluated = datetime.utcnow()
            else:
                # Create new membership
                membership = UserSegmentMembership(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    segment_id=segment.id,
                    membership_score=score,
                    assignment_reason=reason or "Manual assignment",
                )
                self.db.add(membership)

            # Update segment size
            self._update_segment_size(segment)
            self.db.commit()

            logger.info(f"Added user {user_id} to segment {segment_id}")
            return {
                "user_id": user_id,
                "segment_id": segment_id,
                "status": "added",
                "score": score,
                "reason": reason,
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding user to segment: {e}")
            raise

    def remove_user_from_segment(self, user_id: str, segment_id: str) -> Dict[str, Any]:
        """Remove a user from a segment"""
        try:
            membership = (
                self.db.query(UserSegmentMembership)
                .filter(
                    and_(
                        UserSegmentMembership.user_id == uuid.UUID(user_id),
                        UserSegmentMembership.segment_id == uuid.UUID(segment_id),
                    )
                )
                .first()
            )

            if not membership:
                raise ValueError(
                    f"User {user_id} is not a member of segment {segment_id}"
                )

            membership.is_active = False

            # Update segment size
            segment = (
                self.db.query(UserSegment)
                .filter(UserSegment.id == uuid.UUID(segment_id))
                .first()
            )
            if segment:
                self._update_segment_size(segment)

            self.db.commit()

            logger.info(f"Removed user {user_id} from segment {segment_id}")
            return {"user_id": user_id, "segment_id": segment_id, "status": "removed"}

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing user from segment: {e}")
            raise

    def refresh_segment(self, segment_id: str) -> Dict[str, Any]:
        """Refresh segment memberships by re-applying rules"""
        try:
            segment = (
                self.db.query(UserSegment)
                .filter(UserSegment.id == uuid.UUID(segment_id))
                .first()
            )
            if not segment:
                raise ValueError(f"Segment not found: {segment_id}")

            old_count = segment.actual_size or 0

            # Re-apply segment rules
            self._apply_segment_rules(segment)

            new_count = segment.actual_size or 0

            return {
                "segment_id": segment_id,
                "segment_name": segment.name,
                "old_member_count": old_count,
                "new_member_count": new_count,
                "change": new_count - old_count,
                "refreshed_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error refreshing segment: {e}")
            raise

    def get_user_segments(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all segments a user belongs to"""
        try:
            memberships = (
                self.db.query(UserSegmentMembership, UserSegment)
                .join(UserSegment, UserSegmentMembership.segment_id == UserSegment.id)
                .filter(
                    and_(
                        UserSegmentMembership.user_id == uuid.UUID(user_id),
                        UserSegmentMembership.is_active == True,
                        UserSegment.is_active == True,
                    )
                )
                .all()
            )

            segments = []
            for membership, segment in memberships:
                segments.append(
                    {
                        "segment_id": str(segment.id),
                        "segment_name": segment.name,
                        "segment_type": segment.segment_type,
                        "description": segment.description,
                        "membership_score": float(membership.membership_score)
                        if membership.membership_score
                        else 0.0,
                        "assigned_at": membership.assigned_at.isoformat(),
                        "assignment_reason": membership.assignment_reason,
                    }
                )

            return segments

        except Exception as e:
            logger.error(f"Error getting user segments: {e}")
            return []

    def create_rfm_segments(self) -> List[Dict[str, Any]]:
        """Create standard RFM-based segments"""
        try:
            rfm_segments = [
                {
                    "name": "Champions",
                    "description": "Bought recently, buy often and spend the most",
                    "segment_type": "rfm",
                    "segment_rules": {
                        "conditions": [
                            {
                                "field": "rfm_recency_score",
                                "operator": ">=",
                                "value": 4,
                            },
                            {
                                "field": "rfm_frequency_score",
                                "operator": ">=",
                                "value": 4,
                            },
                            {
                                "field": "rfm_monetary_score",
                                "operator": ">=",
                                "value": 4,
                            },
                        ],
                        "logic": "AND",
                    },
                },
                {
                    "name": "Loyal Customers",
                    "description": "Spend good money with us often. Responsive to promotions",
                    "segment_type": "rfm",
                    "segment_rules": {
                        "conditions": [
                            {
                                "field": "rfm_recency_score",
                                "operator": ">=",
                                "value": 2,
                            },
                            {
                                "field": "rfm_frequency_score",
                                "operator": ">=",
                                "value": 3,
                            },
                            {
                                "field": "rfm_monetary_score",
                                "operator": ">=",
                                "value": 3,
                            },
                        ],
                        "logic": "AND",
                    },
                },
                {
                    "name": "Potential Loyalists",
                    "description": "Recent customers, but spent a good amount and bought more than once",
                    "segment_type": "rfm",
                    "segment_rules": {
                        "conditions": [
                            {
                                "field": "rfm_recency_score",
                                "operator": ">=",
                                "value": 3,
                            },
                            {
                                "field": "rfm_frequency_score",
                                "operator": ">=",
                                "value": 2,
                            },
                            {
                                "field": "rfm_monetary_score",
                                "operator": ">=",
                                "value": 2,
                            },
                        ],
                        "logic": "AND",
                    },
                },
                {
                    "name": "New Customers",
                    "description": "Bought most recently, but not often",
                    "segment_type": "rfm",
                    "segment_rules": {
                        "conditions": [
                            {
                                "field": "rfm_recency_score",
                                "operator": ">=",
                                "value": 4,
                            },
                            {
                                "field": "rfm_frequency_score",
                                "operator": "<=",
                                "value": 2,
                            },
                        ],
                        "logic": "AND",
                    },
                },
                {
                    "name": "At Risk",
                    "description": "Spent big money and purchased often. But long time ago",
                    "segment_type": "rfm",
                    "segment_rules": {
                        "conditions": [
                            {
                                "field": "rfm_recency_score",
                                "operator": "<=",
                                "value": 2,
                            },
                            {
                                "field": "rfm_frequency_score",
                                "operator": ">=",
                                "value": 3,
                            },
                            {
                                "field": "rfm_monetary_score",
                                "operator": ">=",
                                "value": 3,
                            },
                        ],
                        "logic": "AND",
                    },
                },
                {
                    "name": "Cannot Lose Them",
                    "description": "Made biggest purchases, and often. But long time ago",
                    "segment_type": "rfm",
                    "segment_rules": {
                        "conditions": [
                            {
                                "field": "rfm_recency_score",
                                "operator": "<=",
                                "value": 2,
                            },
                            {
                                "field": "rfm_frequency_score",
                                "operator": ">=",
                                "value": 4,
                            },
                            {
                                "field": "rfm_monetary_score",
                                "operator": ">=",
                                "value": 4,
                            },
                        ],
                        "logic": "AND",
                    },
                },
                {
                    "name": "Hibernating",
                    "description": "Last purchase was long back, low spenders and low number of orders",
                    "segment_type": "rfm",
                    "segment_rules": {
                        "conditions": [
                            {
                                "field": "rfm_recency_score",
                                "operator": "<=",
                                "value": 2,
                            },
                            {
                                "field": "rfm_frequency_score",
                                "operator": "<=",
                                "value": 2,
                            },
                            {
                                "field": "rfm_monetary_score",
                                "operator": "<=",
                                "value": 2,
                            },
                        ],
                        "logic": "AND",
                    },
                },
                {
                    "name": "Lost",
                    "description": "Lowest recency, frequency and monetary scores",
                    "segment_type": "rfm",
                    "segment_rules": {
                        "conditions": [
                            {
                                "field": "rfm_recency_score",
                                "operator": "<=",
                                "value": 1,
                            },
                            {
                                "field": "rfm_frequency_score",
                                "operator": "<=",
                                "value": 1,
                            },
                        ],
                        "logic": "AND",
                    },
                },
            ]

            created_segments = []
            for segment_data in rfm_segments:
                try:
                    # Check if segment already exists
                    existing = (
                        self.db.query(UserSegment)
                        .filter(UserSegment.name == segment_data["name"])
                        .first()
                    )
                    if not existing:
                        segment = self.create_segment(segment_data, "system")
                        created_segments.append(segment)
                        logger.info(f"Created RFM segment: {segment_data['name']}")
                    else:
                        logger.info(
                            f"RFM segment already exists: {segment_data['name']}"
                        )

                except Exception as e:
                    logger.error(
                        f"Error creating RFM segment {segment_data['name']}: {e}"
                    )
                    continue

            return created_segments

        except Exception as e:
            logger.error(f"Error creating RFM segments: {e}")
            return []

    def get_segment_analytics(
        self, segment_id: Optional[str] = None, days: int = 30
    ) -> Dict[str, Any]:
        """Get analytics for segments"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)

            if segment_id:
                # Analytics for specific segment
                segment = (
                    self.db.query(UserSegment)
                    .filter(UserSegment.id == uuid.UUID(segment_id))
                    .first()
                )
                if not segment:
                    raise ValueError(f"Segment not found: {segment_id}")

                # Get segment member user IDs
                member_ids = (
                    self.db.query(UserSegmentMembership.user_id)
                    .filter(
                        and_(
                            UserSegmentMembership.segment_id == segment.id,
                            UserSegmentMembership.is_active == True,
                        )
                    )
                    .subquery()
                )

                # Calculate segment metrics
                metrics = self._calculate_segment_metrics(member_ids, start_date)

                return {
                    "segment_id": segment_id,
                    "segment_name": segment.name,
                    "period_days": days,
                    "metrics": metrics,
                }

            else:
                # Analytics for all segments
                segments = (
                    self.db.query(UserSegment)
                    .filter(UserSegment.is_active == True)
                    .all()
                )

                analytics = {}
                for segment in segments:
                    member_ids = (
                        self.db.query(UserSegmentMembership.user_id)
                        .filter(
                            and_(
                                UserSegmentMembership.segment_id == segment.id,
                                UserSegmentMembership.is_active == True,
                            )
                        )
                        .subquery()
                    )

                    metrics = self._calculate_segment_metrics(member_ids, start_date)
                    analytics[str(segment.id)] = {
                        "segment_name": segment.name,
                        "segment_type": segment.segment_type,
                        "member_count": segment.actual_size or 0,
                        "metrics": metrics,
                    }

                return {
                    "period_days": days,
                    "total_segments": len(segments),
                    "segment_analytics": analytics,
                }

        except Exception as e:
            logger.error(f"Error getting segment analytics: {e}")
            return {"error": str(e)}

    def _validate_segment_rules(self, rules: Dict[str, Any]):
        """Validate segment rule structure and logic"""
        if not isinstance(rules, dict):
            raise ValueError("Segment rules must be a dictionary")

        if "conditions" not in rules:
            raise ValueError("Segment rules must contain 'conditions'")

        conditions = rules["conditions"]
        if not isinstance(conditions, list) or len(conditions) == 0:
            raise ValueError("Conditions must be a non-empty list")

        valid_fields = [
            "total_orders",
            "total_spent",
            "avg_order_value",
            "days_since_last_order",
            "rfm_recency_score",
            "rfm_frequency_score",
            "rfm_monetary_score",
            "account_age_days",
            "total_sessions",
            "avg_session_duration",
            "product_categories_purchased",
            "last_login_days_ago",
        ]

        valid_operators = [
            "=",
            "!=",
            ">",
            "<",
            ">=",
            "<=",
            "in",
            "not_in",
            "contains",
            "not_contains",
        ]

        for condition in conditions:
            if not isinstance(condition, dict):
                raise ValueError("Each condition must be a dictionary")

            if (
                "field" not in condition
                or "operator" not in condition
                or "value" not in condition
            ):
                raise ValueError(
                    "Each condition must have 'field', 'operator', and 'value'"
                )

            if condition["field"] not in valid_fields:
                raise ValueError(
                    f"Invalid field: {condition['field']}. Valid fields: {valid_fields}"
                )

            if condition["operator"] not in valid_operators:
                raise ValueError(
                    f"Invalid operator: {condition['operator']}. Valid operators: {valid_operators}"
                )

        # Validate logic operator
        logic = rules.get("logic", "AND")
        if logic not in ["AND", "OR"]:
            raise ValueError("Logic must be 'AND' or 'OR'")

    def _apply_segment_rules(self, segment: UserSegment):
        """Apply segment rules to find matching users"""
        try:
            # Clear existing memberships if auto-update
            if segment.auto_update:
                self.db.query(UserSegmentMembership).filter(
                    UserSegmentMembership.segment_id == segment.id
                ).delete()

            # Build query based on rules
            matching_users = self._execute_segment_query(segment.segment_rules)

            # Create new memberships
            for user_data in matching_users:
                membership = UserSegmentMembership(
                    id=uuid.uuid4(),
                    user_id=user_data["user_id"],
                    segment_id=segment.id,
                    membership_score=user_data.get("score", 1.0),
                    assignment_reason="Automatic rule-based assignment",
                )
                self.db.add(membership)

            # Update segment size
            segment.actual_size = len(matching_users)
            segment.last_updated = datetime.utcnow()

            self.db.commit()

            logger.info(
                f"Applied rules for segment {segment.name}: {len(matching_users)} users matched"
            )

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error applying segment rules: {e}")
            raise

    def _execute_segment_query(self, rules: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Execute segment query based on rules"""
        try:
            # Build base query with user data and calculated fields
            query = (
                self.db.query(
                    User.id.label("user_id"),
                    func.coalesce(func.count(Order.id), 0).label("total_orders"),
                    func.coalesce(func.sum(Order.total_amount), 0).label("total_spent"),
                    func.coalesce(func.avg(Order.total_amount), 0).label(
                        "avg_order_value"
                    ),
                    func.coalesce(
                        func.extract("day", func.now() - func.max(Order.created_at)),
                        999,
                    ).label("days_since_last_order"),
                    func.extract("day", func.now() - User.created_at).label(
                        "account_age_days"
                    ),
                    func.coalesce(
                        func.extract("day", func.now() - User.last_active), 999
                    ).label("last_login_days_ago"),
                )
                .outerjoin(Order, User.id == Order.user_id)
                .group_by(User.id)
            )

            # Apply conditions
            conditions = rules["conditions"]
            logic = rules.get("logic", "AND")

            where_conditions = []
            for condition in conditions:
                field = condition["field"]
                operator = condition["operator"]
                value = condition["value"]

                # Map field names to query expressions
                field_mapping = {
                    "total_orders": func.count(Order.id),
                    "total_spent": func.sum(Order.total_amount),
                    "avg_order_value": func.avg(Order.total_amount),
                    "days_since_last_order": func.extract(
                        "day", func.now() - func.max(Order.created_at)
                    ),
                    "account_age_days": func.extract(
                        "day", func.now() - User.created_at
                    ),
                    "last_login_days_ago": func.extract(
                        "day", func.now() - User.last_active
                    ),
                }

                if field in field_mapping:
                    field_expr = field_mapping[field]
                    condition_expr = self._build_condition_expression(
                        field_expr, operator, value
                    )
                    where_conditions.append(condition_expr)

            # Combine conditions with logic operator
            if where_conditions:
                if logic == "AND":
                    query = query.having(and_(*where_conditions))
                else:  # OR
                    query = query.having(or_(*where_conditions))

            # Execute query and format results
            results = query.all()

            return [
                {
                    "user_id": result.user_id,
                    "score": self._calculate_user_score(result, rules),
                }
                for result in results
            ]

        except Exception as e:
            logger.error(f"Error executing segment query: {e}")
            return []

    def _build_condition_expression(self, field_expr, operator: str, value):
        """Build SQLAlchemy condition expression"""
        if operator == "=":
            return field_expr == value
        elif operator == "!=":
            return field_expr != value
        elif operator == ">":
            return field_expr > value
        elif operator == "<":
            return field_expr < value
        elif operator == ">=":
            return field_expr >= value
        elif operator == "<=":
            return field_expr <= value
        elif operator == "in":
            return field_expr.in_(value if isinstance(value, list) else [value])
        elif operator == "not_in":
            return ~field_expr.in_(value if isinstance(value, list) else [value])
        else:
            raise ValueError(f"Unsupported operator: {operator}")

    def _calculate_user_score(self, user_data, rules: Dict[str, Any]) -> float:
        """Calculate a score for how well a user matches the segment"""
        # Simple scoring: count how many conditions the user satisfies
        conditions = rules["conditions"]
        satisfied_conditions = 0

        for condition in conditions:
            field = condition["field"]
            operator = condition["operator"]
            value = condition["value"]

            # Get user field value
            user_value = getattr(user_data, field, 0)

            # Check if condition is satisfied
            if self._evaluate_condition(user_value, operator, value):
                satisfied_conditions += 1

        return satisfied_conditions / len(conditions) if conditions else 0.0

    def _evaluate_condition(self, user_value, operator: str, condition_value) -> bool:
        """Evaluate if a condition is satisfied"""
        try:
            if operator == "=":
                return user_value == condition_value
            elif operator == "!=":
                return user_value != condition_value
            elif operator == ">":
                return user_value > condition_value
            elif operator == "<":
                return user_value < condition_value
            elif operator == ">=":
                return user_value >= condition_value
            elif operator == "<=":
                return user_value <= condition_value
            elif operator == "in":
                return user_value in (
                    condition_value
                    if isinstance(condition_value, list)
                    else [condition_value]
                )
            elif operator == "not_in":
                return user_value not in (
                    condition_value
                    if isinstance(condition_value, list)
                    else [condition_value]
                )
            else:
                return False
        except Exception:
            return False

    def _update_segment_size(self, segment: UserSegment):
        """Update the actual size of a segment"""
        try:
            count = (
                self.db.query(UserSegmentMembership)
                .filter(
                    and_(
                        UserSegmentMembership.segment_id == segment.id,
                        UserSegmentMembership.is_active == True,
                    )
                )
                .count()
            )

            segment.actual_size = count
            segment.last_updated = datetime.utcnow()

        except Exception as e:
            logger.error(f"Error updating segment size: {e}")

    def _calculate_segment_metrics(
        self, member_ids_subquery, start_date: datetime
    ) -> Dict[str, Any]:
        """Calculate metrics for a segment"""
        try:
            # Orders by segment members
            segment_orders = (
                self.db.query(
                    func.count(Order.id).label("total_orders"),
                    func.coalesce(func.sum(Order.total_amount), 0).label(
                        "total_revenue"
                    ),
                    func.coalesce(func.avg(Order.total_amount), 0).label(
                        "avg_order_value"
                    ),
                )
                .filter(
                    and_(
                        Order.user_id.in_(member_ids_subquery),
                        Order.created_at >= start_date,
                    )
                )
                .first()
            )

            # User activity metrics
            member_count = (
                self.db.query(func.count()).select_from(member_ids_subquery).scalar()
            )

            return {
                "member_count": member_count,
                "total_orders": segment_orders.total_orders or 0,
                "total_revenue": float(segment_orders.total_revenue or 0),
                "avg_order_value": float(segment_orders.avg_order_value or 0),
                "orders_per_member": round(
                    (segment_orders.total_orders or 0) / member_count, 2
                )
                if member_count > 0
                else 0,
                "revenue_per_member": round(
                    float(segment_orders.total_revenue or 0) / member_count, 2
                )
                if member_count > 0
                else 0,
            }

        except Exception as e:
            logger.error(f"Error calculating segment metrics: {e}")
            return {}

    def _serialize_segment(self, segment: UserSegment) -> Dict[str, Any]:
        """Serialize segment to dictionary"""
        return {
            "id": str(segment.id),
            "name": segment.name,
            "description": segment.description,
            "segment_type": segment.segment_type,
            "segment_rules": segment.segment_rules,
            "is_active": segment.is_active,
            "auto_update": segment.auto_update,
            "target_size": segment.target_size,
            "actual_size": segment.actual_size or 0,
            "created_at": segment.created_at.isoformat(),
            "updated_at": segment.updated_at.isoformat()
            if segment.updated_at
            else None,
            "last_updated": segment.last_updated.isoformat()
            if segment.last_updated
            else None,
            "created_by": str(segment.created_by) if segment.created_by else None,
            "updated_by": str(segment.updated_by) if segment.updated_by else None,
        }
