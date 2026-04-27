import sqlite3
import os

def add_pre_bidding_date():
    # Go up one level from 'scripts' to the root, then into 'backend'
    db_path = os.path.join( 'backend', 'tender_data.db')
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Add the column
        cursor.execute("ALTER TABLE tenders ADD COLUMN pre_bidding_date TEXT")
        conn.commit()
        print("✅ Column 'pre_bidding_date' added successfully.")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("⚠️ Column 'pre_bidding_date' already exists. Skipping.")
        else:
            print(f"❌ An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_pre_bidding_date()