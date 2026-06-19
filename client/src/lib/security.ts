export type SecurityRoleKey =
  | "admin"
  | "coordinator"
  | "technician"
  | "qc"
  | "safety"
  | "inspection"
  | "tiEngineer"
  | "metalForeman";

export type SecurityProfile = {
  id: string;
  badge: string;
  fullName: string;
  roleKey: SecurityRoleKey;
  roleLabel: string;
  initials: string;
  status: "Active" | "Standby" | "Unavailable";
};

export const SECURITY_PROFILE_KEY = "sbts.activeSecurityProfile.v1";

export const defaultSecurityProfile: SecurityProfile = {
  id: "emp-admin",
  badge: "admin",
  fullName: "System Admin",
  roleKey: "admin",
  roleLabel: "System Admin",
  initials: "SA",
  status: "Active",
};

export const adminOnlyRoutePrefixes = [
  "/users",
  "/access-control",
  "/workflow-studio",
  "/audit",
  "/monitoring",
];

export function isAdminProfile(profile?: Pick<SecurityProfile, "roleKey" | "status"> | null) {
  return profile?.roleKey === "admin" && profile?.status === "Active";
}

export function readSecurityProfile(): SecurityProfile {
  if (typeof window === "undefined") return defaultSecurityProfile;
  const raw = window.localStorage.getItem(SECURITY_PROFILE_KEY);
  if (!raw) return defaultSecurityProfile;
  try {
    return { ...defaultSecurityProfile, ...JSON.parse(raw) } as SecurityProfile;
  } catch {
    return defaultSecurityProfile;
  }
}

export function saveSecurityProfile(profile: SecurityProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SECURITY_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("sbts-security-profile-changed", { detail: profile }));
}

export function routeRequiresAdmin(pathname: string) {
  return adminOnlyRoutePrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function canAccessPath(profile: SecurityProfile, pathname: string) {
  if (!routeRequiresAdmin(pathname)) return true;
  return isAdminProfile(profile);
}
