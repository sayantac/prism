# ⚙️ Admin APIs - Complete Reference

Comprehensive admin panel APIs for analytics, ML models, and system management.

**Base Path:** `/api/v1/admin`

**Authentication:** All admin endpoints require admin role

---

## 📊 Admin Analytics API (`/admin/analytics`)

### Dashboard & KPIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/analytics/dashboard` | GET | Complete analytics dashboard |
| `/admin/analytics/dashboard/overview` | GET | High-level overview metrics |
| `/admin/analytics/kpis` | GET | Key Performance Indicators |
| `/admin/analytics/user-behavior/summary` | GET | User behavior analytics |

### Example: Dashboard Overview
```json
GET /admin/analytics/dashboard/overview

Response:
{
  "period": "last_30_days",
  "metrics": {
    "total_revenue": 125340.50,
    "total_orders": 1234,
    "total_users": 5678,
    "active_users": 3456,
    "conversion_rate": 0.0342,
    "avg_order_value": 101.58,
    "revenue_growth": 15.3,
    "user_growth": 8.7
  },
  "top_products": [...],
  "revenue_by_category": {...},
  "user_acquisition_sources": {...}
}
```

### Recommendation Performance
```json
GET /admin/analytics/recommendations/performance

Response:
{
  "algorithms": [
    {
      "name": "collaborative_filtering",
      "impressions": 45230,
      "clicks": 8940,
      "ctr": 0.1976,
      "conversions": 1203,
      "conversion_rate": 0.0266,
      "revenue": 35670.50
    },
    {
      "name": "hybrid",
      "impressions": 67890,
      "clicks": 15234,
      "ctr": 0.2244,
      "conversions": 2145,
      "conversion_rate": 0.0316,
      "revenue": 54320.75
    }
  ],
  "overall_performance": {
    "total_impressions": 234560,
    "total_clicks": 45670,
    "total_revenue": 189450.25
  }
}
```

### Segment Performance
```json
GET /admin/analytics/segments/performance

Response:
{
  "segments": [
    {
      "id": "seg-001",
      "name": "High-Value Customers",
      "user_count": 234,
      "total_revenue": 125340.50,
      "avg_revenue_per_user": 535.47,
      "purchase_frequency": 3.2,
      "churn_rate": 0.05
    }
  ]
}
```

---

## 🧠 Admin ML Models API (`/admin/ml-models`)

### Model Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/ml-models/models` | GET | List all ML models |
| `/admin/ml-models/models/{model_id}` | GET | Get model details |
| `/admin/ml-models/models/{model_type}/active` | GET | Get active model version |
| `/admin/ml-models/models/{model_type}/versions` | GET | List model versions |
| `/admin/ml-models/models/{version_id}/activate` | POST | Activate model version |
| `/admin/ml-models/models/{version_id}` | DELETE | Delete model version |

### Example: List Models
```json
GET /admin/ml-models/models

Response:
{
  "models": [
    {
      "id": "model-als-001",
      "name": "Collaborative Filtering",
      "type": "als",
      "version": "v1.2.0",
      "status": "active",
      "accuracy": 0.85,
      "created_at": "2025-11-01T00:00:00Z",
      "last_trained": "2025-11-10T10:00:00Z",
      "training_samples": 125000,
      "hyperparameters": {
        "rank": 50,
        "iterations": 10,
        "lambda": 0.01
      }
    }
  ],
  "total": 8
}
```

### Model Training
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/recommendation-engine/train` | POST | Train ML model |
| `/admin/recommendation-engine/training/history` | GET | Training history |
| `/admin/recommendation-engine/training/{id}/status` | GET | Check training status |
| `/admin/recommendation-engine/training/{id}/cancel` | POST | Cancel training |
| `/admin/recommendation-engine/training/{id}/logs` | GET | View training logs |

### Example: Train Model
```json
POST /admin/recommendation-engine/train
{
  "model_type": "als",
  "hyperparameters": {
    "rank": 50,
    "iterations": 15,
    "lambda": 0.01
  },
  "training_config": {
    "use_recent_data_only": true,
    "days_of_data": 90,
    "validation_split": 0.2
  }
}

