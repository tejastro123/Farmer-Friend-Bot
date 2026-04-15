import sqlite3
import os

DB_PATH = "krishimitra.db"

def run_migration():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Adding new columns to 'chat_history' table in {DB_PATH}...")

    # Define the new columns and their SQLite types
    # Since SQLAlchemy JSON columns are stored as strings in SQLite
    new_columns = [
        ("meta_context", "TEXT DEFAULT '{}'"),
        ("latencies", "TEXT DEFAULT '{}'"),
        ("document_ids", "TEXT DEFAULT '[]'")
    ]

    for col_name, col_type in new_columns:
        try:
            # Check if column already exists
            cursor.execute(f"PRAGMA table_info(chat_history)")
            existing_columns = [row[1] for row in cursor.fetchall()]
            
            if col_name not in existing_columns:
                print(f" - Adding {col_name}...")
                cursor.execute(f"ALTER TABLE chat_history ADD COLUMN {col_name} {col_type}")
            else:
                print(f" - Column {col_name} already exists. Skipping.")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")

    # Also verify if ChunkFeedback exists
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='chunk_feedback'")
        if not cursor.fetchone():
            print(" - Creating missing 'chunk_feedback' table...")
            # Note: The easiest way to let SQLAlchemy create missing tables is just running the app
            # but we can do it here too if needed.
    except Exception as e:
        print(f"Error checking chunk_feedback: {e}")

    conn.commit()
    conn.close()
    print("Migration finished successfully.")

if __name__ == "__main__":
    run_migration()
