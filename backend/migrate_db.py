import sqlite3
import os

def migrate_db():
    # 1. Locate the existing database
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'tender_data.db')
    
    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    
    try:
        # 2. Create the Chat Sessions Table (For the Sidebar)
        print("Creating 'chat_sessions' table...")
        conn.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            session_id TEXT PRIMARY KEY,
            title TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 3. Create the Chat Messages Table (For the actual dialogue)
        print("Creating 'chat_messages' table...")
        conn.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT, -- 'user' or 'ai'
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (session_id) ON DELETE CASCADE
        )
        """)
        
        conn.commit()
        print("✅ Database successfully migrated! Chat History tables are ready.")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()