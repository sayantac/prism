from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    "postgresql://tanmay:123@localhost:5432/recom_sys",
    
    pool_size=20,  # Number of connections to maintain in pool
    max_overflow=30,  # Maximum overflow connections
    pool_pre_ping=True,  # Validate connections before use
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
