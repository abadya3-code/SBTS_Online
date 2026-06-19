/*
Design Philosophy: Industrial Command Center Minimalism.
Access Control Center centralizes scattered settings, user permissions, workflow ownership, and menu visibility into one maintainable role-based operating model.
*/
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, ChevronRight, Copy, Eye, GitBranch, LockKeyhole, Plus, Save, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { menuCatalog, permissionGroups, phases, type RoleModel } from "@/lib/mockData";
import { trpc } from "@/lib/trpc";

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
  const utils = trpc.useUtils();
  const accessModelQuery = trpc.accessControl.model.useQuery(undefined, { staleTime: 30_000 });
  const saveRoleModelMutation = trpc.accessControl.saveRoleModel.useMutation({
    onSuccess: () => {
      toast.success("Access control model saved to database.");
      void utils.accessControl.model.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save access control model.");
    },
  });

  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [activeRoleKey, setActiveRoleKey] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabKey>("system");

  useEffect(() => {
    const dbRoles = accessModelQuery.data?.roles;
    if (!dbRoles?.length) return;
    setRoles(dbRoles as RoleModel[]);
    setActiveRoleKey((current) => current || dbRoles[0].key);
  }, [accessModelQuery.data?.roles]);

  const activeRole = useMemo(() => roles.find((role) => role.key === activeRoleKey) ?? roles[0], [roles, activeRoleKey]);
  const accessPermissionGroups = useMemo(() => {
    const dbGroups = accessModelQuery.data?.permissionGroups;
    if (!dbGroups?.length) return permissionGroups;

    return dbGroups.map((group) => ({
      ...group,
      icon: permissionGroups.find((item) => item.group === group.group)?.icon ?? LockKeyhole,
    }));
  }, [accessModelQuery.data?.permissionGroups]);
  const allPermissionsCount = Math.max(1, accessPermissionGroups.flatMap((group) => group.permissions).length);

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
    if (!activeRole) return;

    saveRoleModelMutation.mutate({
      roleKey: activeRole.key,
      permissionKeys: activeRole.permissionKeys,
      menuKeys: activeRole.menuKeys,
      phaseKeys: activeRole.phaseKeys,
    });
  }

  if (accessModelQuery.isLoading && roles.length === 0) {
    return <div className="p-6 text-sm font-semibold text-slate-500">Loading access control model from database...</div>;
  }

  if (accessModelQuery.error && roles.length === 0) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900">
        <div className="text-lg font-extrabold">Access Control could not load</div>
        <p className="mt-2 text-sm leading-6">{accessModelQuery.error.message}</p>
        <button onClick={() => void accessModelQuery.refetch()} className="mt-5 rounded-2xl bg-red-700 px-5 py-2.5 text-sm font-extrabold text-white">Retry</button>
      </div>
    );
  }

  if (!activeRole) {
    return <div className="p-6 text-sm font-semibold text-slate-500">No access roles found. Seed access roles first, then reload this page.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Unified governance"
        title="Access Control Center"
        description="A single place for roles, permissions, workflow ownership, menu visibility, and user scope. This replaces scattered controls in Settings, Users, and Workflow Control."
        actions={
          <>
            <button disabled title="Role creation will be implemented with a governed database workflow in the next iteration." className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-400 opacity-60 shadow-sm">
              <Copy className="h-4 w-4" /> Duplicate role
            </button>
            <button onClick={saveDraft} disabled={saveRoleModelMutation.isPending} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" /> {saveRoleModelMutation.isPending ? "Saving..." : "Save model"}
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
                {accessPermissionGroups.map((group) => {
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
                <div className="flex flex-col gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-cyan-950 lg:flex-row lg:items-center lg:justify-between">
                  <p>Workflow ownership is controlled by role templates. If a role owns a phase, users in that role can see and act on the corresponding phase tasks according to their system permissions.</p>
                  <Link href="/workflow-studio" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-slate-800">
                    <GitBranch className="h-4 w-4" /> Open Workflow Studio
                  </Link>
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
