"""
Database Configuration
Establishes connection to MySQL database using SQLAlchemy
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create SQLAlchemy engine
# pool_pre_ping ensures connections are valid before using them
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Create SessionLocal class
# Each instance will be a database session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all models
Base = declarative_base()


# Dependency to get database session
def get_db():
    """
    Database session dependency
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Function to test database connection
def test_connection():
    """
    Test database connection
    Returns True if connection is successful
    """
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        print(" Database connection successful!")
        return True
    except Exception as e:
        print(f" Database connection failed: {e}")
        return False