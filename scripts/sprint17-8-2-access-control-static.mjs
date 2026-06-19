import { readFileSync } from "node:fs";

const accessControl = readFileSync("client/src/pages/AccessControl.tsx", "utf8");
const routers = readFileSync("server/routers.ts", "utf8");
const db = readFileSync("server/db.ts", "utf8");

const checks = [
  ["AccessControl no longer imports initialRoles", !accessControl.includes("initialRoles")],
  ["AccessControl uses tRPC", accessControl.includes("trpc.accessControl.model.useQuery")],
  ["AccessControl saves via mutation", accessControl.includes("trpc.accessControl.saveRoleModel.useMutation")],
  ["AccessControl local-only toast removed", !accessControl.includes("draft saved locally")],
  ["Router exposes admin saveRoleModel", routers.includes("saveRoleModel: adminProcedure")],
  ["Router validates saveAccessRoleModel input", routers.includes("accessRoleModelSaveSchema")],
  ["DB save function exists", db.includes("export async function saveAccessRoleModel")],
  ["DB save function uses transaction", db.includes("db.transaction(async tx")],
  ["DB writes audit trail", db.includes("ACCESS_ROLE_MODEL_SAVED")],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (ok) console.log(`✓ ${label}`);
  else {
    failed += 1;
    console.error(`✗ ${label}`);
  }
}

if (failed > 0) {
  console.error(`Sprint 17.8.2 static check failed: ${failed} issue(s).`);
  process.exit(1);
}

console.log("Sprint 17.8.2 static check passed.");
