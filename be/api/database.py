import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Read DATABASE_URL from environment. Example for PostgreSQL:
# postgresql+psycopg2://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # When DATABASE_URL is set, use it (Postgres or other supported DBs).
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    # Fallback to local SQLite for convenience during development.
    SQLALCHEMY_DATABASE_URL = "sqlite:///../sql/sudarai.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
