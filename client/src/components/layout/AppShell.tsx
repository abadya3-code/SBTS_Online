import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { isAdminProfile, readSecurityProfile, type SecurityProfile } from "@/lib/security";
import { clearAuthSession, readAuthSession } from "@/lib/auth";
import { readUserProfile } from "@/lib/userProfile";
import { themeClassFor } from "@/lib/themeEngine";
import { Activity, BarChart3, Bell, FolderKanban, Gauge, GitBranch, Inbox, LayoutDashboard, Layers3, LogOut, Mail, MapPinned, Menu, Settings, ShieldCheck, SlidersHorizontal, UsersRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCorporateIdentity, initialsFromCompanyName } from "@/lib/corporateIdentity";
import { KeyboardShortcuts } from "@/components/navigation/KeyboardShortcuts";
import { OperatorBreadcrumbs } from "@/components/navigation/OperatorBreadcrumbs";
import { ThemeModeToggle } from "@/components/preferences/ThemeModeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/areas", label: "Areas", icon: MapPinned },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/slip-blinds", label: "Slip Blind", icon: Layers3 },
  { href: "/approvals", label: "Approval Center", icon: Inbox },
  { href: "/audit", label: "Audit Trail", icon: Activity, adminOnly: true },
  { href: "/monitoring", label: "Monitoring", icon: Gauge, adminOnly: true },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
  { href: "/workflow-studio", label: "Workflow Studio", icon: GitBranch, adminOnly: true },
  { href: "/users", label: "Users", icon: UsersRound, adminOnly: true },
  { href: "/access-control", label: "Access Control", icon: ShieldCheck, adminOnly: true },
];

type AppShellProps = { children: ReactNode };

const APP_VERSION_SETTING_KEY = "general.appVersionNumber";



function isActiveRoute(location: string, href: string) {
  if (href === "/dashboard") return location === "/" || location === "/dashboard";
  if (href === "/projects") return location === "/projects" || location.startsWith("/projects/");
  if (href === "/slip-blinds") return location === "/slip-blinds";
  return location === href;
}

