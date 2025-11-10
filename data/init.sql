-- Initialize PostgreSQL database with required extensions
-- This script runs automatically when the postgres container is first created

-- Initialize PostgreSQL with required extensions and schema
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Tables will be created by SQLAlchemy models on application startup
-- This script only ensures required extensions are available

-- Create other useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for text search similarity
