```markdown
# Blockchain-Style Tamper-Evident Audit Trail Using Database Triggers

A relational database security prototype that embeds **blockchain-style cryptographic hash chaining** directly inside **Oracle PL/SQL triggers**, eliminating the need for an external distributed ledger platform. Every `INSERT`, `UPDATE`, and `DELETE` operation on sensitive student records is automatically sealed into an append-only `AUDIT_LOG` table using `SYS.DBMS_CRYPTO` (SHA-256) and linked sequentially via `PREV_HASH` and `RECORD_HASH`.

---

## Key Features

- **Native In-Database Hash Chaining:** A `BEFORE INSERT OR UPDATE OR DELETE` trigger (`TRG_STUDENT_RECORDS_AUDIT`) intercepts every DML operation on `STUDENT_RECORDS` and computes a deterministic SHA-256 digest combining the canonical record payload, operation metadata, monotonic sequence ID (`AUDIT_LOG_SEQ`), and the previous block's hash (`PREV_HASH`).
- **Concurrency-Safe Block Ordering:** Uses a single-row anchor lock (`AUDIT_METADATA` with `SELECT ... FOR UPDATE`) to serialize concurrent writes and prevent forked blocks.
- **Mathematical Tamper Detection (`VERIFY_AUDIT_CHAIN`):** A stored PL/SQL verification procedure traverses the entire audit ledger from Genesis (`0000...0000`), recomputes each block's SHA-256 hash, and flags any modified payload (`TAMPERED_RECORD`) or broken link (`BROKEN_LINK`).
- **2-Role Authentication & Attribution:**
  - **System Admin (`admin@vit.edu`):** Performs authorized `INSERT`, `UPDATE`, and `DELETE` operations that maintain a valid, intact SHA-256 chain.
  - **Student Portal (Sign Up / Sign In / Forgot Password):** Newly registered students are added to `SYSTEM_USERS` and `STUDENT_RECORDS`. Any unauthorized edit or deletion attempt by a student breaks the cryptographic chain, triggering a real-time **Tamper Detected** alert with full actor and block attribution.

---

## Technology Stack

- **Database Engine:** Oracle Database 23ai / 21c (`PL/SQL`, `SYS.DBMS_CRYPTO`, Triggers, Sequences, Stored Procedures)
- **Backend:** Python 3.x, Flask, `oracledb`
- **Frontend:** HTML5, CSS3, Vanilla JavaScript

---

## Project Structure

```text
Blockchain-Style Tamper-Evident Audit Trail/
├── backend/
│   ├── app.py                      # Flask REST API, session auth & tamper attribution
│   ├── db_config.py                # Oracle DB connection configuration
│   └── test_connection.py          # Database connectivity verification script
├── database/
│   ├── schema/
│   │   ├── 01_setup_user.sql       # Creates SECURE_AUDIT_ADMIN & grants DBMS_CRYPTO
│   │   ├── 02_schema_design.sql    # Creates STUDENT_RECORDS, AUDIT_LOG, AUDIT_METADATA & sequence
│   │   └── 07_users_setup.sql      # Creates SYSTEM_USERS for Admin & Student authentication
│   ├── triggers/
│   │   └── 03_audit_trigger.sql    # PL/SQL trigger implementing SHA-256 hash chaining
│   ├── procedures/
│   │   └── 05_verify_integrity.sql # PL/SQL chain traversal & tamper verification procedure
│   └── tests/
│       ├── 04_test_hash_chain.sql
│       └── 06_test_verification.sql
├── frontend/
│   ├── css/
│   │   └── style.css               # Clean dashboard & alert styling
│   ├── js/
│   │   └── main.js                 # Auth flows, CRUD handlers & live chain verification
│   └── index.html                  # Unified Admin & Student portal UI
├── requirements.txt
└── README.md
```

---

## Setup & Execution Guide

### 1. Database Initialization (Oracle)
Connect to your Oracle instance and execute the SQL scripts in order:
1. Run `database/schema/01_setup_user.sql` (as `SYS` / `SYSTEM`) to create the `SECURE_AUDIT_ADMIN` user and grant `EXECUTE ON SYS.DBMS_CRYPTO`.
2. Connect as `SECURE_AUDIT_ADMIN` and run:
   - `database/schema/02_schema_design.sql`
   - `database/triggers/03_audit_trigger.sql`
   - `database/procedures/05_verify_integrity.sql`
   - `database/schema/07_users_setup.sql`

### 2. Backend Environment Setup
Create and activate a Python virtual environment, then install dependencies:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Verify your Oracle credentials in `backend/db_config.py`, then start the Flask server:

```powershell
python backend/app.py
```

### 3. Access the Application
Open your browser and navigate to:

```text
[http://127.0.0.1:5000](http://127.0.0.1:5000)
```

---

## Demonstration Workflow

1. **Authorized Admin Operations:**
   - Sign in with **`admin@vit.edu`** / **`admin123`**.
   - Insert, edit, or delete student records. Each action triggers `TRG_STUDENT_RECORDS_AUDIT` to append a valid SHA-256 block.
   - Click **Verify Integrity** — the status banner confirms **`CHAIN INTEGRITY VALID (100% Intact)`**.
2. **Student Registration & Unauthorized Tamper Test:**
   - Sign out and use **Sign Up** to create a new student account (automatically added to `SYSTEM_USERS` and `STUDENT_RECORDS`).
   - Sign in as the student and attempt to **Edit** or **Delete** a record.
   - The unauthorized modification corrupts the block integrity, immediately triggering a red **`TAMPER DETECTED`** alert identifying the exact block, target student record, and actor.
3. **Resetting the Ledger:**
   - Sign back in as **Admin** and click **Reset / Clean Chain** to restore the ledger to a clean Genesis state.

```