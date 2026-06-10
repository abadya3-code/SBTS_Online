import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const packageJson = JSON.parse(read("package.json"));
for (const scriptName of ["build", "start", "db:push", "db:verify", "seed:admin", "qa:deploy"]) {
  if (!packageJson.scripts?.[scriptName]) failures.push(`Missing deployment script: ${scriptName}`);
}

for (const rel of [".env.production.example", "docs/deployment/ONLINE_DEPLOYMENT_GUIDE.md", "docs/deployment/MYSQL_DEPLOYMENT_CHECKLIST.md", "docs/deployment/RAILWAY_RENDER_DEPLOYMENT_NOTES.md", "Dockerfile", "PILOT_QUICK_START.md"]) {
  if (!exists(rel)) failures.push(`Missing deployment artifact: ${rel}`);
}

const index = read("server/_core/index.ts");
if (!index.includes('/api/health')) failures.push("Server is missing /api/health route.");
if (!index.includes("APP_PUBLIC_URL") || !index.includes("ALLOWED_ORIGIN")) failures.push("Server is missing production origin configuration.");

const env = read(".env.production.example");
for (const key of ["NODE_ENV=production", "DATABASE_URL=", "APP_PUBLIC_URL=", "SBTS_ADMIN_PASSWORD="]) {
  if (!env.includes(key)) failures.push(`.env.production.example missing: ${key}`);
}

const seed = read("scripts/seed-admin.mjs");
if (!seed.includes("auth_password_credentials") || !seed.includes("SBTS_ADMIN_PASSWORD")) failures.push("seed-admin script is incomplete.");

if (failures.length) {
  console.error("SBTS deployment static check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("SBTS deployment static check passed.");
