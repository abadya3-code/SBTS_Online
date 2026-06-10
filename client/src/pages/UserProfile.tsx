import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, Camera, Save, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { readAuthSession } from "@/lib/auth";
import { readUserProfile, updateCurrentUserProfile } from "@/lib/userProfile";
import { THEME_OPTIONS } from "@/lib/themeEngine";

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const session = readAuthSession();
  const prefs = readUserProfile();
  const [form, setForm] = useState({
    fullName: session.profile.fullName,
    badge: session.profile.badge,
    email: prefs.email ?? "",
    specialtyDescription: prefs.specialtyDescription ?? "",
    avatarDataUrl: prefs.avatarDataUrl ?? "",
    themePreferenceMode: prefs.themePreferenceMode ?? "system",
    themeTemplate: prefs.themeTemplate ?? "Template 1",
    customAccentColor: prefs.customAccentColor ?? "#0891b2",
  });

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(current => ({ ...current, avatarDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateCurrentUserProfile(
      { fullName: form.fullName, badge: form.badge },
      {
        email: form.email,
        specialtyDescription: form.specialtyDescription,
        avatarDataUrl: form.avatarDataUrl,
        themePreferenceMode: form.themePreferenceMode as any,
        themeTemplate: form.themeTemplate as any,
        customAccentColor: form.customAccentColor,
      }
    );
    toast.success("Profile saved. Your personal display, avatar, and theme preferences are updated.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Personal settings"
        title="User Profile"
        description="Employee-owned profile settings. These do not replace User Management; they only control personal display, avatar, and preferences."
        actions={<button onClick={() => setLocation('/dashboard')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm"><ArrowLeft className="h-4 w-4" /> Dashboard</button>}
      />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <section className="sbts-card p-6 text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
            {form.avatarDataUrl ? <img src={form.avatarDataUrl} alt="Profile" className="h-full w-full object-cover" /> : <UserRound className="h-16 w-16" />}
          </div>
          <label className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg">
            <Camera className="h-4 w-4" /> Upload photo
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">Photo and personal preferences are saved locally in this demo shell. Theme Mode controls whether the employee follows the System Settings theme or uses a personal theme override.</p>
        </section>

        <section className="sbts-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-bold text-slate-700">Display Name<input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400" /></label>
            <label className="space-y-1 text-sm font-bold text-slate-700">Badge / Signature ID<input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400" /></label>
            <label className="space-y-1 text-sm font-bold text-slate-700">Recovery Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400" /></label>
            <label className="space-y-1 text-sm font-bold text-slate-700">Theme Mode<select value={form.themePreferenceMode} onChange={e => setForm({ ...form, themePreferenceMode: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400"><option value="system">Use System Settings theme</option><option value="personal">Use my personal theme</option></select></label>
            <label className="space-y-1 text-sm font-bold text-slate-700">Preferred Theme<select value={form.themeTemplate} onChange={e => setForm({ ...form, themeTemplate: e.target.value })} disabled={form.themePreferenceMode !== "personal"} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400 disabled:bg-slate-100 disabled:text-slate-400">{THEME_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="space-y-1 text-sm font-bold text-slate-700">Custom Accent Color<input type="color" value={form.customAccentColor} onChange={e => setForm({ ...form, customAccentColor: e.target.value })} disabled={form.themePreferenceMode !== "personal"} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-1 disabled:opacity-50" /></label>
            <label className="md:col-span-2 space-y-1 text-sm font-bold text-slate-700">Specialty / Profile Description<textarea value={form.specialtyDescription} onChange={e => setForm({ ...form, specialtyDescription: e.target.value })} rows={5} placeholder="Example: Welding, blind isolation, torque support, QA/QC coordination..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400" /></label>
          </div>
          <button className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg"><Save className="h-4 w-4" /> Save Profile</button>
        </section>
      </form>
    </div>
  );
}
