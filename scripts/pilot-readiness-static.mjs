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

const requiredDocs = [
  "docs/pilot/PILOT_ADMIN_GUIDE.md",
  "docs/pilot/PILOT_USER_GUIDE.md",
  "docs/pilot/PILOT_CHECKLIST.md",
  "docs/pilot/DEPLOYMENT_NOTES.md",
  "docs/pilot/BACKUP_RESTORE_PLAN.md",
  "docs/pilot/KNOWN_LIMITATIONS.md",
  "docs/pilot/PILOT_ACCEPTANCE_FORM.md",
];

for (const doc of requiredDocs) {
  if (!exists(doc)) failures.push(`Missing pilot document: ${doc}`);
}

const requiredSamples = [
  "samples/pilot_sample_data.json",
  "samples/pilot_blinds_import_template.csv",
];

for (const sample of requiredSamples) {
  if (!exists(sample)) failures.push(`Missing pilot sample: ${sample}`);
}

if (exists("samples/pilot_sample_data.json")) {
  const data = JSON.parse(read("samples/pilot_sample_data.json"));
  if (!Array.isArray(data.blinds) || data.blinds.length < 5) {
    failures.push("Pilot sample data must include at least 5 blinds.");
  }
  if (!data.blinds?.some(blind => blind.blindType === "Slip Blind")) {
    failures.push("Pilot sample data must include a Slip Blind.");
  }
  if (!data.expectedApprovalProfile?.["Slip Blind"]?.includes("Metal Foreman")) {
    failures.push("Pilot sample must document Metal Foreman approval for Slip Blind.");
  }
}

const packageJson = JSON.parse(read("package.json"));
for (const scriptName of ["qa:pilot", "pilot:static", "qa:print", "qa:approval", "qa:security", "db:verify"]) {
  if (!packageJson.scripts?.[scriptName]) failures.push(`Missing package script: ${scriptName}`);
}

if (!read("README.md").includes("Sprint 15 Pilot Ready Package")) {
  failures.push("README missing Sprint 15 Pilot Ready Package section.");
}

if (failures.length) {
  console.error("SBTS pilot readiness static check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("SBTS pilot readiness static check passed.");
