import sqlite3
import logging
import json
from datetime import datetime
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

DB_PATH = "krishimitra.db"

def init_db_raw():
    """Initializes the SQLite database with full schema using raw SQL."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable Write-Ahead Logging for better concurrency
    cursor.execute("PRAGMA journal_mode=WAL;")
    
    # 1. Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 2. Farmer Profiles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farmer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        latitude REAL,
        longitude REAL,
        soil_role TEXT DEFAULT 'Standard',
        farm_size REAL,
        primary_crop TEXT,
        sowing_date DATETIME,
        location_name TEXT,
        phone_number TEXT,
        aadhaar_number TEXT,
        kcc_number TEXT,
        survey_number TEXT,
        khata_number TEXT,
        bank_name TEXT,
        bank_account_number TEXT,
        ifsc_code TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    # 3. Chat Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT DEFAULT 'New Consultation',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    # 4. Chat History (Messages)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        user_id INTEGER,
        query TEXT,
        answer TEXT,
        explanation TEXT,
        confidence_score REAL,
        agents_used TEXT, -- JSON
        sources TEXT,      -- JSON
        citations TEXT,    -- JSON
        is_helpful INTEGER,
        feedback_text TEXT,
        meta_context TEXT, -- JSON
        latencies TEXT,    -- JSON
        document_ids TEXT, -- JSON
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    # 5. Chunk Feedback (RAG Boost)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chunk_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chunk_hash TEXT UNIQUE,
        helpful_count INTEGER DEFAULT 0,
        unhelpful_count INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 6. Mandi Prices (National Tracking)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mandi_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state TEXT,
        district TEXT,
        market TEXT,
        commodity TEXT,
        variety TEXT,
        arrival_date TEXT,
        min_price REAL,
        max_price REAL,
        modal_price REAL,
        ingested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(market, commodity, variety, arrival_date)
    )
    """)
    
    conn.commit()
    conn.close()
    logger.info("Raw SQL: Database schema initialized successfully.")

# --- USER & PROFILE HELPERS ---

def get_user_by_email(email: str) -> Optional[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: int) -> Optional[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(email: str, hashed_pw: str, full_name: str = None) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (email, hashed_password, full_name) VALUES (?, ?, ?)", (email, hashed_pw, full_name))
    user_id = cursor.lastrowid
    # Create profile
    cursor.execute("INSERT INTO farmer_profiles (user_id) VALUES (?)", (user_id,))
    conn.commit()
    conn.close()
    return user_id

def get_farmer_profile(user_id: int) -> Optional[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farmer_profiles WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_farmer_profile(user_id: int, updates: Dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.append(user_id)
    cursor.execute(f"UPDATE farmer_profiles SET {', '.join(fields)} WHERE user_id = ?", tuple(values))
    conn.commit()
    conn.close()

# --- CHAT & HISTORY HELPERS ---

def create_chat_session(user_id: int, title: str = "New Consultation") -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)", (user_id, title))
    sid = cursor.lastrowid
    conn.commit()
    conn.close()
    return sid

def get_chat_sessions(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_session_messages(session_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC", (session_id,))
    rows = cursor.fetchall()
    conn.close()
    res = []
    for r in rows:
        d = dict(r)
        # Handle JSON fields
        for field in ["agents_used", "sources", "citations", "meta_context", "latencies", "document_ids"]:
            try:
                if d.get(field):
                    d[field] = json.loads(d[field])
                else:
                    d[field] = [] if "ids" in field or "sources" in field or "used" in field or "citations" in field else {}
            except: d[field] = []
        res.append(d)
    return res

def save_chat_message(session_id, user_id, query, answer, explanation, confidence, agents, sources, citations, meta=None, latencies=None, doc_ids=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO chat_history (session_id, user_id, query, answer, explanation, confidence_score, agents_used, sources, citations, meta_context, latencies, document_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id, user_id, query, answer, explanation, confidence,
        json.dumps(agents or []), json.dumps(sources or []), json.dumps(citations or []),
        json.dumps(meta or {}), json.dumps(latencies or {}), json.dumps(doc_ids or [])
    ))
    cursor.execute("UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

# --- MARKET & NATIONAL HELPERS ---

def upsert_mandi_price(state, district, market, commodity, variety, arrival_date, min_p, max_p, modal_p):
    """Inserts or updates a mandi price record using raw SQL."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO mandi_prices (state, district, market, commodity, variety, arrival_date, min_price, max_price, modal_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(market, commodity, variety, arrival_date) DO UPDATE SET
            min_price = excluded.min_price,
            max_price = excluded.max_price,
            modal_price = excluded.modal_price,
            ingested_at = CURRENT_TIMESTAMP
        """, (state, district, market, commodity, variety, arrival_date, min_p, max_p, modal_p))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Raw SQL Upsert Error: {e}")
        return False
    finally:
        conn.close()

def get_recent_prices(commodity: str, market: str, limit: int = 5):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT state, district, market, commodity, variety, arrival_date, min_price, max_price, modal_price
        FROM mandi_prices
        WHERE commodity = ? AND market = ?
        ORDER BY id DESC
        LIMIT ?
        """, (commodity.capitalize(), market.capitalize(), limit))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Raw SQL Query Error: {e}")
        return []
    finally:
        conn.close()

def get_latest_market_snapshot(commodity: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
    SELECT market, modal_price, arrival_date 
    FROM mandi_prices 
    WHERE commodity = ? 
    ORDER BY id DESC LIMIT 100
    """, (commodity.capitalize(),))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
