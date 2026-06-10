import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const printStyles = read("client/src/components/print/PrintStyles.tsx");
const printUtil = read("client/src/lib/printExport.ts");
const pages = [
  "client/src/pages/CertificateBuilder.tsx",
  "client/src/pages/ProjectCertificates.tsx",
  "client/src/pages/SingleTagPrint.tsx",
  "client/src/pages/TagPrint.tsx",
  "client/src/pages/ReportsExportCenter.tsx",
];

for (const token of ["@page sbtsCertificatePage", "@page sbtsTagPage", "@page sbtsReportPage", "body[data-sbts-print-mode]", "print-color-adjust"]) {
  if (!printStyles.includes(token)) failures.push(`PrintStyles missing: ${token}`);
}

for (const token of ["printWithMode", "buildPrintFileName", "SbtsPrintMode"]) {
  if (!printUtil.includes(token)) failures.push(`printExport utility missing: ${token}`);
}

for (const rel of pages) {
  const txt = read(rel);
  if (txt.includes("window.print()")) failures.push(`${rel} still calls window.print() directly.`);
  if (!txt.includes("printWithMode")) failures.push(`${rel} is not using printWithMode.`);
}

if (!read("client/src/pages/CertificateBuilder.tsx").includes("Certificate Lock")) {
  failures.push("CertificateBuilder must keep Certificate Lock panel before print.");
}

if (failures.length) {
  console.error("SBTS print production static check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("SBTS print production static check passed.");
