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

function isAdmin(user: SbtsUserContext) {
  return readRoleKey(user) === "admin";
}

function normalizeBadge(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
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
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin permission required.",
    });
  }

  return user;
}

export function requireRole(
  ctx: SbtsPermissionContext,
  allowedRoleKeys: string[]
): SbtsUserContext {
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

export function requirePermission(
  ctx: SbtsPermissionContext,
  permissionKey: string
): SbtsUserContext {
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

export function requireAreaAccess(
  ctx: SbtsPermissionContext,
  areaId: string
): SbtsUserContext {
  const user = requireActiveUser(ctx);

  if (isAdmin(user)) return user;

  if (!Array.isArray(user.areaIds) || !user.areaIds.includes(areaId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this area.",
    });
  }

  return user;
}

export function requireProjectAccess(
  ctx: SbtsPermissionContext,
  projectId: string
): SbtsUserContext {
  const user = requireActiveUser(ctx);

  if (isAdmin(user)) return user;

  if (!Array.isArray(user.projectIds) || !user.projectIds.includes(projectId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this project.",
    });
  }

  return user;
}

export function requirePhaseAuthorization(
  ctx: SbtsPermissionContext,
  phaseKey: string
): SbtsUserContext {
  const user = requireActiveUser(ctx);
  const roleKey = readRoleKey(user);

  if (roleKey === "admin") return user;

  if (!Array.isArray(user.phaseKeys) || !user.phaseKeys.includes(phaseKey)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized for this workflow phase.",
    });
  }

  return user;
}

export function requireCertificateUnlocked(
  locked?: boolean | null,
  reason?: string | null
) {
  if (locked) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        reason ?? "Certificate is locked. This record cannot be modified.",
    });
  }
}

export function requirePhaseSignatureBinding(
  ctx: SbtsPermissionContext,
  signatureId?: string | null
): SbtsUserContext {
  const user = requireActiveUser(ctx);

  if (isAdmin(user)) return user;

  const signature = normalizeBadge(signatureId);
  const badge = normalizeBadge(user.badge);

  if (!signature || !badge || signature !== badge) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Phase signature must match the authenticated employee badge.",
    });
  }

  return user;
}
