import pandas as pd
import sqlite3
import os

# --- CONFIGURATION ---
EXCEL_FILE = "Master_Tender_Cleaned_2018_2024.xlsx"
DB_PATH = os.path.join("backend", "tender_data.db")

def update_sqlite_deduplicated():
    print(f"🔄 Starting De-duplicated Sync to: {DB_PATH}")
    
    if not os.path.exists(EXCEL_FILE):
        print(f"❌ Error: {EXCEL_FILE} not found!")
        return

    try:
        # 1. Load the cleaned Excel
        df_excel = pd.read_excel(EXCEL_FILE)
        df_excel['tender_no'] = df_excel['tender_no'].astype(str).str.strip().str.upper()

        # 2. Connect to SQLite
        conn = sqlite3.connect(DB_PATH)
        
        # 3. Get the ACTUAL columns existing in your DB table
        try:
            db_columns_info = conn.execute("PRAGMA table_info(tenders)").fetchall()
            db_columns = [info[1] for info in db_columns_info] # List of column names in DB
            
            # Load existing tender_nos for deduplication
            df_existing = pd.read_sql("SELECT tender_no FROM tenders", conn)
            existing_nos = set(df_existing['tender_no'].tolist())
            print(f"ℹ️ Found {len(existing_nos)} existing tenders in Database.")
        except Exception as e:
            print(f"⚠️ Could not read existing table: {e}")
            conn.close()
            return

        # 4. FILTER: Only keep NEW records
        df_new_records = df_excel[~df_excel['tender_no'].isin(existing_nos)].copy()
        
        # 5. COLUMN MATCHING: Only keep columns that exist in the DB
        # This prevents the "Execution Failed" error caused by extra analytics columns
        cols_to_keep = [col for col in df_new_records.columns if col in db_columns]
        df_new_records = df_new_records[cols_to_keep]

        print(f"📊 Excel has {len(df_excel)} total records.")
        print(f"✨ Found {len(df_new_records)} NEW historical records to add.")
        print(f"🚫 Skipped {len(df_excel) - len(df_new_records)} records already in DB.")

        # 6. APPEND only the new records
        if not df_new_records.empty:
            df_new_records.to_sql('tenders', conn, if_exists='append', index=False)
            print(f"✅ Success! {len(df_new_records)} records added to SQLite.")
        else:
            print("✅ Database is already up to date.")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Failed to update SQLite: {e}")

if __name__ == "__main__":
    update_sqlite_deduplicated()