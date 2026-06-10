import { readAuthSession, saveAuthSession } from "@/lib/auth";
import { readSecurityProfile, saveSecurityProfile, type SecurityProfile } from "@/lib/security";
import { dispatchThemeChanged, type SbtsThemeTemplate, type ThemePreferenceMode } from "@/lib/themeEngine";

export const USER_PROFILE_KEY = "sbts.userProfile.v1";
export type UserProfilePrefs = {
  email?: string;
  specialtyDescription?: string;
  avatarDataUrl?: string;
  themeTemplate?: SbtsThemeTemplate;
  themePreferenceMode?: ThemePreferenceMode;
  customAccentColor?: string;
};

export function readUserProfile(): UserProfilePrefs {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(USER_PROFILE_KEY) || "{}") as UserProfilePrefs;
  } catch {
    return {};
  }
}

export function saveUserProfile(profile: UserProfilePrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("sbts-user-profile-changed", { detail: profile }));
  dispatchThemeChanged();
}

export function updateCurrentUserProfile(patch: Partial<SecurityProfile>, prefsPatch?: UserProfilePrefs) {
  const current = readSecurityProfile();
  const next = { ...current, ...patch };
  saveSecurityProfile(next);
  const session = readAuthSession();
  if (session.authenticated) saveAuthSession(next, session.loginMethod);
  if (prefsPatch) saveUserProfile({ ...readUserProfile(), ...prefsPatch });
  return next;
}
