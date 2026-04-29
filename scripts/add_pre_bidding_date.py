import sqlite3
import os

def update_database_schema():
    # Path to your database
    db_path = os.path.join('backend', 'tender_data.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Error: Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Define the columns you want to add
    new_columns = [
        "pre_bid_time TEXT",
        "mode_of_conduct TEXT",
        "platform_or_address TEXT"
    ]

    print("🚀 Starting database update...")

    for col_definition in new_columns:
        try:
            cursor.execute(f"ALTER TABLE tenders ADD COLUMN {col_definition}")
            print(f"✅ Added column: {col_definition}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"⚠️ Column already exists: {col_definition.split(' ')[0]}. Skipping.")
            else:
                print(f"❌ An error occurred while adding {col_definition}: {e}")

    conn.commit()
    conn.close()
    print("🎉 Database update complete.")

if __name__ == "__main__":
    update_database_schema()