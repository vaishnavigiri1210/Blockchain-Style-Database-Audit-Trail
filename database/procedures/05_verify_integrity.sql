-- ====================================================================
-- Script: 05_verify_integrity.sql
-- Description: Stored procedure that traverses the SHA-256 chain, validates continuity,
--              recomputes all hashes from raw data, and flags any broken or tampered blocks
-- Execute As: SECURE_AUDIT_ADMIN
-- ====================================================================

CREATE OR REPLACE PROCEDURE VERIFY_AUDIT_CHAIN (
    p_status     OUT VARCHAR2,
    p_broken_id  OUT NUMBER,
    p_error_msg  OUT VARCHAR2
) AS
    v_expected_prev_hash VARCHAR2(64) := '0000000000000000000000000000000000000000000000000000000000000000';
    v_recalculated_hash  VARCHAR2(64);
    v_payload            CLOB;
    v_count              NUMBER := 0;
BEGIN
    p_status    := 'VALID';
    p_broken_id := NULL;
    p_error_msg := 'Chain integrity verified. No tampering detected.';

    FOR r IN (
        SELECT AUDIT_ID, TABLE_NAME, OPERATION_TYPE, RECORD_PK,
               OLD_DATA, NEW_DATA, CHANGED_BY, CHANGED_EPOCH,
               PREV_HASH, RECORD_HASH
        FROM AUDIT_LOG
        ORDER BY AUDIT_ID ASC
    ) LOOP
        v_count := v_count + 1;

        -- 1. Validate hash chain link continuity (PREV_HASH match)
        IF r.PREV_HASH <> v_expected_prev_hash THEN
            p_status    := 'BROKEN_LINK';
            p_broken_id := r.AUDIT_ID;
            p_error_msg := 'Chain link broken at Block #' || TO_CHAR(r.AUDIT_ID) || 
                           '. Expected PREV_HASH ' || v_expected_prev_hash || 
                           ' but found ' || r.PREV_HASH;
            RETURN;
        END IF;

        -- 2. Deterministically reconstruct canonical payload
        v_payload := 'ID='    || TO_CHAR(r.AUDIT_ID) || '|'
                  || 'TBL='   || r.TABLE_NAME || '|'
                  || 'OP='    || r.OPERATION_TYPE || '|'
                  || 'PK='    || r.RECORD_PK || '|'
                  || 'OLD='   || r.OLD_DATA || '|'
                  || 'NEW='   || r.NEW_DATA || '|'
                  || 'USR='   || r.CHANGED_BY || '|'
                  || 'EPOCH=' || TO_CHAR(r.CHANGED_EPOCH) || '|'
                  || 'PREV='  || r.PREV_HASH;

        -- 3. Recompute SHA-256 hash using native cryptographic engine
        v_recalculated_hash := LOWER(
            RAWTOHEX(
                SYS.DBMS_CRYPTO.HASH(
                    SRC => UTL_I18N.STRING_TO_RAW(v_payload, 'AL32UTF8'),
                    TYP => SYS.DBMS_CRYPTO.HASH_SH256
                )
            )
        );

        -- 4. Validate recomputed hash against stored block hash
        IF v_recalculated_hash <> r.RECORD_HASH THEN
            p_status    := 'TAMPERED_RECORD';
            p_broken_id := r.AUDIT_ID;
            p_error_msg := 'Content hash mismatch at Block #' || TO_CHAR(r.AUDIT_ID) || 
                           '. Stored hash ' || r.RECORD_HASH || 
                           ' does not match computed hash ' || v_recalculated_hash;
            RETURN;
        END IF;

        v_expected_prev_hash := r.RECORD_HASH;
    END LOOP;

    IF v_count = 0 THEN
        p_status    := 'EMPTY';
        p_error_msg := 'Audit ledger is empty. Genesis root intact.';
    END IF;
END;
/