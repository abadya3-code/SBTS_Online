const DATABASE_URL = process.env.DATABASE_URL;
const args = new Set(process.argv.slice(2));
const runSmoke = !args.has("--no-smoke");
const commitSmoke = args.has("--commit-smoke");

const requiredTables = {
  users: ["id", "openId", "role", "createdAt"],
  areas: ["id", "code", "name", "plant", "ownerRoleKey", "status"],
  projects: ["id", "projectNo", "name", "areaId", "status", "progress"],
  blinds: ["id", "blindNo", "tagNo", "projectId", "areaId", "lineNo", "size", "blindType", "currentPhaseKey", "status"],
  blind_workflow_logs: ["id", "blindId", "toPhaseKey", "action", "createdAt"],
  project_phase_assignments: ["id", "projectId", "phaseKey", "roleKey", "authorizedEmployeeBadgesJson"],
  approvals: ["id", "blindId", "phaseKey", "requiredRoleKey", "status"],
  torque_records: ["id", "blindId", "phaseKey", "machineType", "psiValue"],
  certificates: ["id", "blindId", "certificateNo", "revision", "status", "printCount"],
  notifications: ["id", "type", "title", "message", "status"],
  audit_trail: ["id", "entityType", "entityId", "action", "summary", "createdAt"],
  system_settings: ["key", "category", "valueJson", "updatedByOpenId"],
  employees: ["id", "badge", "fullName", "roleKey", "status"],
  sbts_auth_sessions: ["id", "employeeId", "badge", "roleKey", "loginMethod"],
  sbts_schema_versions: ["id", "version", "label", "appliedAt"],
  file_uploads: ["id", "entityType", "entityId", "purpose", "fileName", "mimeType"],
  user_preferences: ["openId", "themePreferenceMode", "themeTemplate", "customAccentColor"],
  production_persistence_events: ["id", "eventType", "domain", "status", "summary"],
};

function ok(label) {
  console.log(`✓ ${label}`);
}

function fail(label) {
  console.log(`✗ ${label}`);
}

function warn(label) {
  console.log(`! ${label}`);
}

async function getCurrentDatabase(connection) {
  const [rows] = await connection.query("SELECT DATABASE() AS dbName");
  return rows?.[0]?.dbName ?? null;
}

async function tableExists(connection, table) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [table]
  );
  return Number(rows?.[0]?.count ?? 0) > 0;
}

async function columnsFor(connection, table) {
  const [rows] = await connection.query(
    "SELECT column_name AS columnName FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
    [table]
  );
  return new Set(rows.map(row => row.columnName));
}

async function countRows(connection, table) {
  const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
  return Number(rows?.[0]?.count ?? 0);
}

async function verifyTables(connection) {
  const results = [];
  for (const [table, columns] of Object.entries(requiredTables)) {
    const exists = await tableExists(connection, table);
    if (!exists) {
      results.push({ table, exists: false, missingColumns: columns, count: null });
      fail(`${table} table missing`);
      continue;
    }

    const actualColumns = await columnsFor(connection, table);
    const missingColumns = columns.filter(column => !actualColumns.has(column));
    const count = await countRows(connection, table);

    if (missingColumns.length) {
      fail(`${table} missing columns: ${missingColumns.join(", ")}`);
    } else {
      ok(`${table} exists (${count} row${count === 1 ? "" : "s"})`);
    }

    results.push({ table, exists: true, missingColumns, count });
  }
  return results;
}

