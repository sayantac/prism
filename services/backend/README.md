# Backend Service - E-Commerce Recommendation System

FastAPI-based backend service with ML-powered recommendation engine, user segmentation, and comprehensive admin features.

## 🏗️ Architecture

```
services/backend/
├── app/
│   ├── api/v1/              # API endpoints (versioned)
│   │   ├── endpoints/       # Route handlers
│   │   │   ├── admin/       # Admin-only endpoints
│   │   │   ├── auth.py      # Authentication
│   │   │   ├── products.py  # Product management
│   │   │   ├── orders.py    # Order management
│   │   │   └── ...
│   │   └── api.py           # API router configuration
│   ├── core/                # Core functionality
│   │   ├── config.py        # Configuration management
│   │   ├── security.py      # Authentication & security
│   │   ├── permissions.py   # RBAC permissions
│   │   └── constants.py     # Application constants
│   ├── middleware/          # Custom middleware
│   │   ├── cors.py          # CORS configuration
│   │   ├── security.py      # Security headers
│   │   ├── rate_limit.py    # Rate limiting
│   │   └── ...
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py          # User, Role, Permission
│   │   ├── product.py       # Product, Category
│   │   ├── order.py         # Order, OrderItem
│   │   ├── cart.py          # Cart, CartItem
│   │   ├── analytics.py     # Analytics tracking
│   │   ├── ml_models.py     # ML model metadata
│   │   └── ...
│   ├── schemas/             # Pydantic schemas (DTOs)
│   │   ├── auth.py          # Authentication schemas
│   │   ├── product.py       # Product schemas
│   │   ├── user.py          # User schemas
│   │   └── ...
│   ├── services/            # Business logic layer
│   │   ├── ml/              # ML services (modular)
│   │   │   ├── als_model_service.py
│   │   │   ├── lightgbm_model_service.py
│   │   │   ├── kmeans_model_service.py
│   │   │   ├── content_model_service.py
│   │   │   ├── ml_model_manager.py
│   │   │   ├── ml_feature_service.py
│   │   │   └── ml_training_service.py
│   │   ├── product_service.py
│   │   ├── recommendation_service.py
│   │   ├── search_service.py
│   │   ├── user_behavior_service.py
│   │   ├── admin_dashboard_service.py
│   │   └── ...
│   ├── utils/               # Utility functions
│   ├── database.py          # Database configuration
│   └── main.py              # FastAPI application entry
├── data/                    # Sample data & SQL
├── ml_models/              # Trained ML models (persisted)
├── static/                 # Static files & uploads
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
└── .dockerignore          # Docker ignore patterns (symlink)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- Docker & Docker Compose (recommended)

### Option 1: Docker (Recommended)

```bash
# From root directory
docker-compose up backend

# Backend will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Option 2: Local Development

```bash
cd services/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# or: .\venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp ../../.env.example ../../.env
# Edit .env with your database credentials

# Run database migrations (if needed)
# alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Access Points

| Endpoint | URL | Description |
|----------|-----|-------------|
| API Root | http://localhost:8000 | Base API endpoint |
| Interactive Docs | http://localhost:8000/docs | Swagger UI |
| ReDoc | http://localhost:8000/redoc | Alternative API docs |
| Health Check | http://localhost:8000/health | Service health status |

## 🛠️ Tech Stack

### Core Framework
- **FastAPI 0.115.12** - Modern async web framework
- **Uvicorn** - ASGI server with auto-reload
- **Pydantic 1.10** - Data validation using Python type hints

### Database
- **PostgreSQL 15** - Primary database
- **pgvector** - Vector similarity search extension
- **SQLAlchemy 2.0** - ORM with async support
- **psycopg2** - PostgreSQL adapter

### Machine Learning
- **scikit-learn** - Traditional ML algorithms
- **LightGBM** - Gradient boosting for predictions
- **implicit ALS** - Collaborative filtering
- **joblib** - Model serialization
- **pandas 2.1.4** - Data manipulation
- **numpy 1.26.4** - Numerical computing

### Authentication & Security
- **python-jose** - JWT token generation
- **passlib + bcrypt** - Password hashing
- **python-multipart** - File upload support

### Additional
- **python-dotenv** - Environment variable management
- **email-validator** - Email validation

## 📋 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /login` - User login (returns JWT)
- `POST /register` - User registration
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout

### Products (`/api/v1/products`)
- `GET /` - List products (with filters & pagination)
- `GET /{id}` - Get product details
- `GET /recommendations` - Get personalized recommendations
- `GET /similar/{id}` - Get similar products
- `GET /trending` - Get trending products
- `POST /` - Create product (admin)
- `PUT /{id}` - Update product (admin)
- `DELETE /{id}` - Delete product (admin)

