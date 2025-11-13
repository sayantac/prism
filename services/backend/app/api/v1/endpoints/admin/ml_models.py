"""
Admin API endpoints for ML Model Management.

This module provides admin-only endpoints for managing ML models, versions,
configurations, and monitoring model performance.
"""
import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_superuser as get_current_active_superuser, get_db
from app.models.ml_models import MLModelConfig, ModelTrainingHistory, ModelVersion
from app.models.user import User
from app.services.ml.ml_model_manager import MLModelManager

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== Pydantic Schemas ====================

class ModelVersionResponse(BaseModel):
    id: UUID
    model_config_id: UUID
    training_history_id: Optional[UUID]
    version_number: str
    file_path: str
    file_size_bytes: Optional[int]
    is_active: bool
    performance_metrics: Optional[dict]
    config_snapshot: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class ModelConfigSummary(BaseModel):
    id: UUID
    name: str
    model_type: str
    description: Optional[str]
    is_active: bool
    accuracy_score: Optional[float]
    last_trained: Optional[datetime]
    version_count: int
    active_version: Optional[ModelVersionResponse]

    class Config:
        from_attributes = True


class ModelListResponse(BaseModel):
    total: int
    models: List[ModelConfigSummary]


class ModelDetailResponse(BaseModel):
    id: UUID
    name: str
    model_type: str
    description: Optional[str]
    parameters: dict
    is_active: bool
    accuracy_score: Optional[float]
    precision_score: Optional[float]
    recall_score: Optional[float]
    last_trained: Optional[datetime]
    model_version: Optional[str]
    created_at: datetime
    updated_at: datetime
    versions: List[ModelVersionResponse]
    training_history_count: int

    class Config:
        from_attributes = True


class ModelFileInfo(BaseModel):
    filename: str
    path: str
    size_bytes: int
    modified_at: str


class ModelFilesResponse(BaseModel):
    model_type: str
    files: List[ModelFileInfo]
    total_size_bytes: int


# ==================== Endpoints ====================

@router.get("/models", response_model=ModelListResponse)
async def list_ml_models(
    model_type: Optional[str] = Query(None, description="Filter by model type"),
    active_only: bool = Query(False, description="Only show active models"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    List all ML model configurations.

    Returns a summary of all ML models including their active versions,
    performance metrics, and training status.
    """
    try:
        query = db.query(MLModelConfig)

        if model_type:
            query = query.filter(MLModelConfig.model_type == model_type)

        if active_only:
            query = query.filter(MLModelConfig.is_active == True)

        configs = query.all()

        models = []
        for config in configs:
            # Get version count
            version_count = db.query(ModelVersion).filter(
                ModelVersion.model_config_id == config.id
            ).count()

            # Get active version
            active_version = db.query(ModelVersion).filter(
                ModelVersion.model_config_id == config.id,
                ModelVersion.is_active == True
            ).first()

            models.append(ModelConfigSummary(
                id=config.id,
                name=config.name,
                model_type=config.model_type,
                description=config.description,
                is_active=config.is_active,
                accuracy_score=float(config.accuracy_score) if config.accuracy_score else None,
                last_trained=config.last_trained,
                version_count=version_count,
                active_version=active_version
            ))

        return ModelListResponse(
            total=len(models),
            models=models
        )

    except Exception as e:
        logger.error(f"Error listing ML models: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing ML models: {str(e)}"
        )


@router.get("/models/{model_id}", response_model=ModelDetailResponse)
async def get_model_details(
    model_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get detailed information about a specific ML model.

    Includes all versions, training history, performance metrics,
    and configuration details.
    """
    try:
        config = db.query(MLModelConfig).filter(MLModelConfig.id == model_id).first()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model configuration not found"
            )

        # Get all versions
        versions = db.query(ModelVersion).filter(
            ModelVersion.model_config_id == model_id
        ).order_by(ModelVersion.created_at.desc()).all()

        # Get training history count
        training_count = db.query(ModelTrainingHistory).filter(
            ModelTrainingHistory.model_config_id == model_id
        ).count()

        return ModelDetailResponse(
            id=config.id,
            name=config.name,
            model_type=config.model_type,
            description=config.description,
            parameters=config.parameters or {},
            is_active=config.is_active,
            accuracy_score=float(config.accuracy_score) if config.accuracy_score else None,
            precision_score=float(config.precision_score) if config.precision_score else None,
            recall_score=float(config.recall_score) if config.recall_score else None,
            last_trained=config.last_trained,
            model_version=config.model_version,
            created_at=config.created_at,
            updated_at=config.updated_at,
            versions=[ModelVersionResponse.from_orm(v) for v in versions],
            training_history_count=training_count
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model details: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting model details: {str(e)}"
        )


@router.get("/models/{model_type}/active")
async def get_active_model(
    model_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get the currently active model for a specific type.

    Returns the active configuration and version information.
    """
    try:
        # Get from model manager cache
        model_manager = MLModelManager.get_instance(db=db)
        active_model = model_manager.get_active_model(model_type)

        if not active_model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No active model found for type: {model_type}"
            )

        return {
            "model_type": model_type,
            "model_data": active_model,
            "cached": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting active model: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting active model: {str(e)}"
        )


@router.get("/models/{model_type}/versions", response_model=List[ModelVersionResponse])
async def list_model_versions(
    model_type: str,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    List all versions for a specific model type.

    Returns version history with performance metrics and metadata.
    """
    try:
        # Get model config for this type
        config = db.query(MLModelConfig).filter(
            MLModelConfig.model_type == model_type,
            MLModelConfig.is_active == True
        ).first()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No active configuration found for model type: {model_type}"
            )

        # Get versions
        versions = db.query(ModelVersion).filter(
            ModelVersion.model_config_id == config.id
        ).order_by(ModelVersion.created_at.desc()).limit(limit).all()

        return [ModelVersionResponse.from_orm(v) for v in versions]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing model versions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing model versions: {str(e)}"
        )


