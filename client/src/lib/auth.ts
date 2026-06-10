import {
  defaultSecurityProfile,
  readSecurityProfile,
  saveSecurityProfile,
  type SecurityProfile,
} from "@/lib/security";

export const AUTH_SESSION_KEY = "sbts.authSession.v1";

export type AuthSession = {
  authenticated: boolean;
  profile: SecurityProfile;
  loginMethod: "demo-badge" | "production-bound";
  sessionId: string;
  issuedAt: string;
  expiresAt?: string | null;
};

function makeDemoSession(profile: SecurityProfile): AuthSession {
  const issuedAt = new Date().toISOString();
  return {
    authenticated: true,
    profile,
    loginMethod: "production-bound",
    sessionId: `sbts-session-${profile.badge}-${Date.now().toString(36)}`,
    issuedAt,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  };
}

export function readAuthSession(): AuthSession {
  if (typeof window === "undefined") {
    return makeDemoSession(defaultSecurityProfile);
  }
  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    const profile = readSecurityProfile();
    return { authenticated: false, profile, loginMethod: "demo-badge", sessionId: "", issuedAt: "" };
  }
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      clearAuthSession();
      return { authenticated: false, profile: defaultSecurityProfile, loginMethod: "demo-badge", sessionId: "", issuedAt: "" };
    }
    return session;
  } catch {
    clearAuthSession();
    return { authenticated: false, profile: defaultSecurityProfile, loginMethod: "demo-badge", sessionId: "", issuedAt: "" };
  }
}

export function saveAuthSession(profile: SecurityProfile, loginMethod: AuthSession["loginMethod"] = "production-bound") {
  const session = { ...makeDemoSession(profile), loginMethod };
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  saveSecurityProfile(profile);
  window.dispatchEvent(new CustomEvent("sbts-auth-session-changed", { detail: session }));
  return session;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.localStorage.removeItem("sbts.activeSecurityProfile.v1");
  window.dispatchEvent(new CustomEvent("sbts-auth-session-changed"));
  window.dispatchEvent(new CustomEvent("sbts-security-profile-changed"));
}
