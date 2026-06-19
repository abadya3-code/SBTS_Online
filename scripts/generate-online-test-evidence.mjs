import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const resultsPath = path.join(root, "test-results", "online-results.json");
const evidenceDir = path.join(root, "docs", "evidence");
fs.mkdirSync(evidenceDir, { recursive: true });

const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-");
const outputPath = path.join(evidenceDir, `ONLINE_TEST_RUN_${stamp}.md`);

let parsed = null;
if (fs.existsSync(resultsPath)) {
  parsed = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
}

function flattenSuites(suites = []) {
  const tests = [];
  for (const suite of suites) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests ?? []) {
          const result = test.results?.[test.results.length - 1];
          tests.push({
            title: [suite.title, spec.title].filter(Boolean).join(" / "),
            status: result?.status ?? test.status ?? "unknown",
            duration: result?.duration ?? 0,
            errors: result?.errors ?? [],
          });
        }
      }
    }
    tests.push(...flattenSuites(suite.suites ?? []));
  }
  return tests;
}

const tests = parsed ? flattenSuites(parsed.suites ?? []) : [];
const passed = tests.filter(test => test.status === "passed").length;
const failed = tests.filter(test => test.status === "failed" || test.status === "timedOut").length;
const skipped = tests.filter(test => test.status === "skipped").length;

const baseUrl = process.env.SBTS_E2E_BASE_URL || "Not provided";
const commit = process.env.GITHUB_SHA || process.env.RAILWAY_GIT_COMMIT_SHA || "Manual local run";

const lines = [
  "# SBTS Online Test Evidence",
  "",
  `- Run date: ${now.toISOString()}`,
  `- Base URL: ${baseUrl}`,
  `- Commit / build: ${commit}`,
  `- Passed: ${passed}`,
  `- Failed: ${failed}`,
  `- Skipped: ${skipped}`,
  `- Report folder: playwright-report`,
  `- Raw results: test-results/online-results.json`,
  "",
  "## Test Results",
  "",
  "| Test | Status | Duration ms |",
  "|---|---:|---:|",
  ...(tests.length ? tests.map(test => `| ${test.title.replace(/\|/g, "/")} | ${test.status} | ${test.duration} |`) : ["| No Playwright JSON found | Pending | 0 |"]),
  "",
  "## Manual Evidence Checklist",
  "",
  "| Control | Evidence | Result |",
  "|---|---|---:|",
  "| Admin login | Screenshot / Playwright trace | ☐ |",
  "| Supervisor scope | Screenshot / Playwright trace | ☐ |",
  "| Technician restriction | Screenshot / Playwright trace | ☐ |",
  "| AccessControl DB binding | DB row + audit trail | ☐ |",
  "| Certificate lock | Blocked mutation evidence | ☐ |",
  "| Print layouts | Certificate/tag preview | ☐ |",
  "| Monitoring dashboard | Admin-only screenshot | ☐ |",
  "",
  "## Sign-off",
  "",
  "- Tester:",
  "- Reviewer:",
  "- Pilot approval:",
  "",
];

fs.writeFileSync(outputPath, lines.join("\n"));
console.log(`Online evidence generated: ${outputPath}`);
