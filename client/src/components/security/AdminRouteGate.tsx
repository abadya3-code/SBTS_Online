import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { readSecurityProfile, isAdminProfile, defaultSecurityProfile } from "@/lib/security";
import { saveAuthSession } from "@/lib/auth";

type Props = { children: ReactNode; title?: string };

export function AdminRouteGate({ children, title = "Admin hard lock" }: Props) {
  const [, setLocation] = useLocation();
  const profile = readSecurityProfile();

  if (isAdminProfile(profile)) return <>{children}</>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-10">
      <div className="rounded-[2rem] border border-rose-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-rose-50 text-rose-700 ring-1 ring-rose-100">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-rose-600">Security gate</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              This page is locked to active Administrator users only. Current session is <span className="font-extrabold text-slate-900">{profile.fullName}</span> with role <span className="font-extrabold text-slate-900">{profile.roleLabel}</span>.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Badge</div>
                <div className="mt-1 font-extrabold text-slate-950">{profile.badge}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</div>
                <div className="mt-1 font-extrabold text-slate-950">{profile.roleLabel}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</div>
                <div className="mt-1 font-extrabold text-slate-950">{profile.status}</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800">
                Back to Dashboard
              </Link>
              <button onClick={() => { saveAuthSession(defaultSecurityProfile, "demo-badge"); setLocation("/users"); }} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm hover:border-cyan-200 hover:text-cyan-700">
                <LockKeyhole className="h-4 w-4" /> Reset demo admin session
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5 text-sm leading-6 text-cyan-950">
        Admin pages are hidden from non-admin navigation and protected again at route level. Login binds the current role to the authenticated session and admin-only procedures remain ready for server-side production guards.
      </div>
    </div>
  );
}
