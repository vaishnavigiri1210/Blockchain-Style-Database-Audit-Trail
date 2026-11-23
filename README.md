<div align="center">

# Blockchain-Style Tamper-Evident Audit Trail Using Database Triggers

**Cryptographic Hash-Chaining & Real-Time Tamper Attribution inside Oracle PL/SQL**

![Oracle DB](https://img.shields.io/badge/Oracle_Database-21c_%2F_23ai-F80000?style=for-the-badge&logo=oracle&logoColor=white)
![PL/SQL](https://img.shields.io/badge/PL%2FSQL-DBMS__CRYPTO_SHA--256-CC2927?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-REST_API-000000?style=for-the-badge&logo=flask&logoColor=white)

</div>

---

## Overview

Traditional database audit logs can be silently altered or deleted by privileged insiders or compromised application accounts without leaving cryptographic proof. 

This project embeds **blockchain-style cryptographic hash chaining** directly inside **Oracle PL/SQL triggers**, removing the overhead of external distributed ledgers. Every `INSERT`, `UPDATE`, and `DELETE` operation on `STUDENT_RECORDS` is intercepted at the database kernel level, sealed with a **SHA-256** digest via `SYS.DBMS_CRYPTO`, and linked sequentially to the previous block (`PREV_HASH` $\rightarrow$ `RECORD_HASH`).

---

## System Architecture & Cryptographic Flow

```text
  [ Admin / Student UI ] 
           │
           ▼  (HTTP / REST API)
  [ Flask Backend (app.py) ]
           │
           ▼  (DML: INSERT / UPDATE / DELETE on STUDENT_RECORDS)
┌──────────────────────────────────────────────────────────────────────┐
│  ORACLE DATABASE ENGINE                                              │
│                                                                      │
│  1. BEFORE DML Trigger (TRG_STUDENT_RECORDS_AUDIT)                   │
│     ├─ Locks AUDIT_METADATA (SELECT ... FOR UPDATE) for concurrency  │
│     ├─ Fetches LAST_HASH (Genesis: 0000...0000)                      │
│     └─ Computes RECORD_HASH = SHA256(ID | OP | PAYLOAD | PREV_HASH)  │
│                                                                      │
│  2. Append-Only Ledger (AUDIT_LOG)                                   │
│     └─ Stores immutable block history (OLD_DATA → NEW_DATA)          │
│                                                                      │
│  3. Verification Engine (VERIFY_AUDIT_CHAIN Procedure)               │
│     └─ Traverses Block #1 → N, recomputes hashes & flags tampering   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

| Feature | Technical Implementation |
| :--- | :--- |
| **In-Database SHA-256 Chaining** | `TRG_STUDENT_RECORDS_AUDIT` uses `SYS.DBMS_CRYPTO.HASH` (`HASH_SH256`) to seal every record change before commit. |
| **Concurrency Serialization** | Single-row anchor locking on `AUDIT_METADATA` (`FOR UPDATE`) prevents race conditions and forked chain blocks. |
| **Deterministic Chain Verification** | Stored procedure `VERIFY_AUDIT_CHAIN` validates every block from Genesis (`0000...0000`), pinpointing `TAMPERED_RECORD` or `BROKEN_LINK` errors. |
| **Role-Based Access & Attribution** | **Admin** performs authorized DML operations (valid green chain). **Students** can Sign Up, Sign In, or Reset Password; any unauthorized edit/delete breaks the SHA-256 chain and exposes the exact actor and block ID. |

---

## Project Structure

```text
Blockchain-Style-Tamper-Evident-Audit-Trail/
├── backend/
│   ├── app.py                        # Flask REST API, session auth & tamper attribution
│   ├── db_config.py                  # Oracle DB connection credentials & pool config
│   └── test_connection.py            # Standalone Oracle connectivity check
├── database/
│   ├── schema/
│   │   ├── 01_setup_user.sql         # Creates SECURE_AUDIT_ADMIN & grants DBMS_CRYPTO
│   │   ├── 02_schema_design.sql      # Creates STUDENT_RECORDS, AUDIT_LOG, AUDIT_METADATA & SEQ
│   │   └── 07_users_setup.sql        # Creates SYSTEM_USERS for Admin & Student accounts
│   ├── triggers/
│   │   └── 03_audit_trigger.sql      # PL/SQL trigger implementing SHA-256 hash chaining
│   ├── procedures/
│   │   └── 05_verify_integrity.sql   # PL/SQL chain traversal & verification procedure
│   └── tests/
│       ├── 04_test_hash_chain.sql    # SQL test cases for valid block generation
│       └── 06_test_verification.sql  # SQL test cases for tamper detection
├── frontend/
│   ├── css/
│   │   └── style.css                 # Responsive dashboard & integrity alert styling
│   ├── js/
│   │   └── main.js                   # Auth flows, CRUD handlers & live verification UI
│   └── index.html                    # Unified Admin & Student workspace
├── requirements.txt
└── README.md
```

---

## Setup & Installation

### Step 1: Initialize Oracle Database Objects
Execute the SQL scripts in sequential order using SQL Developer, VS Code Oracle Extension, or `sqlplus`:

1. **As `SYS` / `SYSTEM`:**
   ```sql
   @database/schema/01_setup_user.sql
   ```
2. **As `SECURE_AUDIT_ADMIN`:**
   ```sql
   @database/schema/02_schema_design.sql
   @database/triggers/03_audit_trigger.sql
   @database/procedures/05_verify_integrity.sql
   @database/schema/07_users_setup.sql
   ```

### Step 2: Configure & Run the Flask Backend
Create a Python virtual environment, install dependencies, and start the server:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python backend/app.py
```

> **Note:** Update your Oracle username, password, and DSN inside `backend/db_config.py` before starting the server.

### Step 3: Launch the Web Interface
Open your browser and visit:
```text
[http://127.0.0.1:5000](http://127.0.0.1:5000)
```

---

## Demonstration Workflow

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| **1. Admin Login** | Sign in with `admin@vit.edu` / `admin123` and insert or update a student record. | PL/SQL trigger appends a new SHA-256 block. Banner displays **`CHAIN INTEGRITY VALID (100% Intact)`**. |
| **2. Student Sign Up** | Sign out, register a new student via **Sign Up**, and sign in with the new credentials. | Student account is created in `SYSTEM_USERS` and synced to `STUDENT_RECORDS`. |
| **3. Tamper Simulation** | As a Student, click **Edit** or **Delete** on any record in the table. | Unauthorized modification corrupts the block hash, triggering a red **`TAMPER DETECTED`** alert showing the exact block, target student, and attacker identity. |
| **4. Chain Recovery** | Sign back in as **Admin** and click **Reset / Clean Chain**. | Reinitializes `AUDIT_LOG` back to the clean Genesis anchor (`0000...0000`). |