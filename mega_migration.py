import sqlite3
import pandas as pd
from sqlalchemy import create_engine
import urllib.parse # Required to handle special characters in passwords

# --- CONFIGURATION ---
SQLITE_DB = 'backend/tender_data.db'

# 1. Encode the password to handle the '@' symbol
raw_password = "Utsavgm@506"
safe_password = urllib.parse.quote_plus(raw_password)

# 2. Build the URL using the safe password
POSTGRES_URL = f"postgresql://postgres:{safe_password}@localhost:5432/tender_system"

def migrate_everything():
    print("🚀 Initializing Mega Migration...")
    
    try:
        # Connect to both worlds
        sqlite_conn = sqlite3.connect(SQLITE_DB)
        pg_engine = create_engine(POSTGRES_URL)
        
        # Get list of all tables
        cursor = sqlite_conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [t[0] for t in cursor.fetchall()]
        
        print(f"📦 Found {len(tables)} tables to migrate: {', '.join(tables)}")

        for table in tables:
            print(f"⏳ Moving table: {table}...")
            
            # Read SQLite table
            df = pd.read_sql(f"SELECT * FROM {table}", sqlite_conn)
            
            # Data Type Cleanup for Postgres
            date_cols = [col for col in df.columns if 'date' in col or 'time' in col]
            for col in date_cols:
                df[col] = pd.to_datetime(df[col], errors='coerce')

            # Push to Postgres
            df.to_sql(table, pg_engine, if_exists='replace', index=False)
            print(f"✅ Table '{table}' migrated ({len(df)} rows).")

        sqlite_conn.close()
        print("\n✨ ALL DATA SUCCESSFULLY TRANSFERRED TO POSTGRESQL ✨")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate_everything()