@router.get("/models/{model_id}/config")
async def get_model_config(
    model_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get the configuration parameters for a model.

    Returns hyperparameters and training configuration.
    """
    try:
        config = db.query(MLModelConfig).filter(MLModelConfig.id == model_id).first()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model configuration not found"
            )

        return {
            "model_id": str(config.id),
            "model_type": config.model_type,
            "name": config.name,
            "parameters": config.parameters or {},
            "is_active": config.is_active,
            "created_at": config.created_at,
            "updated_at": config.updated_at
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting model config: {str(e)}"
        )


@router.get("/models/{model_id}/metrics")
async def get_model_metrics(
    model_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get performance metrics for a model.

    Returns accuracy, precision, recall, and other evaluation metrics.
    """
    try:
        config = db.query(MLModelConfig).filter(MLModelConfig.id == model_id).first()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model configuration not found"
            )

        # Get active version metrics
        active_version = db.query(ModelVersion).filter(
            ModelVersion.model_config_id == model_id,
            ModelVersion.is_active == True
        ).first()

        metrics = {
            "model_id": str(config.id),
            "model_type": config.model_type,
            "accuracy_score": float(config.accuracy_score) if config.accuracy_score else None,
            "precision_score": float(config.precision_score) if config.precision_score else None,
            "recall_score": float(config.recall_score) if config.recall_score else None,
            "last_trained": config.last_trained,
            "active_version_metrics": active_version.performance_metrics if active_version else None
        }

        return metrics

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model metrics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting model metrics: {str(e)}"
        )


@router.post("/models/{version_id}/activate")
async def activate_model_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Activate a specific model version.

    Deactivates the currently active version and activates the specified version.
    Updates the model manager cache.
    """
    try:
        model_manager = MLModelManager.get_instance(db=db)
        success = model_manager.activate_model_version(version_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to activate model version"
            )

        return {
            "message": "Model version activated successfully",
            "version_id": str(version_id),
            "activated_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating model version: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error activating model version: {str(e)}"
        )


@router.delete("/models/{version_id}")
async def delete_model_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Delete a specific model version.

    Cannot delete the currently active version. Removes both the database
    record and the model file from disk.
    """
    try:
        model_manager = MLModelManager.get_instance(db=db)
        success = model_manager.delete_model_version(version_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete model version (may be active)"
            )

        return {
            "message": "Model version deleted successfully",
            "version_id": str(version_id),
            "deleted_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting model version: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting model version: {str(e)}"
        )


