from pathlib import Path

ROOT = Path('/home/ubuntu/sbts-professional')

files = {
    'client/index.html': r'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <meta name="description" content="SBTS Professional Edition - Smart Blind Tracking System command center for projects, blinds, workflow, and access control." />
    <title>SBTS Professional Edition</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script defer src="%VITE_ANALYTICS_ENDPOINT%/umami" data-website-id="%VITE_ANALYTICS_WEBSITE_ID%"></script>
  </body>
</html>
''',
    'client/src/index.css': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
This global stylesheet establishes a precise petrol-blue operations interface with calm whitespace, functional depth, readable IBM Plex Sans/Noto Sans Arabic typography, and restrained motion for SBTS Professional Edition.
*/
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  --radius: 0.82rem;
  --background: oklch(0.978 0.009 247.9);
  --foreground: oklch(0.205 0.034 250.2);
  --card: oklch(0.997 0.003 247.8);
  --card-foreground: oklch(0.205 0.034 250.2);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.205 0.034 250.2);
  --primary: oklch(0.375 0.112 247.3);
  --primary-foreground: oklch(0.982 0.006 247.8);
  --secondary: oklch(0.935 0.019 247.6);
  --secondary-foreground: oklch(0.275 0.061 247.4);
  --muted: oklch(0.947 0.012 247.8);
  --muted-foreground: oklch(0.491 0.037 249.7);
  --accent: oklch(0.917 0.038 222.6);
  --accent-foreground: oklch(0.255 0.077 246.8);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.884 0.022 247.4);
  --input: oklch(0.904 0.019 247.4);
  --ring: oklch(0.594 0.145 232.6);
  --chart-1: oklch(0.623 0.214 259.815);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.577 0.245 27.325);
  --chart-5: oklch(0.491 0.111 247.7);
  --sidebar: oklch(0.217 0.065 250.4);
  --sidebar-foreground: oklch(0.947 0.013 248.1);
  --sidebar-primary: oklch(0.705 0.145 232.6);
  --sidebar-primary-foreground: oklch(0.149 0.041 250.9);
  --sidebar-accent: oklch(0.294 0.071 249.6);
  --sidebar-accent-foreground: oklch(0.982 0.006 247.8);
  --sidebar-border: oklch(1 0 0 / 12%);
  --sidebar-ring: oklch(0.705 0.145 232.6);
}

.dark {
  --background: oklch(0.145 0.041 250.9);
  --foreground: oklch(0.925 0.011 248.3);
  --card: oklch(0.205 0.047 250.1);
  --card-foreground: oklch(0.925 0.011 248.3);
  --popover: oklch(0.205 0.047 250.1);
  --popover-foreground: oklch(0.925 0.011 248.3);
  --primary: oklch(0.705 0.145 232.6);
  --primary-foreground: oklch(0.145 0.041 250.9);
  --secondary: oklch(0.244 0.055 250.3);
  --secondary-foreground: oklch(0.925 0.011 248.3);
  --muted: oklch(0.244 0.055 250.3);
  --muted-foreground: oklch(0.715 0.025 249.3);
  --accent: oklch(0.294 0.071 249.6);
  --accent-foreground: oklch(0.982 0.006 247.8);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: oklch(0.705 0.145 232.6);
  --sidebar: oklch(0.133 0.038 250.8);
  --sidebar-foreground: oklch(0.925 0.011 248.3);
  --sidebar-accent: oklch(0.244 0.055 250.3);
  --sidebar-accent-foreground: oklch(0.982 0.006 247.8);
  --sidebar-border: oklch(1 0 0 / 12%);
  --sidebar-ring: oklch(0.705 0.145 232.6);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  html { scroll-behavior: smooth; }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: "IBM Plex Sans", "Noto Sans Arabic", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  button:not(:disabled),
  [role="button"]:not([aria-disabled="true"]),
  [type="button"]:not(:disabled),
  [type="submit"]:not(:disabled),
  [type="reset"]:not(:disabled),
  a[href],
  select:not(:disabled),
  input[type="checkbox"]:not(:disabled),
  input[type="radio"]:not(:disabled) { @apply cursor-pointer; }
}

@layer components {
  .container {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .flex { min-height: 0; min-width: 0; }
  .sbts-card {
    @apply rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_18px_45px_rgba(15,39,56,0.08)] backdrop-blur;
  }
  .sbts-dark-card {
    @apply rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_24px_80px_rgba(2,8,23,0.32)] backdrop-blur;
  }
  .status-dot { @apply h-2.5 w-2.5 rounded-full ring-4 ring-white/80; }
  .industrial-grid {
    background-image:
      linear-gradient(rgba(23, 76, 126, 0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(23, 76, 126, 0.07) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  @media (min-width: 640px) { .container { padding-left: 1.5rem; padding-right: 1.5rem; } }
  @media (min-width: 1024px) { .container { padding-left: 2rem; padding-right: 2rem; max-width: 1440px; } }
}
''',
    'client/src/App.tsx': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
This application root keeps SBTS routes inside a persistent operational shell instead of isolated pages, so navigation, context, and access-control decisions remain visible and maintainable.
*/
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppShell } from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import AccessControl from "./pages/AccessControl";
import Projects from "./pages/Projects";
import Blinds from "./pages/Blinds";
import NotFound from "./pages/NotFound";
import { Route, Switch } from "wouter";

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/blinds" component={Blinds} />
        <Route path="/access-control" component={AccessControl} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
