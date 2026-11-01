-- ====================================================================
-- Script: 04_test_hash_chain.sql
-- Description: Inserts, updates, and deletes test student records
-- Execute As: SECURE_AUDIT_ADMIN
-- ====================================================================

-- 1. Insert initial student records (Mines Block #1, #2, #3)
INSERT INTO STUDENT_RECORDS (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DEPARTMENT, CGPA, FEE_STATUS)
VALUES (101, 'Vedant', 'Joshi', 'vedant@vit.edu', 'AI and DS', 9.45, 'PENDING');

INSERT INTO STUDENT_RECORDS (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DEPARTMENT, CGPA, FEE_STATUS)
VALUES (102, 'Kalyani', 'Dudhale', 'kalyani@vit.edu', 'AI and DS', 9.10, 'PAID');

INSERT INTO STUDENT_RECORDS (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DEPARTMENT, CGPA, FEE_STATUS)
VALUES (103, 'Vaishnavi', 'Giri', 'vaishnavi@vit.edu', 'AI and DS', 9.60, 'PAID');

COMMIT;

-- 2. Update a student record (Mines Block #4)
UPDATE STUDENT_RECORDS
SET CGPA = 9.75, FEE_STATUS = 'PAID'
WHERE STUDENT_ID = 101;

COMMIT;

-- 3. Delete a student record (Mines Block #5)
DELETE FROM STUDENT_RECORDS
WHERE STUDENT_ID = 102;

COMMIT;