let cachedStudents = [];
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    checkExistingSession();

    // Auth Listeners
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("signup-form").addEventListener("submit", handleSignup);
    document.getElementById("forgot-form").addEventListener("submit", handleForgotPassword);
    document.getElementById("btn-logout").addEventListener("click", handleLogout);

    // Unified Dashboard Listeners
    document.getElementById("student-form").addEventListener("submit", handleAddStudent);
    document.getElementById("btn-refresh-students").addEventListener("click", loadStudents);
    document.getElementById("btn-refresh-ledger").addEventListener("click", loadAuditLog);
    document.getElementById("btn-reset-chain").addEventListener("click", resetChain);
    document.getElementById("btn-verify").addEventListener("click", runIntegrityCheck);
});

// =========================================================
// AUTH NAVIGATION (SIGN IN / SIGN UP / FORGOT PASSWORD)
// =========================================================
function showAuthSection(section) {
    const alertBox = document.getElementById("auth-alert");
    alertBox.classList.add("hidden");

    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("signup-form").classList.add("hidden");
    document.getElementById("forgot-form").classList.add("hidden");

    const title = document.getElementById("auth-title");
    const subtitle = document.getElementById("auth-subtitle");

    if (section === "signin") {
        document.getElementById("login-form").classList.remove("hidden");
        title.innerText = "Sign In";
        subtitle.innerText = "Blockchain-Style Database Audit Trail";
    } else if (section === "signup") {
        document.getElementById("signup-form").classList.remove("hidden");
        title.innerText = "Student Sign Up";
        subtitle.innerText = "Create your student account";
    } else if (section === "forgot") {
        document.getElementById("forgot-form").classList.remove("hidden");
        title.innerText = "Forgot Password";
        subtitle.innerText = "Reset your student account password";
    }
}

function showAuthAlert(msg, isSuccess = false) {
    const alertBox = document.getElementById("auth-alert");
    alertBox.innerText = msg;
    alertBox.className = isSuccess ? "alert-box alert-success" : "alert-box alert-error";
    alertBox.classList.remove("hidden");
}

function quickFill(email, password) {
    showAuthSection("signin");
    document.getElementById("login-email").value = email;
    document.getElementById("login-password").value = password;
}

async function checkExistingSession() {
    try {
        const res = await fetch("/api/session");
        const json = await res.json();
        if (json.authenticated) {
            renderDashboardForUser(json.user);
        } else {
            showLoginView();
        }
    } catch (err) {
        showLoginView();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const json = await res.json();

        if (json.success) {
            renderDashboardForUser(json.user);
        } else {
            showAuthAlert(json.error || "Sign in failed.", false);
        }
    } catch (err) {
        showAuthAlert("Network error while signing in.", false);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const payload = {
        full_name: document.getElementById("reg-name").value,
        email: document.getElementById("reg-email").value,
        department: document.getElementById("reg-dept").value,
        password: document.getElementById("reg-password").value
    };

    try {
        const res = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success) {
            showAuthSection("signin");
            document.getElementById("login-email").value = payload.email;
            showAuthAlert(json.message, true);
        } else {
            showAuthAlert(json.error, false);
        }
    } catch (err) {
        showAuthAlert("Network error during registration.", false);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const payload = {
        email: document.getElementById("fp-email").value,
        new_password: document.getElementById("fp-new-password").value
    };

    try {
        const res = await fetch("/api/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success) {
            showAuthSection("signin");
            document.getElementById("login-email").value = payload.email;
            showAuthAlert(json.message, true);
        } else {
            showAuthAlert(json.error, false);
        }
    } catch (err) {
        showAuthAlert("Network error during password reset.", false);
    }
}

async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    currentUser = null;
    showLoginView();
}

function showLoginView() {
    document.getElementById("login-view").classList.remove("hidden");
    document.getElementById("app-shell").classList.add("hidden");
}

function renderDashboardForUser(user) {
    currentUser = user;
    document.getElementById("login-view").classList.add("hidden");
    document.getElementById("app-shell").classList.remove("hidden");

    const badge = document.getElementById("nav-role-badge");
    const resetBtn = document.getElementById("btn-reset-chain");

    if (user.role === "ADMIN") {
        badge.innerText = "ROLE: ADMIN";
        badge.className = "brand-tag";
        resetBtn.classList.remove("hidden");
    } else {
        badge.innerText = "ROLE: STUDENT";
        badge.className = "brand-tag student-badge";
        resetBtn.classList.add("hidden");
    }

    document.getElementById("nav-user-name").innerText = user.name;
    document.getElementById("nav-user-email").innerText = user.email;

    loadStudents();
    loadAuditLog();
    runIntegrityCheck();
}