''',
    'client/src/lib/mockData.ts': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
This file centralizes current frontend domain models and mock data so future API integration can replace one source of truth without scattering sample objects across pages.
*/
import { Activity, BarChart3, ClipboardCheck, FileText, FolderKanban, Gauge, ListChecks, LockKeyhole, MapPin, ShieldCheck, SlidersHorizontal, Users, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PhaseKey = "broken" | "assembly" | "tightTorque" | "finalTight" | "inspectionReady";
export type RoleKey = "admin" | "coordinator" | "technician" | "qc" | "safety" | "inspection" | "tiEngineer" | "metalForeman";

export type Permission = {
  key: string;
  label: string;
  description: string;
  group: string;
};

export type RoleModel = {
  key: RoleKey;
  name: string;
  subtitle: string;
  members: number;
  color: string;
  permissionKeys: string[];
  menuKeys: string[];
  phaseKeys: PhaseKey[];
};

export const appMeta = {
  title: "SBTS Professional",
  subtitle: "Smart Blind Tracking System",
  site: "Shedgum Gas Plant",
  version: "React Frontend Alpha",
};

export const navItems: { key: string; label: string; path: string; icon: LucideIcon; description: string }[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: Gauge, description: "Operational command overview" },
  { key: "projects", label: "Projects", path: "/projects", icon: FolderKanban, description: "Projects and areas" },
  { key: "blinds", label: "Blinds", path: "/blinds", icon: ListChecks, description: "Blind registry and phases" },
  { key: "access-control", label: "Access Control", path: "/access-control", icon: ShieldCheck, description: "Roles, permissions, workflow" },
];

export const secondaryNavItems: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "audit", label: "Audit Logs", icon: Activity },
  { key: "settings", label: "System Settings", icon: SlidersHorizontal },
];

export const phases: { key: PhaseKey; label: string; color: string; count: number; owner: string }[] = [
  { key: "broken", label: "Broken / Preparation", color: "#ef4444", count: 16, owner: "Coordinator" },
  { key: "assembly", label: "Assembly", color: "#f59e0b", count: 22, owner: "Technician" },
  { key: "tightTorque", label: "Tight & Torque", color: "#eab308", count: 18, owner: "T&I Engineer" },
  { key: "finalTight", label: "Final Tight", color: "#22c55e", count: 31, owner: "QC Inspector" },
  { key: "inspectionReady", label: "Inspection Ready", color: "#3b82f6", count: 12, owner: "Inspection" },
];

export const permissionGroups: { group: string; icon: LucideIcon; permissions: Permission[] }[] = [
  {
    group: "Projects & Areas",
    icon: FolderKanban,
    permissions: [
      { key: "projects.view", label: "View projects", description: "Read project and area lists", group: "Projects & Areas" },
      { key: "projects.create", label: "Create project", description: "Open new project records", group: "Projects & Areas" },
      { key: "projects.edit", label: "Edit project", description: "Update project details and areas", group: "Projects & Areas" },
      { key: "projects.delete", label: "Delete project", description: "Archive or remove project data", group: "Projects & Areas" },
    ],
  },
  {
    group: "Blind Registry",
    icon: ClipboardCheck,
    permissions: [
      { key: "blinds.view", label: "View blinds", description: "Read blind registry and QR pages", group: "Blind Registry" },
      { key: "blinds.create", label: "Create blind", description: "Add field blind records", group: "Blind Registry" },
      { key: "blinds.edit", label: "Edit blind", description: "Modify blind details and metadata", group: "Blind Registry" },
      { key: "blinds.phase.change", label: "Change phase", description: "Move a blind through workflow", group: "Blind Registry" },
      { key: "blinds.delete", label: "Delete blind", description: "Archive or delete blind records", group: "Blind Registry" },
    ],
  },
  {
    group: "Workflow & Sign-off",
    icon: Wrench,
    permissions: [
      { key: "workflow.view", label: "View workflow", description: "Read workflow ownership rules", group: "Workflow & Sign-off" },
      { key: "workflow.configure", label: "Configure workflow", description: "Change owners, gates, and sign-off rules", group: "Workflow & Sign-off" },
      { key: "workflow.approve", label: "Approve task", description: "Apply approval on assigned phases", group: "Workflow & Sign-off" },
      { key: "workflow.override", label: "Emergency override", description: "Use controlled admin override", group: "Workflow & Sign-off" },
    ],
  },
  {
    group: "Users, Roles & Audit",
    icon: LockKeyhole,
    permissions: [
      { key: "users.view", label: "View users", description: "Read users and specialties", group: "Users, Roles & Audit" },
      { key: "users.manage", label: "Manage users", description: "Create, approve, suspend users", group: "Users, Roles & Audit" },
      { key: "roles.manage", label: "Manage roles", description: "Edit role templates and permissions", group: "Users, Roles & Audit" },
      { key: "audit.view", label: "View audit logs", description: "Read system activity trail", group: "Users, Roles & Audit" },
    ],
  },
  {
    group: "Reports & Certificates",
    icon: FileText,
    permissions: [
      { key: "reports.view", label: "View reports", description: "Open dashboard and report cards", group: "Reports & Certificates" },
      { key: "reports.export", label: "Export reports", description: "Download CSV/PDF summaries", group: "Reports & Certificates" },
      { key: "certificates.manage", label: "Manage certificates", description: "Configure certificate templates", group: "Reports & Certificates" },
      { key: "qr.manage", label: "Manage QR tags", description: "Generate or reissue QR links", group: "Reports & Certificates" },
    ],
  },
];

const allPermissionKeys = permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.key));

export const initialRoles: RoleModel[] = [
  {
    key: "admin",
    name: "Administrator",
    subtitle: "Full platform owner and emergency override",
    members: 2,
    color: "#38bdf8",
    permissionKeys: allPermissionKeys,
    menuKeys: ["dashboard", "projects", "blinds", "access-control", "reports", "audit", "settings"],
    phaseKeys: phases.map((phase) => phase.key),
  },
  {
    key: "coordinator",
    name: "Coordinator",
    subtitle: "Project setup, area control, assignment follow-up",
    members: 4,
    color: "#60a5fa",
    permissionKeys: ["projects.view", "projects.create", "projects.edit", "blinds.view", "blinds.create", "blinds.edit", "workflow.view", "reports.view", "users.view"],
    menuKeys: ["dashboard", "projects", "blinds", "reports"],
    phaseKeys: ["broken"],
  },
  {
    key: "technician",
    name: "Technician",
    subtitle: "Field execution and blind status updates",
    members: 18,
    color: "#f59e0b",
    permissionKeys: ["projects.view", "blinds.view", "blinds.phase.change", "workflow.view", "workflow.approve", "qr.manage"],
    menuKeys: ["dashboard", "blinds"],
    phaseKeys: ["assembly"],
  },
  {
    key: "qc",
    name: "QC Inspector",
    subtitle: "Quality verification and final tightening approval",
    members: 7,
    color: "#22c55e",
    permissionKeys: ["projects.view", "blinds.view", "blinds.phase.change", "workflow.view", "workflow.approve", "reports.view", "audit.view"],
    menuKeys: ["dashboard", "blinds", "reports", "audit"],
    phaseKeys: ["finalTight", "inspectionReady"],
  },
  {
    key: "safety",
    name: "Safety Officer",
    subtitle: "Safety oversight, restrictions, and compliance review",
    members: 5,
    color: "#ef4444",
    permissionKeys: ["projects.view", "blinds.view", "workflow.view", "workflow.approve", "reports.view", "audit.view"],
    menuKeys: ["dashboard", "blinds", "reports", "audit"],
    phaseKeys: ["broken", "inspectionReady"],
  },
  {
    key: "tiEngineer",
    name: "T&I Engineer",
    subtitle: "Torque gate owner and technical validation",
    members: 6,
    color: "#eab308",
    permissionKeys: ["projects.view", "blinds.view", "blinds.phase.change", "workflow.view", "workflow.approve", "reports.view"],
    menuKeys: ["dashboard", "blinds", "reports"],
    phaseKeys: ["tightTorque"],
  },
];

export const projects = [
  { id: "PRJ-1027", name: "Shedgum Train-4 Shutdown", area: "SGP-04", blinds: 42, progress: 74, status: "Active" },
  { id: "PRJ-1033", name: "North Manifold Isolation", area: "NMG-02", blinds: 31, progress: 58, status: "Active" },
  { id: "PRJ-1041", name: "Utility Header Maintenance", area: "UHM-01", blinds: 26, progress: 91, status: "Final Review" },
];

export const blindRows = [
  { tag: "SB-4219", project: "Shedgum Train-4 Shutdown", area: "SGP-04", type: "Slip Blind", size: "12 in", phase: "Final Tight", owner: "QC Inspector", priority: "High" },
  { tag: "SB-4244", project: "North Manifold Isolation", area: "NMG-02", type: "Spectacle Blind", size: "8 in", phase: "Assembly", owner: "Technician", priority: "Normal" },
  { tag: "SB-4302", project: "Utility Header Maintenance", area: "UHM-01", type: "Slip Blind", size: "16 in", phase: "Inspection Ready", owner: "Inspection", priority: "High" },
  { tag: "SB-4338", project: "Shedgum Train-4 Shutdown", area: "SGP-04", type: "Spacer", size: "6 in", phase: "Tight & Torque", owner: "T&I Engineer", priority: "Normal" },
];

export const recentEvents = [
  { title: "Role template consolidated", detail: "Workflow permissions moved into Access Control", time: "09:42", type: "SYSTEM" },
  { title: "SB-4219 phase changed", detail: "Final Tight approved by QC Inspector", time: "08:57", type: "BLIND" },
  { title: "New technician pending", detail: "User request routed to Administrator", time: "08:21", type: "USER" },
];

export const menuCatalog = [...navItems, ...secondaryNavItems].map((item) => ({ key: item.key, label: item.label, icon: item.icon }));
''',
    'client/src/components/layout/AppShell.tsx': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
