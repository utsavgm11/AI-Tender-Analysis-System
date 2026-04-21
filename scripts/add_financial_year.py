import sqlite3
import os

def add_financial_year():
    # Path to your database
    db_path = os.path.join('backend', 'tender_data.db')
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Add the new column to the 'tenders' table
        cursor.execute("ALTER TABLE tenders ADD COLUMN financial_year TEXT")
        print("Column 'financial_year' added successfully.")
        
        # 2. Update all existing records to '2023-2024'
        cursor.execute("UPDATE tenders SET financial_year = '2023-2024'")
        conn.commit()
        print("All existing records updated to '2023-2024'.")
        
    except sqlite3.OperationalError as e:
        # This catches errors if the column was already added previously
        if "duplicate column name" in str(e).lower():
            print("Column 'financial_year' already exists. Skipping add step.")
        else:
            print(f"An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_financial_year()