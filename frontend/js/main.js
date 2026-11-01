let cachedStudents = [];

document.addEventListener("DOMContentLoaded", () => {
    loadStudents();
    loadAuditLog();

    document.getElementById("student-form").addEventListener("submit", handleAddStudent);
    document.getElementById("btn-refresh-students").addEventListener("click", loadStudents);
    document.getElementById("btn-refresh-ledger").addEventListener("click", loadAuditLog);
    document.getElementById("btn-verify").addEventListener("click", runIntegrityCheck);
    document.getElementById("btn-simulate-tamper").addEventListener("click", simulateTamper);
    document.getElementById("btn-reset-chain").addEventListener("click", resetChain);
});

// 1. Fetch & Render Active Students
async function loadStudents() {
    try {
        const res = await fetch("/api/students");
        const json = await res.json();
        const tbody = document.querySelector("#students-table tbody");
        tbody.innerHTML = "";

        if (!json.success || !json.data || json.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding: 1.5rem;">No active student records.</td></tr>`;
            return;
        }

        cachedStudents = json.data;

        json.data.forEach(s => {
            const tr = document.createElement("tr");
            const statusClass = s.fee_status === 'PAID' ? 'op-insert' : (s.fee_status === 'PENDING' ? 'op-update' : 'op-delete');
            tr.innerHTML = `
                <td><strong>#${s.student_id}</strong></td>
                <td>${s.first_name} ${s.last_name}</td>
                <td>${s.department}</td>
                <td>${Number(s.cgpa).toFixed(2)}</td>
                <td><span class="op-badge ${statusClass}">${s.fee_status}</span></td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-sm btn-outline" style="color:#0284c7; border-color:#bae6fd;" onclick="editStudentPrompt(${s.student_id})">Edit</button>
                        <button class="btn btn-sm btn-outline" style="color:#b91c1c; border-color:#fecaca;" onclick="deleteStudent(${s.student_id})">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Failed to fetch students:", err);
    }
}

// 2. Fetch & Render Cryptographic Blockchain Ledger
async function loadAuditLog() {
    try {
        const res = await fetch("/api/audit-log");
        const json = await res.json();
        const tbody = document.querySelector("#ledger-table tbody");
        tbody.innerHTML = "";

        if (!json.success || !json.data || json.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding: 1.5rem;">No audit blocks generated yet.</td></tr>`;
            return;
        }

        json.data.forEach(b => {
            const tr = document.createElement("tr");
            const opClass = b.operation_type === 'INSERT' ? 'op-insert' : (b.operation_type === 'UPDATE' ? 'op-update' : 'op-delete');
            const shortPrev = b.prev_hash ? b.prev_hash.substring(0, 16) + '...' : '';
            const shortRecord = b.record_hash ? b.record_hash.substring(0, 16) + '...' : '';

            tr.innerHTML = `
                <td><strong>Block #${b.audit_id}</strong></td>
                <td><span class="op-badge ${opClass}">${b.operation_type}</span></td>
                <td><strong>#${b.record_pk}</strong></td>
                <td><span class="hash-tag" title="${b.prev_hash}">${shortPrev}</span></td>
                <td><span class="hash-tag" title="${b.record_hash}">${shortRecord}</span></td>
                <td>${b.changed_by}</td>
                <td style="color:#64748b; font-size:0.75rem;">${b.changed_at || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Failed to fetch audit log:", err);
    }
}

// 3. Add Student Form Submit
async function handleAddStudent(e) {
    e.preventDefault();
    const payload = {
        student_id: parseInt(document.getElementById("student_id").value),
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        email: document.getElementById("email").value,
        department: document.getElementById("department").value,
        cgpa: parseFloat(document.getElementById("cgpa").value),
        fee_status: document.getElementById("fee_status").value
    };

    const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.success) {
        document.getElementById("student_id").value = "";
        document.getElementById("first_name").value = "";
        document.getElementById("last_name").value = "";
        document.getElementById("email").value = "";
        loadStudents();
        loadAuditLog();
    } else {
        alert("Insert failed: " + json.error);
    }
}

// 4. Update / Edit Student Prompt
async function editStudentPrompt(studentId) {
    const student = cachedStudents.find(s => s.student_id === studentId);
    if (!student) return;

    const newCgpa = prompt(`[UPDATE DEMO] Enter new CGPA for ${student.first_name}:`, student.cgpa);
    if (newCgpa === null) return;

    const newStatus = prompt(`Enter new Fee Status (PAID / PENDING / OVERDUE):`, student.fee_status);
    if (newStatus === null) return;

    const payload = {
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        department: student.department,
        cgpa: parseFloat(newCgpa),
        fee_status: newStatus.toUpperCase().trim()
    };

    const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.success) {
        loadStudents();
        loadAuditLog();
    } else {
        alert("Update failed: " + json.error);
    }
}

// 5. Delete Student
async function deleteStudent(studentId) {
    if (!confirm(`Delete Student #${studentId}? This deletion will be permanently hashed into the blockchain audit ledger.`)) return;

    const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
        loadStudents();
        loadAuditLog();
    } else {
        alert("Delete failed: " + json.error);
    }
}

// 6. Run Verification Procedure
async function runIntegrityCheck() {
    const banner = document.getElementById("verification-banner");
    const icon = document.getElementById("banner-icon");
    const title = document.getElementById("banner-title");
    const desc = document.getElementById("banner-desc");

    banner.className = "banner banner-neutral";
    icon.innerText = "⏳";
    title.innerText = "Traversing Cryptographic Chain...";
    desc.innerText = "Recomputing SHA-256 for all blocks using Oracle DBMS_CRYPTO...";

    try {
        const res = await fetch("/api/verify-chain");
        const json = await res.json();

        if (json.success && json.verification.status === "VALID") {
            banner.className = "banner banner-valid";
            icon.innerText = "✓";
            title.innerText = "CHAIN INTEGRITY VALID (100% Intact)";
            desc.innerText = json.verification.message;
        } else {
            banner.className = "banner banner-broken";
            icon.innerText = "⚠";
            title.innerText = `TAMPER DETECTED: ${json.verification.status}`;
            desc.innerText = json.verification.message;
        }
    } catch (err) {
        banner.className = "banner banner-broken";
        title.innerText = "Verification Request Failed";
        desc.innerText = err.message;
    }
}

// 7. Simulate Direct DB Tampering
async function simulateTamper() {
    const auditId = prompt("Enter the Block # (AUDIT_ID) you want to maliciously alter directly in Oracle DB:", "1");
    if (!auditId) return;

    const res = await fetch("/api/tamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit_id: parseInt(auditId) })
    });

    const json = await res.json();
    if (json.success) {
        alert(`Direct tampering injected into Block #${auditId}! Click 'Run Integrity Verification' to test detection.`);
        loadAuditLog();
    } else {
        alert("Tampering failed: " + json.error);
    }
}

// 8. One-Click Clean Chain Reset
async function resetChain() {
    if (!confirm("Reset database to clean Genesis state? This will clear tampered blocks and reseed fresh test students.")) return;

    try {
        const res = await fetch("/api/reset-chain", { method: "POST" });
        const json = await res.json();
        if (json.success) {
            await loadStudents();
            await loadAuditLog();
            runIntegrityCheck();
        } else {
            alert("Reset failed: " + json.error);
        }
    } catch (err) {
        alert("Network error during reset: " + err.message);
    }
}