export function AppShell({ children }: AppShellProps) {
  const [location, setLocation] = useLocation();
  const [profile, setProfile] = useState<SecurityProfile>(() => readSecurityProfile());
  const [session, setSession] = useState(() => readAuthSession());
  const [userPrefs, setUserPrefs] = useState(() => readUserProfile());
  useEffect(() => {
    const handler = () => {
      setProfile(readSecurityProfile());
      setSession(readAuthSession());
      setUserPrefs(readUserProfile());
    };
    window.addEventListener("sbts-security-profile-changed", handler);
    window.addEventListener("sbts-auth-session-changed", handler);
    window.addEventListener("storage", handler);
    window.addEventListener("sbts-user-profile-changed", handler);
    window.addEventListener("sbts-theme-changed", handler);
    return () => {
      window.removeEventListener("sbts-security-profile-changed", handler);
      window.removeEventListener("sbts-auth-session-changed", handler);
      window.removeEventListener("storage", handler);
      window.removeEventListener("sbts-user-profile-changed", handler);
      window.removeEventListener("sbts-theme-changed", handler);
    };
  }, []);
  const visibleNavItems = useMemo(() => navItems.filter(item => !item.adminOnly || isAdminProfile(profile)), [profile]);
  const settingsQuery = trpc.core.systemSettings.useQuery(undefined, { staleTime: 20_000 });
  useEffect(() => {
    const refetchSettings = () => { void settingsQuery.refetch(); };
    window.addEventListener("sbts-theme-changed", refetchSettings);
    window.addEventListener("sbts-system-settings-changed", refetchSettings);
    return () => {
      window.removeEventListener("sbts-theme-changed", refetchSettings);
      window.removeEventListener("sbts-system-settings-changed", refetchSettings);
    };
  }, [settingsQuery.refetch]);
  const general = settingsQuery.data?.general;
  const systemName = general?.systemName ?? "Smart Blind Tag System";
  const facilityName = general?.facilityName ?? "Shedgum Gas Plant";
  const departmentName = general?.departmentName ?? "Maintenance";
  const logoText = general?.logoText ?? "SBTS Professional";
  const logoUrl = (general as any)?.logoUrl ?? "";
  const appVersion = (general as any)?.appVersionNumber ?? "V1.0";
  const releaseName = (general as any)?.releaseName ?? "Pilot Live";
  const releaseYear = (general as any)?.releaseYear ?? "2026";
  const sessionModeLabel = session.loginMethod === "production-bound" ? "Live database" : "Demo session";
  const corporate = getCorporateIdentity(general as any);
  const identityLogo = corporate.companyLogo || logoUrl;
  const identityInitials = initialsFromCompanyName(corporate.companyShortName || systemName);
  const personalThemeEnabled = userPrefs.themePreferenceMode === "personal";
  const themeTemplate = personalThemeEnabled ? (userPrefs.themeTemplate ?? "Template 1") : (general?.themeTemplate ?? "Template 1");
  const customAccent = personalThemeEnabled ? (userPrefs.customAccentColor ?? "#0891b2") : ((general as any)?.customAccentColor ?? "#0891b2");
  const avatar = userPrefs.avatarDataUrl ?? "";
  const themeClass = themeClassFor(themeTemplate);
  const today = new Date().toLocaleDateString("en-GB");

  if (themeTemplate === "Template 5 Command Pro") {
    const groupedNav = [
      { label: "Operations", items: visibleNavItems.filter(item => ["/dashboard", "/areas", "/projects", "/slip-blinds"].includes(item.href)) },
      { label: "Control", items: visibleNavItems.filter(item => ["/approvals", "/workflow-studio", "/audit", "/monitoring"].includes(item.href)) },
      { label: "Intelligence", items: visibleNavItems.filter(item => ["/reports"].includes(item.href)) },
      { label: "Administration", items: visibleNavItems.filter(item => ["/settings", "/users", "/access-control"].includes(item.href)) },
    ].filter(group => group.items.length > 0);

    return (
      <>
      <KeyboardShortcuts navItems={visibleNavItems} />
      <div data-sbts-theme={themeTemplate} className="theme-command-pro min-h-screen text-slate-100" style={{ "--sbts-accent": customAccent } as CSSProperties}>
        <div className="command-shell min-h-screen">
          <aside className="command-sidebar hidden lg:flex">
            <button onClick={() => setLocation("/dashboard")} className="command-sidebar-head" aria-label="Open dashboard">
              <div className="command-brand-row">
                <div className="command-brand-logo">
                  {identityLogo ? <img src={identityLogo} alt="Company logo" /> : <span>{identityInitials}</span>}
                </div>
                <div className="min-w-0 text-left">
                  <div className="command-company-name">{corporate.showName ? corporate.companyShortName || corporate.companyName : facilityName}</div>
                  <div className="command-system-title">{systemName}</div>
                  <div className="command-system-sub">{facilityName} · {departmentName}</div>
                </div>
              </div>
            </button>

            <button onClick={() => setLocation("/profile")} className="command-operator-card">
              <div className="command-operator-avatar">{avatar ? <img src={avatar} alt="User" /> : profile.initials}</div>
              <div className="min-w-0 text-left">
                <div className="command-operator-name">{profile.fullName}</div>
                <div className="command-operator-meta">{profile.roleLabel} · {profile.badge}</div>
                <div className="command-operator-status"><span /> Active session</div>
              </div>
            </button>

            <nav className="command-nav">
              {groupedNav.map(group => (
                <section key={group.label} className="command-nav-group">
                  <div className="command-nav-label">{group.label}</div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(location, item.href);
                    return (
                      <Link key={item.href} href={item.href} className={`command-nav-link ${active ? "active" : ""}`}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </section>
              ))}
            </nav>

            <div className="command-sidebar-foot">
              <div className="command-version-block">
                <div className="command-foot-label">Application version</div>
                <div className="command-foot-value">SBTS {appVersion} · {releaseName} · {releaseYear}</div>
              </div>
              <button type="button" onClick={() => { clearAuthSession(); setLocation("/login"); }} className="command-foot-action danger"><LogOut className="h-4 w-4" /> Logout</button>
            </div>
          </aside>

          <div className="command-workspace">
            <header className="command-topbar">
              <div>
                <div className="command-page-kicker">{facilityName} · {departmentName}</div>
                <div className="command-page-title">{systemName}</div>
              </div>
              <div className="command-status-strip">
                <button onClick={() => setLocation("/profile")} className="command-status-pill"><SlidersHorizontal className="h-4 w-4" /> {profile.fullName}</button>
                <ThemeModeToggle compact />
                <span className="command-status-pill">{profile.roleLabel}</span>
                <span className="command-status-pill command-status-live"><span /> {sessionModeLabel}</span>
                <Link href="/inbox" className="command-status-icon" aria-label="Inbox"><Inbox className="h-4 w-4" /></Link>
                <Link href="/inbox" className="command-status-icon command-status-alert" aria-label="Notifications"><Bell className="h-4 w-4" /></Link>
                <button onClick={() => { clearAuthSession(); setLocation("/login"); }} className="command-status-icon" aria-label="Logout"><LogOut className="h-4 w-4" /></button>
              </div>
            </header>

            <nav className="command-mobile-nav lg:hidden">
              {visibleNavItems.map((item) => { const Icon = item.icon; const active = isActiveRoute(location, item.href); return <Link key={item.href} href={item.href} className={`command-mobile-chip ${active ? "active" : ""}`}><Icon className="h-4 w-4" /> {item.label}</Link>; })}
            </nav>

            <main className="command-main"><OperatorBreadcrumbs className="command-breadcrumb" />{children}</main>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (themeTemplate === "Template 2 Classic") {
    return (
      <>
      <KeyboardShortcuts navItems={visibleNavItems} />
      <div data-sbts-theme={themeTemplate} className="theme-classic min-h-screen text-slate-950" style={{ "--sbts-accent": customAccent } as CSSProperties}>
        <div className="classic-shell min-h-screen">
          <header className="classic-topbar">
            <div className="classic-topbar-left">
              <div className="classic-logo-circle">{identityLogo ? <img src={identityLogo} alt="Logo" /> : identityInitials}</div>
              <div>
                <div className="classic-brand-title">{systemName}</div>
                <div className="classic-brand-sub">{departmentName}</div>
              </div>
            </div>
            <div className="classic-topbar-center">
              <div className="classic-site-title">{facilityName}</div>
              <div className="classic-site-sub">Smart blind tag system</div>
            </div>
            <div className="classic-topbar-right">
              <div className="classic-right-text"><b>{corporate.companyShortName || corporate.companyName}</b><span>{corporate.companySubtitle}</span></div>
              <ThemeModeToggle compact className="classic-theme-toggle" />
              <Link href="/inbox" className="classic-top-icon" aria-label="Inbox"><Bell className="h-4 w-4" /></Link>
              <div className="classic-company-mark">{identityLogo ? <img src={identityLogo} alt="Company logo" /> : identityInitials}</div>
            </div>
          </header>
          <div className="classic-body-row">
            <aside className="classic-sidebar">
              <button onClick={() => setLocation("/profile")} className="classic-user-box">
                <div className="classic-user-avatar">{avatar ? <img src={avatar} alt="User" /> : profile.initials}</div>
                <div className="min-w-0 text-left">
                  <div className="classic-user-name">{profile.fullName}</div>
                  <div className="classic-user-role">{profile.roleLabel}</div>
                </div>
              </button>
              <nav className="classic-menu">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(location, item.href);
                  return (
                    <Link key={item.href} href={item.href} className={`classic-menu-item ${active ? "active" : ""}`}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="classic-sidebar-bottom">
                <div className="classic-version">SBTS {appVersion} · {releaseName} · {releaseYear}</div>
                <div className="classic-date">{today}</div>
                <button onClick={() => { clearAuthSession(); setLocation("/login"); }} className="classic-logout"><LogOut className="h-4 w-4" /> Logout</button>
              </div>
            </aside>
            <div className="classic-content-wrap">
              <div className="classic-mobile-actions">
                <Link href="/inbox" className="classic-chip"><Mail className="h-4 w-4" /> Inbox</Link>
                <button onClick={() => setLocation("/profile")} className="classic-chip"><SlidersHorizontal className="h-4 w-4" /> {profile.fullName}</button>
              </div>
              <main className="classic-main"><OperatorBreadcrumbs />{children}</main>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
    <KeyboardShortcuts navItems={visibleNavItems} />
    <div data-sbts-theme={themeTemplate} className={`min-h-screen ${themeClass} text-slate-900`} style={{ "--sbts-accent": customAccent } as CSSProperties}>
      <div className="flex min-h-screen">
        <aside className="sbts-sidebar sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-slate-950 text-white shadow-[20px_0_60px_rgba(15,23,42,0.22)] lg:block">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.35rem] bg-white/95 p-2 text-slate-950 shadow-lg shadow-cyan-950/30">{identityLogo ? <img src={identityLogo} alt="Logo" className="h-full w-full object-contain" /> : <ShieldCheck className="h-8 w-8" />}</div>
                <div className="min-w-0"><div className="truncate text-xl font-black tracking-tight">{corporate.showName ? corporate.companyShortName : (logoText.split(" ")[0] || "SBTS")}</div><div className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">{systemName}</div><div className="mt-1 truncate text-xs font-semibold text-slate-300">{facilityName} · {departmentName}</div></div>
              </div>
              <button onClick={() => setLocation("/profile")} className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-200/50 hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">{avatar ? <img src={avatar} alt="User" className="h-full w-full object-cover" /> : profile.initials}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-white">{profile.fullName}</div>
                    <div className="truncate text-xs font-bold text-cyan-100">{profile.roleLabel} · {profile.badge}</div>
                  </div>
                </div>
              </button>
            </div>
            <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon; const active = isActiveRoute(location, item.href);
                return <Link key={item.href} href={item.href} className={`sbts-nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${active ? "sbts-nav-link-active bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5" />{item.label}</Link>;
              })}
            </nav>
            <div className="sbts-sidebar-footer shrink-0 border-t border-white/10 p-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Application version</div>
                <div className="mt-1 text-sm font-extrabold text-white">SBTS {appVersion} · {releaseName} · {releaseYear}</div>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sbts-topbar sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
                <div><div className="text-sm font-black text-slate-950 sm:text-base">{systemName}</div><div className="text-xs font-semibold text-slate-500">{corporate.showName ? corporate.companyName + " · " : ""}{facilityName} · {departmentName}</div></div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeModeToggle compact />
                <button onClick={() => setLocation("/profile")} className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 sm:inline-flex"><SlidersHorizontal className="h-4 w-4" /> {profile.fullName} • {profile.roleLabel}</button>
                <Link href="/inbox" className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 shadow-sm sm:inline-flex"><Mail className="h-4 w-4" /> Inbox</Link><Link href="/inbox" className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm" aria-label="Notifications"><Bell className="h-5 w-5" /><span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-cyan-500 ring-2 ring-white" /></Link>
                <button onClick={() => { clearAuthSession(); setLocation("/login"); }} className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 shadow-sm hover:border-rose-200 hover:text-rose-700 sm:inline-flex" aria-label="Logout"><LogOut className="h-4 w-4" /> Logout</button>
              </div>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {visibleNavItems.map((item) => { const Icon = item.icon; const active = isActiveRoute(location, item.href); return <Link key={item.href} href={item.href} className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ${active ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}><Icon className="h-4 w-4" /> {item.label}</Link>; })}
            </nav>
          </header>
          <main className="sbts-main container flex-1 py-6 sm:py-8"><OperatorBreadcrumbs />{children}</main>
        </div>
      </div>
    </div>
    </>
  );
}
