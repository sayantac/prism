# Docker Configuration Guide (POC)

## Overview

Simple Docker setup for local development of the recommendation engine POC. Single-stage Dockerfiles and one docker-compose.yml for quick setup.

## Quick Start

### 1. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your values (optional - defaults work fine)
vim .env
```

### 2. Start Services

```bash
# Build and start all services
docker-compose up -d

# Or use the Makefile
make up
```

### 3. Access Services (Database auto-initializes!)

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **PgAdmin** (optional): http://localhost:5050 (run `docker-compose --profile tools up -d`)

> **Note**: Database schema and initial data (roles, permissions, admin user) are **automatically created** on first startup. No manual initialization needed!

## Architecture

```
┌─────────────────────────────────────────────────┐
│            Docker Compose Network               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │PostgreSQL│   │ Backend  │   │ Frontend │  │
│  │   :5432  │   │  :8000   │   │  :3000   │  │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘  │
│       │              │              │         │
│       └──────────────┴──────────────┘         │
│           ecommerce-network                    │
└─────────────────────────────────────────────────┘
```

## Services

### PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Volume**: postgres_data (persistent storage)
- **Health check**: Enabled

### Backend (FastAPI)
- **Build**: services/backend/Dockerfile
- **Port**: 8000
- **Features**:
  - Hot reload enabled
  - Volume mounted for live code changes
  - Automatic health checks

### Frontend (React + Vite)
- **Build**: services/frontend/Dockerfile
- **Port**: 5173 (mapped to 3000)
- **Features**:
  - Hot module replacement (HMR)
  - Volume mounted for live code changes
  - Fast refresh enabled

### PgAdmin (Optional)
- **Image**: dpage/pgadmin4
- **Port**: 5050
- **Usage**: `docker-compose --profile tools up -d`

## Common Commands

### Using Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Using Makefile

```bash
# Setup (create .env and start services)
make setup

# Start all services
make up

# Stop all services
make down

# View logs
make logs

# View backend logs
make logs-backend

# Rebuild services
make build

# Initialize database
make init-db

# Shell into backend
make shell-backend

# Shell into database
make shell-db

# Run backend tests
make test

# Clean everything
make clean
```

## Dockerfiles

### Backend Dockerfile

Simple single-stage Dockerfile:
- Python 3.11 slim base
- System dependencies (gcc, postgresql-client)
- pip install from requirements.txt
- Hot reload with uvicorn --reload
- Health check endpoint

### Frontend Dockerfile

Simple single-stage Dockerfile:
- Node 18 Alpine base
- npm install dependencies
- Vite dev server with HMR
- Health check endpoint

## Environment Variables

### Root .env File

```env
# Database
POSTGRES_USER=ecommerce_user
POSTGRES_PASSWORD=ecommerce_pass
POSTGRES_DB=ecommerce
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=8000
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True

# Frontend
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:8000

# PgAdmin (optional)
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
```

## Volumes

Persistent data volumes:
- `postgres_data` - Database data
- `backend_static` - Uploaded files
- `backend_logs` - Application logs
- `ml_models` - Trained ML models
- `pgadmin_data` - PgAdmin configuration

### Volume Management

```bash
# List volumes
docker volume ls

# Remove all volumes (WARNING: data loss)
docker volume prune

# Backup database
docker-compose exec -T postgres pg_dump -U ecommerce_user ecommerce > backup.sql

# Restore database
docker-compose exec -T postgres psql -U ecommerce_user ecommerce < backup.sql
```

## Development Workflow

### Making Code Changes

Backend changes:
1. Edit files in `services/backend/`
2. Changes auto-reload (uvicorn --reload)
3. View logs: `make logs-backend`

Frontend changes:
1. Edit files in `services/frontend/src/`
2. Vite HMR updates browser instantly
3. View logs: `make logs-frontend`

### Database Changes

```bash
# Access PostgreSQL CLI
make shell-db

# Or manually
docker-compose exec postgres psql -U ecommerce_user -d ecommerce
```

> **Database Initialization**: 
> - On first startup, SQLAlchemy creates all tables automatically
> - The `init_db()` function creates default roles, permissions, and admin user
> - This only runs if data doesn't exist (idempotent)
> - The postgres_data volume persists data between restarts
> - No need to run initialization manually!

### Debugging

```bash
# Shell into backend container
docker-compose exec backend bash

# Check Python packages
docker-compose exec backend pip list

# Run Python commands
docker-compose exec backend python -c "from app.database import engine; print(engine)"

# Shell into frontend container
docker-compose exec frontend sh

# Check npm packages
docker-compose exec frontend npm list
```

## Troubleshooting

### Services Won't Start

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use

```bash
# Find what's using the port
lsof -i :8000
lsof -i :3000

# Kill the process or change port in .env
BACKEND_PORT=8001
FRONTEND_PORT=3001
```

### Database Connection Errors

```bash
# Check database is healthy
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Wait for database to be ready
docker-compose exec backend python -c "from app.database import engine; engine.connect()"
```

### Out of Disk Space

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a

# Remove unused volumes
docker volume prune
```

### Frontend Not Loading

```bash
# Check Vite is running
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Check browser console for errors
```

## Database Persistence

### How It Works

The database is **persistent** across container restarts:

1. **First Startup**:
   - PostgreSQL container creates empty database
   - Backend app starts → SQLAlchemy creates all tables
   - `init_db()` runs → creates roles, permissions, admin user
   - Data saved to `postgres_data` volume

2. **Subsequent Startups**:
   - PostgreSQL loads data from `postgres_data` volume
   - Backend starts → sees existing tables
   - `init_db()` checks if data exists → skips creation
   - Everything just works! ✅

3. **Clean Slate** (if needed):
   ```bash
   # Remove volume to start fresh
   docker-compose down -v
   docker-compose up -d
   ```

### Default Credentials

After first startup, login with:
- **Email**: admin@example.com (from .env: FIRST_SUPERUSER_EMAIL)
- **Password**: admin123 (from .env: FIRST_SUPERUSER_PASSWORD)

## Best Practices for POC

1. **Keep it simple** - Single Dockerfile per service, no multi-stage builds
2. **Use volume mounts** - Hot reload for fast development
3. **Default values** - .env has sensible defaults, no need to configure much
4. **Health checks** - Ensure services are ready before connecting
5. **Logs** - Use `make logs` to debug issues
6. **Clean slate** - Use `make clean` or `docker-compose down -v` to start fresh
7. **Database persists** - No need to reinitialize on every restart

## Next Steps

After POC validation:
1. Add production-ready multi-stage Dockerfiles
2. Create docker-compose.prod.yml for production
3. Add Nginx reverse proxy
4. Implement proper secrets management
5. Add CI/CD pipeline
6. Set up monitoring and logging

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI in Docker](https://fastapi.tiangolo.com/deployment/docker/)
- [Vite Docker Setup](https://vitejs.dev/guide/)
