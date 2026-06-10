import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("SBTS persistence mode: DEMO");
  console.log("DATABASE_URL is not configured. The app will use demo fallback state.");
  process.exit(0);
}

const tables = [
  "areas",
  "projects",
  "blinds",
  "blind_workflow_logs",
  "project_phase_assignments",
  "approvals",
  "torque_records",
  "certificates",
  "notifications",
  "audit_trail",
  "system_settings",
  "user_preferences",
  "file_uploads",
  "production_persistence_events",
];

let connection;
try {
  connection = await mysql.createConnection(url);
  const [dbRows] = await connection.query("SELECT DATABASE() AS dbName");
  console.log(`SBTS persistence mode: DATABASE (${dbRows?.[0]?.dbName ?? "unknown database"})`);

  for (const table of tables) {
    const [rows] = await connection.query(
      "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
      [table]
    );
    const exists = Number(rows?.[0]?.count ?? 0) > 0;
    console.log(`${exists ? "✓" : "✗"} ${table}`);
  }
} catch (error) {
  console.error("SBTS persistence status check failed:");
  console.error(error?.message ?? error);
  process.exitCode = 1;
} finally {
  await connection?.end();
}