The shell behaves like an operations room frame: stable navigation, strong context header, and responsive access to critical areas without visual noise.
*/
import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, ChevronDown, Menu, Search, ShieldCheck, X } from "lucide-react";
import { appMeta, navItems, secondaryNavItems } from "@/lib/mockData";
import { toast } from "sonner";

const heroUrl = "https://d2xsxph8kpxj0f.cloudfront.net/95256836/T9nk6A5dkk7H7GaCBwTuhX/sbts-command-center-hero-UhGNvmibStQht4VPE3rmFJ.webp";

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const showComingSoon = (label: string) => {
    toast.info(`${label} will be connected after the core frontend migration is stabilized.`);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-100 text-slate-950 industrial-grid">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(23,76,126,0.18),transparent_38%)]" />

      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[290px] transform border-r border-white/10 bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="relative overflow-hidden border-b border-white/10 p-5">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url(${heroUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="relative flex items-center justify-between gap-3">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 ring-1 ring-cyan-200/25">
                  <ShieldCheck className="h-6 w-6 text-cyan-200" />
                </div>
                <div>
                  <div className="text-base font-extrabold tracking-tight">SBTS</div>
                  <div className="text-xs font-medium text-slate-300">Professional Edition</div>
                </div>
              </Link>
              <button className="rounded-xl p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Command</div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location === item.path || (location === "/" && item.path === "/dashboard");
                return (
                  <Link
                    key={item.key}
                    href={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-cyan-300/15 text-white shadow-[inset_3px_0_0_rgba(103,232,249,0.9)]" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-cyan-200" : "text-slate-400 group-hover:text-cyan-200"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-7 mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Next Modules</div>
            <div className="space-y-1.5">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-400 transition hover:bg-white/8 hover:text-white" onClick={() => showComingSoon(item.label)}>
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-200 text-sm font-extrabold text-slate-950">AD</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">Admin Control</div>
                  <div className="truncate text-xs text-slate-400">Centralized permissions</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative z-10 min-h-screen lg:pl-[290px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/78 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">{appMeta.title}</h1>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">{appMeta.version}</span>
              </div>
              <p className="mt-0.5 truncate text-xs font-medium text-slate-500 sm:text-sm">{appMeta.site} · {appMeta.subtitle}</p>
            </div>
            <div className="hidden min-w-[280px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 shadow-inner md:flex">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search blind tag, project, area...</span>
            </div>
            <button className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700" onClick={() => showComingSoon("Notifications") } aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-slate-950">3</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
''',
    'client/src/components/common/PageHeader.tsx': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
Page headers communicate operational context first: title, owner, status, and a restrained action area that can grow without breaking page structure.
*/
import { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.26em] text-cyan-700">{eyebrow}</div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
''',
    'client/src/pages/Dashboard.tsx': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
The dashboard functions as the first operations-room view: high signal, low clutter, with statuses, ownership, and risk surfaced before decorative content.
*/
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Clock3, FileWarning, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { blindRows, phases, projects, recentEvents } from "@/lib/mockData";

const heroUrl = "https://d2xsxph8kpxj0f.cloudfront.net/95256836/T9nk6A5dkk7H7GaCBwTuhX/sbts-command-center-hero-UhGNvmibStQht4VPE3rmFJ.webp";
const fieldUrl = "https://d2xsxph8kpxj0f.cloudfront.net/95256836/T9nk6A5dkk7H7GaCBwTuhX/sbts-field-qr-blind-tag-ib8jkhZ5Q9DrAYW7LZ3mVY.webp";

export default function Dashboard() {
  const totalBlinds = phases.reduce((sum, phase) => sum + phase.count, 0);
  const completed = phases.find((phase) => phase.key === "finalTight")?.count ?? 0;
  const completion = Math.round((completed / totalBlinds) * 100);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-900/10 bg-slate-950 text-white shadow-[0_26px_90px_rgba(15,39,56,0.28)]">
        <div className="absolute inset-0 opacity-80" style={{ backgroundImage: `url(${heroUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/82 to-slate-950/30" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
              <ShieldCheck className="h-4 w-4" /> Access-first migration
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">SBTS command center rebuilt for maintainable React architecture.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">The new frontend starts with a centralized Access Control Center, clear domain boundaries, and responsive operational views for mobile field users, tablets, and desktop supervisors.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/access-control" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-200">
                Open Access Control <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/blinds" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">
                Review Blind Registry
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Tracked blinds", value: totalBlinds, icon: FileWarning, tone: "text-cyan-200" },
              { label: "Completion", value: `${completion}%`, icon: TrendingUp, tone: "text-emerald-300" },
              { label: "Active roles", value: 8, icon: Users, tone: "text-amber-200" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="sbts-dark-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-300">{item.label}</span>
                    <Icon className={`h-5 w-5 ${item.tone}`} />
                  </div>
                  <div className="mt-3 text-3xl font-extrabold tracking-tight">{item.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="sbts-card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950">Workflow phase ownership</h3>
              <p className="mt-1 text-sm text-slate-500">Phase responsibility is now designed to come from one access-control model.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Live model draft</span>
          </div>
          <div className="space-y-3">
            {phases.map((phase) => (
              <div key={phase.key} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-200 hover:shadow-md">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="status-dot" style={{ backgroundColor: phase.color }} />
                    <div>
                      <div className="font-extrabold text-slate-900">{phase.label}</div>
                      <div className="text-xs font-semibold text-slate-500">Owner: {phase.owner}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-950">{phase.count}</div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, phase.count * 2.4)}%`, backgroundColor: phase.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="sbts-card overflow-hidden">
            <img src={fieldUrl} alt="Industrial blind tag QR field illustration" className="h-52 w-full object-cover" />
            <div className="p-5">
              <h3 className="text-lg font-extrabold text-slate-950">Field-ready QR visibility</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">The frontend structure is prepared for a public QR route where field teams can scan a blind tag and instantly see status, history, and approval context.</p>
            </div>
          </div>

          <div className="sbts-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-950">Recent activity</h3>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={`${event.title}-${event.time}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><CheckCircle2 className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-slate-900">{event.title}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-400">{event.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sbts-card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-extrabold text-slate-950">Current blind focus</h3>
          <p className="mt-1 text-sm text-slate-500">Representative registry view that will later connect to the Node + SQL backend.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Tag</th><th className="px-5 py-3">Project</th><th className="px-5 py-3">Area</th><th className="px-5 py-3">Phase</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blindRows.map((blind) => (
                <tr key={blind.tag} className="bg-white transition hover:bg-cyan-50/40">
                  <td className="px-5 py-4 font-extrabold text-slate-950">{blind.tag}</td>
                  <td className="px-5 py-4 text-slate-600">{blind.project}</td>
                  <td className="px-5 py-4 text-slate-600">{blind.area}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{blind.phase}</span></td>
                  <td className="px-5 py-4 text-slate-600">{blind.owner}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${blind.priority === "High" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{blind.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
''',
    'client/src/pages/AccessControl.tsx': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
Access Control Center centralizes scattered settings, user permissions, workflow ownership, and menu visibility into one maintainable role-based operating model.
*/
import { useMemo, useState } from "react";
import { Check, ChevronRight, Copy, Eye, GitBranch, LockKeyhole, Plus, Save, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { initialRoles, menuCatalog, permissionGroups, phases, type RoleModel } from "@/lib/mockData";

const tabs = [
  { key: "system", label: "System Access", icon: LockKeyhole },
  { key: "workflow", label: "Workflow Tasks", icon: GitBranch },
  { key: "visibility", label: "Menu Visibility", icon: Eye },
  { key: "scope", label: "People Scope", icon: Users },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function hasItem(items: string[], key: string) {
  return items.includes(key);
}

function toggleItem(items: string[], key: string) {
  return items.includes(key) ? items.filter((item) => item !== key) : [...items, key];
}

export default function AccessControl() {
  const [roles, setRoles] = useState<RoleModel[]>(initialRoles);
  const [activeRoleKey, setActiveRoleKey] = useState(initialRoles[0].key);
  const [activeTab, setActiveTab] = useState<TabKey>("system");

  const activeRole = useMemo(() => roles.find((role) => role.key === activeRoleKey) ?? roles[0], [roles, activeRoleKey]);
  const allPermissionsCount = permissionGroups.flatMap((group) => group.permissions).length;

  function updateRole(updater: (role: RoleModel) => RoleModel) {
    setRoles((current) => current.map((role) => (role.key === activeRole.key ? updater(role) : role)));
  }

  function togglePermission(key: string) {
    updateRole((role) => ({ ...role, permissionKeys: toggleItem(role.permissionKeys, key) }));
  }

  function togglePhase(key: string) {
    updateRole((role) => ({ ...role, phaseKeys: toggleItem(role.phaseKeys, key) as RoleModel["phaseKeys"] }));
  }

  function toggleMenu(key: string) {
    updateRole((role) => ({ ...role, menuKeys: toggleItem(role.menuKeys, key) }));
  }

  function saveDraft() {
    toast.success("Access control draft saved locally. Backend persistence will be connected in the Node + SQL phase.");
  }

  function duplicateRole() {
    const copy: RoleModel = {
      ...activeRole,
      key: `${activeRole.key}-copy` as RoleModel["key"],
      name: `${activeRole.name} Copy`,
      members: 0,
    };
    setRoles((current) => [...current, copy]);
    setActiveRoleKey(copy.key);
    toast.info("Role template duplicated for review.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Unified governance"
        title="Access Control Center"
        description="A single place for roles, permissions, workflow ownership, menu visibility, and user scope. This replaces scattered controls in Settings, Users, and Workflow Control."
        actions={
          <>
            <button onClick={duplicateRole} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700">
              <Copy className="h-4 w-4" /> Duplicate role
            </button>
            <button onClick={saveDraft} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800">
              <Save className="h-4 w-4" /> Save model
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="sbts-card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-950">Role templates</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Edit once, apply everywhere.</p>
              </div>
              <button className="rounded-2xl bg-cyan-50 p-2.5 text-cyan-700 ring-1 ring-cyan-100 transition hover:bg-cyan-100" onClick={() => toast.info("New role creation will open a guided role wizard in the next iteration.")} aria-label="Add role">
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-2 p-3">
            {roles.map((role) => {
              const active = role.key === activeRole.key;
              return (
                <button key={role.key} onClick={() => setActiveRoleKey(role.key)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-cyan-200 bg-cyan-50 shadow-sm" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: role.color }}>
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-extrabold text-slate-950">{role.name}</div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{role.subtitle}</div>
                    </div>
                    <ChevronRight className={`h-5 w-5 ${active ? "text-cyan-700" : "text-slate-300"}`} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white/70 px-2 py-2"><div className="text-sm font-extrabold text-slate-950">{role.members}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Users</div></div>
                    <div className="rounded-xl bg-white/70 px-2 py-2"><div className="text-sm font-extrabold text-slate-950">{role.permissionKeys.length}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Perms</div></div>
                    <div className="rounded-xl bg-white/70 px-2 py-2"><div className="text-sm font-extrabold text-slate-950">{role.phaseKeys.length}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phases</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="sbts-card overflow-hidden">
          <div className="border-b border-slate-200 bg-white px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md" style={{ backgroundColor: activeRole.color }}>
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-xl font-extrabold tracking-tight text-slate-950">{activeRole.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{activeRole.subtitle}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-2 text-center ring-1 ring-slate-200">
                <div className="px-3 py-2"><div className="text-lg font-extrabold text-slate-950">{Math.round((activeRole.permissionKeys.length / allPermissionsCount) * 100)}%</div><div className="text-[10px] font-bold uppercase text-slate-400">Access</div></div>
                <div className="px-3 py-2"><div className="text-lg font-extrabold text-slate-950">{activeRole.phaseKeys.length}</div><div className="text-[10px] font-bold uppercase text-slate-400">Tasks</div></div>
                <div className="px-3 py-2"><div className="text-lg font-extrabold text-slate-950">{activeRole.menuKeys.length}</div><div className="text-[10px] font-bold uppercase text-slate-400">Menus</div></div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50/60 px-3 py-3 sm:px-5">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition ${active ? "bg-slate-950 text-white shadow-lg" : "text-slate-600 hover:bg-white hover:text-slate-950"}`}>
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "system" && (
              <div className="space-y-4">
                {permissionGroups.map((group) => {
                  const Icon = group.icon;
                  return (
                    <div key={group.group} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                        <Icon className="h-5 w-5 text-cyan-700" />
                        <div className="font-extrabold text-slate-950">{group.group}</div>
                      </div>
                      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                        {group.permissions.map((permission) => {
                          const checked = hasItem(activeRole.permissionKeys, permission.key);
                          return (
                            <button key={permission.key} onClick={() => togglePermission(permission.key)} className={`rounded-2xl border p-4 text-left transition ${checked ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="font-extrabold text-slate-900">{permission.label}</div>
                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-300 bg-white text-transparent"}`}><Check className="h-4 w-4" /></span>
                              </div>
                              <p className="text-xs leading-5 text-slate-500">{permission.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "workflow" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-cyan-950">
                  Workflow ownership is controlled by role templates. If a role owns a phase, users in that role can see and act on the corresponding phase tasks according to their system permissions.
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {phases.map((phase) => {
                    const checked = hasItem(activeRole.phaseKeys, phase.key);
                    return (
                      <button key={phase.key} onClick={() => togglePhase(phase.key)} className={`rounded-2xl border p-5 text-left transition ${checked ? "border-cyan-200 bg-cyan-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="status-dot" style={{ backgroundColor: phase.color }} />
                            <div>
                              <div className="font-extrabold text-slate-950">{phase.label}</div>
                              <div className="mt-1 text-xs font-semibold text-slate-500">Current owner in draft: {checked ? activeRole.name : phase.owner}</div>
                            </div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${checked ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-500"}`}>{checked ? "Assigned" : "Not assigned"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "visibility" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {menuCatalog.map((menu) => {
                  const Icon = menu.icon;
                  const checked = hasItem(activeRole.menuKeys, menu.key);
                  return (
                    <button key={menu.key} onClick={() => toggleMenu(menu.key)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${checked ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${checked ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-500"}`}><Icon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-950">{menu.label}</div>
                        <div className="mt-1 text-xs text-slate-500">{checked ? "Visible in sidebar" : "Hidden from role"}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === "scope" && (
              <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center gap-3"><Users className="h-5 w-5 text-cyan-700" /><h3 className="font-extrabold text-slate-950">User and project scope</h3></div>
                  <p className="text-sm leading-6 text-slate-600">This tab will connect each role to allowed projects, areas, specialties, and individual user overrides. Keeping it here prevents permission logic from leaking back into Settings, Users, or Workflow Control.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Project scope", "All active projects"],
                      ["Area scope", "Assigned areas only"],
                      ["Override policy", "Admin approval required"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-2 text-sm font-extrabold text-slate-900">{value}</div></div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="mb-3 flex items-center gap-2 text-amber-900"><SlidersHorizontal className="h-5 w-5" /><div className="font-extrabold">Engineering note</div></div>
                  <p className="text-sm leading-6 text-amber-950/80">In the backend phase, this screen should save to normalized tables: roles, permissions, role_permissions, role_menu_visibility, workflow_phase_owners, and user_project_assignments.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
''',
    'client/src/pages/Projects.tsx': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
The projects page frames each project as an operational container with progress, area, and registry load visible at a glance.
*/
import { ArrowRight, MapPin, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { projects } from "@/lib/mockData";
import { toast } from "sonner";

export default function Projects() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project control"
        title="Projects & Areas"
        description="A structured React page for the project domain. In the backend phase, this will connect to PostgreSQL project and area tables."
        actions={<button onClick={() => toast.info("Project creation form will be implemented after the domain model is approved.")} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"><Plus className="h-4 w-4" /> New project</button>}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {projects.map((project) => (
          <article key={project.id} className="sbts-card p-5 transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,39,56,0.13)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">{project.id}</div>
                <h3 className="mt-2 text-lg font-extrabold text-slate-950">{project.name}</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">{project.status}</span>
            </div>
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-500"><MapPin className="h-4 w-4" /> {project.area} · {project.blinds} blinds</div>
            <div className="mb-3 flex items-center justify-between text-sm"><span className="font-bold text-slate-600">Progress</span><span className="font-extrabold text-slate-950">{project.progress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600" style={{ width: `${project.progress}%` }} /></div>
            <button className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-cyan-700 hover:text-cyan-900">Open project <ArrowRight className="h-4 w-4" /></button>
          </article>
        ))}
      </div>
    </div>
  );
}
''',
    'client/src/pages/Blinds.tsx': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
The blind registry emphasizes scan-friendly status, ownership, and phase visibility for field and desktop users.
*/
import { Plus, QrCode } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { blindRows } from "@/lib/mockData";
import { toast } from "sonner";

export default function Blinds() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Blind registry"
        title="Blinds"
        description="A maintainable registry view prepared for QR deep links, workflow status, and field approvals."
        actions={<button onClick={() => toast.info("Blind creation wizard will be connected after the core registry model is finalized.")} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"><Plus className="h-4 w-4" /> New blind</button>}
      />
      <div className="sbts-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-5 py-3">QR</th><th className="px-5 py-3">Tag</th><th className="px-5 py-3">Project</th><th className="px-5 py-3">Area</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Size</th><th className="px-5 py-3">Phase</th><th className="px-5 py-3">Owner</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blindRows.map((blind) => (
                <tr key={blind.tag} className="bg-white transition hover:bg-cyan-50/40">
                  <td className="px-5 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><QrCode className="h-5 w-5" /></div></td>
                  <td className="px-5 py-4 font-extrabold text-slate-950">{blind.tag}</td>
                  <td className="px-5 py-4 text-slate-600">{blind.project}</td>
                  <td className="px-5 py-4 text-slate-600">{blind.area}</td>
                  <td className="px-5 py-4 text-slate-600">{blind.type}</td>
                  <td className="px-5 py-4 text-slate-600">{blind.size}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-800 ring-1 ring-cyan-100">{blind.phase}</span></td>
                  <td className="px-5 py-4 text-slate-600">{blind.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
''',
    'client/src/pages/NotFound.tsx': r'''/*
Design Philosophy: Industrial Command Center Minimalism.
The fallback page preserves the operational shell and provides a clear route back to the command center.
*/
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="sbts-card mx-auto max-w-2xl p-8 text-center">
      <div className="text-xs font-extrabold uppercase tracking-[0.26em] text-cyan-700">Route not found</div>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">This operations panel does not exist yet.</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Return to the command dashboard and continue reviewing the new SBTS frontend structure.</p>
      <Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800">Back to Dashboard</Link>
    </div>
  );
}
''',
}

for relative_path, content in files.items():
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')

print(f"Wrote {len(files)} frontend files for SBTS Professional Edition.")
