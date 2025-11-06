# Development Guide

This guide covers local development setup and common development tasks.

## Prerequisites

- **Docker** 24.0+ and **Docker Compose** 2.0+
- **Git**
- **Node.js** 18+ (for frontend development)
- **Python** 3.11+ (for backend development)
- **Make** (optional, for Makefile commands)

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd recommendationsystem
```

### 2. Setup Environment Variables

```bash
# Copy environment templates
cp services/backend/.env.example services/backend/.env
cp services/frontend/.env.example services/frontend/.env
```

Edit the `.env` files with your configuration:

**Backend** (`services/backend/.env`):
```env
# Update these values
POSTGRES_PASSWORD=your_secure_password
SECRET_KEY=generate_using_openssl_rand_hex_32
FIRST_SUPERUSER_PASSWORD=your_admin_password
```

**Frontend** (`services/frontend/.env`):
```env
# Usually defaults are fine for local development
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Start Services with Docker

Using Make (recommended):
```bash
make setup
```

Or using Docker Compose directly:
```bash
docker-compose build
docker-compose up -d
docker-compose exec backend python -m app.utils.init_db
```

### 4. Verify Installation

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Database: localhost:5432

Default admin credentials:
- Email: `admin@example.com`
- Password: (set in your `.env` file)

## Development Workflow

### Backend Development

#### Running Backend Locally (without Docker)

1. **Setup Virtual Environment**

```bash
cd services/backend
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
.\venv\Scripts\activate   # On Windows
```

2. **Install Dependencies**

```bash
pip install -r requirements.txt
```

3. **Setup Database**

Make sure PostgreSQL is running with the pgvector extension:
```bash
# Install pgvector extension in your PostgreSQL database
CREATE EXTENSION IF NOT EXISTS vector;
```

4. **Run the Server**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Code Structure

```
services/backend/
├── app/
│   ├── api/              # API routes
│   │   └── v1/
│   │       ├── api.py    # API router
│   │       └── endpoints/
│   ├── core/             # Configuration and security
│   │   ├── config.py
│   │   ├── security.py
│   │   └── permissions.py
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas (request/response)
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer (future)
│   └── utils/            # Utilities
├── tests/                # Test files
├── alembic/              # Database migrations
└── requirements.txt      # Python dependencies
```

#### Adding a New Endpoint

1. **Create Schema** (`app/schemas/your_feature.py`)
```python
from pydantic import BaseModel

class ItemCreate(BaseModel):
    name: str
    description: str
    price: float
```

2. **Create Service** (`app/services/your_feature_service.py`)
```python
class YourFeatureService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_item(self, data: ItemCreate):
        # Business logic here
        pass
```

3. **Create Endpoint** (`app/api/v1/endpoints/your_feature.py`)
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db

router = APIRouter()

@router.post("/items")
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db)
):
    service = YourFeatureService(db)
    return service.create_item(item)
```

4. **Register Router** (`app/api/v1/api.py`)
```python
from app.api.v1.endpoints import your_feature

api_router.include_router(
    your_feature.router,
    prefix="/your-feature",
    tags=["your-feature"]
)
```

#### Database Migrations

```bash
# Create a new migration
docker-compose exec backend alembic revision --autogenerate -m "Add new table"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback migration
docker-compose exec backend alembic downgrade -1

# View migration history
docker-compose exec backend alembic history
```

#### Testing Backend

```bash
# Run all tests
make test-backend
# or
docker-compose exec backend pytest

# Run with coverage
docker-compose exec backend pytest --cov=app --cov-report=html

# Run specific test file
docker-compose exec backend pytest tests/test_products.py

# Run specific test
docker-compose exec backend pytest tests/test_products.py::test_create_product
```

#### Code Quality

```bash
# Format code
cd services/backend
black app
isort app

# Lint code
flake8 app
mypy app

# Or use Make
make format
make lint
```

### Frontend Development

#### Running Frontend Locally

1. **Install Dependencies**

```bash
cd services/frontend
npm install
```

2. **Start Development Server**

```bash
npm run dev
```

The frontend will be available at http://localhost:5173 (Vite default)

#### Code Structure

```
services/frontend/
├── src/
│   ├── components/       # React components
│   │   ├── admin/        # Admin-specific components
│   │   ├── auth/         # Authentication components
│   │   ├── product/      # Product components
│   │   └── ui/           # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── routes/           # Routing configuration
│   ├── store/            # Redux store
│   │   ├── api/          # RTK Query API slices
│   │   └── slices/       # Redux slices
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
└── package.json
```

#### Adding a New Feature

1. **Create API Slice** (`src/store/api/yourFeatureApi.ts`)
```typescript
import { apiSlice } from './apiSlice';

