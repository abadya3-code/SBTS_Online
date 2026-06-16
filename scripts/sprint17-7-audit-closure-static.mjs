import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const fail = message => {
  console.error(`❌ Sprint 17.7 audit failed: ${message}`);
  process.exitCode = 1;
};
const pass = message => console.log(`✅ ${message}`);

const packageJson = JSON.parse(read("package.json"));
const serverIndex = read("server/_core/index.ts");
const trpc = read("server/_core/trpc.ts");
const routers = read("server/routers.ts");
const db = read("server/db.ts");
const migration177 = read("drizzle/0016_sprint17_7_audit_report_closure.sql");

if (packageJson.pnpm?.patchedDependencies?.["wouter@3.7.1"]) fail("missing wouter patch dependency still configured");
else pass("missing wouter patch dependency removed");

if (!packageJson.dependencies?.helmet || !packageJson.dependencies?.["express-rate-limit"]) fail("helmet/rate-limit dependencies are missing");
else pass("security dependencies registered");

if (!serverIndex.includes("helmet(") || !serverIndex.includes("rateLimit({")) fail("server security middleware is missing");
else pass("helmet and rate limiting are enabled before tRPC");

if (!trpc.includes("errorFormatter") || !trpc.includes("userFriendlyErrorMessage")) fail("tRPC error formatter is missing");
else pass("centralized tRPC error formatter enabled");

if (!routers.includes("defaultTagWidthCm: z.coerce.number()") || !routers.includes("defaultTagHeightCm: z.coerce.number()")) fail("decimal tag size validation is not enabled");
else pass("decimal cm tag sizes are accepted");

if (!routers.includes("areasPage") || !routers.includes("projectsPage") || !routers.includes("blindsPage")) fail("pagination endpoints are missing");
else pass("pagination endpoints are available for long operational lists");

if (!routers.includes("adminProcedure.query") || !routers.includes("getAccessControlModel")) fail("Access Control admin binding not detected");
else pass("Access Control model is protected by admin procedure");

if (!db.includes("db.transaction(async tx") || !db.includes("SYSTEM_SETTINGS_CACHE_TTL_MS")) fail("transactions or settings cache not detected");
else pass("transactions and settings cache detected");

const indexNeedles = [
  "idx_s177_auth_credentials_status",
  "idx_s177_auth_sessions_employee",
  "idx_s177_phase_assignments_project",
  "idx_s177_security_events_created",
];
const missingIndexes = indexNeedles.filter(needle => !migration177.includes(needle));
if (missingIndexes.length) fail(`Sprint 17.7 migration missing indexes: ${missingIndexes.join(", ")}`);
else pass("Sprint 17.7 database performance indexes migration is present");

if (process.exitCode) process.exit(process.exitCode);
console.log("\nSprint 17.7 audit closure static check passed.");
