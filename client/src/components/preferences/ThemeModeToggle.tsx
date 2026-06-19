import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";

const modes: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "System", icon: Monitor },
];

type ThemeModeToggleProps = {
  compact?: boolean;
  className?: string;
};

export function ThemeModeToggle({ compact = false, className = "" }: ThemeModeToggleProps) {
  const { themeMode, setThemeMode, effectiveTheme } = useTheme();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/85 p-1 text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-200 ${className}`}
      title={`Theme mode: ${themeMode} (${effectiveTheme})`}
    >
      {modes.map((item) => {
        const Icon = item.icon;
        const active = themeMode === item.mode;
        return (
          <button
            key={item.mode}
            type="button"
            onClick={() => setThemeMode(item.mode)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-xs font-black transition ${active ? "bg-slate-950 text-white shadow-sm dark:bg-cyan-300 dark:text-slate-950" : "hover:bg-slate-100 dark:hover:bg-white/10"}`}
            aria-label={`Use ${item.label} theme`}
          >
            <Icon className="h-4 w-4" />
            {!compact ? <span className="hidden sm:inline">{item.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
