import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Search, LogIn, BadgeCheck, LockKeyhole, UsersRound, KeyRound, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { saveAuthSession } from "@/lib/auth";
import type { SecurityProfile, SecurityRoleKey } from "@/lib/security";
import { getCorporateIdentity, initialsFromCompanyName } from "@/lib/corporateIdentity";
import type { SystemGeneralSettings } from "@/types/operationalModels";

const roleLabels: Record<SecurityRoleKey, string> = {
  admin: "System Admin",
  coordinator: "Coordinator",
  technician: "Technician",
  qc: "QA/QC",
  safety: "Safety",
  inspection: "Inspection",
  tiEngineer: "T&I Engineer",
  metalForeman: "Metal Foreman",
};

function toProfile(employee: { id: string; badge: string; fullName: string; roleKey: SecurityRoleKey; roleLabel?: string; initials?: string; status?: "Active" | "Standby" | "Unavailable" }): SecurityProfile {
  return {
    id: employee.id,
    badge: employee.badge,
    fullName: employee.fullName,
    roleKey: employee.roleKey,
    roleLabel: employee.roleLabel ?? roleLabels[employee.roleKey],
    initials: employee.initials ?? employee.fullName.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase(),
    status: employee.status ?? "Active",
  };
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"password" | "badge">("password");
  const [query, setQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ username: "", password: "" });
  const [resetUsername, setResetUsername] = useState("");
  const employeesQuery = trpc.core.employees.useQuery();
  const settingsQuery = trpc.core.systemSettings.useQuery(undefined, { staleTime: 30_000 });
  const general = settingsQuery.data?.general;
  const corporate = getCorporateIdentity(general as SystemGeneralSettings | undefined);
  const systemName = general?.systemName ?? "Smart Blind Tag System";
  const facilityName = general?.facilityName ?? "Shedgum Gas Plant";

  const passwordLoginMutation = trpc.core.passwordLogin.useMutation({
    onSuccess(result) {
      const profile = toProfile({
        id: result.employee.id,
        badge: result.employee.badge,
        fullName: result.employee.fullName,
        roleKey: result.employee.roleKey,
        roleLabel: roleLabels[result.employee.roleKey],
        status: "Active",
      });
      saveAuthSession(profile, "production-bound");
      toast.success("Secure session created.");
      setLocation("/dashboard");
    },
    onError: error => toast.error(error.message),
  });

  const resetMutation = trpc.core.requestPasswordReset.useMutation({
    onSuccess: result => toast.message(result.message ?? "If a recovery email exists, a reset request will be created."),
    onError: error => toast.error(error.message),
  });

  const loginMutation = trpc.core.login.useMutation({
    onSuccess(result) {
      saveAuthSession(result.profile, "production-bound");
      setLocation("/dashboard");
    },
    onError: error => toast.error(error.message),
  });

  const employees = employeesQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const active = employees.filter(employee => employee.status === "Active");
    if (!term) return active.slice(0, 8);
    return active.filter(employee => [employee.fullName, employee.badge, employee.roleLabel, employee.specialty, employee.department]
      .join(" ").toLowerCase().includes(term)).slice(0, 8);
  }, [employees, query]);

  const selected = employees.find(employee => employee.badge === selectedBadge) ?? filtered[0];

  function submitPasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    passwordLoginMutation.mutate(passwordForm);
  }

  function requestReset() {
    const username = resetUsername.trim() || passwordForm.username.trim();
    if (!username) return toast.error("Enter username first.");
    resetMutation.mutate({ username });
  }

  function loginAsSelected() {
    if (!selected) return;
    loginMutation.mutate({ badge: selected.badge, roleKey: selected.roleKey });
  }

  function quickDemoAdmin() {
    const admin = employees.find(employee => employee.roleKey === "admin" && employee.status === "Active") ?? employees[0];
    if (!admin) return;
    saveAuthSession(toProfile(admin), "demo-badge");
    setLocation("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.25),transparent_34rem),linear-gradient(135deg,#020617,#0f172a_55%,#083344)] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-100 shadow-2xl shadow-cyan-950/20 backdrop-blur">
            <ShieldCheck className="h-4 w-4" /> Secure login portal
          </div>
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.6rem] bg-white text-xl font-black text-slate-950 shadow-2xl shadow-cyan-950/30">
                {corporate.companyLogo ? <img src={corporate.companyLogo} alt="Company logo" className="h-full w-full object-contain p-2" /> : initialsFromCompanyName(corporate.companyShortName)}
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight">{corporate.showName ? corporate.companyName : systemName}</div>
                <div className="mt-1 text-sm font-bold text-cyan-100">{corporate.companySubtitle}</div>
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">SBTS Secure Login</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              {systemName} now supports real password-backed sessions and protected backend actions for {facilityName}.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <LockKeyhole className="h-6 w-6 text-cyan-200" />
              <div className="mt-4 text-sm font-black">Server Session</div>
              <div className="mt-1 text-xs leading-5 text-slate-300">Password login creates backend session cookies.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <UsersRound className="h-6 w-6 text-cyan-200" />
              <div className="mt-4 text-sm font-black">Role Binding</div>
              <div className="mt-1 text-xs leading-5 text-slate-300">Backend gates enforce critical actions.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <BadgeCheck className="h-6 w-6 text-cyan-200" />
              <div className="mt-4 text-sm font-black">Badge Ready</div>
              <div className="mt-1 text-xs leading-5 text-slate-300">Badge login remains available for controlled demo/pilot.</div>
            </div>
          </div>
        </section>

        <section className="rounded-[2.25rem] border border-white/15 bg-white p-5 text-slate-950 shadow-2xl shadow-cyan-950/30 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">{corporate.companyShortName} · Backend session binding</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Sign in to SBTS</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Use password authentication for production-bound testing, or badge login for demo/pilot operation.</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><LogIn className="h-6 w-6" /></div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setMode("password")} className={`rounded-2xl px-4 py-3 text-center text-xs font-black uppercase tracking-wider ${mode === "password" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>1 · Username / Password</button>
            <button type="button" onClick={() => setMode("badge")} className={`rounded-2xl px-4 py-3 text-center text-xs font-black uppercase tracking-wider ${mode === "badge" ? "bg-slate-950 text-white" : "border border-cyan-100 bg-cyan-50 text-cyan-800"}`}>2 · SSO / Badge Login</button>
          </div>

          {mode === "password" ? (
            <form onSubmit={submitPasswordLogin} className="mt-5 space-y-4">
              <label className="block text-sm font-black text-slate-700">Username
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  <input value={passwordForm.username} onChange={event => setPasswordForm({ ...passwordForm, username: event.target.value })} placeholder="username or badge account" className="flex-1 bg-transparent text-sm font-bold outline-none" />
                </div>
              </label>
              <label className="block text-sm font-black text-slate-700">Password
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input type={passwordVisible ? "text" : "password"} value={passwordForm.password} onChange={event => setPasswordForm({ ...passwordForm, password: event.target.value })} placeholder="password" className="flex-1 bg-transparent text-sm font-bold outline-none" />
                  <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="text-slate-400">{passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </label>
              <button disabled={passwordLoginMutation.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                <LogIn className="h-4 w-4" /> {passwordLoginMutation.isPending ? "Signing in..." : "Secure Login"}
              </button>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input value={resetUsername} onChange={event => setResetUsername(event.target.value)} placeholder="Username for password reset" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold outline-none" />
                  <button type="button" onClick={requestReset} disabled={resetMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800"><Mail className="h-4 w-4" /> Forgot password</button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Type employee name, badge, role..." className="h-9 flex-1 bg-transparent text-sm font-semibold outline-none" />
                </div>
              </div>

              <div className="mt-4 max-h-[23rem] space-y-2 overflow-auto pr-1">
                {filtered.map(employee => {
                  const active = selected?.badge === employee.badge;
                  return (
                    <button key={employee.id} onClick={() => setSelectedBadge(employee.badge)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-cyan-300 bg-cyan-50 shadow-sm" : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50"}`}>
                      {employee.photoUrl ? <img src={employee.photoUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">{employee.initials}</div>}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black text-slate-950">{employee.fullName}</div>
                        <div className="mt-0.5 text-xs font-bold text-slate-500">Badge {employee.badge} • {employee.roleLabel}</div>
                        <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">{employee.specialty} • {employee.department}</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${employee.roleKey === "admin" ? "bg-rose-50 text-rose-700" : "bg-cyan-50 text-cyan-700"}`}>{employee.roleKey === "admin" ? "Admin" : "User"}</span>
                    </button>
                  );
                })}
                {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">No active employee matched your search.</div>}
              </div>

              {selected && (
                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selected session</div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-950">{selected.fullName}</div>
                      <div className="text-xs font-bold text-slate-500">{selected.roleLabel} • Badge {selected.badge}</div>
                    </div>
                    <button disabled={loginMutation.isPending} onClick={loginAsSelected} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                      <LogIn className="h-4 w-4" /> Login
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button onClick={quickDemoAdmin} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:border-cyan-200 hover:text-cyan-700">Quick demo admin login</button>
            <Link href="/register" className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-center text-sm font-black text-cyan-800 hover:border-cyan-200">Register new user</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
