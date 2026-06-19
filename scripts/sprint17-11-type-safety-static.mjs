import fs from "node:fs";
import path from "node:path";

const roots = ["server", "client/src", "shared"];
const extensions = new Set([".ts", ".tsx"]);
const securityCriticalFiles = [
  "server/routers.ts",
  "server/_core/trpc.ts",
  "server/security/permissionGuard.ts",
  "server/_core/observability.ts",
  "client/src/lib/observability.ts",
  "client/src/hooks/usePersistFn.ts",
  "client/src/components/ui/dialog.tsx",
  "client/src/components/ui/input.tsx",
  "client/src/components/ui/textarea.tsx",
];
const failures = [];
const remaining = [];

function normalize(file) {
  return file.replaceAll("\\\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      const text = fs.readFileSync(full, "utf8");
      const matches = text.match(/\bany\b/g) ?? [];
      if (matches.length) remaining.push({ file: normalize(full), count: matches.length });
    }
  }
}

for (const root of roots) walk(root);

for (const file of securityCriticalFiles) {
  const text = fs.readFileSync(file, "utf8");
  const matches = text.match(/\bany\b/g) ?? [];
  if (matches.length) failures.push(`${file}: ${matches.length} any usage(s) in a security-critical file`);
}

const routers = fs.readFileSync("server/routers.ts", "utf8");
if (routers.includes("ctx.user as any")) failures.push("server/routers.ts still casts ctx.user as any");

const trpc = fs.readFileSync("server/_core/trpc.ts", "utf8");
if (trpc.includes("as any")) failures.push("server/_core/trpc.ts still has as any");

if (!fs.existsSync("docs/releases/SBTS_SPRINT17_11_TYPE_SAFETY_CLEANUP.md")) {
  failures.push("Missing Sprint 17.11 type safety release note");
}

if (failures.length) {
  console.error("Sprint 17.11 type-safety static check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Sprint 17.11 type-safety static check passed.");
console.log(`Remaining legacy any occurrences tracked for follow-up: ${remaining.reduce((sum, item) => sum + item.count, 0)}`);
for (const item of remaining.slice(0, 12)) console.log(`- ${item.file}: ${item.count}`);