Response:
{
  "training_id": "train-abc-123",
  "status": "in_progress",
  "model_type": "als",
  "started_at": "2025-11-12T10:30:00Z",
  "estimated_duration_minutes": 45
}
```

### Model Performance Monitoring
```json
GET /admin/recommendation-engine/performance

Response:
{
  "models": {
    "als": {
      "precision": 0.42,
      "recall": 0.38,
      "f1_score": 0.40,
      "auc": 0.87,
      "coverage": 0.75
    },
    "content_based": {
      "precision": 0.45,
      "recall": 0.35,
      "f1_score": 0.39,
      "auc": 0.85,
      "coverage": 0.68
    }
  },
  "online_metrics": {
    "avg_response_time_ms": 125,
    "requests_per_second": 45,
    "cache_hit_rate": 0.85
  }
}
```

---

## 🎯 Recommendation Engine API (`/admin/recommendation-engine`)

### Configuration Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/recommendation-engine/configs` | GET | List configurations |
| `/admin/recommendation-engine/configs` | POST | Create configuration |
| `/admin/recommendation-engine/configs/{id}` | PUT | Update configuration |
| `/admin/recommendation-engine/configs/{id}/activate` | POST | Activate config |
| `/admin/recommendation-engine/configs/{id}/deactivate` | POST | Deactivate config |
| `/admin/recommendation-engine/configs/{id}` | DELETE | Delete config |

### Health Monitoring
```json
GET /admin/recommendation-engine/health

Response:
{
  "status": "healthy",
  "models_loaded": {
    "als": true,
    "content_based": true,
    "lightgbm": true
  },
  "cache_status": "operational",
  "last_health_check": "2025-11-12T10:30:00Z",
  "issues": []
}
```

---

## 👥 User Segmentation API (`/admin/user-segmentation`)

### Segment Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/user-segmentation/segments` | GET | List segments |
| `/admin/user-segmentation/segments` | POST | Create segment |
| `/admin/user-segmentation/segments/{id}` | PUT | Update segment |
| `/admin/user-segmentation/segments/{id}` | DELETE | Delete segment |
| `/admin/user-segmentation/segments/{id}/members` | GET | Get segment members |
| `/admin/user-segmentation/segments/{id}/refresh` | POST | Refresh segment |
| `/admin/user-segmentation/segments/create-rfm` | POST | Create RFM segments |

### Example: Create Segment
```json
POST /admin/user-segmentation/segments
{
  "name": "Premium Buyers",
  "description": "Users with AOV > $200",
  "segment_type": "behavioral",
  "criteria": {
    "min_avg_order_value": 200,
    "min_order_count": 3
  },
  "auto_refresh": true,
  "refresh_frequency_hours": 24
}
```

### Segment Analytics
```json
GET /admin/user-segmentation/segments/analytics

Response:
{
  "segments": [
    {
      "id": "seg-001",
      "name": "High-Value Customers",
      "size": 234,
      "growth_rate": 0.05,
      "churn_rate": 0.03,
      "lifetime_value_avg": 1234.56,
      "revenue_contribution": 0.35
    }
  ]
}
```

---

## 🛍️ Admin Products API (`/admin/products`)

### Product Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/products/products` | GET | List products (admin view) |
| `/admin/products/products` | POST | Create product |
| `/admin/products/products/{id}` | GET | Get product details |
| `/admin/products/products/{id}` | PUT | Update product |
| `/admin/products/products/{id}` | DELETE | Delete product |
| `/admin/products/products/bulk-update` | POST | Bulk update products |
| `/admin/products/products/{id}/regenerate-embedding` | POST | Regenerate embeddings |
| `/admin/products/products/bulk-regenerate-embeddings` | POST | Bulk regenerate |

### Category Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/products/categories` | GET | List categories |
| `/admin/products/categories` | POST | Create category |
| `/admin/products/categories/{id}` | PUT | Update category |
| `/admin/products/categories/{id}` | DELETE | Delete category |

