"""
Database connection and session management for Sudar Agent Service.

This module provides SQLAlchemy database connection to the shared PostgreSQL database
for verifying classroom permissions and other authorization checks.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Read DATABASE_URL from environment. Example for PostgreSQL:
# postgresql+psycopg2://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    Dependency to get database session.
    
    Yields:
        Session: SQLAlchemy database session
        
    Example:
        @app.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            # Use db for queries
            pass
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
