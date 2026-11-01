-- ====================================================================
-- Script: 06_test_verification.sql
-- Description: Runs integrity verification on clean and tampered states
-- Execute As: SECURE_AUDIT_ADMIN
-- ====================================================================

SET SERVEROUTPUT ON;

-- 1. Test clean chain verification
DECLARE
    v_status    VARCHAR2(50);
    v_broken_id NUMBER;
    v_msg       VARCHAR2(4000);
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- SCENARIO 1: VERIFYING CLEAN CHAIN ---');
    VERIFY_AUDIT_CHAIN(v_status, v_broken_id, v_msg);
    DBMS_OUTPUT.PUT_LINE('Status   : ' || v_status);
    DBMS_OUTPUT.PUT_LINE('Broken ID: ' || NVL(TO_CHAR(v_broken_id), 'None'));
    DBMS_OUTPUT.PUT_LINE('Message  : ' || v_msg);
END;
/

-- 2. Simulate an attacker modifying historical data directly in AUDIT_LOG
-- An attacker attempts to cover their tracks by changing row 1's old fee status to 'PAID'
UPDATE AUDIT_LOG
SET NEW_DATA = REPLACE(NEW_DATA, 'FEE_STATUS=PENDING', 'FEE_STATUS=PAID')
WHERE AUDIT_ID = 1;

COMMIT;

-- 3. Test tamper detection after unauthorized modification
DECLARE
    v_status    VARCHAR2(50);
    v_broken_id NUMBER;
    v_msg       VARCHAR2(4000);
BEGIN
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('--- SCENARIO 2: VERIFYING TAMPERED CHAIN ---');
    VERIFY_AUDIT_CHAIN(v_status, v_broken_id, v_msg);
    DBMS_OUTPUT.PUT_LINE('Status   : ' || v_status);
    DBMS_OUTPUT.PUT_LINE('Broken ID: ' || NVL(TO_CHAR(v_broken_id), 'None'));
    DBMS_OUTPUT.PUT_LINE('Message  : ' || v_msg);
END;
/