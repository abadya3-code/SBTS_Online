import fs from "node:fs";
import path from "node:path";

const requiredFiles = [
  "playwright.config.ts",
  "tests/e2e/auth.ts",
  "tests/e2e/01-online-smoke.spec.ts",
  "tests/e2e/02-access-control-and-preferences.spec.ts",
  "tests/e2e/03-role-security-matrix.spec.ts",
  "tests/e2e/04-print-certificate-regression.spec.ts",
  "scripts/generate-online-test-evidence.mjs",
  "docs/evidence/ONLINE_TEST_EVIDENCE_TEMPLATE.md",
  "docs/releases/SBTS_SPRINT17_FINAL_ONLINE_E2E_TYPESAFETY.md",
  "client/src/types/operationalModels.ts",
];

const missing = requiredFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));
if (missing.length) {
  console.error("Missing final closure files:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scripts = packageJson.scripts ?? {};
for (const scriptName of ["e2e:install", "e2e:online", "e2e:evidence", "audit:final", "qa:final"]) {
  if (!scripts[scriptName]) {
    console.error(`Missing package script: ${scriptName}`);
    process.exit(1);
  }
}

if (!packageJson.devDependencies?.["@playwright/test"] && !packageJson.dependencies?.["@playwright/test"]) {
  console.error("Missing @playwright/test dependency.");
  process.exit(1);
}

const sourceDirs = ["client/src", "server", "shared"];
const legacyAnyPattern = /\b(?:as|:)\s*any\b|\bany\s*\[\s*\]|<\s*any\s*>/;
const offenders = [];
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(full, "utf8");
      content.split(/\r?\n/).forEach((line, index) => {
        if (legacyAnyPattern.test(line)) offenders.push(`${full}:${index + 1}: ${line.trim()}`);
      });
    }
  }
}
for (const dir of sourceDirs) if (fs.existsSync(dir)) scan(dir);

if (offenders.length) {
  console.error("Legacy TypeScript any usages remain:");
  for (const offender of offenders.slice(0, 80)) console.error(`- ${offender}`);
  process.exit(1);
}

const printLayout = fs.readFileSync("client/src/components/print/ProfessionalPrintLayouts.tsx", "utf8");
if (!printLayout.includes("PrintableBlind") || !printLayout.includes("CertificateRecord") || !printLayout.includes("TorqueRecord")) {
  console.error("Print layouts are not protected by typed print models.");
  process.exit(1);
}

console.log("Sprint 17 final online/E2E/type-safety static check passed.");
