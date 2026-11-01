import oracledb
import os

# Connection parameters for Oracle Database (Thin Mode)
DB_USER = os.getenv("DB_USER", "SECURE_AUDIT_ADMIN")
DB_PASSWORD = os.getenv("DB_PASSWORD", "AuditSecure#2026")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 1521))
DB_SERVICE = os.getenv("DB_SERVICE", "FREEPDB1")

def get_connection():
    """
    Establishes connection to Oracle Database in Thin Mode.
    No Oracle Client binaries or Instant Client packages required.
    """
    return oracledb.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        service_name=DB_SERVICE
    )