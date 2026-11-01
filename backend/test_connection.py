from db_config import get_connection

def test_db():
    print("Testing connection to Oracle FREEPDB1...")
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT USER, SYS_CONTEXT('USERENV', 'CON_NAME') FROM DUAL")
                user, container = cursor.fetchone()
                print(f"[SUCCESS] Connected as user: {user} in container: {container}")
                
                cursor.execute("SELECT COUNT(*) FROM AUDIT_LOG")
                count = cursor.fetchone()[0]
                print(f"[SUCCESS] Total blocks in AUDIT_LOG: {count}")
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")

if __name__ == "__main__":
    test_db()