# app/api/v1/endpoints/admin/recommendation_engine.py
"""
Admin API endpoints for recommendation engine management
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_permission
from app.models import User
from app.services.ml_model_config_service import MLModelConfigService
from app.services.recommendation_engine_service import RecommendationEngineService
from app.services.training_management_service import TrainingManagementService

router = APIRouter()
logger = logging.getLogger(__name__)


# Pydantic models for request/response
class ModelConfigCreate(BaseModel):
    model_name: str = Field(..., min_length=1, max_length=100)
    model_type: str = Field(..., pattern="^(als|lightgbm|kmeans|content_based)$")
    parameters: Dict[str, Any]
    training_schedule: str = Field(
        default="manual", pattern="^(manual|daily|weekly|monthly)$"
    )
    performance_threshold: float = Field(default=0.0, ge=0.0, le=1.0)
    description: Optional[str] = Field(None, max_length=500)


class ModelConfigUpdate(BaseModel):
    model_name: Optional[str] = Field(None, min_length=1, max_length=100)
    parameters: Optional[Dict[str, Any]] = None
    training_schedule: Optional[str] = Field(
        None, pattern="^(manual|daily|weekly|monthly)$"
    )
    performance_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    description: Optional[str] = Field(None, max_length=500)


class TrainingRequest(BaseModel):
    model_type: str = Field(..., pattern="^(als|lightgbm|kmeans|content_based)$")
    custom_parameters: Optional[Dict[str, Any]] = None


class RecommendationInteractionLog(BaseModel):
    user_id: str
    session_id: str
    interaction_type: str = Field(..., pattern="^(view|click|add_to_cart|purchase)$")
    product_id: str
    recommendation_request_id: Optional[str] = None


# Model Configuration Endpoints
@router.get("/configs")
async def get_model_configs(
    active_only: bool = Query(False, description="Only return active configurations"),
    current_user: User = Depends(require_permission("manage_recommendation_engine")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get all ML model configurations"""
    try:
        service = RecommendationEngineService(db)
        configs = service.get_model_configs(active_only=active_only)

        return {
            "status": "success",
            "data": configs,
            "total_count": len(configs),
            "active_only": active_only,
        }

    except Exception as e:
        logger.error(f"Error getting model configs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update model configuration",
        )


