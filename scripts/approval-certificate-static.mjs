import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const schema = read("drizzle/schema.ts");
const router = read("server/routers.ts");
const db = read("server/db.ts");
const cert = read("client/src/pages/CertificateBuilder.tsx");

for (const table of ["approvalProfiles", "approvalProfileApprovers", "certificateLockEvents"]) {
  if (!schema.includes(`export const ${table}`)) failures.push(`Missing Sprint 13 schema table: ${table}`);
}

for (const route of ["approvalProfiles", "certificateLock"]) {
  if (!router.includes(`${route}:`)) failures.push(`Missing Sprint 13 API route: core.${route}`);
}

for (const fn of ["getApprovalProfiles", "getCertificateLockStatus", "ensureFinalApprovalRequests"]) {
  if (!db.includes(`function ${fn}`) && !db.includes(`function ${fn}`.replace("function", "async function")) && !db.includes(`export async function ${fn}`)) {
    failures.push(`Missing Sprint 13 backend function: ${fn}`);
  }
}

if (!db.includes("Certificate issue blocked")) failures.push("Certificate issue lock is not enforced in issueCertificate.");
if (!cert.includes("certificateLock")) failures.push("Certificate Builder is not bound to certificate lock API.");
if (!cert.includes("Certificate Lock")) failures.push("Certificate Builder does not show lock status.");

if (failures.length) {
  console.error("SBTS approval/certificate static check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("SBTS approval/certificate static check passed.");
