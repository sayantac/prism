# E-Commerce Recommendation System

A comprehensive AI-powered recommendation engine with advanced ML capabilities, user segmentation, and real-time analytics.

## 🏗️ Architecture

This is a **monorepo** containing multiple services:

```
recommendationsystem/
├── services/
│   ├── backend/          # FastAPI backend with ML engine
│   │   └── README.md     # Backend documentation
│   └── frontend/         # React TypeScript frontend
│       └── README.md     # Frontend documentation
├── docs/                 # Comprehensive documentation
├── scripts/              # Utility scripts
├── docker-compose.yml    # Docker orchestration
├── Makefile             # Development commands
└── .env                 # Environment configuration
```

### Services

- **[Backend](./services/backend/README.md)** - FastAPI + PostgreSQL + ML engine
- **[Frontend](./services/frontend/README.md)** - React 19 + TypeScript + Redux Toolkit

## Quick Start

### Prerequisites

- Docker and Docker Compose
- 8GB RAM minimum
- 10GB free disk space

### 1. Restore Database

Before starting the application for the first time, restore the database from the dump file:

```bash
# Make the restore script executable
chmod +x scripts/restore_database.sh

# Run the restore script
./scripts/restore_database.sh
```

This will:
- Start the PostgreSQL container
- Drop and recreate the database
- Install required extensions (uuid-ossp, vector)
- Restore all data from the dump file

### 2. Setup and Run

```bash
# Clone the repository
git clone <repository-url>
cd recommendationsystem

# Create environment file and start services
make setup
```

This will:
- Create `.env` from `.env.example`
- Build Docker images
- Start all services (postgres, backend, frontend)

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **PgAdmin** (optional): `make pgadmin` then http://localhost:5050

### 4. Login

Default admin credentials (change in .env):
- **Email**: admin@example.com
- **Password**: admin123

That's it! The system is now running. 🎉

> **Database Note**: The database has been restored from the dump file and is ready to use. Data persists in Docker volume between restarts.

## 📋 Common Commands

```bash
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

# Shell into backend
make shell-backend

# Shell into database
make shell-db

# Run backend tests
make test

# Clean everything (removes volumes)
make clean
```

> **Note**: Database initializes automatically on first run! No need to run `make init-db`.
```

## 🚀 Features

### Core Features

- **Personalized Recommendations**: User-based collaborative filtering with ALS

- **Product Similarity**: Content-based recommendations using TF-IDF## Collaborate with your team

- **Trending Products**: Real-time popular products based on user behavior

- **User Segmentation**: RFM analysis and K-means clustering
- **Reorder Predictions**: LightGBM model for purchase prediction
- **Real-time Analytics**: User behavior tracking and conversion metrics
- **Vector Search**: Product similarity using pgvector
- **Hybrid Recommendations**: Content + Collaborative filtering

### Admin Features

- **ML Model Management**: Train, monitor, and configure ML models
- **User Segmentation Dashboard**: Create and manage custom segments
- **Performance Monitoring**: Real-time system health and metrics
- **Product Management**: CRUD operations with bulk upload
- **Order Management**: View and manage customer orders
- **Analytics Dashboard**: Comprehensive business insights

## 🛠️ Tech Stack

### Backend

- **Framework**: FastAPI 0.115.12
- **Database**: PostgreSQL 15 with pgvector extension
- **ORM**: SQLAlchemy 2.0
- **ML Libraries**: scikit-learn, LightGBM, implicit ALS
- **Authentication**: JWT with bcrypt

### Frontend

- **Framework**: React 19 with TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **Styling**: TailwindCSS 4 + DaisyUI
- **Build Tool**: Vite 6

### Infrastructure

- **Containerization**: Docker with Docker Compose
- **Database**: PostgreSQL 15 Alpine with pgvector
- **Development**: Hot reload for backend and frontend
- **Web Server**: Uvicorn (ASGI)
- **Routing**: React Router 7

## 📚 Documentation

### Service Documentation
- **[Backend Service Guide](./services/backend/README.md)** - API, ML models, database
- **[Frontend Service Guide](./services/frontend/README.md)** - React app, components, state

### General Documentation
- [Quick Start Guide](./docs/QUICK_START.md) - Get started in 5 minutes
- [Docker Configuration](./docs/docker.md) - Docker setup and usage
- [Architecture Overview](./docs/architecture.md) - System design and patterns
- [API Documentation](./docs/api.md) - API endpoints and usage
- [ML Models Guide](./docs/ml-models.md) - Machine learning models
- [Development Workflow](./docs/development.md) - Development best practices
- [Deployment Guide](./docs/deployment.md) - Production deployment
- [Monorepo Structure](./docs/MONOREPO_STRUCTURE.md) - Repository organization
- [Security Guide](./docs/SECURITY.md) - Security best practices
- [Frontend API Patterns](./docs/FRONTEND_API_PATTERNS.md) - RTK Query patterns
- [Frontend Testing](./docs/FRONTEND_TESTING.md) - Testing guide

## 🧪 Testing

```bash
# Backend tests
make test
# or: docker-compose exec backend pytest --cov=app

