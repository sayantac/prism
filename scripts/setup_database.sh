#!/bin/bash

set -e

echo "=================================="
echo "Database Setup & Migration Script"
echo "=================================="

# Configuration
POSTGRES_CONTAINER="ecommerce-postgres"
POSTGRES_USER="ecommerce_user"
DB_NAME="ecommerce"

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
CSV_FILE="$PROJECT_ROOT/data/products-data.csv"
SEED_SCRIPT="$PROJECT_ROOT/scripts/seed_database.py"
ENRICH_SCRIPT="$PROJECT_ROOT/scripts/enrich_user_data.py"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Start PostgreSQL
echo -e "${YELLOW}Step 1: Starting PostgreSQL container...${NC}"
docker-compose up -d postgres

# Step 2: Wait for PostgreSQL
echo -e "${YELLOW}Step 2: Waiting for PostgreSQL to be ready...${NC}"
until docker exec $POSTGRES_CONTAINER pg_isready -U $POSTGRES_USER > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}PostgreSQL is ready!${NC}"

# Step 3: Create database
echo -e "${YELLOW}Step 3: Creating database if not exists...${NC}"
docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d postgres -c "
CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"
echo -e "${GREEN}✅ Database ready${NC}"

# Step 4: Run Python migration scripts
echo ""
echo "=================================="
echo -e "${BLUE}Running Python Migration Scripts${NC}"
echo "=================================="

# Check if backend container is running
BACKEND_CONTAINER=$(docker-compose ps -q backend 2>/dev/null)
if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${YELLOW}Backend container not running. Starting it...${NC}"
    docker-compose up -d backend
    
    # Wait for backend to be ready
    echo "Waiting for backend container to start..."
    sleep 5
fi

BACKEND_CONTAINER=$(docker-compose ps -q backend)

# Verify CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}❌ CSV file not found at $CSV_FILE${NC}"
    echo -e "${RED}Products cannot be imported without the CSV file!${NC}"
    exit 1
fi

# Step 4a: Seed Database with Training Data
echo ""
echo -e "${YELLOW}Step 4a: Seeding database with training data...${NC}"
if [ -f "$SEED_SCRIPT" ]; then
    # Copy scripts and CSV to /tmp in backend container (to avoid polluting /app volume)
    docker cp "$SEED_SCRIPT" $BACKEND_CONTAINER:/tmp/seed_database.py
    docker cp "$CSV_FILE" $BACKEND_CONTAINER:/tmp/products-data.csv
    
    echo -e "${BLUE}CSV file copied to backend container${NC}"
    
    # Run migration inside backend container
    docker exec $BACKEND_CONTAINER python /tmp/seed_database.py
    
    # Cleanup temp files
    docker exec $BACKEND_CONTAINER rm -f /tmp/seed_database.py /tmp/products-data.csv
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database seeding completed successfully!${NC}"
    else
        echo -e "${RED}❌ Database seeding failed!${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ seed_database.py not found at $SEED_SCRIPT!${NC}"
    exit 1
fi

# Step 4b: Enrich User Data
echo ""
echo -e "${YELLOW}Step 4b: Enriching user data with profiles...${NC}"
if [ -f "$ENRICH_SCRIPT" ]; then
    # Copy script to /tmp in backend container (to avoid polluting /app volume)
    docker cp "$ENRICH_SCRIPT" $BACKEND_CONTAINER:/tmp/enrich_user_data.py
    
    # Run enrichment inside backend container
    docker exec $BACKEND_CONTAINER python /tmp/enrich_user_data.py
    
    # Cleanup temp file
    docker exec $BACKEND_CONTAINER rm -f /tmp/enrich_user_data.py
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ User data enrichment completed successfully!${NC}"
    else
        echo -e "${YELLOW}⚠️  User enrichment had issues (check output above)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  enrich_user_data.py not found, skipping...${NC}"
fi

# Step 5: Verify data
echo ""
echo "=================================="
echo -e "${BLUE}Verifying Database${NC}"
echo "=================================="

docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $DB_NAME -c "
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'search_analytics', COUNT(*) FROM search_analytics
ORDER BY table_name;
" 2>/dev/null || echo "Some tables may not exist yet"

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Database Setup Complete!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start all services: ${YELLOW}docker-compose up${NC}"
echo "  2. Access application: ${YELLOW}http://localhost:8000${NC}"
echo "  3. Login with: ${YELLOW}admin@ecommerce.com / password123${NC}"
echo ""
echo -e "${BLUE}Database Info:${NC}"
echo "  • Database: $DB_NAME"
echo "  • Container: $POSTGRES_CONTAINER"
echo "  • User: $POSTGRES_USER"
echo ""
