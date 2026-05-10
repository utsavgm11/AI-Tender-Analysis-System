import sqlite3
import os

def update_financial_years():
    # Path to your database (adjust if script is inside 'scripts' folder)
    db_path = os.path.join('backend', 'tender_data.db')
    
    if not os.path.exists(db_path):
        # Fallback if running from root
        db_path = 'backend/tender_data.db'
        if not os.path.exists(db_path):
            print(f"❌ Error: Database not found at {db_path}")
            return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Ensure the column exists (your previous logic)
        try:
            cursor.execute("ALTER TABLE tenders ADD COLUMN financial_year TEXT")
            print("✅ Column 'financial_year' created.")
        except sqlite3.OperationalError:
            print("ℹ️ Column 'financial_year' already exists.")

        # 2. Fetch all tenders to calculate their specific FY
        cursor.execute("SELECT tender_no, received_date FROM tenders")
        rows = cursor.fetchall()
        
        print(f"🔄 Processing {len(rows)} records...")
        update_count = 0

        for tender_no, received_date in rows:
            if not received_date:
                continue
            
            try:
                # Logic: If month is April(4) or later, FY is Year to Year+1
                # If month is Jan-March, FY is Year-1 to Year
                # Expected date format: YYYY-MM-DD
                year = int(received_date[:4])
                month = int(received_date[5:7])

                if month >= 4:
                    fy = f"{year}-{year+1}"
                else:
                    fy = f"{year-1}-{year}"

                cursor.execute(
                    "UPDATE tenders SET financial_year = ? WHERE tender_no = ?", 
                    (fy, tender_no)
                )
                update_count += 1
            except Exception as e:
                print(f"⚠️ Skipping {tender_no} due to date format: {received_date}")

        conn.commit()
        print(f"🎯 Success! {update_count} tenders assigned to their correct Financial Years.")
        
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_financial_years()