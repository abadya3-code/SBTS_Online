import crypto from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required to seed the first admin.");
  process.exit(1);
}

const admin = {
  id: process.env.SBTS_ADMIN_EMPLOYEE_ID || "admin-001",
  badge: process.env.SBTS_ADMIN_BADGE || "admin",
  fullName: process.env.SBTS_ADMIN_NAME || "System Admin",
  username: (process.env.SBTS_ADMIN_USERNAME || "admin").trim().toLowerCase(),
  password: process.env.SBTS_ADMIN_PASSWORD || "",
  recoveryEmail: process.env.SBTS_ADMIN_EMAIL || "admin@example.com",
};

if (!admin.password || admin.password.length < 10) {
  console.error("SBTS_ADMIN_PASSWORD is required and must be at least 10 characters.");
  console.error("Example: SBTS_ADMIN_PASSWORD=ChangeMe2026!");
  process.exit(1);
}

if (!/[A-Z]/.test(admin.password) || !/[a-z]/.test(admin.password) || !/[0-9]/.test(admin.password)) {
  console.error("SBTS_ADMIN_PASSWORD must include uppercase, lowercase, and number.");
  process.exit(1);
}

function scryptHash(password, salt = crypto.randomBytes(24).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(6).toString("hex")}`;
}

const mysql = await import("mysql2/promise");
let connection;
try {
  connection = await mysql.default.createConnection(url);
  const { salt, hash } = scryptHash(admin.password);
  await connection.beginTransaction();

  await connection.query(
    `INSERT INTO employees (id, badge, fullName, roleKey, specialty, department, shift, status, photoUrl, initials, isCertified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE fullName = VALUES(fullName), roleKey = VALUES(roleKey), status = VALUES(status), updatedAt = CURRENT_TIMESTAMP`,
    [admin.id, admin.badge, admin.fullName, "admin", "SBTS Platform Owner", "Maintenance", "Day", "Active", null, "SA", 1]
  );

  const [existing] = await connection.query(
    "SELECT id FROM auth_password_credentials WHERE username = ? LIMIT 1",
    [admin.username]
  );

  if (existing.length) {
    await connection.query(
      `UPDATE auth_password_credentials
       SET employeeId = ?, recoveryEmail = ?, passwordHash = ?, passwordSalt = ?, passwordAlgorithm = 'scrypt-sha256', status = 'Active', failedAttempts = 0, updatedAt = CURRENT_TIMESTAMP
       WHERE username = ?`,
      [admin.id, admin.recoveryEmail, hash, salt, admin.username]
    );
  } else {
    await connection.query(
      `INSERT INTO auth_password_credentials (id, employeeId, username, recoveryEmail, passwordHash, passwordSalt, passwordAlgorithm, status, mustChangePassword, failedAttempts, createdByOpenId)
       VALUES (?, ?, ?, ?, ?, ?, 'scrypt-sha256', 'Active', 0, 0, 'seed-admin')`,
      [id("cred"), admin.id, admin.username, admin.recoveryEmail, hash, salt]
    );
  }

  await connection.query(
    `INSERT INTO security_events (eventType, severity, actorOpenId, employeeId, badge, roleKey, summary, metadataJson)
     VALUES ('admin.seeded', 'info', 'seed-admin', ?, ?, 'admin', ?, ?)`,
    [admin.id, admin.badge, `Admin credential seeded for ${admin.username}.`, JSON.stringify({ username: admin.username })]
  );

  await connection.commit();
  console.log("SBTS admin seed completed.");
  console.log(`Username: ${admin.username}`);
  console.log(`Badge: ${admin.badge}`);
} catch (error) {
  await connection?.rollback();
  console.error("SBTS admin seed failed:");
  console.error(error?.message ?? error);
  process.exit(1);
} finally {
  await connection?.end();
}
