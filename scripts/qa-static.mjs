import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", ".next", ".turbo"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(root);
const sourceFiles = files.filter(file => /\.(ts|tsx|css|json)$/.test(file));
const badUiPhrases = [
  "Source: Core API / Database or Demo Store",
  "Area setup contains location information only",
  "Profile, photo, theme, and specialty settings.",
  "Registry is now action-first, not form-heavy.",
];

for (const phrase of badUiPhrases) {
  const hits = sourceFiles.filter(file => fs.readFileSync(file, "utf8").includes(phrase));
  if (hits.length) failures.push(`Remove development/helper phrase "${phrase}" from: ${hits.map(x => path.relative(root, x)).join(", ")}`);
}

const rootReleaseNotes = fs.readdirSync(root).filter(name => /^SBTS_SPRINT.*\.md$/i.test(name));
if (rootReleaseNotes.length) failures.push(`Move release notes out of project root: ${rootReleaseNotes.join(", ")}`);

if (fs.existsSync(path.join(root, "node_modules"))) failures.push("node_modules must not be included in the deliverable zip.");

const appShell = path.join(root, "client/src/components/layout/AppShell.tsx");
if (fs.existsSync(appShell)) {
  const txt = fs.readFileSync(appShell, "utf8");
  if (!txt.includes("APP_VERSION")) failures.push("AppShell must expose APP_VERSION in the sidebar/footer.");
  if (txt.includes("themeName")) warnings.push("Theme name still appears in AppShell; keep theme labels inside Settings/Profile only.");
}

const pkgPath = path.join(root, "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  for (const dep of ["@builder.io/vite-plugin-jsx-loc", "vite-plugin-manus-runtime", "add", "pnpm"]) {
    if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) failures.push(`Remove unused dependency: ${dep}`);
  }
  if (!pkg.scripts?.check) failures.push("Missing package script: check");
  if (!pkg.scripts?.build) failures.push("Missing package script: build");
}

if (failures.length) {
  console.error("\nSBTS static QA failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  if (warnings.length) {
    console.warn("\nWarnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
  }
  process.exit(1);
}

console.log("SBTS static QA passed.");
if (warnings.length) {
  console.warn("\nWarnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}
