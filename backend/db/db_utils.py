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

    # 7. Crop Cycles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS crop_cycles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        crop_name TEXT NOT NULL,
        planting_date DATE,
        expected_harvest_date DATE,
        actual_harvest_date DATE,
        season TEXT,
        status TEXT DEFAULT 'planned',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 8. Yield Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS yield_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        crop_cycle_id INTEGER,
        crop_name TEXT,
        yield_quintals REAL,
        area_hectares REAL,
        quality_grade TEXT,
        selling_price_per_quintal REAL,
        total_income REAL,
        harvest_date DATE,
        buyer_name TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles (id) ON DELETE SET NULL
    )
    """)

    # 9. Input Usage (Fertilizer, Pesticide, Seeds)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS input_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        crop_cycle_id INTEGER,
        input_type TEXT NOT NULL,
        input_name TEXT NOT NULL,
        quantity REAL,
        unit TEXT,
        cost REAL,
        application_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles (id) ON DELETE SET NULL
    )
    """)

    # 10. Equipment Inventory
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS equipment_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        equipment_name TEXT NOT NULL,
        equipment_type TEXT,
        purchase_date DATE,
        purchase_cost REAL,
        current_value REAL,
        condition TEXT,
        last_maintenance_date DATE,
        next_maintenance_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 11. Weather History
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weather_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date DATE NOT NULL,
        temperature_min REAL,
        temperature_max REAL,
        humidity REAL,
        rainfall_mm REAL,
        wind_speed REAL,
        weather_condition TEXT,
        alerts TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 12. Weather Alerts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weather_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        alert_type TEXT NOT NULL,
        severity TEXT,
        start_date DATE,
        end_date DATE,
        description TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 13. Expenses
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        expense_type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        receipt_image TEXT,
        is_recurring INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 14. Bills/Invoices
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        bill_type TEXT NOT NULL,
        vendor_name TEXT,
        bill_date DATE,
        amount REAL,
        due_date DATE,
        status TEXT DEFAULT 'pending',
        document_path TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 15. Transactions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        transaction_type TEXT NOT NULL,
        amount REAL NOT NULL,
        date DATE NOT NULL,
        category TEXT,
        description TEXT,
        reference_id TEXT,
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 16. Loans
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        lender_name TEXT NOT NULL,
        loan_type TEXT,
        principal_amount REAL,
        interest_rate REAL,
        emi_amount REAL,
        start_date DATE,
        end_date DATE,
        total_interest REAL,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 17. Insurance Policies
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS insurance_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        policy_type TEXT NOT NULL,
        provider_name TEXT,
        policy_number TEXT UNIQUE,
        premium_amount REAL,
        coverage_amount REAL,
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'active',
        claim_status TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 18. Seed Inventory
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS seed_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        seed_name TEXT NOT NULL,
        crop_type TEXT,
        quantity_kg REAL,
        purchase_date DATE,
        cost REAL,
        supplier_name TEXT,
        expiry_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 19. Fertilizer/Pesticide Stock
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agrochemical_stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_name TEXT NOT NULL,
        product_type TEXT,
        quantity_kg REAL,
        purchase_date DATE,
        cost REAL,
        supplier_name TEXT,
        expiry_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 20. Advisory Recommendations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS advisory_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        crop_cycle_id INTEGER,
        recommendation_text TEXT NOT NULL,
        category TEXT,
        priority TEXT,
        is_implemented INTEGER DEFAULT 0,
        implementation_date DATE,
        result_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles (id) ON DELETE SET NULL
    )
    """)

    # 21. Government Schemes Applications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scheme_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        scheme_name TEXT NOT NULL,
        scheme_type TEXT,
        applying_date DATE,
        status TEXT DEFAULT 'pending',
        documents_submitted TEXT,
        amount_applied REAL,
        amount_approved REAL,
        approval_date DATE,
        rejection_reason TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 22. Subsidy Tracking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subsidies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        scheme_id INTEGER,
        subsidy_type TEXT NOT NULL,
        amount REAL,
        disbursement_date DATE,
        status TEXT DEFAULT 'applied',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 23. Soil Test Results
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS soil_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        test_date DATE NOT NULL,
        ph_level REAL,
        nitrogen_ppm REAL,
        phosphorus_ppm REAL,
        potassium_ppm REAL,
        organic_carbon REAL,
        zinc_ppm REAL,
        iron_ppm REAL,
        manganese_ppm REAL,
        copper_ppm REAL,
        boron_ppm REAL,
        lab_name TEXT,
        field_location TEXT,
        recommendations TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 24. Soil Health Tracking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS soil_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        soil_test_id INTEGER,
        ph_level REAL,
        organic_matter REAL,
        nitrogen REAL,
        phosphorus REAL,
        potassium REAL,
        recorded_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (soil_test_id) REFERENCES soil_tests (id) ON DELETE SET NULL
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

# --- CROP MANAGEMENT HELPERS ---

def add_crop_cycle(user_id: int, crop_name: str, planting_date: str, expected_harvest: str, season: str, notes: str = None) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO crop_cycles (user_id, crop_name, planting_date, expected_harvest_date, season, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, crop_name, planting_date, expected_harvest, season, notes))
    cycle_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return cycle_id

def get_crop_cycles(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM crop_cycles WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_crop_cycle(user_id: int, cycle_id: int, updates: Dict) -> bool:
    if not updates:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.extend([user_id, cycle_id])
    cursor.execute(f"UPDATE crop_cycles SET {', '.join(fields)} WHERE user_id = ? AND id = ?", tuple(values))
    conn.commit()
    conn.close()
    return True

def delete_crop_cycle(user_id: int, cycle_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM crop_cycles WHERE user_id = ? AND id = ?", (user_id, cycle_id))
    conn.commit()
    conn.close()
    return True

def add_yield_record(user_id: int, cycle_id: int, crop: str, yield_q: float, area: float, price: float, income: float, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO yield_records (user_id, crop_cycle_id, crop_name, yield_quintals, area_hectares, selling_price_per_quintal, total_income, buyer_name, harvest_date, quality_grade, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, cycle_id, crop, yield_q, area, price, income, kwargs.get('buyer'), kwargs.get('harvest_date'), kwargs.get('grade'), kwargs.get('notes')))
    rid = cursor.lastrowid
    conn.commit()
    conn.close()
    return rid

def get_yield_records(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM yield_records WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_input_usage(user_id: int, cycle_id: int, input_type: str, name: str, qty: float, cost: float, unit: str, date: str, notes: str = None) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO input_usage (user_id, crop_cycle_id, input_type, input_name, quantity, unit, cost, application_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, cycle_id, input_type, name, qty, unit, cost, date, notes))
    iid = cursor.lastrowid
    conn.commit()
    conn.close()
    return iid

def get_input_usage(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM input_usage WHERE user_id = ? ORDER BY application_date DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_equipment(user_id: int, name: str, etype: str, purchase_date: str, cost: float, condition: str, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO equipment_inventory (user_id, equipment_name, equipment_type, purchase_date, purchase_cost, current_value, condition, last_maintenance_date, next_maintenance_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, name, etype, purchase_date, cost, cost * 0.8, condition, kwargs.get('last_maint'), kwargs.get('next_maint'), kwargs.get('notes')))
    eid = cursor.lastrowid
    conn.commit()
    conn.close()
    return eid

def get_equipment(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM equipment_inventory WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_equipment(user_id: int, equip_id: int, updates: Dict) -> bool:
    if not updates:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.extend([user_id, equip_id])
    cursor.execute(f"UPDATE equipment_inventory SET {', '.join(fields)} WHERE user_id = ? AND id = ?", tuple(values))
    conn.commit()
    conn.close()
    return True

def delete_equipment(user_id: int, equip_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM equipment_inventory WHERE user_id = ? AND id = ?", (user_id, equip_id))
    conn.commit()
    conn.close()
    return True

# --- WEATHER HELPERS ---

def add_weather_record(user_id: int, date: str, temp_min: float, temp_max: float, humidity: float, rainfall: float, condition: str) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO weather_history (user_id, date, temperature_min, temperature_max, humidity, rainfall_mm, weather_condition)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, date, temp_min, temp_max, humidity, rainfall, condition))
    wid = cursor.lastrowid
    conn.commit()
    conn.close()
    return wid

def get_weather_history(user_id: int, limit: int = 30) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM weather_history WHERE user_id = ? ORDER BY date DESC LIMIT ?", (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_weather_alert(user_id: int, alert_type: str, severity: str, start_date: str, end_date: str, description: str) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO weather_alerts (user_id, alert_type, severity, start_date, end_date, description)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, alert_type, severity, start_date, end_date, description))
    aid = cursor.lastrowid
    conn.commit()
    conn.close()
    return aid

def get_weather_alerts(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM weather_alerts WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_weather_record(user_id: int, record_id: int, updates: Dict) -> bool:
    if not updates:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.extend([user_id, record_id])
    cursor.execute(f"UPDATE weather_history SET {', '.join(fields)} WHERE user_id = ? AND id = ?", tuple(values))
    conn.commit()
    conn.close()
    return True

def delete_weather_record(user_id: int, record_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM weather_history WHERE user_id = ? AND id = ?", (user_id, record_id))
    conn.commit()
    conn.close()
    return True

# --- FINANCIAL HELPERS ---

def add_expense(user_id: int, exp_type: str, category: str, amount: float, date: str, description: str = None, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO expenses (user_id, expense_type, category, amount, date, description, receipt_image, is_recurring)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, exp_type, category, amount, date, description, kwargs.get('receipt'), kwargs.get('recurring', 0)))
    eid = cursor.lastrowid
    conn.commit()
    conn.close()
    return eid

def get_expenses(user_id: int, category: str = None) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    if category:
        cursor.execute("SELECT * FROM expenses WHERE user_id = ? AND category = ? ORDER BY date DESC", (user_id, category))
    else:
        cursor.execute("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_expense(user_id: int, expense_id: int, updates: Dict) -> bool:
    if not updates:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.extend([user_id, expense_id])
    cursor.execute(f"UPDATE expenses SET {', '.join(fields)} WHERE user_id = ? AND id = ?", tuple(values))
    conn.commit()
    conn.close()
    return True

def delete_expense(user_id: int, expense_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE user_id = ? AND id = ?", (user_id, expense_id))
    conn.commit()
    conn.close()
    return True

def add_transaction(user_id: int, txn_type: str, amount: float, date: str, category: str, description: str = None, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO transactions (user_id, transaction_type, amount, date, category, description, reference_id, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, txn_type, amount, date, category, description, kwargs.get('ref_id'), kwargs.get('payment_method')))
    tid = cursor.lastrowid
    conn.commit()
    conn.close()
    return tid

def get_transactions(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_transaction(user_id: int, txn_id: int, updates: Dict) -> bool:
    if not updates:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.extend([user_id, txn_id])
    cursor.execute(f"UPDATE transactions SET {', '.join(fields)} WHERE user_id = ? AND id = ?", tuple(values))
    conn.commit()
    conn.close()
    return True

def delete_transaction(user_id: int, txn_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE user_id = ? AND id = ?", (user_id, txn_id))
    conn.commit()
    conn.close()
    return True

def add_loan(user_id: int, lender: str, loan_type: str, principal: float, interest: float, emi: float, start_date: str, end_date: str, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO loans (user_id, lender_name, loan_type, principal_amount, interest_rate, emi_amount, start_date, end_date, total_interest, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, lender, loan_type, principal, interest, emi, start_date, end_date, principal * interest / 100, kwargs.get('notes')))
    lid = cursor.lastrowid
    conn.commit()
    conn.close()
    return lid

def get_loans(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_loan(user_id: int, loan_id: int, updates: Dict) -> bool:
    if not updates:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.extend([user_id, loan_id])
    cursor.execute(f"UPDATE loans SET {', '.join(fields)} WHERE user_id = ? AND id = ?", tuple(values))
    conn.commit()
    conn.close()
    return True

def delete_loan(user_id: int, loan_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM loans WHERE user_id = ? AND id = ?", (user_id, loan_id))
    conn.commit()
    conn.close()
    return True

def add_insurance(user_id: int, ptype: str, provider: str, policy_no: str, premium: float, coverage: float, start_date: str, end_date: str, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO insurance_policies (user_id, policy_type, provider_name, policy_number, premium_amount, coverage_amount, start_date, end_date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, ptype, provider, policy_no, premium, coverage, start_date, end_date, kwargs.get('status', 'active'), kwargs.get('notes')))
    iid = cursor.lastrowid
    conn.commit()
    conn.close()
    return iid

def get_insurance(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM insurance_policies WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_insurance(user_id: int, policy_id: int, updates: Dict) -> bool:
    if not updates:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.extend([user_id, policy_id])
    cursor.execute(f"UPDATE insurance_policies SET {', '.join(fields)} WHERE user_id = ? AND id = ?", tuple(values))
    conn.commit()
    conn.close()
    return True

def delete_insurance(user_id: int, policy_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM insurance_policies WHERE user_id = ? AND id = ?", (user_id, policy_id))
    conn.commit()
    conn.close()
    return True

# --- INVENTORY HELPERS ---

def add_seed_inventory(user_id: int, name: str, crop_type: str, qty: float, cost: float, purchase_date: str, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO seed_inventory (user_id, seed_name, crop_type, quantity_kg, cost, purchase_date, supplier_name, expiry_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, name, crop_type, qty, cost, purchase_date, kwargs.get('supplier'), kwargs.get('expiry'), kwargs.get('notes')))
    sid = cursor.lastrowid
    conn.commit()
    conn.close()
    return sid

def get_seed_inventory(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM seed_inventory WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_seed_inventory(user_id: int, seed_id: int, updates: Dict) -> bool:
    if not updates:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.extend([user_id, seed_id])
    cursor.execute(f"UPDATE seed_inventory SET {', '.join(fields)} WHERE user_id = ? AND id = ?", tuple(values))
    conn.commit()
    conn.close()
    return True

def delete_seed_inventory(user_id: int, seed_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM seed_inventory WHERE user_id = ? AND id = ?", (user_id, seed_id))
    conn.commit()
    conn.close()
    return True

def add_agrochemical_stock(user_id: int, name: str, ptype: str, qty: float, cost: float, purchase_date: str, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO agrochemical_stock (user_id, product_name, product_type, quantity_kg, cost, purchase_date, supplier_name, expiry_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, name, ptype, qty, cost, purchase_date, kwargs.get('supplier'), kwargs.get('expiry'), kwargs.get('notes')))
    sid = cursor.lastrowid
    conn.commit()
    conn.close()
    return sid

def get_agrochemical_stock(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agrochemical_stock WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- ADVISORY HELPERS ---

def add_advisory_recommendation(user_id: int, cycle_id: int, text: str, category: str, priority: str) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO advisory_recommendations (user_id, crop_cycle_id, recommendation_text, category, priority)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, cycle_id, text, category, priority))
    aid = cursor.lastrowid
    conn.commit()
    conn.close()
    return aid

def get_advisory_recommendations(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM advisory_recommendations WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_advisory_implementation(user_id: int, rec_id: int, implemented: int, result: str = None) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE advisory_recommendations SET is_implemented = ?, implementation_date = CURRENT_TIMESTAMP, result_text = ?
        WHERE id = ? AND user_id = ?
    """, (implemented, result, rec_id, user_id))
    conn.commit()
    conn.close()
    return True

