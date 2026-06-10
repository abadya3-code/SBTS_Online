export const SYSTEM_THEME_KEY = "sbts.systemTheme.preview.v1";

export type SbtsThemeTemplate =
  | "Template 1"
  | "Template 2 Classic"
  | "Template 3 SAP"
  | "Template 4 Custom"
  | "Template 5 Command Pro";

export type ThemePreferenceMode = "system" | "personal";

export const THEME_OPTIONS: { value: SbtsThemeTemplate; label: string; description: string }[] = [
  { value: "Template 1", label: "Future / Modern", description: "Current premium SBTS command center style." },
  { value: "Template 2 Classic", label: "Classic SBTS", description: "Closer to the original SBTS blue industrial style." },
  { value: "Template 3 SAP", label: "SAP Clean", description: "White, flat, business-focused layout with minimal decoration." },
  { value: "Template 4 Custom", label: "Custom Accent", description: "Modern SBTS with employee-selected accent color." },
  { value: "Template 5 Command Pro", label: "SBTS Command Pro", description: "Engineer-designed industrial command layout with petrol navy, signal cyan, and field-ready cards." },
];

export function themeClassFor(template?: string | null) {
  switch (template) {
    case "Template 2 Classic":
      return "theme-classic";
    case "Template 3 SAP":
      return "theme-sap";
    case "Template 4 Custom":
      return "theme-custom";
    case "Template 5 Command Pro":
      return "theme-command-pro";
    case "Template 1":
    default:
      return "theme-modern";
  }
}

export function themeDisplayName(template?: string | null) {
  return THEME_OPTIONS.find(option => option.value === template)?.label ?? "Future / Modern";
}

export function dispatchThemeChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("sbts-theme-changed"));
}
