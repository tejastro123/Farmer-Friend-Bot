import sqlite3
import os

DB_PATH = "krishimitra.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Checking for session_id column in chat_history...")
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(chat_history)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "session_id" not in columns:
            print("Adding session_id column to chat_history...")
            cursor.execute("ALTER TABLE chat_history ADD COLUMN session_id INTEGER REFERENCES chat_sessions(id)")
            conn.commit()
            print("Column added successfully.")
        else:
            print("session_id column already exists.")

        # Data Migration: Group orphaned messages
        print("Migrating orphaned messages to Legacy sessions...")
        
        # Get users with orphaned messages
        cursor.execute("SELECT DISTINCT user_id FROM chat_history WHERE session_id IS NULL AND user_id IS NOT NULL")
        user_ids = [row[0] for row in cursor.fetchall()]

        for uid in user_ids:
            # Create a legacy session
            print(f"Creating legacy session for User {uid}...")
            cursor.execute(
                "INSERT INTO chat_sessions (user_id, title, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                (uid, "Legacy Consultation History")
            )
            session_id = cursor.lastrowid
            
            # Update history
            cursor.execute(
                "UPDATE chat_history SET session_id = ? WHERE user_id = ? AND session_id IS NULL",
                (session_id, uid)
            )
            print(f"Updated messages for User {uid} with Session ID {session_id}.")

        conn.commit()
        print("Migration complete!")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
