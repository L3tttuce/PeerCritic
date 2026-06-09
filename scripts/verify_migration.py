import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

sys.path.append(os.getcwd())
load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    for table in ("movie", "tvshow", "song"):
        cols = conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = :table ORDER BY ordinal_position"
            ),
            {"table": table},
        ).fetchall()
        print(f"{table}: {[c[0] for c in cols]}")

    for table in ("movie", "tvshow", "song"):
        count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
        print(f"{table} rows: {count}")