@router.post("/models/cleanup")
async def cleanup_old_versions(
    model_type: Optional[str] = Query(None, description="Clean up specific model type"),
    dry_run: bool = Query(False, description="Preview what would be deleted"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Clean up old model versions, keeping only the most recent N versions.

    Uses MODEL_VERSION_LIMIT from settings. Can be run in dry-run mode
    to preview what would be deleted.
    """
    try:
        from app.core.config import get_settings
        settings = get_settings()

        # Get all configs or filter by type
        query = db.query(MLModelConfig)
        if model_type:
            query = query.filter(MLModelConfig.model_type == model_type)

        configs = query.all()

        cleanup_summary = []

        for config in configs:
            # Get all versions for this config
            versions = db.query(ModelVersion).filter(
                ModelVersion.model_config_id == config.id
            ).order_by(ModelVersion.created_at.desc()).all()

            if len(versions) > settings.MODEL_VERSION_LIMIT:
                versions_to_delete = versions[settings.MODEL_VERSION_LIMIT:]

                cleanup_info = {
                    "model_type": config.model_type,
                    "model_name": config.name,
                    "total_versions": len(versions),
                    "versions_to_delete": len(versions_to_delete),
                    "versions": [
                        {
                            "version_id": str(v.id),
                            "version_number": v.version_number,
                            "created_at": v.created_at.isoformat(),
                            "file_size_bytes": v.file_size_bytes
                        }
                        for v in versions_to_delete
                    ]
                }

                cleanup_summary.append(cleanup_info)

                # Actually delete if not dry run
                if not dry_run:
                    model_manager = MLModelManager.get_instance(db=db)
                    for version in versions_to_delete:
                        model_manager.delete_model_version(version.id)

        return {
            "dry_run": dry_run,
            "version_limit": settings.MODEL_VERSION_LIMIT,
            "cleanup_summary": cleanup_summary,
            "total_versions_affected": sum(c["versions_to_delete"] for c in cleanup_summary)
        }

    except Exception as e:
        logger.error(f"Error cleaning up old versions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning up old versions: {str(e)}"
        )


@router.get("/models/files/{model_type}", response_model=ModelFilesResponse)
async def list_model_files(
    model_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    List all saved model files for a specific type.

    Returns file information including size and modification dates.
    """
    try:
        model_manager = MLModelManager.get_instance(db=db)
        files_dict = model_manager.list_saved_models(model_type=model_type)

        if model_type not in files_dict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Invalid model type: {model_type}"
            )

        files = files_dict[model_type]
        total_size = sum(f["size_bytes"] for f in files)

        return ModelFilesResponse(
            model_type=model_type,
            files=[ModelFileInfo(**f) for f in files],
            total_size_bytes=total_size
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing model files: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing model files: {str(e)}"
        )


@router.post("/models/cache/reload")
async def reload_model_cache(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Reload all models into the cache.

    Forces a reload of all saved models from disk into the
    model manager's active cache.
    """
    try:
        model_manager = MLModelManager.get_instance(db=db)
        active_models = model_manager.reload_active_models()

        return {
            "message": "Model cache reloaded successfully",
            "active_models": list(active_models.keys()),
            "count": len(active_models),
            "reloaded_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error reloading model cache: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reloading model cache: {str(e)}"
        )


@router.get("/models/cache/status")
async def get_cache_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Get the current status of the model cache.

    Shows which models are currently loaded in memory and ready for inference.
    """
    try:
        model_manager = MLModelManager.get_instance(db=db)

        cache_status = {}
        for model_type, model_data in model_manager.active_models.items():
            cache_status[model_type] = {
                "loaded": True,
                "model_type": model_data.get("model_type"),
                "training_id": model_data.get("training_id"),
                "saved_at": model_data.get("saved_at"),
                "has_model": model_data.get("model") is not None
            }

        return {
            "cache_size": len(cache_status),
            "models": cache_status
        }

    except Exception as e:
        logger.error(f"Error getting cache status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting cache status: {str(e)}"
        )


# ==================== ML Config Management (Issues.md spec) ====================

class MLConfigCreateRequest(BaseModel):
    name: str = Field(..., description="Model configuration name")
    model_type: str = Field(..., description="Type of model (collaborative, content_based, etc.)")
    description: Optional[str] = Field(None, description="Description of the configuration")
    parameters: dict = Field(..., description="Model hyperparameters")


class MLConfigUpdateRequest(BaseModel):
    parameters: Optional[dict] = Field(None, description="Updated hyperparameters")
    description: Optional[str] = Field(None, description="Updated description")


class TrainRequest(BaseModel):
    retrain_all: bool = Field(False, description="Whether to retrain all models")
    specific_models: Optional[List[str]] = Field(None, description="List of specific model names to train")


@router.get("/ml-config/")
async def get_ml_model_configurations(
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
):
    """
    Get all ML model configurations.

    Returns list of all configured ML models with their parameters, accuracy scores,
    and training metadata.

    **Required Permission:** `system.ml_models`
    """
    try:
        configs = db.query(MLModelConfig).all()

        result = []
        for config in configs:
            result.append({
                "id": str(config.id),
                "name": config.name,
                "model_type": config.model_type,
                "description": config.description,
                "is_active": config.is_active,
                "accuracy_score": float(config.accuracy_score) if config.accuracy_score else None,
                "precision_score": float(config.precision_score) if config.precision_score else None,
                "recall_score": float(config.recall_score) if config.recall_score else None,
                "last_trained": config.last_trained.isoformat() + "Z" if config.last_trained else None,
                "parameters": config.parameters or {}
            })

        return result

    except Exception as e:
        logger.error(f"Error getting ML configs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve ML configurations"
        )


@router.post("/ml-config/")
async def create_ml_model_configuration(
    request: MLConfigCreateRequest,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
):
    """
    Create a new ML model configuration.

    Creates a new model configuration with specified hyperparameters.

    **Required Permission:** `system.ml_models`
    """
    try:
        from uuid import uuid4

        new_config = MLModelConfig(
            id=uuid4(),
            name=request.name,
            model_type=request.model_type,
            description=request.description,
            parameters=request.parameters,
            is_active=False,  # New configs start inactive
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(new_config)
        db.commit()
        db.refresh(new_config)

        logger.info(f"Created ML config: {new_config.name} (ID: {new_config.id})")

        return {
            "id": str(new_config.id),
            "name": new_config.name,
            "model_type": new_config.model_type,
            "description": new_config.description,
            "is_active": new_config.is_active,
            "parameters": new_config.parameters,
            "created_at": new_config.created_at.isoformat() + "Z"
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating ML config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create ML configuration"
        )


@router.put("/ml-config/{config_id}")
async def update_ml_model_configuration(
    config_id: str,
    request: MLConfigUpdateRequest,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
):
    """
    Update an existing ML model configuration.

    Updates hyperparameters or description of an existing configuration.

    **Required Permission:** `system.ml_models`
    """
    try:
        from uuid import UUID

        config = db.query(MLModelConfig).filter(
            MLModelConfig.id == UUID(config_id)
        ).first()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration not found: {config_id}"
            )

        # Update fields
        if request.parameters is not None:
            config.parameters = request.parameters
        if request.description is not None:
            config.description = request.description

        config.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(config)

        logger.info(f"Updated ML config: {config.name} (ID: {config_id})")

        return {
            "id": str(config.id),
            "name": config.name,
            "model_type": config.model_type,
            "description": config.description,
            "parameters": config.parameters,
            "updated_at": config.updated_at.isoformat() + "Z"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating ML config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update ML configuration"
        )


@router.post("/ml-config/{config_id}/activate")
async def activate_ml_model_configuration(
    config_id: str,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
):
    """
    Activate an ML model configuration.

    Sets the specified configuration as active for its model type.
    Deactivates other configurations of the same type.

    **Required Permission:** `system.ml_models`
    """
    try:
        from uuid import UUID

        config = db.query(MLModelConfig).filter(
            MLModelConfig.id == UUID(config_id)
        ).first()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration not found: {config_id}"
            )

        # Deactivate other configs of same type
        db.query(MLModelConfig).filter(
            MLModelConfig.model_type == config.model_type,
            MLModelConfig.id != UUID(config_id)
        ).update({"is_active": False})

        # Activate this config
        config.is_active = True
        config.updated_at = datetime.utcnow()

        db.commit()

        logger.info(f"Activated ML config: {config.name} (ID: {config_id})")

        return {
            "message": "Configuration activated successfully",
            "config_id": str(config.id),
            "name": config.name,
            "model_type": config.model_type
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error activating ML config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate ML configuration"
        )


@router.get("/ml-config/{config_id}/performance")
async def get_model_performance_metrics(
    config_id: str,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
):
    """
    Get performance metrics for a model configuration.

    Returns accuracy scores, training history, and recommendation performance
    for the specified configuration.

    **Required Permission:** `system.ml_models`
    """
    try:
        config = db.query(MLModelConfig).filter(
            MLModelConfig.id == UUID(config_id)
        ).first()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration not found: {config_id}"
            )

        # Get training history
        training_history = db.query(ModelTrainingHistory).filter(
            ModelTrainingHistory.model_config_id == UUID(config_id)
        ).order_by(desc(ModelTrainingHistory.started_at)).limit(10).all()

        # Calculate average accuracy
        accuracy_scores = [h.training_metrics.get("accuracy_score") for h in training_history
                          if h.training_metrics and h.training_metrics.get("accuracy_score")]
        average_accuracy = sum(accuracy_scores) / len(accuracy_scores) if accuracy_scores else 0.0

        # Get recommendation performance (if applicable)
        from app.models import RecommendationResult
        from datetime import timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=30)

        total_recs = db.query(func.count(RecommendationResult.id)).filter(
            RecommendationResult.algorithm_used == config.model_type,
            RecommendationResult.created_at >= cutoff_date
        ).scalar() or 0

        clicks = db.query(func.count(RecommendationResult.id)).filter(
            RecommendationResult.algorithm_used == config.model_type,
            RecommendationResult.created_at >= cutoff_date,
            RecommendationResult.was_clicked== True
        ).scalar() or 0

        conversions = db.query(func.count(RecommendationResult.id)).filter(
            RecommendationResult.algorithm_used == config.model_type,
            RecommendationResult.created_at >= cutoff_date,
            RecommendationResult.was_purchased == True
        ).scalar() or 0

        avg_score = db.query(func.avg(RecommendationResult.score)).filter(
            RecommendationResult.algorithm_used == config.model_type,
            RecommendationResult.created_at >= cutoff_date,
            RecommendationResult.score != None
        ).scalar()

        recommendation_performance = {
            "total_recommendations": total_recs,
            "click_rate": round((clicks / total_recs) * 100, 2) if total_recs > 0 else 0.0,
            "conversion_rate": round((conversions / total_recs) * 100, 2) if total_recs > 0 else 0.0,
            "average_score": round(float(avg_score), 2) if avg_score else 0.0
        }

        # Format training history
        history_data = []
        for h in training_history:
            history_data.append({
                "started_at": h.started_at.isoformat() + "Z" if h.started_at else None,
                "completed_at": h.completed_at.isoformat() + "Z" if h.completed_at else None,
                "accuracy_score": h.training_metrics.get("accuracy_score") if h.training_metrics else None,
                "status": h.training_status
            })

        return {
            "config_id": str(config.id),
            "model_type": config.model_type,
            "accuracy_score": float(config.accuracy_score) if config.accuracy_score else None,
            "average_accuracy": round(average_accuracy, 4),
            "training_count": len(training_history),
            "last_trained": config.last_trained.isoformat() + "Z" if config.last_trained else None,
            "recommendation_performance": recommendation_performance,
            "training_history": history_data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model performance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model performance"
        )


