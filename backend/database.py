import sqlite3
import os

def get_db_connection():
    # Get the directory where database.py actually lives
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Connect directly to the db in that same folder
    db_path = os.path.join(base_dir, 'tender_data.db')
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row 
    return conn