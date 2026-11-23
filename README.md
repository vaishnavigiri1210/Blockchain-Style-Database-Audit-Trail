# Blockchain-Style Tamper-Evident Audit Trail Using Database Triggers

**Cryptographic Hash-Chaining & Real-Time Tamper Attribution inside Oracle PL/SQL**

![Oracle Database](https://img.shields.io/badge/Oracle_Database-21c%20%2F%2023ai-F80000?style=for-the-badge&logo=oracle&logoColor=white)
![PL/SQL](https://img.shields.io/badge/PL%2FSQL-DBMS_CRYPTO_SHA--256-CC2927?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-REST_API-000000?style=for-the-badge&logo=flask&logoColor=white)

---

## 📌 Overview

Traditional database audit logs can be silently modified or deleted by privileged insiders or compromised application accounts without leaving reliable evidence of tampering.

The **Blockchain-Style Tamper-Evident Audit Trail Using Database Triggers** project introduces a cryptographic auditing mechanism directly inside Oracle Database using PL/SQL triggers.

The system implements **SHA-256 hash chaining** to maintain a sequential and verifiable history of database operations without requiring an external blockchain network.

Every `INSERT`, `UPDATE`, and `DELETE` operation performed on the `STUDENT_RECORDS` table is automatically intercepted by a database trigger. The trigger generates a cryptographic hash using `SYS.DBMS_CRYPTO` and connects each audit entry to the previous entry through a hash reference.

This creates a chain of audit records in which modifications to previously recorded information can be detected through cryptographic verification.

### 🎯 Objectives

- Maintain a secure and verifiable history of database operations.
- Detect unauthorized modifications to audit records.
- Implement SHA-256 cryptographic hash chaining.
- Automatically capture database changes using PL/SQL triggers.
- Maintain operation details, including old and new record values.
- Identify and attribute unauthorized modification attempts.
- Provide a web-based interface for administration and student access.
- Verify audit-chain integrity through a stored procedure.

---

## 🏗️ System Architecture

The project consists of three major components:

1. **Frontend:** HTML, CSS, and JavaScript-based user interface.
2. **Backend:** Python Flask REST API for authentication and database operations.
3. **Database:** Oracle Database with PL/SQL triggers, audit tables, and verification procedures.

### Architecture Diagram

```text
        ┌──────────────────────────────┐
        │       Admin / Student        │
        │          Web UI              │
        └──────────────┬───────────────┘
                       │
                       │ HTTP / REST API
                       ▼
        ┌──────────────────────────────┐
        │       Flask Backend          │
        │          app.py              │
        │                              │
        │  Authentication & Sessions   │
        │  CRUD Operations             │
        │  Tamper Attribution          │
        └──────────────┬───────────────┘
                       │
                       │ SQL Operations
                       ▼
  ┌────────────────────────────────────────────┐
  │             ORACLE DATABASE                │
  │                                            │
  │  ┌──────────────────────────────────────┐  │
  │  │       STUDENT_RECORDS TABLE          │  │
  │  │   INSERT / UPDATE / DELETE           │  │
  │  └──────────────────┬───────────────────┘  │
  │                     │                      │
  │                     ▼                      │
  │  ┌──────────────────────────────────────┐  │
  │  │      PL/SQL AUDIT TRIGGER            │  │
  │  │  TRG_STUDENT_RECORDS_AUDIT           │  │
  │  │                                      │  │
  │  │  • Captures database changes         │  │
  │  │  • Locks audit metadata              │  │
  │  │  • Generates SHA-256 hash            │  │
  │  │  • Links previous hash               │  │
  │  └──────────────────┬───────────────────┘  │
  │                     │                      │
  │                     ▼                      │
  │  ┌──────────────────────────────────────┐  │
  │  │           AUDIT_LOG                  │  │
  │  │                                      │  │
  │  │  OLD_DATA → NEW_DATA                 │  │
  │  │  PREV_HASH → RECORD_HASH              │  │
  │  └──────────────────┬───────────────────┘  │
  │                     │                      │
  │                     ▼                      │
  │  ┌──────────────────────────────────────┐  │
  │  │       VERIFY_AUDIT_CHAIN             │  │
  │  │                                      │  │
  │  │  • Recalculates hashes               │  │
  │  │  • Checks chain continuity           │  │
  │  │  • Identifies broken blocks          │  │
  │  └──────────────────────────────────────┘  │
  │                                            │
  └────────────────────────────────────────────┘
```

### 🔐 Cryptographic Hash-Chaining Flow

Each database operation creates a new audit entry containing the operation details and the hash of the previous entry.

**Hash Generation:**

```text
RECORD_HASH = SHA256(
    RECORD_ID |
    OPERATION_TYPE |
    PAYLOAD |
    PREV_HASH
)
```

The generated hash is stored in the `AUDIT_LOG` table.

The next audit entry uses the current entry's hash as its `PREV_HASH`.

```text
Genesis Hash
     │
     ▼
  Block 1 ──────► Block 2 ──────► Block 3
     │               │               │
  Hash 1          Hash 2          Hash 3
     │               │               │
     └───────────────┴───────────────┘
            Sequential Hash Chain
```

If an existing audit record is modified, its recalculated hash will no longer match the stored hash, allowing the verification procedure to identify the inconsistency.

---

## ✨ Key Features

| Feature | Technical Implementation |
|---|---|
| In-Database SHA-256 Chaining | `SYS.DBMS_CRYPTO.HASH` with `HASH_SH256` |
| Automatic Audit Logging | `TRG_STUDENT_RECORDS_AUDIT` PL/SQL trigger |
| Concurrency Control | `AUDIT_METADATA` row locking using `SELECT ... FOR UPDATE` |
| Sequential Hash Linking | `PREV_HASH` and `RECORD_HASH` |
| Tamper Detection | `VERIFY_AUDIT_CHAIN` stored procedure |
| REST API Verification | Flask `/api/verify-chain` endpoint |
| Role-Based Access | Admin and Student authentication |
| Tamper Attribution | `TAMPERED_BY` tracking |
| Database Change Tracking | Captures INSERT, UPDATE, and DELETE |
| Web-Based Dashboard | HTML, CSS, and JavaScript |

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Oracle Database 21c / 23ai | Database management |
| PL/SQL | Triggers and stored procedures |
| DBMS_CRYPTO | SHA-256 cryptographic hashing |
| Python 3.x | Backend programming |
| Flask | REST API and authentication |
| HTML5 | Frontend structure |
| CSS3 | User interface styling |
| JavaScript | Frontend interactions |
| SQL Developer / SQL*Plus | Database development and execution |
| VS Code | Project development environment |

---

## 📂 Project Structure

```text
Blockchain-Style-Tamper-Evident-Audit-Trail/
│
├── backend/
│   ├── app.py
│   ├── db_config.py
│   └── test_connection.py
│
├── database/
│   │
│   ├── schema/
│   │   ├── 01_setup_user.sql
│   │   ├── 02_schema_design.sql
│   │   └── 07_users_setup.sql
│   │
│   ├── triggers/
│   │   └── 03_audit_trigger.sql
│   │
│   ├── procedures/
│   │   └── 05_verify_integrity.sql
│   │
│   └── tests/
│       ├── 04_test_hash_chain.sql
│       └── 06_test_verification.sql
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   └── main.js
│   │
│   └── index.html
│
├── requirements.txt
└── README.md
```

### 📁 Directory Description

| Directory / File | Description |
|---|---|
| `backend/` | Contains the Flask backend application. |
| `app.py` | Handles authentication, REST APIs, CRUD operations, and tamper attribution. |
| `db_config.py` | Stores Oracle database connection configuration. |
| `test_connection.py` | Tests connectivity with Oracle Database. |
| `database/schema/` | Contains database user, table, and account setup scripts. |
| `database/triggers/` | Contains the PL/SQL audit trigger. |
| `database/procedures/` | Contains the audit-chain verification procedure. |
| `database/tests/` | Contains SQL test scripts for hash generation and tamper detection. |
| `frontend/` | Contains the web application interface. |
| `requirements.txt` | Lists Python dependencies. |

---

## ⚙️ Setup and Installation

Follow these steps to configure and run the project locally.

### Prerequisites

Ensure that the following software is installed:

- Oracle Database 21c / 23ai.
- Python 3.x.
- Visual Studio Code or SQL Developer.
- Oracle SQL*Plus or an equivalent SQL execution environment.
- Git (optional).

### Step 1: Clone the Repository

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd Blockchain-Style-Tamper-Evident-Audit-Trail
```

### Step 2: Initialize Oracle Database Objects

Open SQL Developer or SQL*Plus and execute the SQL scripts in the specified order.

**A. Execute as SYS / SYSTEM**

```sql
@database/schema/01_setup_user.sql
```

This script creates the `SECURE_AUDIT_ADMIN` database user and grants the required privileges, including access to `DBMS_CRYPTO`.

**B. Connect as SECURE_AUDIT_ADMIN**

Execute the following scripts sequentially:

```sql
@database/schema/02_schema_design.sql

@database/triggers/03_audit_trigger.sql

@database/procedures/05_verify_integrity.sql

@database/schema/07_users_setup.sql
```

These scripts create the required database tables, sequences, trigger, verification procedure, and user accounts.

### Step 3: Configure the Flask Backend

Navigate to the project directory and create a Python virtual environment.

```powershell
python -m venv venv
```

Activate the environment:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

### Step 4: Configure Database Connectivity

Open:

```text
backend/db_config.py
```

Update the Oracle database connection details:

- Database username
- Database password
- Database DSN

Ensure that the configured user has the necessary database permissions.

### Step 5: Test Database Connectivity

Run:

```bash
python backend/test_connection.py
```

This verifies whether the Flask application can connect to Oracle Database.

### Step 6: Start the Flask Application

Execute:

```bash
python backend/app.py
```

Once the Flask server starts successfully, open the application in your browser.

```text
http://127.0.0.1:5000
```

---

## 🧪 Demonstration Workflow

The project demonstrates normal database operations, user access control, audit-chain generation, and tamper detection.

### 1. Admin Login

**Credentials:**

```text
Email: admin@vit.edu
Password: admin123
```

The administrator can:

- Insert new student records.
- Update existing student information.
- Delete student records.
- View the audit ledger.
- Check the audit-chain integrity status.

**Expected Result:**

Every authorized database operation automatically generates a new SHA-256 audit entry through the PL/SQL trigger.

The dashboard displays:

```text
CHAIN INTEGRITY VALID
100% INTACT
```

### 2. Student Sign Up / Sign In

Students can:

- Register through the Sign Up option.
- Sign in using existing credentials.
- View available student records.

**Sample seeded account:**

```text
Email: sneha@vit.edu
Password: student123
```

Newly registered student accounts are stored in `SYSTEM_USERS` with their corresponding `STUDENT_REF` and synchronized with `STUDENT_RECORDS`, as implemented by the application.

### 3. Tamper Simulation

The system demonstrates an unauthorized modification attempt through the Student interface.

**Steps:**

1. Sign in using a student account.
2. Open the student records table.
3. Attempt to edit or delete a record.
4. Observe the application's authorization and tamper-attribution response.
5. Sign in as Admin to inspect the integrity status.

**Expected Result:**

Unauthorized modifications to `STUDENT_RECORDS` are blocked by the application's authorization mechanism.

The application records the attempted action and associated `TAMPERED_BY` information in the audit system, according to the implemented tamper-attribution workflow.

The administrator dashboard displays:

```text
TAMPER DETECTED
```

**Note:** An application-level authorization failure and a database-level audit-chain integrity failure are different events. The implementation should maintain separate indicators for attempted unauthorized actions and verified cryptographic tampering.

### 4. Chain Verification

The administrator can execute the verification functionality using the dashboard or the `/api/verify-chain` endpoint.

The `VERIFY_AUDIT_CHAIN` procedure:

- Traverses the audit records sequentially.
- Recalculates the SHA-256 hashes.
- Compares calculated and stored hashes.
- Checks previous-hash references.
- Identifies broken links and tampered records.

Possible verification results include:

```text
CHAIN INTEGRITY VALID
```

or

```text
TAMPERED_RECORD
BROKEN_LINK
```

### 5. Chain Recovery / Reset

The application provides a Reset / Clean Chain operation for demonstration and testing.

This operation reinitializes:

- `AUDIT_LOG`
- `AUDIT_METADATA`
- `STUDENT_RECORDS`

The system returns to its initial Genesis state.

```text
Genesis Hash:
00000000000000000000000000000000
```

**⚠️ Warning:** Reset / Clean Chain is a destructive operation. It removes existing student records and audit history. Use it only in a test environment and only with explicit administrator authorization.

---

## 🗄️ Database Design

The project uses the following primary database objects.

| Database Object | Purpose |
|---|---|
| `STUDENT_RECORDS` | Stores student information. |
| `AUDIT_LOG` | Stores the historical audit entries. |
| `AUDIT_METADATA` | Maintains the latest hash and supports sequential chain generation. |
| `AUDIT_LOG_SEQ` | Generates sequential audit identifiers. |
| `SYSTEM_USERS` | Stores user account and role information. |
| `TRG_STUDENT_RECORDS_AUDIT` | Automatically captures database modifications. |
| `VERIFY_AUDIT_CHAIN` | Verifies the integrity of the hash chain. |

### Important Audit Fields

| Field | Description |
|---|---|
| `OPERATION_TYPE` | Identifies INSERT, UPDATE, or DELETE. |
| `RECORD_PK` | Identifies the affected database record. |
| `OLD_DATA` | Stores the previous record information. |
| `NEW_DATA` | Stores the updated record information. |
| `CHANGED_BY` | Identifies the user performing the operation. |
| `CHANGED_EPOCH` | Stores the operation timestamp. |
| `PREV_HASH` | Stores the hash of the previous audit entry. |
| `RECORD_HASH` | Stores the current audit entry's SHA-256 hash. |
| `TAMPERED_BY` | Identifies the user associated with a recorded tamper attempt. |

---

## 🔍 Testing and Validation

The project includes SQL test scripts to validate hash generation and tamper detection.

| Test File | Testing Purpose |
|---|---|
| `04_test_hash_chain.sql` | Tests automatic hash generation for valid database operations. |
| `06_test_verification.sql` | Tests audit-chain verification and tamper detection. |

### Test Scenarios

1. Insert a student record and verify the generated hash.
2. Update an existing record and verify the new audit entry.
3. Delete a record and verify that the deletion is recorded.
4. Modify an existing audit entry to simulate tampering.
5. Execute `VERIFY_AUDIT_CHAIN` to identify the inconsistency.
6. Verify that the system reports the affected audit record or broken hash link.

---

## 🔐 Security Considerations

The system improves database audit integrity through cryptographic hash chaining and controlled application access.

However, a database-internal hash chain should not be considered absolutely immutable.

A sufficiently privileged database administrator who can modify the audit records, trigger definitions, metadata, and verification procedure may potentially rewrite the chain.

For stronger protection in production environments, consider:

- Restricting direct access to audit tables.
- Separating database administration and audit verification privileges.
- Protecting cryptographic keys and application credentials.
- Maintaining independent backups of audit records.
- Exporting periodic chain checkpoints to an independently controlled location.
- Logging authentication failures and unauthorized access attempts.
- Using secure password hashing rather than storing plaintext passwords.

The current implementation demonstrates **tamper evidence**, not an externally enforced immutable blockchain.

---

## 🚀 Future Enhancements

Potential improvements include:

- Digital signatures for audit-chain checkpoints.
- External audit-log backups.
- Multi-level administrator authorization.
- Real-time tamper alerts.
- Advanced audit analytics and reporting.
- Integration with external monitoring systems.
- Cryptographic verification through an independent service.
- Enhanced dashboard visualizations.

---

## 👩‍💻 Project Information

**Project Title:** Blockchain-Style Tamper-Evident Audit Trail Using Database Triggers

**Domain:** Database Security and Cryptographic Integrity

**Primary Technologies:** Oracle Database, PL/SQL, Python, Flask

**Core Concept:** SHA-256 Hash Chaining and Database-Level Audit Logging

---

## 📜 License

This project is developed for educational and academic purposes.

You may modify and extend the implementation with appropriate attribution.
