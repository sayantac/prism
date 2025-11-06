"""
Base Analytics Service with common functionality.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class BaseAnalyticsService:
    """Base class for analytics services with common utilities."""
    
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def _safe_execute(self, operation_name: str, func, default_return: Any = None):
        """Safely execute a database operation with error handling."""
        try:
            return func()
        except Exception as e:
            self.logger.error(f"Error in {operation_name}: {e}")
            if default_return is not None:
                return default_return
            raise
    
    def _serialize_datetime(self, dt: datetime) -> str:
        """Serialize datetime to ISO format string."""
        return dt.isoformat() if dt else None
    
    def _get_date_range(self, days: int):
        """Get start and end datetime for analysis."""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        return start_date, end_date
