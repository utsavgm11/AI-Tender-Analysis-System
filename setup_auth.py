import psycopg2
from passlib.context import CryptContext
import urllib.parse

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Encode password for the connection string to handle the '@' symbol
raw_password = "Utsavgm@506"
safe_password = urllib.parse.quote_plus(raw_password)
POSTGRES_URL = f"postgresql://postgres:{safe_password}@localhost:5432/tender_system"

def setup_users():
    print("🔄 Initializing Aarvi Encon User Authentication System...")
    conn = psycopg2.connect(POSTGRES_URL)
    cur = conn.cursor()
    
    try:
        # 1. Drop old table to switch from 'username' to 'email'
        cur.execute("DROP TABLE IF EXISTS users")
        
        # 2. Create the new Enterprise User Table
        cur.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'project_manager'))
            )
        """)
        
        # 3. Create your Master Admin Account
        # Using your specific company email and requested password
        admin_email = "utsavm@aarviencon.com"
        admin_pass = "Admin@2026"
        admin_hash = pwd_context.hash(admin_pass)
        
        cur.execute("""
            INSERT INTO users (email, password_hash, role) 
            VALUES (%s, %s, %s)
        """, (admin_email, admin_hash, "admin"))

        # 4. Create a Sample Project Manager for testing
        pm_email = "pm@aarviencon.com"
        pm_pass = "PM@aarvi"
        pm_hash = pwd_context.hash(pm_pass)
        
        cur.execute("""
            INSERT INTO users (email, password_hash, role) 
            VALUES (%s, %s, %s)
        """, (pm_email, pm_hash, "project_manager"))

        conn.commit()
        print("---")
        print("✅ DATABASE SYNC COMPLETE")
        print(f"📧 Admin User: {admin_email}")
        print(f"📧 PM User: {pm_email}")
        print("🛡️ Security Policy: Signups restricted to @aarviencon.com domain.")
        print("---")

    except Exception as e:
        print(f"❌ Setup Failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    setup_users()