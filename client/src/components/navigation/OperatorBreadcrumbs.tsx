import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

type Crumb = {
  label: string;
  href?: string;
};

const staticLabels: Record<string, string> = {
  dashboard: "Dashboard",
  areas: "Areas",
  projects: "Projects",
  blinds: "Blinds",
  "slip-blinds": "Slip Blind Center",
  approvals: "Approval Center",
  inbox: "Inbox",
  audit: "Audit Trail",
  reports: "Reports",
  settings: "System Settings",
  "workflow-studio": "Workflow Studio",
  users: "Users",
  "access-control": "Access Control",
  profile: "User Profile",
  tags: "Print Tags",
  certificates: "Print Certificates",
  certificate: "Certificate",
  tag: "Tag",
  "tag-settings": "Tag Settings",
};

function formatSegment(segment: string, index: number, previous?: string): string {
  if (staticLabels[segment]) return staticLabels[segment];
  if (previous === "projects") return `Project ${segment}`;
  if (previous === "blinds") return `Blind ${segment}`;
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || `Level ${index + 1}`;
}

function buildCrumbs(pathname: string): Crumb[] {
  const clean = pathname === "/" ? "/dashboard" : pathname.split("?")[0];
  const segments = clean.split("/").filter(Boolean);
  if (!segments.length) return [{ label: "Dashboard", href: "/dashboard" }];

  const crumbs: Crumb[] = [{ label: "Dashboard", href: "/dashboard" }];
  let href = "";

  segments.forEach((segment, index) => {
    href += `/${segment}`;
    if (index === 0 && segment === "dashboard") return;
    const label = formatSegment(segment, index, segments[index - 1]);
    crumbs.push({ label, href: index === segments.length - 1 ? undefined : href });
  });

  return crumbs;
}

type OperatorBreadcrumbsProps = {
  className?: string;
};

export function OperatorBreadcrumbs({ className = "" }: OperatorBreadcrumbsProps) {
  const [location] = useLocation();
  const crumbs = buildCrumbs(location);

  return (
    <nav
      aria-label="Operator breadcrumb"
      className={`mb-4 flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-extrabold text-slate-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/55 dark:text-slate-300 ${className}`}
    >
      <Home className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" /> : null}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="rounded-lg px-1.5 py-0.5 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white">
                {crumb.label}
              </Link>
            ) : (
              <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-slate-900 dark:bg-white/10 dark:text-white">{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