# --- GOVERNMENT SCHEMES HELPERS ---

def add_scheme_application(user_id: int, name: str, scheme_type: str, applying_date: str, amount: float, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scheme_applications (user_id, scheme_name, scheme_type, applying_date, amount_applied, documents_submitted, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, name, scheme_type, applying_date, amount, kwargs.get('documents'), kwargs.get('status', 'pending'), kwargs.get('notes')))
    sid = cursor.lastrowid
    conn.commit()
    conn.close()
    return sid

def get_scheme_applications(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scheme_applications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_scheme_status(user_id: int, app_id: int, status: str, amount_approved: float = None, approval_date: str = None) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE scheme_applications SET status = ?, amount_approved = ?, approval_date = ?
        WHERE id = ? AND user_id = ?
    """, (status, amount_approved, approval_date, app_id, user_id))
    conn.commit()
    conn.close()
    return True

# --- SOIL HEALTH HELPERS ---

def add_soil_test(user_id: int, test_date: str, ph: float, n: float, p: float, k: float, oc: float, **kwargs) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO soil_tests (user_id, test_date, ph_level, nitrogen_ppm, phosphorus_ppm, potassium_ppm, organic_carbon, lab_name, field_location, recommendations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, test_date, ph, n, p, k, oc, kwargs.get('lab'), kwargs.get('location'), kwargs.get('recommendations')))
    tid = cursor.lastrowid
    conn.commit()
    conn.close()
    return tid

def get_soil_tests(user_id: int) -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM soil_tests WHERE user_id = ? ORDER BY test_date DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_soil_test(user_id: int, test_id: int, updates: Dict) -> bool:
    if not updates:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.extend([user_id, test_id])
    cursor.execute(f"UPDATE soil_tests SET {', '.join(fields)} WHERE user_id = ? AND id = ?", tuple(values))
    conn.commit()
    conn.close()
    return True

def delete_soil_test(user_id: int, test_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM soil_tests WHERE user_id = ? AND id = ?", (user_id, test_id))
    conn.commit()
    conn.close()
    return True

def get_latest_soil_health(user_id: int) -> Optional[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM soil_tests WHERE user_id = ? ORDER BY test_date DESC LIMIT 1", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None
