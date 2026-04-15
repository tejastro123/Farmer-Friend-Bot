import sqlite3
import os
from contextlib import contextmanager

DB_PATH = "krishimitra.db"

@contextmanager
def get_db_conn():
    """
    Standard library sqlite3 connection provider.
    Bypasses SQLAlchemy for Python 3.14 compatibility.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Mock get_db for FastAPI dependency injection compatibility
def get_db():
    with get_db_conn() as conn:
        yield conn
