import fs from "node:fs";

const checks = [
  {
    file: "server/_core/context.ts",
    mustInclude: [
      "projectPhaseAssignments",
      "resolveEmployeeScope",
      "areaIds: scope.areaIds",
      "projectIds: scope.projectIds",
    ],
  },
  {
    file: "server/security/permissionGuard.ts",
    mustInclude: [
      "requireAreaAccess",
      "requireProjectAccess",
      "requirePhaseAuthorization",
      "requirePhaseSignatureBinding",
      "Phase signature must match the authenticated employee badge",
    ],
  },
  {
    file: "server/routers.ts",
    mustInclude: [
      "scopedAreasForUser",
      "scopedProjectsForUser",
      "scopedBlindsForUser",
      "getBlindMutationLockStatus",
      "requirePermission(ctx, \"blinds.phase.change\")",
      "requirePhaseSignatureBinding(ctx, input.signatureId)",
      "requirePermission(ctx, \"certificates.manage\")",
      "requirePermission(ctx, \"workflow.approve\")",
      "requireCertificateUnlocked(lock.locked, lock.reason)",
    ],
  },
  {
    file: "server/db.ts",
    mustInclude: [
      "getBlindMutationLockStatus",
      "Blind is locked by certificate",
      "Certificate could not be read after issue",
    ],
  },
];

let failed = false;
for (const check of checks) {
  const content = fs.readFileSync(check.file, "utf8");
  for (const token of check.mustInclude) {
    if (!content.includes(token)) {
      console.error(`✗ Missing token in ${check.file}: ${token}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("Sprint 17.8.3 static security check failed.");
  process.exit(1);
}

console.log("✓ Sprint 17.8.3 static security check passed.");
console.log("✓ Ownership scope, phase signature binding, certificate lock guard, and role-based mutations are present.");