### Orders (`/api/v1/orders`)
- `GET /` - List user orders
- `GET /{id}` - Get order details
- `POST /` - Create order
- `PUT /{id}/status` - Update order status (admin)

### Cart (`/api/v1/cart`)
- `GET /` - Get user cart
- `POST /items` - Add item to cart
- `PUT /items/{id}` - Update cart item
- `DELETE /items/{id}` - Remove cart item

### User Behavior (`/api/v1/user-behavior`)
- `POST /track` - Track user interaction
- `GET /history` - Get user behavior history

### Admin Endpoints (`/api/v1/admin/*`)

#### Dashboard (`/admin/dashboard`)
- `GET /stats` - System statistics
- `GET /revenue` - Revenue analytics
- `GET /user-activity` - User activity metrics

#### ML Engine (`/admin/recommendation-engine`)
- `POST /train` - Train ML models
- `GET /status` - Get training status
- `GET /models` - List available models
- `GET /metrics` - Get model performance metrics

#### User Segmentation (`/admin/user-segmentation`)
- `GET /segments` - List user segments
- `POST /segments` - Create segment
- `GET /segments/{id}` - Get segment details
- `POST /segments/{id}/analyze` - Analyze segment

#### User Analytics (`/admin/user-analytics`)
- `GET /overview` - User analytics overview
- `GET /cohort` - Cohort analysis
- `GET /retention` - Retention metrics

#### Products (`/admin/products`)
- `POST /bulk-upload` - Bulk product upload
- `GET /analytics` - Product analytics

### Health & System
- `GET /health` - Service health check
- `GET /admin-info` - Admin configuration info

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Flow
```bash
# 1. Login to get access token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Response: { "access_token": "eyJ...", "token_type": "bearer" }

# 2. Use token in subsequent requests
curl -X GET http://localhost:8000/api/v1/products/recommendations \
  -H "Authorization: Bearer eyJ..."
```

### Default Admin Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **Change these in production!** (Set in `.env` file)

## 🤖 Machine Learning Features

### Models

1. **ALS (Alternating Least Squares)**
   - Collaborative filtering
   - User-based recommendations
   - File: `ml_models/als_model_*.pkl`

2. **LightGBM**
   - Reorder prediction
   - Purchase likelihood
   - File: `ml_models/lightgbm_model_*.pkl`

3. **K-Means Clustering**
   - User segmentation
   - RFM analysis
   - File: `ml_models/kmeans_model_*.pkl`

4. **Content-Based (TF-IDF)**
   - Product similarity
   - Text-based recommendations
   - File: `ml_models/content_model_*.pkl`

### Training Models

```bash
# Via API (requires admin authentication)
curl -X POST http://localhost:8000/api/v1/admin/recommendation-engine/train \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "als",
    "parameters": {
      "factors": 50,
      "regularization": 0.01,
      "iterations": 15
    }
  }'

# Check training status
curl -X GET http://localhost:8000/api/v1/admin/recommendation-engine/status?training_id=xxx \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Model Files

Models are saved in `ml_models/` directory:
- Format: `{model_type}_model_{timestamp}.pkl`
- Metadata: `{model_type}_metadata_{timestamp}.json`
- Auto-loaded on service startup

## 🗄️ Database

### Schema Overview

**Core Tables:**
- `users` - User accounts
- `roles` - User roles (admin, user)
- `permissions` - Granular permissions
- `products` - Product catalog
- `product_categories` - Product categories
- `orders` - Customer orders
- `order_items` - Order line items
- `carts` - Shopping carts
- `cart_items` - Cart line items

**Analytics Tables:**
- `search_analytics` - Search tracking
- `audit_logs` - Admin action audit trail
- `system_logs` - System events

**ML Tables:**
- `ml_model_configs` - ML model configuration
- `model_training_history` - Training history
- `user_segments` - User segmentation
- `segment_memberships` - User-segment relationships
- `recommendation_metrics` - Model performance
- `recommendation_conversions` - Recommendation tracking

### Migrations

```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback
docker-compose exec backend alembic downgrade -1

# View history
docker-compose exec backend alembic history
```

### Database Initialization

On first startup, the system automatically:
1. Creates all tables via SQLAlchemy
2. Creates default roles (`admin`, `user`)
3. Creates default permissions
4. Creates first admin user (from `.env` config)

## 🧪 Testing

```bash
# Run all tests
docker-compose exec backend pytest

# With coverage
docker-compose exec backend pytest --cov=app --cov-report=html

# Run specific test file
docker-compose exec backend pytest tests/test_products.py

