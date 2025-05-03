# test_db.py
from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///:memory:")  # Use Postgres URI if available

with engine.connect() as conn:
    result = conn.execute(text("SELECT 'Hello, world!'"))
    print(result.scalar())
