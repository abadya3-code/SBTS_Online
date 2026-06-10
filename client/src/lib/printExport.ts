export type SbtsPrintMode = "certificate" | "certificate-package" | "tag" | "tag-register" | "report";

export function printWithMode(mode: SbtsPrintMode, title?: string) {
  if (typeof window === "undefined") return;
  const previousMode = document.body.dataset.sbtsPrintMode;
  const previousTitle = document.title;
  document.body.dataset.sbtsPrintMode = mode;
  if (title) document.title = title;

  window.setTimeout(() => {
    window.print();
    window.setTimeout(() => {
      if (previousMode) document.body.dataset.sbtsPrintMode = previousMode;
      else delete document.body.dataset.sbtsPrintMode;
      document.title = previousTitle;
    }, 750);
  }, 150);
}

export function buildPrintFileName(prefix: string, key?: string | null) {
  const safeKey = String(key ?? "package").replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "");
  return `${prefix}_${safeKey}_${new Date().toISOString().slice(0, 10)}`;
}
