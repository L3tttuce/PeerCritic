import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends
from sqlalchemy import text
from sqlmodel import SQLModel, create_engine, Session

# Load environment variable or secret from .env file
load_dotenv()
postgresql_url = os.getenv("DATABASE_URL")
engine = create_engine(
    postgresql_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create tables in the database (dev only; production uses Alembic migrations)
def create_db_and_tables():
    if os.getenv("CREATE_TABLES_ON_STARTUP", "").lower() in ("1", "true", "yes"):
        SQLModel.metadata.create_all(engine)

# Open database connection
def get_session():
    with Session(engine) as session:
        yield session

# The database connection
SessionDep = Annotated[Session, Depends(get_session)]