### Inventory Management
```json
POST /admin/products/inventory/bulk-update-stock
{
  "updates": [
    {
      "product_id": "prod-123",
      "stock_quantity": 50,
      "operation": "set"
    },
    {
      "product_id": "prod-456",
      "stock_quantity": 10,
      "operation": "increment"
    }
  ]
}
```

---

## 📦 Admin Orders API (`/admin/orders`)

### Order Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/orders/orders` | GET | List all orders |
| `/admin/orders/orders/{id}` | GET | Get order details |
| `/admin/orders/orders/{id}` | PUT | Update order status |
| `/admin/orders/orders/bulk-update-status` | POST | Bulk status update |

### Order Analytics
```json
GET /admin/orders/analytics/orders/summary

Response:
{
  "period": "last_30_days",
  "total_orders": 1234,
  "total_revenue": 125340.50,
  "avg_order_value": 101.58,
  "orders_by_status": {
    "pending": 45,
    "processing": 123,
    "shipped": 890,
    "delivered": 1020,
    "cancelled": 56
  },
  "revenue_by_day": [...]
}
```

---

## 👥 Admin Users API (`/admin/users`)

### User Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/users/users` | GET | List users |
| `/admin/users/users` | POST | Create user |
| `/admin/users/users/{id}` | GET | Get user details |
| `/admin/users/users/{id}` | PUT | Update user |
| `/admin/users/users/{id}` | DELETE | Delete user |
| `/admin/users/users/{id}/roles/{role_id}` | POST | Assign role |
| `/admin/users/users/{id}/roles/{role_id}` | DELETE | Remove role |

### Role Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/users/roles` | GET | List roles |
| `/admin/users/roles` | POST | Create role |
| `/admin/users/permissions` | GET | List permissions |

---

## ⚙️ System Settings API (`/admin/settings`)

### Settings Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/settings/settings` | GET | Get all settings |
| `/admin/settings/settings/category/{category}` | PUT | Update category settings |
| `/admin/settings/feature-flags` | GET | Get feature flags |
| `/admin/settings/feature-flags` | PUT | Update feature flags |
| `/admin/settings/validate` | POST | Validate settings |

### Backup & Restore
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/settings/backup` | POST | Create settings backup |
| `/admin/settings/backups` | GET | List backups |
| `/admin/settings/restore/{backup_id}` | POST | Restore from backup |
| `/admin/settings/backup/{backup_id}` | DELETE | Delete backup |

---

## 🖥️ Admin Dashboard API (`/admin/dashboard`)

### Real-Time Metrics
```json
GET /admin/dashboard/real-time-stats

Response:
{
  "active_users_now": 234,
  "orders_today": 45,
  "revenue_today": 4532.10,
  "conversion_rate_today": 0.034,
  "top_products_today": [...],
  "recent_orders": [...]
}
```

### System Health
```json
GET /admin/dashboard/system-health

Response:
{
  "database": {
    "status": "healthy",
    "connections": 15,
    "response_time_ms": 12
  },
  "cache": {
    "status": "healthy",
    "hit_rate": 0.85,
    "memory_usage_mb": 256
  },
  "ml_models": {
    "status": "healthy",
    "models_loaded": 5
  }
}
```

---

## 🔐 Security & Permissions

### Required Roles
- **Super Admin**: Full access to all admin endpoints
- **Admin**: Most admin features except system settings
- **Manager**: Read-only analytics, limited management
- **Support**: Order management, user support

### Permission Checks
All admin endpoints validate:
1. Valid Bearer token
2. User has admin role
3. Specific permission for the operation
4. Rate limits (1000 req/min for admins)

---

## 🧪 Testing Admin Endpoints

```bash
# Login as admin
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@ecommerce.com",
    "password": "password123"
  }'

# Get dashboard overview
curl -X GET "http://localhost:8000/api/v1/admin/analytics/dashboard/overview" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Train ML model
curl -X POST "http://localhost:8000/api/v1/admin/recommendation-engine/train" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "als",
    "hyperparameters": {"rank": 50}
  }'
```
