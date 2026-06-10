import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, UserPlus, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const roles = [
  ["coordinator", "Coordinator"],
  ["technician", "Technician"],
  ["qc", "QA/QC"],
  ["safety", "Safety"],
  ["inspection", "Inspection"],
  ["tiEngineer", "T&I Engineer"],
  ["metalForeman", "Metal Foreman"],
] as const;

export default function RegisterUser() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    fullName: "",
    badge: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    roleKey: "technician",
  });
  const createMutation = trpc.core.registerEmployeeCredential.useMutation({
    onSuccess: () => {
      toast.success("Registration request submitted. Admin approval is required before login.");
      setLocation("/login");
    },
    onError: error => toast.error(error.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.password.length < 10) return toast.error("Password should be at least 10 characters.");
    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) return toast.error("Password must include uppercase, lowercase, and number.");
    if (form.password !== form.confirmPassword) return toast.error("Password and confirmation do not match.");
    createMutation.mutate({
      badge: form.badge || form.username,
      fullName: form.fullName,
      roleKey: form.roleKey as any,
      specialty: "Pending profile update",
      department: "Pending assignment",
      shift: "Unassigned",
      status: "Pending",
      photoUrl: null,
      isCertified: false,
      username: form.username,
      password: form.password,
      recoveryEmail: form.email,
    });
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.25),transparent_34rem),linear-gradient(135deg,#020617,#0f172a_55%,#083344)] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.8fr_1fr]">
        <section className="space-y-6">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-cyan-100"><ArrowLeft className="h-4 w-4" /> Back to Login</Link>
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-300 text-slate-950"><ShieldCheck className="h-9 w-9" /></div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">New User Registration</h1>
          <p className="max-w-xl text-base leading-8 text-slate-300">Create a clean SBTS account request. Specialty, avatar, and employee description are controlled later from User Profile to avoid duplicate or unverified data.</p>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm font-bold leading-6 text-cyan-50"><Mail className="mb-2 h-5 w-5 text-cyan-200" /> Recovery email is captured now and stored for the password reset flow.</div>
        </section>
        <form onSubmit={submit} className="rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
          <div className="mb-6 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><UserPlus className="h-6 w-6" /></div><div><h2 className="text-2xl font-black">Register account</h2><p className="text-sm font-semibold text-slate-500">Submit a registration request. Your password stays private; admin only approves identity, role, and access.</p></div></div>
          <div className="grid gap-3 md:grid-cols-2">
            <input required value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})} placeholder="Full name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
            <input required value={form.badge} onChange={e => setForm({...form, badge:e.target.value})} placeholder="Badge / Signature ID" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
            <input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="Recovery email" className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
            <input required value={form.username} onChange={e => setForm({...form, username:e.target.value})} placeholder="Username" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
            <select value={form.roleKey} onChange={e => setForm({...form, roleKey:e.target.value})} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400">{roles.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
            <input required type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Password (10+ chars, A-Z, a-z, number)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
            <input required type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword:e.target.value})} placeholder="Confirm password" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400" />
          </div>
          <button disabled={createMutation.isPending} className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-60">Submit Request for Admin Approval</button>
        </form>
      </div>
    </div>
  );
}
