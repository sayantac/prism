#!/bin/bash

set -e

echo "=================================="
echo "Database Restore Script"
echo "=================================="

# Configuration
POSTGRES_CONTAINER="ecommerce-postgres"
POSTGRES_USER="ecommerce_user"
DB_NAME="ecommerce"
SQL_FILE="/tmp/database.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Starting PostgreSQL container...${NC}"
docker-compose up -d postgres

echo -e "${YELLOW}Step 2: Waiting for PostgreSQL to be ready...${NC}"
until docker exec $POSTGRES_CONTAINER pg_isready -U $POSTGRES_USER > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}PostgreSQL is ready!${NC}"

echo -e "${YELLOW}Step 3: Copying database.sql to container...${NC}"
docker cp ../data/database.sql $POSTGRES_CONTAINER:$SQL_FILE
echo -e "${GREEN}File copied successfully!${NC}"

echo -e "${YELLOW}Step 4: Terminating all connections to database...${NC}"
docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" || true

echo -e "${YELLOW}Step 5: Restoring database from dump (connected to postgres db)...${NC}"
echo "This may take a few minutes (157MB file)..."
docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d postgres -f $SQL_FILE 2>&1 | tee ./restore.log

# Check for errors
ERROR_COUNT=$(grep -i "ERROR:" ./restore.log | wc -l | tr -d ' ')

echo ""
echo "=================================="
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo -e "${GREEN}Database restore completed successfully!${NC}"
else
    echo -e "${YELLOW}Database restore completed with $ERROR_COUNT errors.${NC}"
    echo -e "${YELLOW}Check restore.log for details.${NC}"
    echo ""
    echo "Common errors (showing first 10):"
    grep -i "ERROR:" ./restore.log | head -10
fi
echo "=================================="

echo ""
echo "You can now start the application with: docker-compose up"
