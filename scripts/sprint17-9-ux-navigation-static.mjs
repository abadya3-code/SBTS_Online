import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  {
    file: "client/src/contexts/ThemeContext.tsx",
    contains: ["ThemeMode", "system", "sbts.themeMode.v1", "effectiveTheme"],
  },
  {
    file: "client/src/components/preferences/ThemeModeToggle.tsx",
    contains: ["ThemeModeToggle", "Light", "Dark", "System"],
  },
  {
    file: "client/src/components/navigation/OperatorBreadcrumbs.tsx",
    contains: ["OperatorBreadcrumbs", "Operator breadcrumb", "Project"],
  },
  {
    file: "client/src/components/navigation/KeyboardShortcuts.tsx",
    contains: ["KeyboardShortcuts", "Ctrl/⌘ K", "goShortcuts", "command search"],
  },
  {
    file: "client/src/components/layout/AppShell.tsx",
    contains: ["KeyboardShortcuts", "OperatorBreadcrumbs", "ThemeModeToggle"],
  },
  {
    file: "client/src/App.tsx",
    contains: ["defaultTheme=\"system\"", "switchable"],
  },
  {
    file: "docs/releases/SBTS_SPRINT17_9_UX_OPERATOR_NAVIGATION.md",
    contains: ["Sprint 17.9", "Dark Mode", "Breadcrumbs", "Keyboard Shortcuts"],
  },
];

let failures = 0;
for (const check of checks) {
  const fullPath = path.join(root, check.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing file: ${check.file}`);
    failures += 1;
    continue;
  }
  const content = fs.readFileSync(fullPath, "utf8");
  for (const needle of check.contains) {
    if (!content.includes(needle)) {
      console.error(`Missing marker in ${check.file}: ${needle}`);
      failures += 1;
    }
  }
}

if (failures) {
  console.error(`Sprint 17.9 static check failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Sprint 17.9 static UX/navigation check passed.");
