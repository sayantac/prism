# Deployment Guide

## Production Deployment

### Prerequisites

- Docker and Docker Compose installed on server
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- PostgreSQL database (managed service recommended)
- S3 bucket for file storage (optional)

## Deployment Options

### Option 1: Docker Compose (Simple)

Best for: Small to medium applications, single server deployment

1. **Prepare Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Clone Repository**
```bash
git clone <repository-url>
cd recommendationsystem
```

3. **Configure Environment**
```bash
cp services/backend/.env.example services/backend/.env
cp services/frontend/.env.example services/frontend/.env

# Edit with production values
nano services/backend/.env
nano services/frontend/.env
```

4. **Deploy**
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Initialize database
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker-compose -f docker-compose.prod.yml exec backend python -m app.utils.init_db
```

### Option 2: Kubernetes (Scalable)

Best for: Large applications, high availability, auto-scaling

(Documentation to be added)

## Environment Configuration

### Production Environment Variables

**Backend** (`services/backend/.env`):
```env
# Use production database (managed service recommended)
DATABASE_URL=postgresql://user:password@db.example.com:5432/ecommerce

# Strong secret key
SECRET_KEY=<generate-with-openssl-rand-hex-32>

# Production CORS
BACKEND_CORS_ORIGINS=["https://yourdomain.com"]

# Disable debug mode
DEBUG=False

# Production admin
FIRST_SUPERUSER_EMAIL=admin@yourdomain.com
FIRST_SUPERUSER_PASSWORD=<strong-password>

# S3 for file storage
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
```

**Frontend** (`services/frontend/.env`):
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_ENV=production
```

## SSL Configuration

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Nginx Configuration

Example nginx configuration (`/etc/nginx/sites-available/ecommerce`):

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/ecommerce/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

## Database Management

### Using Managed PostgreSQL (Recommended)

- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Databases
- Heroku Postgres

Benefits:
- Automatic backups
- High availability
- Scaling
- Monitoring

### Self-Hosted PostgreSQL

Ensure:
- Regular backups (automated)
- Replication for high availability
- SSL/TLS enabled
- Proper resource allocation

## Monitoring

### Application Monitoring

- Set up Sentry for error tracking
- Configure logging aggregation (ELK stack)
- Use APM tools (New Relic, DataDog)

### Infrastructure Monitoring

- System metrics (CPU, RAM, disk)
- Database performance
- Response times
- Error rates

### Alerting

Set up alerts for:
- High error rates
- Slow response times
- Database issues
- Disk space warnings

## Backup Strategy

### Database Backups

```bash
# Daily automated backup
0 2 * * * docker-compose exec -T postgres pg_dump -U user dbname | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
find /backups -name "db_*.sql.gz" -mtime +30 -delete
```

### ML Models Backup

```bash
# Backup ml_models directory
rsync -av ml_models/ s3://your-bucket/ml_models/
```

## Scaling Considerations

### Horizontal Scaling

1. **Multiple Backend Instances**: Run multiple backend containers behind load balancer
2. **Session Management**: Use Redis for session storage
3. **File Storage**: Use S3 instead of local filesystem
4. **Database Connection Pooling**: Configure appropriately

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Add indexes
4. Implement caching

## Security Checklist

- [ ] SSL/TLS enabled
- [ ] Strong secret keys and passwords
- [ ] Database connection encrypted
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Backup encryption
- [ ] Access logs enabled
- [ ] Admin panel access restricted

## CI/CD Pipeline

(To be configured in `.github/workflows/`)

1. **On Pull Request**:
   - Run linters
   - Run tests
   - Build Docker images

2. **On Merge to Main**:
   - Build production images
   - Push to container registry
   - Deploy to staging
   - Run integration tests

3. **On Release Tag**:
   - Deploy to production
   - Run smoke tests
   - Notify team

## Rollback Procedure

If deployment fails:

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-tag>

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# If database migration issues, rollback migration
docker-compose -f docker-compose.prod.yml exec backend alembic downgrade -1
```

## Performance Tuning

### Backend

- Enable gzip compression
- Use CDN for static files
- Implement Redis caching
- Optimize database queries
- Use async endpoints

### Frontend

- Enable code splitting
- Lazy load routes
- Optimize images
- Use CDN
- Enable browser caching

### Database

- Create proper indexes
- Regular VACUUM and ANALYZE
- Monitor slow queries
- Connection pooling
- Read replicas for read-heavy loads

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs and metrics
- **Weekly**: Review performance, check backups
- **Monthly**: Security updates, dependency updates
- **Quarterly**: Load testing, disaster recovery drill

### Updates

```bash
# Update codebase
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```
