import os
from flask import Flask, jsonify, request, render_template, send_from_directory
from db_config import get_connection
import oracledb

app = Flask(
    __name__,
    template_folder="../frontend",
    static_folder="../frontend",
    static_url_path=""
)

# ---------------------------------------------------------
# Helper function: Serialize CLOB and Timestamps to JSON
# ---------------------------------------------------------
def serialize_row(cursor, row):
    columns = [col[0].lower() for col in cursor.description]
    record = {}
    for col_name, val in zip(columns, row):
        if hasattr(val, "read"):
            record[col_name] = val.read()
        elif hasattr(val, "isoformat"):
            record[col_name] = val.isoformat()
        else:
            record[col_name] = val
    return record


# ---------------------------------------------------------
# 1. UI Root Route
# ---------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


# ---------------------------------------------------------
# 2. Student Records APIs
# ---------------------------------------------------------
@app.route("/api/students", methods=["GET"])
def get_students():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DEPARTMENT, CGPA, FEE_STATUS, LAST_UPDATED
                    FROM STUDENT_RECORDS
                    ORDER BY STUDENT_ID ASC
                """)
                students = [serialize_row(cursor, r) for r in cursor.fetchall()]
        return jsonify({"success": True, "data": students})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/students", methods=["POST"])
def add_student():
    data = request.json
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO STUDENT_RECORDS (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DEPARTMENT, CGPA, FEE_STATUS)
                    VALUES (:1, :2, :3, :4, :5, :6, :7)
                """, (
                    data["student_id"],
                    data["first_name"],
                    data["last_name"],
                    data["email"],
                    data["department"],
                    float(data["cgpa"]),
                    data["fee_status"].upper()
                ))
            conn.commit()
        return jsonify({"success": True, "message": "Student inserted and audit block anchored successfully."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.json
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE STUDENT_RECORDS
                    SET FIRST_NAME = :1,
                        LAST_NAME = :2,
                        EMAIL = :3,
                        DEPARTMENT = :4,
                        CGPA = :5,
                        FEE_STATUS = :6,
                        LAST_UPDATED = CURRENT_TIMESTAMP
                    WHERE STUDENT_ID = :7
                """, (
                    data["first_name"],
                    data["last_name"],
                    data["email"],
                    data["department"],
                    float(data["cgpa"]),
                    data["fee_status"].upper(),
                    student_id
                ))
            conn.commit()
        return jsonify({"success": True, "message": f"Student {student_id} updated and hash block chained."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM STUDENT_RECORDS WHERE STUDENT_ID = :1", (student_id,))
            conn.commit()
        return jsonify({"success": True, "message": f"Student {student_id} deleted and audit record written."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# ---------------------------------------------------------
# 3. Blockchain Ledger API
# ---------------------------------------------------------
@app.route("/api/audit-log", methods=["GET"])
def get_audit_log():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT AUDIT_ID, TABLE_NAME, OPERATION_TYPE, RECORD_PK, 
                           OLD_DATA, NEW_DATA, CHANGED_BY, CHANGED_AT, PREV_HASH, RECORD_HASH
                    FROM AUDIT_LOG
                    ORDER BY AUDIT_ID ASC
                """)
                logs = [serialize_row(cursor, r) for r in cursor.fetchall()]
        return jsonify({"success": True, "data": logs})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------
# 4. Cryptographic Chain Integrity Verification API
# ---------------------------------------------------------
@app.route("/api/verify-chain", methods=["GET"])
def verify_chain():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                status_var = cursor.var(oracledb.DB_TYPE_VARCHAR, size=50)
                broken_id_var = cursor.var(oracledb.DB_TYPE_NUMBER)
                error_msg_var = cursor.var(oracledb.DB_TYPE_VARCHAR, size=4000)

                cursor.callproc("VERIFY_AUDIT_CHAIN", [status_var, broken_id_var, error_msg_var])

                result = {
                    "status": status_var.getvalue(),
                    "broken_audit_id": broken_id_var.getvalue(),
                    "message": error_msg_var.getvalue()
                }
        return jsonify({"success": True, "verification": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------
# 5. Tamper Simulation API
# ---------------------------------------------------------
@app.route("/api/tamper", methods=["POST"])
def tamper_log():
    data = request.json or {}
    audit_id = data.get("audit_id", 1)
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE AUDIT_LOG
                    SET NEW_DATA = NEW_DATA || '|TAMPERED_INJECTION=TRUE'
                    WHERE AUDIT_ID = :1
                """, (audit_id,))
            conn.commit()
        return jsonify({
            "success": True,
            "message": f"Block #{audit_id} was deliberately tampered with in AUDIT_LOG."
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# ---------------------------------------------------------
# 6. One-Click Clean Chain Reset & Reseed API
# ---------------------------------------------------------
@app.route("/api/reset-chain", methods=["POST"])
def reset_chain():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("TRUNCATE TABLE AUDIT_LOG")
                cursor.execute("TRUNCATE TABLE STUDENT_RECORDS")
                
                try:
                    cursor.execute("DROP SEQUENCE AUDIT_LOG_SEQ")
                    cursor.execute("CREATE SEQUENCE AUDIT_LOG_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE")
                except Exception:
                    pass

                cursor.execute("DELETE FROM AUDIT_METADATA")
                cursor.execute("""
                    INSERT INTO AUDIT_METADATA (CHAIN_ID, LAST_AUDIT_ID, LAST_HASH)
                    VALUES (1, 0, '0000000000000000000000000000000000000000000000000000000000000000')
                """)

                cursor.execute("""
                    INSERT INTO STUDENT_RECORDS (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DEPARTMENT, CGPA, FEE_STATUS)
                    VALUES (101, 'Vedant', 'Joshi', 'vedant@vit.edu', 'AI and DS', 9.50, 'PAID')
                """)
                cursor.execute("""
                    INSERT INTO STUDENT_RECORDS (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DEPARTMENT, CGPA, FEE_STATUS)
                    VALUES (102, 'Kalyani', 'Dudhale', 'kalyani@vit.edu', 'AI and DS', 9.20, 'PAID')
                """)
                cursor.execute("""
                    INSERT INTO STUDENT_RECORDS (STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, DEPARTMENT, CGPA, FEE_STATUS)
                    VALUES (103, 'Vaishnavi', 'Giri', 'vaishnavi@vit.edu', 'AI and DS', 9.60, 'PAID')
                """)

            conn.commit()
        return jsonify({"success": True, "message": "Blockchain ledger reset and reseeded with clean Genesis chain."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)