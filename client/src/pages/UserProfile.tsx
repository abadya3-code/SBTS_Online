import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, Camera, Save, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { readAuthSession } from "@/lib/auth";
import { readUserProfile, updateCurrentUserProfile } from "@/lib/userProfile";
import { THEME_OPTIONS, type SbtsThemeTemplate, type ThemePreferenceMode } from "@/lib/themeEngine";
import { trpc } from "@/lib/trpc";

type InterfaceThemeMode = "light" | "dark" | "system";

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const session = readAuthSession();
  const prefs = readUserProfile();
  const userPreferencesQuery = trpc.core.userPreferences.useQuery(undefined, {
    enabled: session.authenticated,
    retry: 1,
  });
  const saveUserPreferences = trpc.core.saveUserPreferences.useMutation({
    onSuccess(data) {
      updateCurrentUserProfile(
        { fullName: data.displayName ?? session.profile.fullName, badge: session.profile.badge },
        {
          email: data.recoveryEmail ?? "",
          specialtyDescription: data.specialtyDescription ?? "",
          avatarDataUrl: data.avatarDataUrl ?? "",
          themePreferenceMode: data.themePreferenceMode as ThemePreferenceMode,
          themeTemplate: data.themeTemplate as SbtsThemeTemplate,
          customAccentColor: data.customAccentColor,
          interfaceThemeMode: data.interfaceThemeMode as InterfaceThemeMode,
          commandSearchEnabled: data.commandSearchEnabled,
          keyboardShortcutsEnabled: data.keyboardShortcutsEnabled,
        }
      );
      toast.success("Profile and operator preferences saved to database.");
      userPreferencesQuery.refetch();
    },
    onError(error) {
      toast.error(error.message || "Failed to save profile preferences.");
    },
  });

  const [form, setForm] = useState({
    fullName: session.profile.fullName,
    badge: session.profile.badge,
    email: prefs.email ?? "",
    specialtyDescription: prefs.specialtyDescription ?? "",
    avatarDataUrl: prefs.avatarDataUrl ?? "",
    themePreferenceMode: (prefs.themePreferenceMode ?? "system") as ThemePreferenceMode,
    themeTemplate: (prefs.themeTemplate ?? "Template 1") as SbtsThemeTemplate,
    customAccentColor: prefs.customAccentColor ?? "#0891b2",
    interfaceThemeMode: (prefs.interfaceThemeMode ?? "system") as InterfaceThemeMode,
    commandSearchEnabled: prefs.commandSearchEnabled ?? true,
    keyboardShortcutsEnabled: prefs.keyboardShortcutsEnabled ?? true,
  });

  useEffect(() => {
    const data = userPreferencesQuery.data;
    if (!data) return;
    setForm(current => ({
      ...current,
      fullName: data.displayName ?? current.fullName,
      email: data.recoveryEmail ?? "",
      specialtyDescription: data.specialtyDescription ?? "",
      avatarDataUrl: data.avatarDataUrl ?? "",
      themePreferenceMode: data.themePreferenceMode as ThemePreferenceMode,
      themeTemplate: data.themeTemplate as SbtsThemeTemplate,
      customAccentColor: data.customAccentColor,
      interfaceThemeMode: data.interfaceThemeMode as InterfaceThemeMode,
      commandSearchEnabled: data.commandSearchEnabled,
      keyboardShortcutsEnabled: data.keyboardShortcutsEnabled,
    }));
  }, [userPreferencesQuery.data]);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(current => ({ ...current, avatarDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prefsPatch = {
      email: form.email,
      specialtyDescription: form.specialtyDescription,
      avatarDataUrl: form.avatarDataUrl,
      themePreferenceMode: form.themePreferenceMode,
      themeTemplate: form.themeTemplate,
      customAccentColor: form.customAccentColor,
      interfaceThemeMode: form.interfaceThemeMode,
      commandSearchEnabled: form.commandSearchEnabled,
      keyboardShortcutsEnabled: form.keyboardShortcutsEnabled,
    };
    updateCurrentUserProfile({ fullName: form.fullName, badge: form.badge }, prefsPatch);
    if (!session.authenticated) {
      toast.success("Profile saved locally.");
      return;
    }
    saveUserPreferences.mutate({
      displayName: form.fullName,
      recoveryEmail: form.email || null,
      specialtyDescription: form.specialtyDescription || null,
      avatarDataUrl: form.avatarDataUrl || null,
      themePreferenceMode: form.themePreferenceMode,
      themeTemplate: form.themeTemplate,
      customAccentColor: form.customAccentColor,
      interfaceThemeMode: form.interfaceThemeMode,
      commandSearchEnabled: form.commandSearchEnabled,
      keyboardShortcutsEnabled: form.keyboardShortcutsEnabled,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Personal settings"
        title="User Profile"
        description="Employee-owned profile settings persisted to the database. These preferences do not grant permissions and do not replace User Management."
        actions={<button onClick={() => setLocation('/dashboard')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><ArrowLeft className="h-4 w-4" /> Dashboard</button>}
      />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <section className="sbts-card p-6 text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-slate-900 dark:text-cyan-300 dark:ring-slate-700">
            {form.avatarDataUrl ? <img src={form.avatarDataUrl} alt="Profile" className="h-full w-full object-cover" /> : <UserRound className="h-16 w-16" />}
          </div>
          <label className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg dark:bg-cyan-600">
            <Camera className="h-4 w-4" /> Upload photo
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            Photo and preferences are saved in the production database and mirrored locally for fast loading. They control UX only, not role permissions.
          </p>
          {userPreferencesQuery.isFetching && <p className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-cyan-600">Syncing preferences...</p>}
        </section>

        <section className="sbts-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">Display Name<input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /></label>
            <label className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">Badge / Signature ID<input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /></label>
            <label className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">Recovery Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /></label>
            <label className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">Theme Mode<select value={form.themePreferenceMode} onChange={e => setForm({ ...form, themePreferenceMode: e.target.value as ThemePreferenceMode })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value="system">Use System Settings theme</option><option value="personal">Use my personal theme</option></select></label>
            <label className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">Preferred Theme<select value={form.themeTemplate} onChange={e => setForm({ ...form, themeTemplate: e.target.value as SbtsThemeTemplate })} disabled={form.themePreferenceMode !== "personal"} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900">{THEME_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">Interface Mode<select value={form.interfaceThemeMode} onChange={e => setForm({ ...form, interfaceThemeMode: e.target.value as InterfaceThemeMode })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value="system">Follow device</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
            <label className="space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">Custom Accent Color<input type="color" value={form.customAccentColor} onChange={e => setForm({ ...form, customAccentColor: e.target.value })} disabled={form.themePreferenceMode !== "personal"} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-1 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950" /></label>
            <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <label className="flex items-center justify-between gap-3 text-sm font-black text-slate-700 dark:text-slate-200">
                Command Search
                <input type="checkbox" checked={form.commandSearchEnabled} onChange={e => setForm({ ...form, commandSearchEnabled: e.target.checked })} className="h-5 w-5" />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm font-black text-slate-700 dark:text-slate-200">
                Keyboard Shortcuts
                <input type="checkbox" checked={form.keyboardShortcutsEnabled} onChange={e => setForm({ ...form, keyboardShortcutsEnabled: e.target.checked })} className="h-5 w-5" />
              </label>
            </div>
            <label className="md:col-span-2 space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">Specialty / Profile Description<textarea value={form.specialtyDescription} onChange={e => setForm({ ...form, specialtyDescription: e.target.value })} rows={5} placeholder="Example: Welding, blind isolation, torque support, QA/QC coordination..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /></label>
          </div>
          <button disabled={saveUserPreferences.isPending} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-60"><Save className="h-4 w-4" /> {saveUserPreferences.isPending ? "Saving..." : "Save Profile"}</button>
        </section>
      </form>
    </div>
  );
}
