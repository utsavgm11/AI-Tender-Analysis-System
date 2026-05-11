import sqlite3
import pandas as pd
from sqlalchemy import create_engine
import os

# --- CONFIGURATION ---
SQLITE_DB = 'backend/tender_data.db'

# YOUR NEON URL (Cloud)
POSTGRES_URL = "postgresql://neondb_owner:npg_djW0Dm5HAPOa@ep-twilight-block-apopzllz-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"

def migrate_everything():
    print("🚀 Initializing Mega Migration to Neon Cloud...")
    
    try:
        # 1. Connect to Local SQLite and Cloud Neon
        sqlite_conn = sqlite3.connect(SQLITE_DB)
        pg_engine = create_engine(POSTGRES_URL)
        
        # 2. Get list of all tables in the SQLite file
        cursor = sqlite_conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [t[0] for t in cursor.fetchall()]
        
        print(f"📦 Found {len(tables)} tables in SQLite: {', '.join(tables)}")

        # 3. Migrate tables found in SQLite
        for table in tables:
            print(f"⏳ Moving table: {table}...")
            df = pd.read_sql(f"SELECT * FROM {table}", sqlite_conn)
            
            # Data Type Cleanup
            date_cols = [col for col in df.columns if 'date' in col or 'time' in col]
            for col in date_cols:
                df[col] = pd.to_datetime(df[col], errors='coerce')

            # Push to Neon (replace means it overwrites with the latest data)
            df.to_sql(table, pg_engine, if_exists='replace', index=False)
            print(f"✅ Table '{table}' migrated ({len(df)} rows).")

        # 4. CRITICAL: If 'users' was NOT in SQLite, we must create it in Neon anyway
        if 'users' not in tables:
            print("⚠️ 'users' table not found in SQLite. Creating empty table in Neon...")
            with pg_engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        role VARCHAR(50) DEFAULT 'project_manager',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.commit()
            print("✅ 'users' table structure ensured in Neon.")

        sqlite_conn.close()
        print("\n✨ ALL DATA SUCCESSFULLY TRANSFERRED TO NEON CLOUD ✨")
        print("👉 Next: Go to your website and 'Sign Up' to create your admin account!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate_everything()