import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.parse

# --- 1. LOCAL LAPTOP SETTINGS ---
raw_password = "Utsavgm@506"
safe_password = urllib.parse.quote_plus(raw_password)
LOCAL_URL = f"postgresql://postgres:{safe_password}@localhost:5432/tender_system"

# --- 2. NEON CLOUD SETTINGS ---
# Replace this with your actual Neon URL
NEON_URL = "postgresql://neondb_owner:npg_djW0Dm5HAPOa@ep-twilight-block-apopzllz-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"

def migrate_users():
    print("🚀 Connecting to Local and Cloud Databases...")
    
    try:
        # Connect to Local
        local_conn = psycopg2.connect(LOCAL_URL)
        local_cur = local_conn.cursor(cursor_factory=RealDictCursor)
        
        # Connect to Neon
        neon_conn = psycopg2.connect(NEON_URL)
        neon_cur = neon_conn.cursor()

        # Step A: Ensure table exists in Neon
        print("⏳ Setting up User table structure in Neon...")
        neon_cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'project_manager'))
            )
        """)

        # Step B: Get users from Local Laptop
        print("⏳ Fetching users from your laptop...")
        local_cur.execute("SELECT email, password_hash, role FROM users")
        users = local_cur.fetchall()

        # Step C: Upload to Neon
        print(f"☁️ Uploading {len(users)} users to Neon Cloud...")
        for user in users:
            neon_cur.execute("""
                INSERT INTO users (email, password_hash, role) 
                VALUES (%s, %s, %s)
                ON CONFLICT (email) DO NOTHING
            """, (user['email'], user['password_hash'], user['role']))

        neon_conn.commit()
        print("\n✨ SUCCESS! Your Admin and PM users are now live in the cloud.")
        print(f"👉 You can now log in at your Vercel link using {users[0]['email']}")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
    finally:
        if 'local_conn' in locals(): local_conn.close()
        if 'neon_conn' in locals(): neon_conn.close()

if __name__ == "__main__":
    migrate_users()