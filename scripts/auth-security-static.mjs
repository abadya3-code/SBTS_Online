import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const router = read("server/routers.ts");
const schema = read("drizzle/schema.ts");
const context = read("server/_core/context.ts");
const trpc = read("server/_core/trpc.ts");
const cookies = read("server/_core/cookies.ts");
const loginPage = read("client/src/pages/Login.tsx");
const registerPage = read("client/src/pages/RegisterUser.tsx");
const usersPage = read("client/src/pages/UserManagement.tsx");

const requiredSchemaTables = [
  "authPasswordCredentials",
  "authPasswordResetTokens",
  "securityEvents",
];

for (const table of requiredSchemaTables) {
  if (!schema.includes(`export const ${table}`)) failures.push(`Missing schema table: ${table}`);
}

const requiredRoutes = [
  "registerPasswordCredential",
  "registerEmployeeCredential",
  "passwordLogin",
  "requestPasswordReset",
];

for (const route of requiredRoutes) {
  if (!router.includes(`${route}:`)) failures.push(`Missing auth route: core.${route}`);
}

const protectedMutations = {
  "saveSystemSettings": "adminProcedure",
  "createEmployee": "adminProcedure",
  "updateEmployee": "adminProcedure",
  "deleteEmployee": "adminProcedure",
  "createArea": "coordinatorProcedure",
  "updateArea": "coordinatorProcedure",
  "deleteArea": "adminProcedure",
  "createProject": "coordinatorProcedure",
  "updateProject": "coordinatorProcedure",
  "deleteProject": "adminProcedure",
  "createBlind": "protectedProcedure",
  "moveBlindPhase": "protectedProcedure",
  "approveRequest": "protectedProcedure",
  "issueCertificate": "protectedProcedure",
};

for (const [name, procedure] of Object.entries(protectedMutations)) {
  if (!router.includes(`${name}: ${procedure}`)) {
    failures.push(`Expected ${name} to use ${procedure}`);
  }
}

if (!context.includes("authenticateSbtsSession")) failures.push("Context does not authenticate SBTS server-side sessions.");
if (!context.includes("sbtsAuthSessions")) failures.push("Context does not read sbts_auth_sessions.");
if (!trpc.includes("roleProcedure")) failures.push("Missing roleProcedure authorization helper.");
if (!cookies.includes("sameSite: isSecureRequest(req) ?")) failures.push("Cookie options should use secure-aware sameSite policy.");
if (!loginPage.includes("passwordLogin")) failures.push("Login page is not bound to core.passwordLogin.");
if (!loginPage.includes("requestPasswordReset")) failures.push("Login page is not bound to core.requestPasswordReset.");
if (!registerPage.includes("registerEmployeeCredential")) failures.push("Register page is not bound to credential-backed registration.");
if (!usersPage.includes("registerPasswordCredential")) failures.push("User Management is missing admin credential manager binding.");

if (failures.length) {
  console.error("SBTS auth/security static check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("SBTS auth/security static check passed.");
