import fs from "node:fs";

const required = [
  "server/_core/observability.ts",
  "client/src/lib/observability.ts",
  "client/src/pages/PerformanceMonitoring.tsx",
  "docs/releases/SBTS_SPRINT17_10_OBSERVABILITY_ERROR_LOGGING.md",
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const index = fs.readFileSync("server/_core/index.ts", "utf8");
for (const marker of [
  "initServerObservability",
  "observabilityRequestMiddleware",
  "captureClientErrorPayload",
  "captureTrpcError",
  "onError({ error, path, type, ctx })",
]) {
  if (!index.includes(marker)) failures.push(`server/_core/index.ts missing ${marker}`);
}

const routers = fs.readFileSync("server/routers.ts", "utf8");
for (const marker of ["performanceMonitoring", "adminProcedure.query", "getRuntimeMonitoringSnapshot", "getObservabilityDatabaseSnapshot"]) {
  if (!routers.includes(marker)) failures.push(`server/routers.ts missing ${marker}`);
}

const main = fs.readFileSync("client/src/main.tsx", "utf8");
for (const marker of ["initClientObservability", "captureClientError", "react-query.query", "react-query.mutation"]) {
  if (!main.includes(marker)) failures.push(`client/src/main.tsx missing ${marker}`);
}

const app = fs.readFileSync("client/src/App.tsx", "utf8");
if (!app.includes("/monitoring") || !app.includes("PerformanceMonitoring")) failures.push("App route /monitoring missing");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.dependencies?.["@sentry/node"]) failures.push("Missing @sentry/node dependency");
if (!pkg.dependencies?.["@sentry/react"]) failures.push("Missing @sentry/react dependency");

if (failures.length) {
  console.error("Sprint 17.10 observability static check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Sprint 17.10 observability static check passed.");
