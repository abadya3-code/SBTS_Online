import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "../_core/context";

export type SbtsUserContext = NonNullable<TrpcContext["user"]> & {
  roleKey?: string | null;
  status?: string | null;
  permissionKeys?: string[] | null;
  phaseKeys?: string[] | null;
  areaIds?: string[] | null;
  projectIds?: string[] | null;
};

export type SbtsPermissionContext = Pick<TrpcContext, "user">;

function readRoleKey(user: SbtsUserContext) {
  return user.roleKey ?? (user.role === "admin" ? "admin" : null);
}

export function requireActiveUser(ctx: SbtsPermissionContext): SbtsUserContext {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required." });
  }

  const user = ctx.user as SbtsUserContext;
  const status = user.status ?? "Active";

  if (status !== "Active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your account is pending admin approval or inactive.",
    });
  }

  return user;
}

export function requireAdmin(ctx: SbtsPermissionContext): SbtsUserContext {
  const user = requireActiveUser(ctx);
  const roleKey = readRoleKey(user);

  if (roleKey !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin permission required." });
  }

  return user;
}

export function requireRole(ctx: SbtsPermissionContext, allowedRoleKeys: string[]): SbtsUserContext {
  const user = requireActiveUser(ctx);
  const roleKey = readRoleKey(user);

  if (roleKey === "admin") return user;

  if (!roleKey || !allowedRoleKeys.includes(roleKey)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission for this action.",
    });
  }

  return user;
}

export function requirePermission(ctx: SbtsPermissionContext, permissionKey: string): SbtsUserContext {
  const user = requireActiveUser(ctx);
  const roleKey = readRoleKey(user);

  if (roleKey === "admin") return user;

  if (!user.permissionKeys?.includes(permissionKey)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Missing permission: ${permissionKey}`,
    });
  }

  return user;
}

export function requireAreaAccess(ctx: SbtsPermissionContext, areaId: string): SbtsUserContext {
  const user = requireActiveUser(ctx);
  const roleKey = readRoleKey(user);

  if (roleKey === "admin") return user;

  // Sprint 17.4 safety guard: once area-level assignment is populated, enforce it.
  // Empty/undefined lists are temporarily treated as role-level access to avoid breaking legacy pilot data.
  if (user.areaIds?.length && !user.areaIds.includes(areaId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this area." });
  }

  return user;
}

export function requireProjectAccess(ctx: SbtsPermissionContext, projectId: string): SbtsUserContext {
  const user = requireActiveUser(ctx);
  const roleKey = readRoleKey(user);

  if (roleKey === "admin") return user;

  // Sprint 17.4 safety guard: once project-level assignment is populated, enforce it.
  // Empty/undefined lists are temporarily treated as role-level access to avoid breaking legacy pilot data.
  if (user.projectIds?.length && !user.projectIds.includes(projectId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this project." });
  }

  return user;
}

export function requirePhaseAuthorization(ctx: SbtsPermissionContext, phaseKey: string): SbtsUserContext {
  const user = requireActiveUser(ctx);
  const roleKey = readRoleKey(user);

  if (roleKey === "admin") return user;

  if (user.phaseKeys?.length && !user.phaseKeys.includes(phaseKey)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized for this workflow phase." });
  }

  return user;
}

export function requireCertificateUnlocked(locked?: boolean | null, reason?: string | null) {
  if (locked) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: reason ?? "Certificate is locked. This record cannot be modified.",
    });
  }
}