# Frontend tests
docker-compose exec frontend npm test
# or: docker-compose exec frontend npm run test:coverage
```

For detailed testing guides:
- [Backend Testing](./services/backend/README.md#-testing)
- [Frontend Testing](./services/frontend/README.md#-testing)
- [Frontend Testing Guide](./docs/FRONTEND_TESTING.md)

## 🔧 Development

### Code Style

```bash
# Backend linting
docker-compose exec backend flake8 app/
docker-compose exec backend black --check app/

# Frontend linting
docker-compose exec frontend npm run lint
```

### Database Migrations

```bash
# Create new migration
make migrate-create

# Apply migrations
make migrate

# Or manually
docker-compose exec backend alembic upgrade head
```

### Debugging

```bash
# View logs
make logs                 # All services
make logs-backend         # Backend only
make logs-frontend        # Frontend only
make logs-db             # Database only

# Shell access
make shell-backend       # Backend container
make shell-frontend      # Frontend container
make shell-db           # PostgreSQL CLI
```

## 🗺️ Project Status

This is a **POC (Proof of Concept)** project with simplified Docker configuration for local development.

### Next Steps for Production

1. Add production-ready multi-stage Dockerfiles
2. Implement proper secrets management (Vault, AWS Secrets Manager)
3. Add CI/CD pipeline (GitHub Actions)
4. Set up monitoring (Prometheus, Grafana)
5. Implement logging aggregation (ELK stack)
6. Add Redis caching layer
7. WebSocket support for real-time features
8. ML model versioning with MLflow

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Development Team: Nagarro

---

**Built with ❤️ by Nagarro**
```

### Integration Tests
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 🔧 Configuration

All environment variables are configured in the root `.env` file.

### Quick Configuration

```bash
# Copy example file
cp .env.example .env

# Edit with your values
vi .env
```

### Key Variables

```env
# Database
POSTGRES_USER=ecommerce_user
POSTGRES_PASSWORD=change-this-secure-password
POSTGRES_DB=ecommerce

# Backend
SECRET_KEY=your-super-secret-key-change-in-production
BACKEND_PORT=8000
CORS_ORIGINS=["http://localhost:5173"]

# Frontend
FRONTEND_PORT=5173
VITE_API_BASE_URL=http://localhost:8000  # No /api/v1 suffix

# Admin User (first-time setup)
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=admin123
```

For detailed configuration options, see:
- [Backend Configuration](./services/backend/README.md#-configuration)
- [Frontend Configuration](./services/frontend/README.md#-configuration)
- [.env.example](./.env.example) - Complete list

## 📦 Project Structure

For detailed service structure, see:
- [Backend Structure](./services/backend/README.md#-architecture)
- [Frontend Structure](./services/frontend/README.md#-architecture)

```
recommendationsystem/
├── services/
│   ├── backend/              # FastAPI backend service
│   │   ├── app/             # Application code
│   │   ├── data/            # Sample data
│   │   ├── ml_models/       # Trained ML models
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── README.md        # Backend documentation
│   └── frontend/             # React frontend service
│       ├── src/             # Source code
│       ├── public/          # Static assets
│       ├── package.json
│       ├── Dockerfile
│       └── README.md        # Frontend documentation
├── docs/                     # Comprehensive documentation
├── scripts/                  # Utility scripts
├── docker-compose.yml       # Docker orchestration
├── Makefile                 # Development commands
├── .env                     # Environment variables
├── .env.example             # Environment template
├── .gitignore               # Git ignore patterns
└── .dockerignore            # Docker ignore patterns
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- Development Team: Nagarro

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact: support@example.com

## 🗺️ Roadmap

- [ ] Implement Redis caching layer
- [ ] Add real-time notifications with WebSockets
- [ ] ML model versioning with MLflow
- [ ] A/B testing framework
- [ ] Mobile app (React Native)
- [ ] Microservices architecture migration

---

**Built with ❤️ by Nagarro**
