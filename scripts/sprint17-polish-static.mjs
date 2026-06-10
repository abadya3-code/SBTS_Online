import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
function read(rel){ return fs.readFileSync(path.join(root, rel), "utf8"); }
function exists(rel){ return fs.existsSync(path.join(root, rel)); }

const docker = read("Dockerfile");
if (docker.includes("pnpm install --prod")) failures.push("Dockerfile runner must install runtime dependencies required by bundled server.");
if (!read("package.json").includes('"start": "node dist/index.js"')) failures.push("package start command should not depend on cross-env in production.");
if (!exists("client/public/app-icon.svg")) failures.push("Missing application icon asset.");

const appShell = read("client/src/components/layout/AppShell.tsx");
if (appShell.includes("production-bound</span>") || appShell.includes("• {session.loginMethod}")) failures.push("Normal topbar must not show raw production-bound session label.");
if (!appShell.includes("appVersionNumber")) failures.push("AppShell is not reading version/release from system settings.");

const register = read("client/src/pages/RegisterUser.tsx");
if (!register.includes('status: "Pending"')) failures.push("New self-registration must be Pending by default.");
if (!register.includes("Admin Approval")) failures.push("Register page should explain admin approval.");

const userManagement = read("client/src/pages/UserManagement.tsx");
if (!userManagement.includes('"Pending"') || !userManagement.includes("Approve")) failures.push("User Management must support pending approval workflow.");

const tagDesigner = read("client/src/pages/TagDesignerSettings.tsx");
for (const token of ["Live Tag Layout Editor", "Layer Position", "selectedLayer", "moveLayer"]) {
  if (!tagDesigner.includes(token)) failures.push(`Tag Designer Pro missing ${token}`);
}

const printStyles = read("client/src/components/print/PrintStyles.tsx");
for (const token of ["max-width: 11cm", "font-size: 82%", "sbtsCertificatePage", "sbtsTagPage", "sbtsReportPage"]) {
  if (!printStyles.includes(token)) failures.push(`Print production CSS missing ${token}`);
}

const cert = read("client/src/pages/CertificateBuilder.tsx");
if (!cert.includes("formatDateTime") || cert.includes("Invalid Date")) failures.push("Certificate Builder must use safe date formatting and avoid Invalid Date output.");

const pageFiles = [
  "client/src/pages/Blinds.tsx",
  "client/src/pages/Projects.tsx",
  "client/src/pages/ApprovalCenter.tsx",
  "client/src/pages/TagPrint.tsx",
  "client/src/pages/ProjectCertificates.tsx",
  "client/src/pages/SingleTagPrint.tsx",
  "client/src/pages/NotificationInbox.tsx",
  "client/src/pages/AuditTrail.tsx",
  "client/src/pages/UserManagement.tsx",
  "client/src/pages/SystemSettingsCenter.tsx",
  "client/src/pages/CertificateBuilder.tsx",
];
for (const rel of pageFiles) {
  const text = read(rel).replace(/replace\(\/Sprint[^\n]+/g, "");
  const userFacing = text.match(/eyebrow=\"[^\"]*Sprint[^\"]*\"|>[^<]*Sprint\s+\d[^<]*</i);
  if (userFacing) failures.push(`${rel} still includes user-facing Sprint text: ${userFacing[0].slice(0,80)}`);
}

if (failures.length) {
  console.error("SBTS Sprint 17 polish static check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("SBTS Sprint 17 polish static check passed.");
