"""
Segmentation Package Initialization.
"""

from app.services.segmentation.rfm_segmenter import RFMSegmenter
from app.services.segmentation.segment_manager import SegmentManager
from app.services.segmentation.segment_rule_engine import SegmentRuleEngine

__all__ = [
    "SegmentManager",
    "SegmentRuleEngine",
    "RFMSegmenter",
]