// =========================================================
// STUDENT RECORDS CRUD (UNIFIED FOR ADMIN & STUDENT)
// =========================================================
async function loadStudents() {
    try {
        const res = await fetch("/api/students");
        const json = await res.json();
        const tbody = document.querySelector("#students-table tbody");
        tbody.innerHTML = "";

        if (!json.success || !json.data || json.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding: 1.5rem;">No student records found.</td></tr>`;
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
        if (json.tampered) {
            alert(json.message);
        }
        document.getElementById("student_id").value = "";
        document.getElementById("first_name").value = "";
        document.getElementById("last_name").value = "";
        document.getElementById("email").value = "";
        loadStudents();
        loadAuditLog();
        runIntegrityCheck();
    } else {
        alert("Insert failed: " + json.error);
    }
}

async function editStudentPrompt(studentId) {
    const student = cachedStudents.find(s => s.student_id === studentId);
    if (!student) return;

    const newCgpa = prompt(`Enter new CGPA for ${student.first_name}:`, student.cgpa);
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
        if (json.tampered) {
            alert(json.message);
        }
        loadStudents();
        loadAuditLog();
        runIntegrityCheck();
    } else {
        alert("Update failed: " + json.error);
    }
}

async function deleteStudent(studentId) {
    if (!confirm(`Delete Student #${studentId}?`)) return;

    const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
        if (json.tampered) {
            alert(json.message);
        }
        loadStudents();
        loadAuditLog();
        runIntegrityCheck();
    } else {
        alert("Delete failed: " + json.error);
    }
}

// =========================================================
// CRYPTOGRAPHIC AUDIT LEDGER & VERIFICATION
// =========================================================
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
            const isTampered = b.new_data && b.new_data.includes("TAMPERED_BY=");
            if (isTampered) tr.classList.add("tamper-row");

            const opClass = b.operation_type === 'INSERT' ? 'op-insert' : (b.operation_type === 'UPDATE' ? 'op-update' : 'op-delete');
            const shortPrev = b.prev_hash ? b.prev_hash.substring(0, 14) + '...' : '';
            const shortRecord = b.record_hash ? b.record_hash.substring(0, 14) + '...' : '';

            let culpritBadge = "";
            if (isTampered) {
                const actor = b.new_data.split("TAMPERED_BY=")[1].split("|")[0];
                culpritBadge = `<div class="tamper-tag">⚠ TAMPERED BY: ${actor}</div>`;
            }

            tr.innerHTML = `
                <td><strong>Block #${b.audit_id}</strong></td>
                <td><span class="op-badge ${opClass}">${b.operation_type}</span></td>
                <td><strong>Student #${b.record_pk}</strong></td>
                <td>
                    <div class="payload-box">${b.new_data || b.old_data || ''}</div>
                    ${culpritBadge}
                </td>
                <td><span class="hash-tag" title="${b.prev_hash}">${shortPrev}</span></td>
                <td><span class="hash-tag" title="${b.record_hash}">${shortRecord}</span></td>
                <td style="color:#64748b; font-size:0.75rem;">${b.changed_at || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Failed to fetch audit log:", err);
    }
}

async function runIntegrityCheck() {
    const banner = document.getElementById("verification-banner");
    const icon = document.getElementById("banner-icon");
    const title = document.getElementById("banner-title");
    const desc = document.getElementById("banner-desc");

    banner.className = "banner banner-neutral";
    icon.innerText = "⏳";
    title.innerText = "Verifying Cryptographic Chain...";
    desc.innerText = "Recomputing SHA-256 hashes across all blocks in Oracle DB...";

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
            title.innerText = `TAMPER DETECTED — ${json.verification.target_record || 'Chain Broken'}`;
            desc.innerText = json.verification.message;
        }
    } catch (err) {
        banner.className = "banner banner-broken";
        title.innerText = "Verification Failed";
        desc.innerText = err.message;
    }
}

async function resetChain() {
    if (!confirm("Reset database to clean Genesis state?")) return;

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