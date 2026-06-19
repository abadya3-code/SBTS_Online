import { useMemo, useState } from "react";
import { CheckCircle2, Edit3, KeyRound, LockKeyhole, Plus, Search, ShieldCheck, Trash2, UserCog, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { trpc } from "@/lib/trpc";
import { type SecurityProfile, type SecurityRoleKey } from "@/lib/security";
import { saveAuthSession } from "@/lib/auth";
import type { UserManagementRow } from "@/types/operationalModels";

const roleOptions: { key: SecurityRoleKey; label: string }[] = [
  { key: "admin", label: "System Admin" },
  { key: "coordinator", label: "Coordinator" },
  { key: "technician", label: "Technician" },
  { key: "qc", label: "QC Inspector" },
  { key: "safety", label: "Safety Officer" },
  { key: "inspection", label: "Inspection" },
  { key: "tiEngineer", label: "T&I Engineer" },
  { key: "metalForeman", label: "Metal Foreman" },
];

const statusOptions = ["Pending", "Active", "Standby", "Unavailable", "Rejected", "Disabled"] as const;
type Status = (typeof statusOptions)[number];

type FormState = {
  id?: string;
  badge: string;
  fullName: string;
  roleKey: SecurityRoleKey;
  specialty: string;
  department: string;
  shift: string;
  status: Status;
  photoUrl: string;
  isCertified: boolean;
};

const emptyForm: FormState = {
  badge: "",
  fullName: "",
  roleKey: "technician",
  specialty: "Field Execution",
  department: "Maintenance",
  shift: "Day",
  status: "Pending",
  photoUrl: "",
  isCertified: true,
};

function roleFromUser(roleKey: string): SecurityRoleKey {
  return roleOptions.some(role => role.key === roleKey) ? (roleKey as SecurityRoleKey) : "technician";
}

function statusFromUser(status: string): Status {
  return statusOptions.includes(status as Status) ? (status as Status) : "Pending";
}

function makeProfile(user: UserManagementRow): SecurityProfile {
  return {
    id: user.id,
    badge: user.badge,
    fullName: user.fullName,
    roleKey: roleFromUser(user.roleKey),
    roleLabel: user.roleLabel,
    initials: user.initials,
    status: statusFromUser(user.status),
  };
}

export default function UserManagement() {
  const utils = trpc.useUtils();
  const usersQuery = trpc.core.userManagement.useQuery(undefined, { staleTime: 15_000 });
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [credentialUser, setCredentialUser] = useState<UserManagementRow | null>(null);
  const [credentialForm, setCredentialForm] = useState({ username: "", password: "", recoveryEmail: "" });

  const createMutation = trpc.core.createEmployee.useMutation({
    onSuccess: async () => {
      toast.success("User created and added to SBTS directory.");
      await utils.core.userManagement.invalidate();
      await utils.core.employees.invalidate();
      setFormOpen(false);
      setForm(emptyForm);
    },
    onError: error => toast.error(error.message),
  });

  const updateMutation = trpc.core.updateEmployee.useMutation({
    onSuccess: async () => {
      toast.success("User profile updated.");
      await utils.core.userManagement.invalidate();
      await utils.core.employees.invalidate();
      setFormOpen(false);
    },
    onError: error => toast.error(error.message),
  });

  const deleteMutation = trpc.core.deleteEmployee.useMutation({
    onSuccess: async () => {
      toast.success("User removed from directory.");
      await utils.core.userManagement.invalidate();
      await utils.core.employees.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const credentialMutation = trpc.core.registerPasswordCredential.useMutation({
    onSuccess: async () => {
      toast.success("Password credential created for employee.");
      setCredentialUser(null);
      setCredentialForm({ username: "", password: "", recoveryEmail: "" });
    },
    onError: error => toast.error(error.message),
  });

  const users: UserManagementRow[] = usersQuery.data ?? [];

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter(user => {
      const matchQuery = !normalized || [user.fullName, user.badge, user.specialty, user.department, user.roleLabel].some(value => String(value ?? "").toLowerCase().includes(normalized));
      const matchRole = roleFilter === "all" || user.roleKey === roleFilter;
      const matchStatus = statusFilter === "all" || user.status === statusFilter;
      return matchQuery && matchRole && matchStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(user => user.status === "Active").length,
    pending: users.filter(user => user.status === "Pending").length,
    admins: users.filter(user => user.roleKey === "admin").length,
    certified: users.filter(user => user.isCertified).length,
  }), [users]);

  function openCreate() {
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(user: UserManagementRow) {
    setForm({
      id: user.id,
      badge: user.badge,
      fullName: user.fullName,
      roleKey: roleFromUser(user.roleKey),
      specialty: user.specialty,
      department: user.department,
      shift: user.shift,
      status: statusFromUser(user.status),
      photoUrl: user.photoUrl ?? "",
      isCertified: Boolean(user.isCertified),
    });
    setFormOpen(true);
  }

  function submitForm() {
    const payload = {
      badge: form.badge,
      fullName: form.fullName,
      roleKey: form.roleKey,
      specialty: form.specialty,
      department: form.department,
      shift: form.shift,
      status: form.status,
      photoUrl: form.photoUrl || null,
      isCertified: form.isCertified,
    };
    if (form.id) updateMutation.mutate({ ...payload, id: form.id });
    else createMutation.mutate(payload);
  }

  function switchSession(user: UserManagementRow) {
    saveAuthSession(makeProfile(user), "demo-badge");
    toast.success(`Active session switched to ${user.fullName}. Navigation lock updated.`);
  }

  function openCredential(user: UserManagementRow) {
    setCredentialUser(user);
    setCredentialForm({ username: String(user.badge ?? "").toLowerCase(), password: "", recoveryEmail: "" });
  }

  function submitCredential() {
    if (!credentialUser) return;
    if (credentialForm.password.length < 10) return toast.error("Password should be at least 10 characters.");
    if (!/[A-Z]/.test(credentialForm.password) || !/[a-z]/.test(credentialForm.password) || !/[0-9]/.test(credentialForm.password)) return toast.error("Password must include uppercase, lowercase, and number.");
    credentialMutation.mutate({
      employeeId: credentialUser.id,
      username: credentialForm.username,
      password: credentialForm.password,
      recoveryEmail: credentialForm.recoveryEmail || null,
      mustChangePassword: false,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="User Access Administration"
        title="User Management"
        description="Manage employees, roles, certification status, and demo active session. Admin-only pages are hard locked from here and the navigation shell."
        actions={<button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg hover:bg-slate-800"><Plus className="h-4 w-4" /> Add User</button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="sbts-card p-5"><div className="text-xs font-black uppercase tracking-widest text-slate-400">Total users</div><div className="mt-2 text-3xl font-black text-slate-950">{stats.total}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-black uppercase tracking-widest text-slate-400">Pending Approval</div><div className="mt-2 text-3xl font-black text-amber-600">{stats.pending}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-black uppercase tracking-widest text-slate-400">Active</div><div className="mt-2 text-3xl font-black text-emerald-600">{stats.active}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-black uppercase tracking-widest text-slate-400">Admins</div><div className="mt-2 text-3xl font-black text-cyan-700">{stats.admins}</div></div>
        <div className="sbts-card p-5"><div className="text-xs font-black uppercase tracking-widest text-slate-400">Certified</div><div className="mt-2 text-3xl font-black text-slate-950">{stats.certified}</div></div>
      </div>

      <section className="sbts-card overflow-hidden">
        <div className="border-b border-slate-200 bg-white p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name, badge, role, specialty..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-cyan-300 focus:bg-white" />
            </label>
            <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-300">
              <option value="all">All roles</option>
              {roleOptions.map(role => <option key={role.key} value={role.key}>{role.label}</option>)}
            </select>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-300">
              <option value="all">All status</option>
              {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.map(user => (
            <div key={user.id} className="grid gap-4 p-5 transition hover:bg-slate-50/70 xl:grid-cols-[1fr_200px_180px_260px] xl:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-sm font-black text-white shadow-sm">
                  {user.photoUrl ? <img src={user.photoUrl} alt="" className="h-full w-full object-cover" /> : user.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{user.fullName}</h3>{user.isCertified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Certified</span>}</div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Badge {user.badge} • {user.specialty}</p>
                </div>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Role</div>
                <div className="mt-1 font-extrabold text-slate-950">{user.roleLabel}</div>
                <div className="text-xs font-semibold text-slate-500">{user.accessLevel}</div>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Status</div>
                <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${user.status === "Active" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : user.status === "Pending" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : user.status === "Standby" ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100" : "bg-rose-50 text-rose-700 ring-1 ring-rose-100"}`}>{user.status}</span>
              </div>
              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <button onClick={() => switchSession(user)} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 hover:bg-cyan-100"><ShieldCheck className="h-4 w-4" /> Use session</button>
                {user.status === "Pending" && <button onClick={() => updateMutation.mutate({ ...user, status: "Active" })} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-4 w-4" /> Approve</button>}
                <button onClick={() => openCredential(user)} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100"><KeyRound className="h-4 w-4" /> Credential</button>
                <button onClick={() => openEdit(user)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-cyan-200 hover:text-cyan-700"><Edit3 className="h-4 w-4" /> Edit</button>
                <button onClick={() => deleteMutation.mutate({ id: user.id })} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Delete</button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && <div className="p-10 text-center text-sm font-semibold text-slate-500">No users match the current filters.</div>}
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5 text-sm leading-6 text-cyan-950">
        <div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" /><p><span className="font-black">Admin hard lock:</span> Workflow Studio, Access Control, Audit Trail, and User Management require an active Admin session. This is a UI hard lock now and is aligned with server-side admin procedures for production login.</p></div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"><UserCog className="h-6 w-6" /></div><div><h2 className="text-xl font-black text-slate-950">{form.id ? "Edit User" : "Add User"}</h2><p className="text-sm text-slate-500">User directory controls phase assignments and admin hard lock.</p></div></div>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Full name</span><input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-300" /></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Badge / Signature ID</span><input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-300" /></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Role</span><select value={form.roleKey} onChange={e => setForm({ ...form, roleKey: e.target.value as SecurityRoleKey })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-300">{roleOptions.map(role => <option key={role.key} value={role.key}>{role.label}</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Status</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-300">{statusOptions.map(status => <option key={status} value={status}>{status}</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Specialty</span><input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-300" /></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Department</span><input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-300" /></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Shift</span><input value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-300" /></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Photo URL</span><input value={form.photoUrl} onChange={e => setForm({ ...form, photoUrl: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-300" /></label>
              <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.isCertified} onChange={e => setForm({ ...form, isCertified: e.target.checked })} className="h-4 w-4" /> Certified for assigned phase duties</label>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-6">
              <button onClick={() => setFormOpen(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={submitForm} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-slate-800">Save User</button>
            </div>
          </div>
        </div>
      )}

      {credentialUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><KeyRound className="h-6 w-6" /></div>
              <div>
                <h2 className="text-xl font-black text-slate-950">Create Password Credential</h2>
                <p className="text-sm font-semibold text-slate-500">{credentialUser.fullName} · Badge {credentialUser.badge}</p>
              </div>
            </div>
            <div className="grid gap-3">
              <label className="space-y-1 text-sm font-bold text-slate-700">Username<input value={credentialForm.username} onChange={e => setCredentialForm({ ...credentialForm, username: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-300" /></label>
              <label className="space-y-1 text-sm font-bold text-slate-700">Recovery Email<input type="email" value={credentialForm.recoveryEmail} onChange={e => setCredentialForm({ ...credentialForm, recoveryEmail: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-300" /></label>
              <label className="space-y-1 text-sm font-bold text-slate-700">Temporary Password<input type="password" value={credentialForm.password} onChange={e => setCredentialForm({ ...credentialForm, password: e.target.value })} placeholder="10+ chars, A-Z, a-z, number" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-300" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCredentialUser(null)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700">Cancel</button>
              <button onClick={submitCredential} disabled={credentialMutation.isPending} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60">Create Credential</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
