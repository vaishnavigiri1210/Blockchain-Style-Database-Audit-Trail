-- ====================================================================
-- Script: 01_setup_user.sql
-- Description: Creates the administrative schema user and grants crypto privileges
-- Execute As: SYSDBA on container FREEPDB1
-- ====================================================================

ALTER SESSION SET CONTAINER = FREEPDB1;

-- Drop existing user if required
BEGIN
    EXECUTE IMMEDIATE 'DROP USER SECURE_AUDIT_ADMIN CASCADE';
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- Create secure admin user
CREATE USER SECURE_AUDIT_ADMIN IDENTIFIED BY "AuditSecure#2026"
    DEFAULT TABLESPACE USERS
    TEMPORARY TABLESPACE TEMP
    QUOTA UNLIMITED ON USERS;

-- Grant required execution and system privileges
GRANT CREATE SESSION TO SECURE_AUDIT_ADMIN;
GRANT CREATE TABLE TO SECURE_AUDIT_ADMIN;
GRANT CREATE TRIGGER TO SECURE_AUDIT_ADMIN;
GRANT CREATE PROCEDURE TO SECURE_AUDIT_ADMIN;
GRANT CREATE SEQUENCE TO SECURE_AUDIT_ADMIN;

-- Essential: DBMS_CRYPTO for cryptographic SHA-256 computation
GRANT EXECUTE ON SYS.DBMS_CRYPTO TO SECURE_AUDIT_ADMIN;

COMMIT;