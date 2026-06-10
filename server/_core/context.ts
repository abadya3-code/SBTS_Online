import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { accessRolePermissions, accessRoles, employees, sbtsAuthSessions } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { eq } from "drizzle-orm";
import { sdk } from "./sdk";
import { getDb } from "../db";

export type AuthSessionUser = User & {
  employeeId?: string | null;
  badge?: string | null;
  roleKey?: string | null;
  status?: string | null;
  permissionKeys?: string[];
  phaseKeys?: string[];
  areaIds?: string[];
  projectIds?: string[];
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AuthSessionUser | null;
  authSessionId: string | null;
};

function parseCookie(header: string | undefined, name: string) {
  if (!header) return null;
  const parts = header.split(";").map(part => part.trim());
  const target = parts.find(part => part.startsWith(`${name}=`));
  return target ? decodeURIComponent(target.slice(name.length + 1)) : null;
}

function safeJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function authenticateSbtsSession(req: CreateExpressContextOptions["req"]): Promise<{ user: AuthSessionUser | null; sessionId: string | null }> {
  const sessionId = parseCookie(req.headers.cookie, COOKIE_NAME);
  if (!sessionId) return { user: null, sessionId: null };

  const db = await getDb();
  if (!db) return { user: null, sessionId };

  const rows = await db.select().from(sbtsAuthSessions).where(eq(sbtsAuthSessions.id, sessionId)).limit(1);
  const session = rows[0];
  if (!session) return { user: null, sessionId };
  if (session.revokedAt) return { user: null, sessionId };
  if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) return { user: null, sessionId };

  const employeeRows = await db.select().from(employees).where(eq(employees.id, session.employeeId)).limit(1);
  const employee = employeeRows[0];
  if (!employee || employee.status !== "Active") return { user: null, sessionId };

  const roleRows = await db.select().from(accessRoles).where(eq(accessRoles.key, employee.roleKey)).limit(1);
  const role = roleRows[0];
  const permissionRows = await db
    .select()
    .from(accessRolePermissions)
    .where(eq(accessRolePermissions.roleKey, employee.roleKey));

  const phaseKeys = role?.phaseKeysJson
    ? safeJsonArray(role.phaseKeysJson)
    : [];

  return {
    sessionId,
    user: {
      id: 0,
      openId: `employee:${employee.id}`,
      name: employee.fullName,
      email: null,
      loginMethod: session.loginMethod,
      role: employee.roleKey === "admin" ? "admin" : "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      employeeId: employee.id,
      badge: employee.badge,
      roleKey: employee.roleKey,
      status: employee.status,
      permissionKeys: permissionRows.map(permission => permission.permissionKey),
      phaseKeys,
      areaIds: [],
      projectIds: [],
    } as AuthSessionUser,
  };
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: AuthSessionUser | null = null;
  let authSessionId: string | null = null;

  try {
    const sbtsAuth = await authenticateSbtsSession(opts.req);
    user = sbtsAuth.user;
    authSessionId = sbtsAuth.sessionId;
  } catch {
    user = null;
    authSessionId = null;
  }

  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req) as AuthSessionUser;
    } catch {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    authSessionId,
  };
}
