"""
Segment Rule Engine.
Applies segmentation rules and queries to find matching users.
"""
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

from app.models import Order, User
from app.models.ml_models import UserSegment, UserSegmentMembership
from app.services.segmentation.base_segmentation_service import BaseSegmentationService

logger = logging.getLogger(__name__)


class SegmentRuleEngine(BaseSegmentationService):
    """Service for validating and applying segment rules."""
    
    def validate_segment_rules(self, rules: Dict[str, Any]):
        """Validate segment rules structure."""
        if not rules:
            return

        required_keys = ["conditions"]
        for key in required_keys:
            if key not in rules:
                raise ValueError(f"Missing required key in segment rules: {key}")

        # Validate conditions
        conditions = rules["conditions"]
        if not isinstance(conditions, list):
            raise ValueError("Conditions must be a list")

        for condition in conditions:
            if "field" not in condition or "operator" not in condition:
                raise ValueError("Each condition must have 'field' and 'operator'")

            valid_operators = ["equals", "not_equals", "greater_than", "less_than", 
                             "greater_or_equal", "less_or_equal", "in", "not_in", "contains"]
            if condition["operator"] not in valid_operators:
                raise ValueError(f"Invalid operator: {condition['operator']}")

    def apply_segment_rules(self, segment: UserSegment):
        """Apply segment rules to find matching users."""
        try:
            rules = segment.segment_rules
            if not rules or "conditions" not in rules:
                return

            # Execute query based on rules
            matching_users = self._execute_segment_query(rules)

            # Clear existing memberships
            self.db.query(UserSegmentMembership).filter(
                UserSegmentMembership.segment_id == segment.id
            ).delete()

            # Add new memberships
            for user_data in matching_users:
                membership = UserSegmentMembership(
                    id=uuid.uuid4(),
                    user_id=uuid.UUID(user_data["user_id"]),
                    segment_id=segment.id,
                    score=user_data.get("score", 0.0),
                )
                self.db.add(membership)

            # Update segment size and timestamp
            segment.actual_size = len(matching_users)
            segment.last_updated = datetime.utcnow()

            self.db.commit()
            self.logger.info(f"Applied rules to segment {segment.name}, found {len(matching_users)} users")

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error applying segment rules: {e}")
            raise

    def _execute_segment_query(self, rules: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Execute query based on segment rules."""
        try:
            conditions = rules["conditions"]
            logic = rules.get("logic", "and")  # and/or

            # Build base query
            query = self.db.query(User.id.label("user_id"), User.email, User.created_at)

            # Join with orders if needed
            joins_orders = any(
                c.get("field", "").startswith("order_") for c in conditions
            )
            if joins_orders:
                query = query.outerjoin(Order, User.id == Order.user_id)

            # Build filter conditions
            filter_conditions = []
            for condition in conditions:
                field = condition["field"]
                operator = condition["operator"]
                value = condition.get("value")

                # Map field to SQLAlchemy expression
                if field == "user.created_at":
                    field_expr = User.created_at
                elif field == "user.last_active":
                    field_expr = User.last_active
                elif field == "user.is_active":
                    field_expr = User.is_active
                elif field == "order.total":
                    field_expr = func.sum(Order.total_amount)
                elif field == "order.count":
                    field_expr = func.count(Order.id)
                else:
                    continue

                # Build condition
                cond_expr = self._build_condition_expression(field_expr, operator, value)
                if cond_expr is not None:
                    filter_conditions.append(cond_expr)

            # Apply conditions
            if filter_conditions:
                if logic == "or":
                    query = query.filter(or_(*filter_conditions))
                else:
                    query = query.filter(and_(*filter_conditions))

            # Execute query
            results = query.all()

            return [
                {
                    "user_id": str(row.user_id),
                    "email": row.email,
                    "score": 1.0,
                }
                for row in results
            ]

        except Exception as e:
            self.logger.error(f"Error executing segment query: {e}")
            return []

    def _build_condition_expression(self, field_expr, operator: str, value):
        """Build SQLAlchemy condition expression."""
        try:
            if operator == "equals":
                return field_expr == value
            elif operator == "not_equals":
                return field_expr != value
            elif operator == "greater_than":
                return field_expr > value
            elif operator == "less_than":
                return field_expr < value
            elif operator == "greater_or_equal":
                return field_expr >= value
            elif operator == "less_or_equal":
                return field_expr <= value
            elif operator == "in":
                return field_expr.in_(value)
            elif operator == "not_in":
                return field_expr.notin_(value)
            elif operator == "contains":
                return field_expr.contains(value)
            else:
                return None
        except Exception as e:
            self.logger.error(f"Error building condition: {e}")
            return None
