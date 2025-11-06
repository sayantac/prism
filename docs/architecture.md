# Architecture Overview

## System Architecture

The E-Commerce Recommendation System follows a **monorepo microservices architecture** with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer / CDN                   │
│                           (Nginx)                            │
└────────────────────┬────────────────────┬───────────────────┘
                     │                    │
         ┌───────────▼─────────┐  ┌───────▼──────────┐
         │   Frontend Service   │  │  Backend Service  │
         │   (React + Vite)     │  │   (FastAPI)       │
         └──────────────────────┘  └───────┬───────────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     │                     │                     │
            ┌────────▼────────┐   ┌────────▼────────┐  ┌────────▼────────┐
            │   PostgreSQL    │   │   ML Engine     │  │   File Storage   │
            │   + pgvector    │   │   (Embedded)    │  │   (Local/S3)     │
            └─────────────────┘   └─────────────────┘  └──────────────────┘
```

## Technology Stack

### Frontend Layer
- **Framework**: React 19 with TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: TailwindCSS 4 + DaisyUI
- **Build Tool**: Vite 6
- **Routing**: React Router 7

### Backend Layer
- **API Framework**: FastAPI 0.115
- **ORM**: SQLAlchemy 2.0
- **Authentication**: JWT with bcrypt
- **Validation**: Pydantic v1/v2
- **ASGI Server**: Uvicorn

### Data Layer
- **Primary Database**: PostgreSQL 15+
- **Vector Search**: pgvector extension
- **Caching**: Redis (optional)
- **File Storage**: Local filesystem / S3

### ML Layer
- **Collaborative Filtering**: Implicit ALS
- **Content-Based**: TF-IDF + Cosine Similarity
- **Prediction Models**: LightGBM
- **Clustering**: K-Means (scikit-learn)

## Design Patterns

### Backend Patterns

#### 1. **Repository Pattern**
```python
# Separates data access logic from business logic
class ProductRepository:
    def get_by_id(self, product_id: str) -> Product
    def get_all(self, filters: dict) -> List[Product]
    def create(self, product_data: dict) -> Product
```

#### 2. **Service Layer Pattern**
```python
# Contains business logic
class ProductService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository
    
    def create_product(self, data: ProductCreate) -> ProductResponse:
        # Business validation
        # Transform data
        # Call repository
```

#### 3. **Dependency Injection**
```python
# FastAPI native dependency injection
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    pass
```

#### 4. **Factory Pattern**
```python
# For creating different recommendation strategies
class RecommendationFactory:
    @staticmethod
    def create(strategy: str) -> BaseRecommender:
        if strategy == "als":
            return ALSRecommender()
        elif strategy == "content":
            return ContentBasedRecommender()
```

### Frontend Patterns

#### 1. **Container/Presenter Pattern**
```typescript
// Container handles logic
const ProductListContainer = () => {
  const { data, isLoading } = useGetProductsQuery();
  return <ProductList products={data} loading={isLoading} />;
};

// Presenter handles UI
const ProductList = ({ products, loading }) => {
  // Pure UI rendering
};
```

#### 2. **Custom Hooks Pattern**
```typescript
// Encapsulate reusable logic
const useAuth = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth);
  
  const login = useCallback((credentials) => {
    // Login logic
  }, [dispatch]);
  
  return { user, login, logout, isAuthenticated: !!token };
};
```

#### 3. **Redux Slice Pattern**
```typescript
// Organized state management
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    }
  }
});
```

## Data Flow

### Authentication Flow
```
1. User submits credentials → Frontend
2. Frontend → POST /api/v1/auth/login → Backend
3. Backend validates credentials → Database
4. Database returns user data → Backend
5. Backend generates JWT token → Frontend
6. Frontend stores token in Redux + localStorage
7. Subsequent requests include token in Authorization header
```

### Recommendation Flow
```
1. User visits homepage → Frontend
2. Frontend → GET /api/v1/products/recommendations → Backend
3. Backend checks if ML models are loaded
4. ML Engine generates recommendations
5. Backend enriches with product details → Database
6. Backend tracks recommendation display → Analytics
7. Backend → Response with recommendations → Frontend
8. Frontend displays products to user
```

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Access tokens (30 min) + Refresh tokens (7 days)
- **Password Hashing**: bcrypt with salt
- **Role-Based Access Control (RBAC)**: Admin, User roles
- **Permission System**: Granular permissions for admin features

### API Security
- **CORS**: Configured allowed origins
- **Rate Limiting**: Per-endpoint rate limits (optional)
- **Input Validation**: Pydantic models
- **SQL Injection Prevention**: SQLAlchemy ORM
- **XSS Prevention**: React automatic escaping

### Data Security
- **Environment Variables**: Secrets management
- **Database Encryption**: PostgreSQL SSL/TLS
- **Sensitive Data**: Passwords never stored in plaintext
- **Audit Logging**: All admin actions tracked

## Scalability Considerations

### Horizontal Scaling
- **Stateless Backend**: Can run multiple instances behind load balancer
- **Database Connection Pooling**: Configured for concurrent requests
- **Async Operations**: FastAPI async endpoints for I/O operations

### Caching Strategy (Optional)
```
┌──────────────┐
│   Request    │
└──────┬───────┘
       │
       ▼
┌──────────────┐     Cache Miss
│  Redis Cache │ ─────────────► Database
└──────┬───────┘                    │
       │ Cache Hit                  │
       ▼                            ▼
   Response  ◄────────────────  Update Cache
```

### ML Model Optimization
- **Model Caching**: Load models once, keep in memory
- **Async Training**: Background jobs for model training
- **Batch Predictions**: Process multiple recommendations together
- **Model Versioning**: Track and rollback models

## Monitoring & Observability

### Logging
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Request Tracking**: Unique request IDs
- **Performance Metrics**: Response times, query times

### Health Checks
- **Database Health**: Connection pool status
- **ML Models Health**: Models loaded and ready
- **System Metrics**: CPU, memory, disk usage
- **API Health**: `/health` endpoint

### Metrics (Future)
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Sentry**: Error tracking
- **Application Performance Monitoring (APM)**

## Database Schema

### Core Tables
- **users**: User accounts and authentication
- **products**: Product catalog
- **orders**: Order history
- **cart_items**: Shopping cart
- **product_categories**: Category hierarchy

### ML Tables
- **ml_model_config**: ML model configurations
- **model_training_history**: Training sessions
- **recommendation_metrics**: Performance tracking
- **user_segments**: Customer segmentation

### Analytics Tables
- **audit_logs**: User action tracking
- **search_analytics**: Search behavior
- **user_analytics_daily**: Daily user metrics

## Deployment Architecture

### Development Environment
```
Docker Compose:
- backend (dev mode with hot reload)
- frontend (Vite dev server)
- postgres
- pgadmin (optional)
```

### Production Environment
```
Docker Compose / Kubernetes:
- backend (multiple replicas)
- frontend (Nginx static serving)
- postgres (managed service recommended)
- redis (caching)
- nginx (reverse proxy + load balancer)
```

## Future Enhancements

1. **Microservices Extraction**
   - Separate ML training service
   - Dedicated recommendation service
   - Real-time analytics service

2. **Event-Driven Architecture**
   - Message queue (RabbitMQ/Kafka)
   - Event sourcing for orders
   - Real-time notifications

3. **Advanced ML Pipeline**
   - MLflow for experiment tracking
   - Model registry
   - A/B testing framework
   - AutoML integration

4. **Enhanced Monitoring**
   - Distributed tracing (Jaeger)
   - Real-time alerting
   - Custom dashboards
   - Anomaly detection
