import pandas as pd
import sqlite3
import os

def import_excel_to_db():
    # Paths
    excel_path = os.path.join('backend', 'knowledge_base', 'Cleaned_Tender_Data.xlsx')
    db_path = os.path.join('backend', 'tender_data.db')

    if not os.path.exists(excel_path):
        print(f"Error: Could not find {excel_path}. Did you run the cleaner first?")
        return

    # 1. Load the cleaned Excel file
    df = pd.read_excel(excel_path)
    
    # 2. Connect to the DB
    conn = sqlite3.connect(db_path)
    
    # 3. Import data
    # 'if_exists="append"' ensures we add these rows to the table we created in Step 1
    df.to_sql('tenders', conn, if_exists='append', index=False)
    
    conn.commit()
    conn.close()
    
    print(f"Success! {len(df)} records imported into 'tenders' table.")

if __name__ == "__main__":
    import_excel_to_db()