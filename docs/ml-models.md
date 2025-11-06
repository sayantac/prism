# ML Models Guide

## Overview

The recommendation system uses multiple ML models for different purposes:

1. **Collaborative Filtering (ALS)** - User-based recommendations
2. **Content-Based Filtering** - Product similarity
3. **LightGBM Classifier** - Reorder prediction
4. **K-Means Clustering** - User segmentation

## Model Architecture

### 1. Collaborative Filtering (Implicit ALS)

**Purpose**: Generate personalized recommendations based on user behavior

**Algorithm**: Alternating Least Squares (ALS) for implicit feedback

**Input Data**:
- User-product interactions (views, purchases, cart additions)
- Weighted based on interaction type

**Training**:
```python
# Default parameters
{
    "factors": 50,
    "regularization": 0.01,
    "iterations": 15,
    "use_native": true
}
```

**Output**: User and item embeddings for recommendation generation

### 2. Content-Based Filtering

**Purpose**: Find similar products based on content features

**Algorithm**: TF-IDF + Cosine Similarity

**Features Used**:
- Product name
- Description
- Category
- Tags

**Training**: Builds TF-IDF matrix from product text features

### 3. Reorder Prediction (LightGBM)

**Purpose**: Predict which products a user is likely to reorder

**Algorithm**: Gradient Boosting (LightGBM)

**Features**:
- User purchase history
- Product popularity
- Days since last purchase
- Purchase frequency
- Category preferences

### 4. User Segmentation (K-Means)

**Purpose**: Group users into segments for targeted marketing

**Algorithm**: K-Means clustering

**Features**:
- RFM metrics (Recency, Frequency, Monetary)
- Purchase behavior
- Product preferences

## Training Models

### Via Admin Panel

1. Navigate to Admin Dashboard → ML Models
2. Select model type
3. Configure parameters (optional)
4. Click "Train Model"
5. Monitor training progress

### Via API

```bash
POST /api/v1/admin/dashboard/train
{
  "model_type": "als",
  "custom_parameters": {
    "factors": 50,
    "iterations": 20
  }
}
```

### Via CLI

```bash
docker-compose exec backend python -m app.services.ml_engine_service train --model als
```

## Model Performance Metrics

Tracked metrics include:
- **Precision@K**: Accuracy of top-K recommendations
- **Recall@K**: Coverage of relevant items in top-K
- **NDCG**: Normalized Discounted Cumulative Gain
- **AUC**: Area Under ROC Curve (for prediction models)
- **Conversion Rate**: Purchase rate from recommendations

## Model Storage

Models are stored in:
- **Local**: `ml_models/` directory
- **Production**: S3 bucket (recommended)

Model files:
- `als_model.pkl` - Collaborative filtering model
- `content_similarity.pkl` - Content-based similarity matrix
- `reorder_model.pkl` - Reorder prediction model
- `user_clusters.pkl` - User segmentation model
- `*_mapping.json` - ID mapping files

## Model Versioning

(Future implementation with MLflow)

## Best Practices

1. **Retrain Regularly**: Schedule weekly retraining
2. **Monitor Performance**: Track recommendation CTR and conversion
3. **A/B Testing**: Test new models against baseline
4. **Cold Start Handling**: Use popular items for new users
5. **Feature Engineering**: Continuously improve features
