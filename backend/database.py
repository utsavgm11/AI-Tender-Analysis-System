import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    # This looks for the 'DATABASE_URL' you set in the Vercel Dashboard
    connection_string = os.environ.get('DATABASE_URL')
    
    if not connection_string:
        raise ValueError("DATABASE_URL not found in environment variables!")

    # Connect to Neon Postgres
    # RealDictCursor makes the rows behave like dictionaries (same as sqlite3.Row)
    conn = psycopg2.connect(
        connection_string, 
        cursor_factory=RealDictCursor
    )
    return conn