# Run specific test
docker-compose exec backend pytest tests/test_products.py::test_create_product

# View coverage report
open htmlcov/index.html
```

## 🔧 Configuration

### Environment Variables

Key variables (see `.env.example` for complete list):

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ecommerce

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:5173"]

# Admin User
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=admin123

# File Uploads
UPLOAD_FOLDER=static/uploads
MAX_FILE_SIZE=10485760  # 10MB

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### Configuration Management

Configuration is managed in `app/core/config.py`:
- Loaded from environment variables
- Type-validated with Pydantic
- Centralized settings access

## 📂 Key Files

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI application entry point |
| `app/database.py` | Database session management |
| `app/core/config.py` | Configuration settings |
| `app/core/security.py` | Authentication utilities |
| `app/api/deps.py` | Dependency injection |
| `requirements.txt` | Python dependencies |
| `Dockerfile` | Container configuration |

## 🐛 Debugging

### View Logs

```bash
# All backend logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Search logs
docker-compose logs backend | grep ERROR
```

### Interactive Debugging

```bash
# Shell into container
docker-compose exec backend bash

# Python REPL with app context
docker-compose exec backend python

>>> from app.database import SessionLocal
>>> from app.models import User
>>> db = SessionLocal()
>>> users = db.query(User).all()
>>> print(users)
```

### Database Queries

```bash
# Connect to database
docker-compose exec postgres psql -U ecommerce_user -d ecommerce

# Useful queries
SELECT COUNT(*) FROM users;
SELECT * FROM products LIMIT 10;
SELECT * FROM orders WHERE user_id = 1;

# Exit
\q
```

## 🚀 Development Workflow

### Adding New Endpoint

1. **Define Schema** (`app/schemas/your_feature.py`)
```python
from pydantic import BaseModel

class ItemCreate(BaseModel):
    name: str
    description: str
```

2. **Create Service** (`app/services/your_feature_service.py`)
```python
class YourFeatureService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_item(self, data: ItemCreate):
        # Business logic
        pass
```

3. **Add Endpoint** (`app/api/v1/endpoints/your_feature.py`)
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user

router = APIRouter()

@router.post("/items")
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = YourFeatureService(db)
    return service.create_item(item)
```

4. **Register Router** (`app/api/v1/api.py`)
```python
from app.api.v1.endpoints import your_feature
api_router.include_router(your_feature.router, prefix="/your-feature", tags=["your-feature"])
```

### Code Quality

```bash
# Format code
docker-compose exec backend black app/
docker-compose exec backend isort app/

# Lint code
docker-compose exec backend flake8 app/

# Type checking
docker-compose exec backend mypy app/
```

## 📊 Performance

### Caching Strategy
- Active ML models cached in memory
- Database query results cached per request
- User sessions cached with JWT

### Optimization Tips
- Use SQLAlchemy `joinedload()` for eager loading
- Implement pagination for large datasets
- Use background tasks for heavy operations
- Consider Redis for session/cache management (future)

## 🔒 Security

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Signed with HS256
- **CORS**: Configured allowed origins
- **SQL Injection**: Protected by SQLAlchemy ORM
- **Input Validation**: Pydantic schemas
- **Rate Limiting**: Middleware (configurable)
- **Audit Logging**: All admin actions tracked

## 📚 Related Documentation

- [API Documentation](../../docs/api.md)
- [Architecture Overview](../../docs/architecture.md)
- [ML Models Guide](../../docs/ml-models.md)
- [Docker Setup](../../docs/docker.md)
- [Development Guide](../../docs/development.md)

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check environment variables
docker-compose exec backend env | grep DATABASE_URL

# Restart services
docker-compose restart backend postgres
```

**Module Import Error**
```bash
# Rebuild container
docker-compose build backend

# Clear Python cache
docker-compose exec backend find . -type d -name __pycache__ -exec rm -rf {} +
```

**ML Model Not Loading**
```bash
# Check if model files exist
docker-compose exec backend ls -la ml_models/

# Train models manually
curl -X POST http://localhost:8000/api/v1/admin/recommendation-engine/train \
  -H "Authorization: Bearer TOKEN"
```

## 📝 Notes

- This is a **POC implementation** with simplified configuration
- For production, implement:
  - Multi-stage Docker builds
  - Secrets management (Vault, AWS Secrets Manager)
  - Redis caching layer
  - Message queue (Celery + RabbitMQ/Redis)
  - Monitoring (Prometheus, Grafana)
  - Logging aggregation (ELK stack)
  - API rate limiting per user
  - Database connection pooling
  - ML model versioning (MLflow)

---

**Built with ❤️ using FastAPI**
