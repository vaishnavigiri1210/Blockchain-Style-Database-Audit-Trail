-- ====================================================================
-- Script: 02_schema_design.sql
-- Description: Core business tables, tamper-evident audit ledger, and Genesis block anchor
-- Execute As: SECURE_AUDIT_ADMIN
-- ====================================================================

-- Clean previous objects
BEGIN EXECUTE IMMEDIATE 'DROP TABLE AUDIT_LOG CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE AUDIT_METADATA CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE STUDENT_RECORDS CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE AUDIT_LOG_SEQ'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- 1. Sensitive Business Entity: Student Academic Records
CREATE TABLE STUDENT_RECORDS (
    STUDENT_ID      NUMBER(10)          PRIMARY KEY,
    FIRST_NAME      VARCHAR2(50)        NOT NULL,
    LAST_NAME       VARCHAR2(50)        NOT NULL,
    EMAIL           VARCHAR2(100)       NOT NULL UNIQUE,
    DEPARTMENT      VARCHAR2(50)        NOT NULL,
    CGPA            NUMBER(3, 2)        DEFAULT 0.00 NOT NULL,
    FEE_STATUS      VARCHAR2(20)        DEFAULT 'PENDING' NOT NULL,
    LAST_UPDATED    TIMESTAMP           DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Monotonic Sequential Counter for Audit Blocks
CREATE SEQUENCE AUDIT_LOG_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- 3. Cryptographic Tamper-Evident Blockchain Ledger
CREATE TABLE AUDIT_LOG (
    AUDIT_ID        NUMBER(12)          PRIMARY KEY,
    TABLE_NAME      VARCHAR2(30)        NOT NULL,
    OPERATION_TYPE  VARCHAR2(10)        NOT NULL,
    RECORD_PK       VARCHAR2(100)       NOT NULL,
    OLD_DATA        CLOB,
    NEW_DATA        CLOB,
    CHANGED_BY      VARCHAR2(100)       NOT NULL,
    CHANGED_EPOCH   NUMBER(18)          NOT NULL, -- Deterministic Unix Epoch ms
    CHANGED_AT      VARCHAR2(30)        NOT NULL, -- Human-readable display timestamp
    PREV_HASH       VARCHAR2(64)        NOT NULL,
    RECORD_HASH     VARCHAR2(64)        NOT NULL
);

-- 4. Single-Row Chain Anchor & Row-Level Lock Target
CREATE TABLE AUDIT_METADATA (
    CHAIN_ID        NUMBER(5)           PRIMARY KEY,
    LAST_AUDIT_ID   NUMBER(12)          NOT NULL,
    LAST_HASH       VARCHAR2(64)        NOT NULL,
    CHAIN_UPDATED_AT TIMESTAMP          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Seed Genesis Block Root Anchor (Block 0)
INSERT INTO AUDIT_METADATA (CHAIN_ID, LAST_AUDIT_ID, LAST_HASH)
VALUES (1, 0, '0000000000000000000000000000000000000000000000000000000000000000');

COMMIT;