export const yourFeatureApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query({
      query: () => '/your-feature/items',
      providesTags: ['YourFeature'],
    }),
    createItem: builder.mutation({
      query: (data) => ({
        url: '/your-feature/items',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['YourFeature'],
    }),
  }),
});

export const { useGetItemsQuery, useCreateItemMutation } = yourFeatureApi;
```

2. **Create Component** (`src/components/yourFeature/ItemList.tsx`)
```typescript
import { useGetItemsQuery } from '@/store/api/yourFeatureApi';

export const ItemList = () => {
  const { data, isLoading, error } = useGetItemsQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading items</div>;
  
  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

3. **Create Page** (`src/pages/yourFeature/ItemsPage.tsx`)
```typescript
import { ItemList } from '@/components/yourFeature/ItemList';

export const ItemsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Items</h1>
      <ItemList />
    </div>
  );
};
```

4. **Add Route** (`src/App.tsx` or routing file)
```typescript
<Route path="/items" element={<ItemsPage />} />
```

#### Styling with TailwindCSS

```typescript
// Use Tailwind utility classes
<button className="btn btn-primary bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
  Click me
</button>

// Use DaisyUI components
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Card Title</h2>
    <p>Card content</p>
  </div>
</div>
```

#### Testing Frontend

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

#### Build for Production

```bash
npm run build
```

## Common Development Tasks

### Adding a New ML Model

1. **Create Model Training Function** (`services/backend/app/services/ml_engine_service.py`)
```python
def train_your_model(self, data: pd.DataFrame, parameters: Dict):
    # Training logic
    model = YourModel(**parameters)
    model.fit(data)
    
    # Save model
    model_path = os.path.join(self.models_dir, "your_model.pkl")
    joblib.dump(model, model_path)
    
    return {"success": True, "metrics": {...}}
```

2. **Add Model Configuration** (via Admin Panel or Database)
```sql
INSERT INTO ml_model_config (model_type, parameters, is_active)
VALUES ('your_model', '{"param1": value}', true);
```

3. **Integrate with Recommendation Service**

### Debugging

#### Backend Debugging

**Using Docker logs:**
```bash
make logs-backend
# or
docker-compose logs -f backend
```

**Using pdb (Python debugger):**
```python
import pdb; pdb.set_trace()
```

**Using VS Code debugger:**
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload"],
      "jinja": true
    }
  ]
}
```

#### Frontend Debugging

**Using browser DevTools:**
- React DevTools extension
- Redux DevTools extension

**Using VS Code:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/services/frontend/src"
    }
  ]
}
```

### Database Management

#### Access Database

```bash
# Using Docker
make db-shell
# or
docker-compose exec postgres psql -U ecommerce_user -d ecommerce

# Direct connection (if PostgreSQL is local)
psql -U ecommerce_user -d ecommerce
```

#### Backup Database

```bash
make backup-db
# or
docker-compose exec -T postgres pg_dump -U ecommerce_user ecommerce > backup.sql
```

#### Restore Database

```bash
make restore-db FILE=backup.sql
# or
docker-compose exec -T postgres psql -U ecommerce_user -d ecommerce < backup.sql
```

### Performance Optimization

#### Backend
- Use database indexes
- Implement caching (Redis)
- Optimize queries (use `joinedload`)
- Use async endpoints for I/O operations
- Profile with `cProfile` or `py-spy`

#### Frontend
- Code splitting (React.lazy)
- Memoization (useMemo, useCallback)
- Virtual scrolling for long lists
- Image optimization
- Bundle size analysis: `npm run build -- --analyze`

## Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check logs
make logs-backend

# Rebuild container
docker-compose build backend
docker-compose up -d backend
```

**Database connection errors:**
```bash
# Verify database is running
docker-compose ps postgres

# Check connection
docker-compose exec backend python -c "from app.database import engine; print(engine.connect())"
```

**Frontend build errors:**
```bash
# Clear node_modules and reinstall
cd services/frontend
rm -rf node_modules package-lock.json
npm install
```

**Port conflicts:**
```bash
# Change ports in docker-compose.yml or .env files
# Backend: PORT=8001
# Frontend: VITE_PORT=3001
```

## Best Practices

### Code Style
- Follow PEP 8 for Python
- Use ESLint + Prettier for TypeScript
- Write meaningful commit messages
- Keep functions small and focused

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature
```

### Testing
- Write tests for new features
- Maintain >80% code coverage
- Test edge cases
- Use factories/fixtures for test data

### Documentation
- Document complex functions
- Update API documentation
- Keep README up to date
- Add inline comments for complex logic
