# Quick Start Guide

## Prerequisites
- Docker & Docker Compose installed
- Git (to clone repository)
- 4GB+ RAM available

## Setup in 5 Minutes

### 1. Clone and Configure
```bash
# Clone repository
cd recommendationsystem/

# Copy environment template
cp .env.example .env

# Edit .env with your values (optional, defaults work for development)
nano .env
```

### 2. Start Services
```bash
# Start all containers
docker-compose up -d

# View startup logs
docker-compose logs -f backend
```

**Wait for**: "Success: startup complete" message

### 3. Load Sample Data
```bash
# Load categories and products (1,256 records total)
docker-compose exec backend python scripts/seed_data.py
```

Expected output:
```
Loading categories (pass 1 - root categories)...
✓ Loaded 234 root categories

Loading categories (pass 2 - child categories)...
✓ Loaded 902 child categories

Loading products...
✓ Loaded 120 products

SUCCESS: Database seeding complete!
```

### 4. Access Applications

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Register new user |
| Backend API | http://localhost:8000 | N/A |
| API Docs | http://localhost:8000/docs | N/A |
| Admin Panel | http://localhost:5173/admin | admin / admin123 |
| PgAdmin (optional) | http://localhost:5050 | admin@example.com / admin |

### 5. Verify Installation
```bash
# Check all services running
docker-compose ps

# Test backend health
curl http://localhost:8000/health

# Check database
docker-compose exec postgres psql -U tanmay -d ecommerce -c "SELECT COUNT(*) FROM products;"
```

## Development Workflow

### Making Backend Changes
```bash
# Edit files in services/backend/
# Changes auto-reload (uvicorn --reload is enabled)

# View logs
docker-compose logs -f backend

# Restart if needed
docker-compose restart backend
```

### Making Frontend Changes
```bash
# Edit files in services/frontend/src/
# Vite HMR will auto-reload browser

# View logs
docker-compose logs -f frontend
```

### Database Operations
```bash
# Connect to database
docker-compose exec postgres psql -U tanmay -d ecommerce

# Common queries
SELECT * FROM product_categories LIMIT 10;
SELECT * FROM products LIMIT 10;
SELECT * FROM users LIMIT 10;

# Exit
\q
```

### Reset Everything
```bash
# Stop and remove all data
docker-compose down -v

# Start fresh
docker-compose up -d

# Re-seed data
docker-compose exec backend python scripts/seed_data.py
```

## Common Tasks

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f frontend
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Stop Services
```bash
# Stop (keep data)
docker-compose stop

# Stop and remove containers (keep volumes)
docker-compose down

# Stop and remove everything
docker-compose down -v
```

### Access Containers
```bash
# Backend shell
docker-compose exec backend bash

# PostgreSQL shell
docker-compose exec postgres psql -U tanmay -d ecommerce

# Frontend shell
docker-compose exec frontend sh
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using ports 8000, 5173, 5432
lsof -i :8000
lsof -i :5173
lsof -i :5432

# Change ports in docker-compose.yml if needed
```

### Backend Won't Start
```bash
# Check postgres is healthy
docker-compose ps

# View detailed logs
docker-compose logs backend

# Common fix: wait for postgres
docker-compose restart backend
```

### Database Connection Error
```bash
# Check environment variables
docker-compose exec backend env | grep POSTGRES

# Verify postgres is accepting connections
docker-compose exec postgres pg_isready -U tanmay

# Check .env file matches docker-compose.yml
cat .env | grep POSTGRES
```

### Seed Script Fails
```bash
# Check CSV files exist
docker-compose exec backend ls -la /app/data/*.csv

# Run with verbose output
docker-compose logs backend
docker-compose exec backend python scripts/seed_data.py
```

### Clean Install
```bash
# Complete reset
docker-compose down -v
docker system prune -f
docker volume prune -f

# Start fresh
docker-compose up -d
docker-compose exec backend python scripts/seed_data.py
```

## Next Steps

- **API Documentation**: http://localhost:8000/docs
- **Full Docker Guide**: [docs/DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **Architecture**: [docs/ARCHITECTURE.md](./ARCHITECTURE.md) *(if exists)*
- **API Reference**: [docs/API.md](./API.md) *(if exists)*

## Getting Help

```bash
# Check Docker Compose version
docker-compose --version

# Check Docker version
docker --version

# View container stats
docker stats

# View container processes
docker-compose top
```

## Default Accounts

### Admin User
- **Username**: admin
- **Email**: admin@example.com
- **Password**: admin123
- **Access**: http://localhost:5173/admin

### PgAdmin (optional)
- **Email**: admin@example.com
- **Password**: admin
- **Access**: http://localhost:5050

> ⚠️ **Security**: Change these credentials in production!

## Quick Reference

```bash
# Essential Commands
docker-compose up -d              # Start everything
docker-compose down               # Stop everything
docker-compose logs -f backend    # View logs
docker-compose restart backend    # Restart service
docker-compose ps                 # Check status
docker-compose exec backend bash  # Shell access

# Data Management
docker-compose exec backend python scripts/seed_data.py   # Load data
docker-compose exec postgres psql -U tanmay -d ecommerce  # Database

# Cleanup
docker-compose down -v            # Nuclear option (removes all data)
```