@router.post("/configs/{config_id}/activate")
async def activate_model_config(
    config_id: str,
    current_user: User = Depends(require_permission("manage_recommendation_engine")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Activate a model configuration"""
    try:
        service = RecommendationEngineService(db)
        config = service.activate_model_config(config_id, str(current_user.id))

        return {
            "status": "success",
            "message": "Model configuration activated successfully",
            "data": config,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error activating model config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate model configuration",
        )


@router.post("/configs/{config_id}/deactivate")
async def deactivate_model_config(
    config_id: str,
    current_user: User = Depends(require_permission("manage_recommendation_engine")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Deactivate a model configuration"""
    try:
        service = RecommendationEngineService(db)
        config = service.deactivate_model_config(config_id, str(current_user.id))

        return {
            "status": "success",
            "message": "Model configuration deactivated successfully",
            "data": config,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error deactivating model config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate model configuration",
        )


@router.delete("/configs/{config_id}")
async def delete_model_config(
    config_id: str,
    current_user: User = Depends(require_permission("manage_recommendation_engine")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a model configuration"""
    try:
        service = RecommendationEngineService(db)
        success = service.delete_model_config(config_id)

        return {
            "status": "success",
            "message": "Model configuration deleted successfully",
            "deleted": success,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting model config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete model configuration",
        )


# Training Management Endpoints
@router.post("/train")
async def trigger_model_training(
    training_request: TrainingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("trigger_ml_training")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Trigger model training for a specific model type"""
    try:
        service = RecommendationEngineService(db)
        result = service.trigger_model_training(
            training_request.model_type,
            str(current_user.id),
            training_request.custom_parameters,
        )

        return {
            "status": "success",
            "message": f"Training initiated for {training_request.model_type}",
            "data": result,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error triggering training: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to trigger model training",
        )


@router.get("/training/history")
async def get_training_history(
    days: int = Query(30, ge=1, le=365, description="Days to look back"),
    model_type: Optional[str] = Query(
        None, pattern="^(als|lightgbm|kmeans|content_based)$"
    ),
    status: Optional[str] = Query(
        None, pattern="^(queued|running|completed|failed|cancelled)$"
    ),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of records"),
    current_user: User = Depends(require_permission("view_ml_performance")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get model training history"""
    try:
        service = TrainingManagementService(db)
        history = service.get_training_history(
            days=days, model_type=model_type, status=status, limit=limit
        )

        return {
            "status": "success",
            "data": history,
            "filters": {
                "days": days,
                "model_type": model_type,
                "status": status,
                "limit": limit,
            },
            "total_count": len(history),
        }

    except Exception as e:
        logger.error(f"Error getting training history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve training history",
        )


@router.get("/training/{training_id}/status")
async def get_training_status(
    training_id: str,
    current_user: User = Depends(require_permission("view_ml_performance")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get detailed status of a training session"""
    try:
        service = TrainingManagementService(db)
        status_data = service.get_training_status(training_id)

        return {"status": "success", "data": status_data}

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting training status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve training status",
        )


@router.post("/training/{training_id}/cancel")
async def cancel_training(
    training_id: str,
    current_user: User = Depends(require_permission("trigger_ml_training")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Cancel a running training session"""
    try:
        service = TrainingManagementService(db)
        result = service.cancel_training(training_id, str(current_user.id))

        return {
            "status": "success",
            "message": "Training cancelled successfully",
            "data": result,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error cancelling training: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel training",
        )


@router.get("/training/{training_id}/logs")
async def get_training_logs(
    training_id: str,
    lines: int = Query(
        100, ge=10, le=1000, description="Number of log lines to return"
    ),
    current_user: User = Depends(require_permission("view_ml_performance")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get training logs for a session"""
    try:
        service = TrainingManagementService(db)
        logs = service.get_training_logs(training_id, lines)

        return {
            "status": "success",
            "data": {"training_id": training_id, "logs": logs, "line_count": len(logs)},
        }

    except Exception as e:
        logger.error(f"Error getting training logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve training logs",
        )


# Performance Analytics Endpoints
@router.get("/performance")
async def get_recommendation_performance(
    days: int = Query(30, ge=1, le=365, description="Days to analyze"),
    current_user: User = Depends(require_permission("view_recommendation_analytics")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get recommendation performance metrics"""
    try:
        service = RecommendationEngineService(db)
        performance = service.get_recommendation_performance(days=days)

        return {
            "status": "success",
            "data": performance,
            "generated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting recommendation performance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recommendation performance",
        )


@router.get("/conversion-rates")
async def get_conversion_analytics(
    days: int = Query(30, ge=1, le=365, description="Days to analyze"),
    current_user: User = Depends(require_permission("view_recommendation_analytics")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get detailed conversion rate analytics"""
    try:
        service = RecommendationEngineService(db)
        analytics = service.get_conversion_analytics(days=days)

        return {
            "status": "success",
            "data": analytics,
            "generated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting conversion analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversion analytics",
        )


# Configuration Management Endpoints
@router.get("/model-types")
async def get_available_model_types(
    current_user: User = Depends(require_permission("view_ml_performance")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get available model types and their configurations"""
    try:
        service = MLModelConfigService(db)
        model_types = service.get_model_types()

        return {
            "status": "success",
            "data": model_types,
            "total_types": len(model_types),
        }

    except Exception as e:
        logger.error(f"Error getting model types: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model types",
        )


@router.get("/model-types/{model_type}/default-config")
async def get_default_model_config(
    model_type: str,
    current_user: User = Depends(require_permission("manage_ml_models")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get default configuration for a model type"""
    try:
        service = MLModelConfigService(db)
        default_config = service.get_default_config(model_type)

        return {
            "status": "success",
            "data": {"model_type": model_type, "default_parameters": default_config},
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting default config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve default configuration",
        )


# Interaction Logging Endpoints
@router.post("/log-interaction")
async def log_recommendation_interaction(
    interaction: RecommendationInteractionLog,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Log user interaction with recommendations"""
    try:
        service = RecommendationEngineService(db)
        service.log_recommendation_interaction(
            interaction.user_id,
            interaction.session_id,
            interaction.interaction_type,
            interaction.product_id,
            interaction.recommendation_request_id,
        )

        return {"status": "success", "message": "Interaction logged successfully"}

    except Exception as e:
        logger.error(f"Error logging interaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log interaction",
        )


# Training Statistics Endpoint
@router.get("/training/statistics")
async def get_training_statistics(
    days: int = Query(30, ge=1, le=365, description="Days to analyze"),
    current_user: User = Depends(require_permission("view_ml_performance")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get training statistics and metrics"""
    try:
        service = TrainingManagementService(db)
        statistics = service.get_training_statistics(days=days)

        return {
            "status": "success",
            "data": statistics,
            "generated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting training statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve training statistics",
        )


# Health Check for ML Engine
@router.get("/health")
async def check_ml_engine_health(
    current_user: User = Depends(require_permission("view_system_health")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Check health of ML engine integration"""
    try:
        from app.services.ml_engine_service import MLEngineService

        ml_engine = MLEngineService(db)


        # Check active models
        active_models = ml_engine.active_models
        

        # Check training jobs
        training_jobs = len(ml_engine.training_jobs)

        # Check models directory
        models_dir_exists = os.path.exists(ml_engine.models_dir)

        status = "healthy" if active_models or models_dir_exists else "warning"

        return {
            "status": "success",
            "data": {
                "ml_engine": status,
                "active_models": list(active_models.keys()),
                "training_jobs_count": training_jobs,
                "models_directory": ml_engine.models_dir,
                "models_directory_exists": models_dir_exists,
                "integration_status": "direct_integration",
            },
        }

    except Exception as e:
        logger.error(f"Error checking ML engine health: {e}")
        return {
            "status": "error",
            "data": {
                "ml_engine": "error",
                "error": str(e),
                "integration_status": "failed",
            },
        }


@router.post("/configs")
async def create_model_config(
    config_data: ModelConfigCreate,
    current_user: User = Depends(require_permission("manage_recommendation_engine")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Create a new ML model configuration"""
    try:
        service = RecommendationEngineService(db)
        config = service.create_model_config(config_data.dict(), str(current_user.id))

        return {
            "status": "success",
            "message": "Model configuration created successfully",
            "data": config,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating model config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create model configuration",
        )


@router.put("/configs/{config_id}")
async def update_model_config(
    config_id: str,
    config_data: ModelConfigUpdate,
    current_user: User = Depends(require_permission("manage_recommendation_engine")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Update an existing ML model configuration"""
    try:
        service = RecommendationEngineService(db)
        config = service.update_model_config(
            config_id, config_data.dict(exclude_unset=True), str(current_user.id)
        )

        return {
            "status": "success",
            "message": "Model configuration updated successfully",
            "data": config,
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating model config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model configurations",
        )
