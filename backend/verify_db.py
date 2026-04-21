import sqlite3
import os

# Connect to the exact same database as your main.py
db_path = os.path.join(os.getcwd(), 'backend', 'tender_data.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get all rows
cur.execute("SELECT * FROM tenders")
data = cur.fetchall()

# Get column names
cur.execute("PRAGMA table_info(tenders)")
columns = [col[1] for col in cur.fetchall()]

print(f"COLUMNS IN DATABASE: {columns}")
print(f"NUMBER OF ROWS FOUND: {len(data)}")
print(f"FIRST ROW DATA: {data[0] if data else 'NO DATA'}")

conn.close()