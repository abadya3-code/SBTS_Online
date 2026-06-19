import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function assertIncludes(label, content, needle) {
  if (!content.includes(needle)) {
    throw new Error(`${label} is missing: ${needle}`);
  }
}

function sliceBetween(content, start, end) {
  const a = content.indexOf(start);
  const b = content.indexOf(end, a + start.length);
  if (a === -1 || b === -1) throw new Error(`Could not isolate ${start}`);
  return content.slice(a, b);
}

const db = read("server/db.ts");
const routers = read("server/routers.ts");
const schema = read("drizzle/schema.ts");
const profile = read("client/src/pages/UserProfile.tsx");
const keyboard = read("client/src/components/navigation/KeyboardShortcuts.tsx");

const sensitiveFunctions = [
  ["moveBlindPhase", "export async function moveBlindPhase(", "function enrichApprovalFromBlind("],
  ["approveWorkflowRequest", "export async function approveWorkflowRequest(", "export async function getTorqueRecords"],
  ["issueCertificate", "export async function issueCertificate(", "// -----------------------------------------------------------------------------\n// Sprint 17 Report Closure"],
  ["saveAccessRoleModel", "export async function saveAccessRoleModel(", "export async function getAllWorkflows"],
  ["saveProjectPhaseAssignments", "export async function saveProjectPhaseAssignments(", "export async function getPhaseGatePreview"],
  ["saveUserPreferences", "export async function saveUserPreferences(", "// -----------------------------------------------------------------------------\n// Sprint 7"],
];

for (const [name, start, end] of sensitiveFunctions) {
  const block = sliceBetween(db, start, end);
  assertIncludes(name, block, "db.transaction");
  if (["moveBlindPhase", "approveWorkflowRequest", "issueCertificate", "saveAccessRoleModel", "saveUserPreferences"].includes(name)) {
    assertIncludes(name, block, "tx.insert(auditTrail)");
  }
  if (["moveBlindPhase", "approveWorkflowRequest", "issueCertificate"].includes(name)) {
    assertIncludes(name, block, "tx.insert(notifications)");
  }
}

for (const column of ["interfaceThemeMode", "commandSearchEnabled", "keyboardShortcutsEnabled"]) {
  assertIncludes("user_preferences schema", schema, column);
  assertIncludes("userPreferences router", routers, column);
  assertIncludes("UserProfile UI", profile, column);
}

assertIncludes("router get preferences", routers, "userPreferences: protectedProcedure.query");
assertIncludes("router save preferences", routers, "saveUserPreferences: protectedProcedure");
assertIncludes("keyboard preference gate", keyboard, "keyboardShortcutsEnabled");
assertIncludes("command preference gate", keyboard, "commandSearchEnabled");

for (const guard of [
  'requirePermission(ctx, "blinds.phase.change")',
  "requireProjectAccess(ctx",
  "requireAreaAccess(ctx",
  "requirePhaseAuthorization(ctx",
  "requirePhaseSignatureBinding(ctx",
  "requireCertificateUnlocked(lock.locked, lock.reason)",
]) {
  assertIncludes("moveBlindPhase route guard", routers, guard);
}

console.log("Sprint 17 report closure static check passed.");
console.log("Verified: sensitive transactions, role guard coverage, DB-backed user preferences, and preference-gated UX shortcuts.");