@router.post("/ml-config/train")
async def train_ml_models(
    request: TrainRequest,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db),
):
    """
    Train ML models.

    Triggers training for all models or specific models based on request.

    **Required Permission:** `system.ml_models`
    """
    try:
        from app.services.recommendation_engine_service import RecommendationEngineService

        rec_service = RecommendationEngineService(db)
        training_results = []

        if request.retrain_all:
            # Train all model types
            model_types = ["als", "content", "kmeans", "lightgbm", "fbt"]
            for model_type in model_types:
                result = rec_service.trigger_model_training(model_type)
                if result.get("success"):
                    training_results.append({
                        "model_type": model_type,
                        "training_id": result["training_id"],
                        "status": "started"
                    })
        elif request.specific_models:
            # Train specific models
            for model_name in request.specific_models:
                # Get config by name
                config = db.query(MLModelConfig).filter(
                    MLModelConfig.name == model_name
                ).first()

                if config:
                    result = rec_service.trigger_model_training(config.model_type)
                    if result.get("success"):
                        training_results.append({
                            "model_name": model_name,
                            "model_type": config.model_type,
                            "training_id": result["training_id"],
                            "status": "started"
                        })

        from datetime import timedelta
        estimated_completion = datetime.utcnow() + timedelta(minutes=30)

        return {
            "training_id": f"train_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "status": "started",
            "models_training": training_results,
            "estimated_completion": estimated_completion.isoformat() + "Z"
        }

    except Exception as e:
        logger.error(f"Error training models: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start model training"
        )