async function runWriteSmoke(connection) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const areaId = `qa_area_${suffix}`;
  const projectId = `qa_project_${suffix}`;
  const blindId = `qa_blind_${suffix}`;
  const employeeId = `qa_emp_${suffix}`;
  const uploadId = `qa_file_${suffix}`;
  const openId = `qa_open_${suffix}`;
  const sessionId = `qa_session_${suffix}`;
  const settingsKey = `qa_settings_${suffix}`;

  await connection.beginTransaction();

  try {
    await connection.query(
      "INSERT INTO areas (id, code, name, plant, ownerRoleKey, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [areaId, `QA-${suffix.slice(-6)}`, "QA Persistence Area", "SBTS QA Plant", "coordinator", "Sprint 11.1 persistence smoke test", "Active"]
    );

    await connection.query(
      "INSERT INTO projects (id, projectNo, name, areaId, workflowId, status, progress, startDate, targetDate, createdByOpenId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [projectId, `QA-P-${suffix.slice(-6)}`, "QA Persistence Project", areaId, null, "Planning", 0, null, null, openId]
    );

    await connection.query(
      "INSERT INTO employees (id, badge, fullName, roleKey, specialty, department, shift, status, photoUrl, initials, isCertified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [employeeId, `QA${suffix.slice(-6)}`, "QA Persistence User", "admin", "Persistence QA", "Maintenance", "Day", "Active", null, "QA", 1]
    );

    await connection.query(
      "INSERT INTO blinds (id, blindNo, tagNo, projectId, areaId, lineNo, size, rating, blindType, currentPhaseKey, ownerRoleKey, status, priority, qrCode, locationNote, createdByOpenId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [blindId, `QA-BL-${suffix.slice(-6)}`, `QA-TAG-${suffix.slice(-6)}`, projectId, areaId, "QA-LINE-001", '6"', "300#", "Slip Blind", "broken", "coordinator", "Open", "Normal", `/qr/QA-TAG-${suffix.slice(-6)}`, "QA smoke test blind", openId]
    );

    await connection.query(
      "INSERT INTO blind_workflow_logs (blindId, fromPhaseKey, toPhaseKey, action, actorOpenId, actorRoleKey, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [blindId, null, "broken", "QA blind created", openId, "coordinator", "Sprint 11.1 smoke test log"]
    );

    await connection.query(
      "INSERT INTO project_phase_assignments (projectId, phaseKey, roleKey, authorizedEmployeeBadgesJson, note, assignedByOpenId) VALUES (?, ?, ?, ?, ?, ?)",
      [projectId, "broken", "coordinator", JSON.stringify([`QA${suffix.slice(-6)}`]), "QA assignment", openId]
    );

    await connection.query(
      "INSERT INTO approvals (blindId, phaseKey, requiredRoleKey, approvedByOpenId, status, remarks, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [blindId, "finalTight", "tiEngineer", null, "Pending", "QA approval request", null]
    );

    await connection.query(
      "INSERT INTO torque_records (blindId, phaseKey, machineType, psiValue, technicianOpenId, technicianBadge, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [blindId, "tightTorque", "Hydraulic", 1500, openId, `QA${suffix.slice(-6)}`, "QA torque record"]
    );

    await connection.query(
      "INSERT INTO certificates (blindId, certificateNo, certificateType, revision, templateVersion, qrValue, blindSnapshotJson, torqueSnapshotJson, approvalSnapshotJson, workflowSnapshotJson, issuedByOpenId, pdfUrl, status, printCount, issuedAt, lastPrintedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [blindId, `QA-CERT-${suffix}`, "Blind Completion", 1, "SBTS-CERT-QA", `/blinds/${blindId}`, "{}", "[]", "[]", "[]", openId, null, "Draft", 0]
    );

    await connection.query(
      "INSERT INTO notifications (userOpenId, type, title, message, relatedEntity, relatedId, actionUrl, severity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [openId, "System", "QA persistence notification", "Sprint 11.1 smoke notification", "Blind", blindId, `/blinds/${blindId}`, "info", "Unread"]
    );

    await connection.query(
      "INSERT INTO audit_trail (entityType, entityId, projectId, blindId, action, actorOpenId, actorName, actorRoleKey, summary, beforeJson, afterJson) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ["QA", blindId, projectId, blindId, "Persistence smoke test", openId, "QA Persistence User", "admin", "Sprint 11.1 smoke audit record", null, JSON.stringify({ ok: true })]
    );

    await connection.query(
      "INSERT INTO system_settings (`key`, category, valueJson, updatedByOpenId) VALUES (?, ?, ?, ?)",
      [settingsKey, "QA", JSON.stringify({ sprint: "11.1", mode: "smoke" }), openId]
    );

    await connection.query(
      "INSERT INTO file_uploads (id, ownerOpenId, entityType, entityId, purpose, fileName, mimeType, sizeBytes, storageKey, publicUrl, dataUrlPreview) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [uploadId, openId, "QA", blindId, "SmokeTest", "qa.txt", "text/plain", 2, null, null, "data:text/plain;base64,T0s="]
    );

    await connection.query(
      "INSERT INTO user_preferences (openId, employeeId, displayName, recoveryEmail, specialtyDescription, avatarUploadId, avatarDataUrl, themePreferenceMode, themeTemplate, customAccentColor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [openId, employeeId, "QA Persistence User", "qa@example.com", "QA verification", uploadId, null, "system", "Template 1", "#0891b2"]
    );

    await connection.query(
      "INSERT INTO sbts_auth_sessions (id, employeeId, badge, roleKey, loginMethod, provider, ipAddress, userAgent, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
      [sessionId, employeeId, `QA${suffix.slice(-6)}`, "admin", "qa-smoke", "SBTS QA", "127.0.0.1", "db-verify-persistence"]
    );

    await connection.query(
      "INSERT INTO production_persistence_events (eventType, domain, status, summary, metadataJson, actorOpenId) VALUES (?, ?, ?, ?, ?, ?)",
      ["smoke", "Database", "Success", "Sprint 11.1 smoke write test executed", JSON.stringify({ blindId, projectId, areaId }), openId]
    );

    const [readRows] = await connection.query("SELECT blindNo, tagNo FROM blinds WHERE id = ?", [blindId]);
    if (readRows.length !== 1) {
      throw new Error("Smoke readback failed for blind row.");
    }

    if (commitSmoke) {
      await connection.commit();

      // Cleanup committed smoke data in reverse dependency order.
      await connection.query("DELETE FROM production_persistence_events WHERE actorOpenId = ?", [openId]);
      await connection.query("DELETE FROM sbts_auth_sessions WHERE id = ?", [sessionId]);
      await connection.query("DELETE FROM user_preferences WHERE openId = ?", [openId]);
      await connection.query("DELETE FROM file_uploads WHERE id = ?", [uploadId]);
      await connection.query("DELETE FROM system_settings WHERE `key` = ?", [settingsKey]);
      await connection.query("DELETE FROM audit_trail WHERE entityId = ?", [blindId]);
      await connection.query("DELETE FROM notifications WHERE relatedId = ?", [blindId]);
      await connection.query("DELETE FROM certificates WHERE blindId = ?", [blindId]);
      await connection.query("DELETE FROM torque_records WHERE blindId = ?", [blindId]);
      await connection.query("DELETE FROM approvals WHERE blindId = ?", [blindId]);
      await connection.query("DELETE FROM project_phase_assignments WHERE projectId = ?", [projectId]);
      await connection.query("DELETE FROM blind_workflow_logs WHERE blindId = ?", [blindId]);
      await connection.query("DELETE FROM blinds WHERE id = ?", [blindId]);
      await connection.query("DELETE FROM employees WHERE id = ?", [employeeId]);
      await connection.query("DELETE FROM projects WHERE id = ?", [projectId]);
      await connection.query("DELETE FROM areas WHERE id = ?", [areaId]);
      ok("Committed smoke test passed and cleanup completed.");
    } else {
      await connection.rollback();
      ok("Rollback smoke test passed. Schema accepts critical writes without leaving QA data.");
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

if (!DATABASE_URL) {
  fail("DATABASE_URL is not configured.");
  console.log("Set DATABASE_URL and run: pnpm db:verify");
  process.exit(1);
}

let connection;
const failures = [];
try {
  const mysql = await import("mysql2/promise");
  connection = await mysql.default.createConnection(DATABASE_URL);
  const dbName = await getCurrentDatabase(connection);
  ok(`Connected to database: ${dbName ?? "unknown"}`);

  const tableResults = await verifyTables(connection);
  for (const result of tableResults) {
    if (!result.exists || result.missingColumns.length) failures.push(result);
  }

  if (runSmoke && failures.length === 0) {
    await runWriteSmoke(connection);
  } else if (runSmoke) {
    warn("Skipping write smoke test because schema checks failed.");
  }

  if (failures.length) {
    console.log("\nPersistence verification failed. Missing tables/columns must be fixed before production use.");
    process.exit(1);
  }

  console.log("\nSBTS persistence verification passed.");
  console.log(commitSmoke ? "Mode: commit smoke + cleanup" : "Mode: rollback smoke");
} catch (error) {
  console.error("\nSBTS persistence verification failed:");
  console.error(error?.message ?? error);
  process.exit(1);
} finally {
  await connection?.end();
}
