import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

interface ThemeContextType {
  theme: EffectiveTheme;
  effectiveTheme: EffectiveTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  switchable?: boolean;
}

const THEME_MODE_STORAGE_KEY = "sbts.themeMode.v1";
const LEGACY_THEME_STORAGE_KEY = "theme";
const USER_PROFILE_STORAGE_KEY = "sbts.userProfile.v1";

function getSystemTheme(): EffectiveTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readProfileThemeMode(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { interfaceThemeMode?: unknown };
    return parsed.interfaceThemeMode === "light" || parsed.interfaceThemeMode === "dark" || parsed.interfaceThemeMode === "system"
      ? parsed.interfaceThemeMode
      : null;
  } catch {
    return null;
  }
}

function readInitialThemeMode(defaultTheme: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return defaultTheme;
  const profileMode = readProfileThemeMode();
  if (profileMode) return profileMode;

  const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null;
  if (stored === "light" || stored === "dark" || stored === "system") return stored;

  const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY) as EffectiveTheme | null;
  if (legacy === "light" || legacy === "dark") return legacy;

  return defaultTheme;
}

function resolveEffectiveTheme(mode: ThemeMode, systemTheme: EffectiveTheme): EffectiveTheme {
  return mode === "system" ? systemTheme : mode;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  switchable = true,
}: ThemeProviderProps) {
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(() => getSystemTheme());
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => readInitialThemeMode(defaultTheme));

  const effectiveTheme = useMemo(
    () => resolveEffectiveTheme(themeMode, systemTheme),
    [themeMode, systemTheme],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemTheme(query.matches ? "dark" : "light");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncProfileTheme = () => {
      const profileMode = readProfileThemeMode();
      if (profileMode) setThemeModeState(profileMode);
    };
    window.addEventListener("sbts-user-profile-changed", syncProfileTheme);
    window.addEventListener("storage", syncProfileTheme);
    return () => {
      window.removeEventListener("sbts-user-profile-changed", syncProfileTheme);
      window.removeEventListener("storage", syncProfileTheme);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", effectiveTheme === "dark");
    root.dataset.sbtsColorMode = effectiveTheme;

    if (switchable) {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
      window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, effectiveTheme);
    }

    window.dispatchEvent(new CustomEvent("sbts-theme-mode-changed", {
      detail: { mode: themeMode, effectiveTheme },
    }));
  }, [effectiveTheme, themeMode, switchable]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      const current = resolveEffectiveTheme(prev, getSystemTheme());
      return current === "dark" ? "light" : "dark";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme: effectiveTheme, effectiveTheme, themeMode, setThemeMode, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
