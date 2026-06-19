import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { readUserProfile } from "@/lib/userProfile";

type ShortcutNavItem = {
  href: string;
  label: string;
};

type KeyboardShortcutsProps = {
  navItems: ShortcutNavItem[];
};

const goShortcuts: Record<string, string> = {
  d: "/dashboard",
  a: "/areas",
  p: "/projects",
  i: "/inbox",
  s: "/settings",
  r: "/reports",
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

export function KeyboardShortcuts({ navItems }: KeyboardShortcutsProps) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [goMode, setGoMode] = useState(false);
  const [preferences, setPreferences] = useState(() => readUserProfile());

  useEffect(() => {
    const refresh = () => setPreferences(readUserProfile());
    window.addEventListener("sbts-user-profile-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("sbts-user-profile-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const commandSearchEnabled = preferences.commandSearchEnabled ?? true;
  const keyboardShortcutsEnabled = preferences.keyboardShortcutsEnabled ?? true;

  const searchableItems = useMemo(
    () => navItems.filter((item) => item.href && item.label),
    [navItems],
  );

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchableItems;
    return searchableItems.filter((item) => item.label.toLowerCase().includes(normalized) || item.href.toLowerCase().includes(normalized));
  }, [query, searchableItems]);

  useEffect(() => {
    if (!goMode) return;
    const timeout = window.setTimeout(() => setGoMode(false), 1_200);
    return () => window.clearTimeout(timeout);
  }, [goMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
        setGoMode(false);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "k") {
        if (!commandSearchEnabled) return;
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }

      if (isEditableTarget(event.target)) return;

      if (key === "/") {
        if (!commandSearchEnabled) return;
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (!keyboardShortcutsEnabled) return;

      if (key === "g") {
        setGoMode(true);
        return;
      }

      if (goMode && goShortcuts[key]) {
        event.preventDefault();
        setGoMode(false);
        setLocation(goShortcuts[key]);
        toast.info(`Navigated to ${goShortcuts[key]}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandSearchEnabled, goMode, keyboardShortcutsEnabled, setLocation]);

  function openItem(href: string) {
    setLocation(href);
    setOpen(false);
    setQuery("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/45 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search navigation, reports, settings..."
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 dark:text-white"
          />
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close command search">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredItems.length ? filteredItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => openItem(item.href)}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <span>{item.label}</span>
              <span className="text-xs font-bold text-slate-400">{item.href}</span>
            </button>
          )) : (
            <div className="px-4 py-8 text-center text-sm font-semibold text-slate-500">No matching navigation item.</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-3 text-[11px] font-black text-slate-500 dark:border-white/10 dark:text-slate-400">
          <span>Ctrl/⌘ K command search</span>
          <span>G D dashboard</span>
          <span>G A areas</span>
          <span>G P projects</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
