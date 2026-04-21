import sqlite3
import pandas as pd
import os

def initialize_database():
    db_path = os.path.join('backend', 'tender_data.db')
    excel_path = os.path.join('backend', 'knowledge_base', 'Cleaned_Tender_Data.xlsx')

    if not os.path.exists(excel_path):
        print("Error: Cleaned_Tender_Data.xlsx not found. Please run your cleaner script first.")
        return

    # 1. Load Excel to see the EXACT column names
    df = pd.read_excel(excel_path)
    
    # 2. Connect and create table
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Drop existing table if it exists
    cursor.execute("DROP TABLE IF EXISTS tenders")

    # 3. Build the CREATE TABLE string dynamically using your actual Excel headers
    # We wrap names in [] to handle spaces or dots in column names (e.g., [Tender No.])
    columns_def = ", ".join([f"[{col}] TEXT" for col in df.columns])
    
    cursor.execute(f"CREATE TABLE tenders ({columns_def})")
    
    conn.commit()
    conn.close()
    print(f"Database initialized with columns: {list(df.columns)}")

if __name__ == "__main__":
    initialize_database()