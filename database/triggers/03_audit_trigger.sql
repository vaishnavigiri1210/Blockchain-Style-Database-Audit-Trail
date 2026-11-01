-- ====================================================================
-- Script: 03_audit_trigger.sql
-- Description: BEFORE row-level trigger that intercepts INSERT, UPDATE, and DELETE
--              computes SHA-256 hash chains, and appends to the immutable ledger
-- Execute As: SECURE_AUDIT_ADMIN
-- ====================================================================

CREATE OR REPLACE TRIGGER TRG_STUDENT_RECORDS_AUDIT
BEFORE INSERT OR UPDATE OR DELETE ON STUDENT_RECORDS
FOR EACH ROW
DECLARE
    v_audit_id       NUMBER(12);
    v_op_type        VARCHAR2(10);
    v_record_pk      VARCHAR2(100);
    v_old_data       CLOB := '';
    v_new_data       CLOB := '';
    v_prev_hash      VARCHAR2(64);
    v_payload        CLOB := '';
    v_record_hash    VARCHAR2(64);
    v_changed_by     VARCHAR2(100);
    v_epoch          NUMBER(18);
    v_display_time   VARCHAR2(30);
    v_now            TIMESTAMP;
BEGIN
    -- 1. Identify DML Operation
    IF INSERTING THEN
        v_op_type   := 'INSERT';
        v_record_pk := TO_CHAR(:NEW.STUDENT_ID);
    ELSIF UPDATING THEN
        v_op_type   := 'UPDATE';
        v_record_pk := TO_CHAR(:NEW.STUDENT_ID);
    ELSIF DELETING THEN
        v_op_type   := 'DELETE';
        v_record_pk := TO_CHAR(:OLD.STUDENT_ID);
    END IF;

    -- 2. Construct canonical representation for OLD values
    IF UPDATING OR DELETING THEN
        v_old_data := 'ID=' || TO_CHAR(:OLD.STUDENT_ID) || ';'
                   || 'FN=' || NVL(:OLD.FIRST_NAME, '<NULL>') || ';'
                   || 'LN=' || NVL(:OLD.LAST_NAME, '<NULL>') || ';'
                   || 'EM=' || NVL(:OLD.EMAIL, '<NULL>') || ';'
                   || 'DP=' || NVL(:OLD.DEPARTMENT, '<NULL>') || ';'
                   || 'CG=' || TRIM(TO_CHAR(:OLD.CGPA, '990.00')) || ';'
                   || 'FS=' || NVL(:OLD.FEE_STATUS, '<NULL>');
    ELSE
        v_old_data := '<EMPTY>';
    END IF;

    -- 3. Construct canonical representation for NEW values
    IF INSERTING OR UPDATING THEN
        v_new_data := 'ID=' || TO_CHAR(:NEW.STUDENT_ID) || ';'
                   || 'FN=' || NVL(:NEW.FIRST_NAME, '<NULL>') || ';'
                   || 'LN=' || NVL(:NEW.LAST_NAME, '<NULL>') || ';'
                   || 'EM=' || NVL(:NEW.EMAIL, '<NULL>') || ';'
                   || 'DP=' || NVL(:NEW.DEPARTMENT, '<NULL>') || ';'
                   || 'CG=' || TRIM(TO_CHAR(:NEW.CGPA, '990.00')) || ';'
                   || 'FS=' || NVL(:NEW.FEE_STATUS, '<NULL>');
    ELSE
        v_new_data := '<EMPTY>';
    END IF;

    -- 4. Session attributes and deterministic epoch timing
    v_changed_by   := NVL(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER);
    v_now          := SYSTIMESTAMP;
    v_epoch        := ROUND((CAST(v_now AS DATE) - DATE '1970-01-01') * 86400000);
    v_display_time := TO_CHAR(v_now, 'YYYY-MM-DD HH24:MI:SS');

    -- 5. Row-level lock on metadata to serialize blockchain writes and prevent chain forks
    SELECT LAST_HASH INTO v_prev_hash
    FROM AUDIT_METADATA
    WHERE CHAIN_ID = 1
    FOR UPDATE;

    v_audit_id := AUDIT_LOG_SEQ.NEXTVAL;

    -- 6. Construct exact canonical cryptographic payload
    v_payload := 'ID='    || TO_CHAR(v_audit_id) || '|'
              || 'TBL=STUDENT_RECORDS|'
              || 'OP='    || v_op_type || '|'
              || 'PK='    || v_record_pk || '|'
              || 'OLD='   || v_old_data || '|'
              || 'NEW='   || v_new_data || '|'
              || 'USR='   || v_changed_by || '|'
              || 'EPOCH=' || TO_CHAR(v_epoch) || '|'
              || 'PREV='  || v_prev_hash;

    -- 7. Compute cryptographic SHA-256 hash using native Oracle DBMS_CRYPTO
    v_record_hash := LOWER(
        RAWTOHEX(
            SYS.DBMS_CRYPTO.HASH(
                SRC => UTL_I18N.STRING_TO_RAW(v_payload, 'AL32UTF8'),
                TYP => SYS.DBMS_CRYPTO.HASH_SH256
            )
        )
    );

    -- 8. Persist audit block into the ledger
    INSERT INTO AUDIT_LOG (
        AUDIT_ID, TABLE_NAME, OPERATION_TYPE, RECORD_PK,
        OLD_DATA, NEW_DATA, CHANGED_BY, CHANGED_EPOCH, CHANGED_AT,
        PREV_HASH, RECORD_HASH
    ) VALUES (
        v_audit_id, 'STUDENT_RECORDS', v_op_type, v_record_pk,
        v_old_data, v_new_data, v_changed_by, v_epoch, v_display_time,
        v_prev_hash, v_record_hash
    );

    -- 9. Advance chain anchor
    UPDATE AUDIT_METADATA
    SET LAST_AUDIT_ID    = v_audit_id,
        LAST_HASH        = v_record_hash,
        CHAIN_UPDATED_AT = v_now
    WHERE CHAIN_ID = 1;
END;
/