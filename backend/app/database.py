import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load the .env file automatically
load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Supabase (and most hosted Postgres) requires SSL; localhost does not
_is_local = "localhost" in (SQLALCHEMY_DATABASE_URL or "") or "127.0.0.1" in (SQLALCHEMY_DATABASE_URL or "")
_connect_args = {} if _is_local else {"sslmode": "require"}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is the 'Base' that Alembic is looking for!
Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()