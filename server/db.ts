import { asc, eq } from "drizzle-orm";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import {
  InsertUser,
  accessPermissions,
  accessRolePermissions,
  accessRoles,
  areas,
  projects,
  blinds,
  blindWorkflowLogs,
  approvals,
  torqueRecords,
  certificates,
  tagDesignerSettings,
  notifications,
  auditTrail,
  systemSettings,
  sbtsSchemaVersions,
  fileUploads,
  userPreferences,
  productionPersistenceEvents,
  authPasswordCredentials,
  authPasswordResetTokens,
  securityEvents,
  approvalProfiles,
  approvalProfileApprovers,
  certificateLockEvents,
  sbtsAuthSessions,
  employees,
  projectPhaseAssignments,
  users,
  workflowPhases,
  workflowTemplates,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new Error(
      "Database is not available. Verify DATABASE_URL before using workflow persistence."
    );
  }
  return db;
}

export type PersistenceDomainStatus = {
  domain: string;
  table: string;
  persisted: boolean;
  mode: "Database" | "Demo";
  note: string;
};

export type ProductionPersistenceStatus = {
  mode: "Database" | "Demo";
  databaseUrlConfigured: boolean;
  databaseAvailable: boolean;
  schemaVersion: string;
  generatedAt: string;
  assetHierarchyDeferred: boolean;
  domains: PersistenceDomainStatus[];
  recommendedNextActions: string[];
};

const sprint11PersistenceDomains: Array<{ domain: string; table: string; note: string }> = [
  { domain: "Areas", table: "areas", note: "Operational area boundaries." },
  { domain: "Projects", table: "projects", note: "Project containers and maintenance reason." },
  { domain: "Blinds", table: "blinds", note: "Blind register and QR identity." },
  { domain: "Workflow Logs", table: "blind_workflow_logs", note: "Phase movement history." },
  { domain: "Phase Assignments", table: "project_phase_assignments", note: "Authorized workers per phase." },
  { domain: "Approvals", table: "approvals", note: "Final/phase approval requests." },
  { domain: "Torque Records", table: "torque_records", note: "Torque execution records." },
  { domain: "Certificates", table: "certificates", note: "Issued certificate history." },
  { domain: "Notifications", table: "notifications", note: "Inbox events and actions." },
  { domain: "Audit Trail", table: "audit_trail", note: "Governance traceability." },
  { domain: "System Settings", table: "system_settings", note: "General, tags, certificate, security settings." },
  { domain: "User Preferences", table: "user_preferences", note: "Profile photo, theme, and personal settings." },
  { domain: "File Uploads", table: "file_uploads", note: "Future production storage references for logos and avatars." },
];

async function ensureSprint11Metadata(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  try {
    await db.insert(sbtsSchemaVersions).values({
      version: "11.0.0",
      label: "Production Database Persistence foundation",
      appliedByOpenId: "system",
      notes: "Adds persistence metadata, file upload references, user preferences, and production event tracking.",
    }).onDuplicateKeyUpdate({
      set: {
        label: "Production Database Persistence foundation",
        notes: "Adds persistence metadata, file upload references, user preferences, and production event tracking.",
      },
    });
  } catch (error) {
    console.warn("[Database] Sprint 11 metadata check failed:", error);
  }
}

export async function getProductionPersistenceStatus(): Promise<ProductionPersistenceStatus> {
  const db = await getDb();
  if (db) {
    await ensureSprint11Metadata(db);
  }

  const databaseAvailable = Boolean(db);
  return {
    mode: databaseAvailable ? "Database" : "Demo",
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    databaseAvailable,
    schemaVersion: "11.0.0",
    generatedAt: new Date().toISOString(),
    assetHierarchyDeferred: true,
    domains: sprint11PersistenceDomains.map(item => ({
      ...item,
      persisted: databaseAvailable,
      mode: databaseAvailable ? "Database" : "Demo",
      note: databaseAvailable
        ? `${item.note} Reads/writes are expected to use database persistence.`
        : `${item.note} Demo fallback is active until DATABASE_URL is configured and migrations are applied.`,
    })),
    recommendedNextActions: databaseAvailable
      ? [
          "Run a full create/update workflow test against the database.",
          "Verify certificates, tags, notifications, and audit records survive a server restart.",
          "Move uploaded logos/avatars from Data URL fallback into production file storage.",
        ]
      : [
          "Set DATABASE_URL in the environment.",
          "Run pnpm db:push or apply drizzle migrations.",
          "Seed admin/user data and run pnpm qa:full.",
        ],
  };
}

export async function recordPersistenceEvent(input: {
  eventType: string;
  domain: string;
  status?: "Info" | "Success" | "Warning" | "Error";
  summary: string;
  metadata?: unknown;
  actorOpenId?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(productionPersistenceEvents).values({
    eventType: input.eventType,
    domain: input.domain,
    status: input.status ?? "Info",
    summary: input.summary,
    metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    actorOpenId: input.actorOpenId ?? null,
  });
}

const scryptAsync = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;

function makeAuthId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(6).toString("hex")}`;
}

async function hashPassword(password: string, salt = randomBytes(24).toString("hex")) {
  const derived = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return { salt, hash: derived.toString("hex") };
}

async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const derived = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(expectedHash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

export type PasswordRegisterInput = {
  employeeId: string;
  username: string;
  password: string;
  recoveryEmail?: string | null;
  mustChangePassword?: boolean;
};

export type PasswordLoginInput = {
  username: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type PasswordAuthResult = {
  authenticated: true;
  sessionId: string;
  openId: string;
  employee: {
    id: string;
    badge: string;
    fullName: string;
    roleKey: RoleKey;
    status: string;
  };
  expiresAt: string;
};

export async function recordSecurityEvent(input: {
  eventType: string;
  severity?: "info" | "warning" | "error" | "critical";
  actorOpenId?: string | null;
  employeeId?: string | null;
  badge?: string | null;
  roleKey?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  summary: string;
  metadata?: unknown;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(securityEvents).values({
    eventType: input.eventType,
    severity: input.severity ?? "info",
    actorOpenId: input.actorOpenId ?? null,
    employeeId: input.employeeId ?? null,
    badge: input.badge ?? null,
    roleKey: input.roleKey ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    summary: input.summary,
    metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

export async function registerPasswordCredential(
  input: PasswordRegisterInput,
  actorOpenId?: string | null
) {
  const db = await requireDb();
  const employeeRows = await db.select().from(employees).where(eq(employees.id, input.employeeId)).limit(1);
  const employee = employeeRows[0];
  if (!employee) throw new Error("Employee was not found.");
  if (employee.status !== "Active") throw new Error("Employee must be Active before creating login credentials.");

  const username = input.username.trim().toLowerCase();
  const existing = await db.select().from(authPasswordCredentials).where(eq(authPasswordCredentials.username, username)).limit(1);
  if (existing.length > 0) throw new Error("Username already exists.");

  const { salt, hash } = await hashPassword(input.password);
  const credentialId = makeAuthId("cred");
  await db.insert(authPasswordCredentials).values({
    id: credentialId,
    employeeId: employee.id,
    username,
    recoveryEmail: input.recoveryEmail?.trim().toLowerCase() || null,
    passwordHash: hash,
    passwordSalt: salt,
    passwordAlgorithm: "scrypt-sha256",
    status: "Active",
    mustChangePassword: input.mustChangePassword ? 1 : 0,
    failedAttempts: 0,
    createdByOpenId: actorOpenId ?? "system",
  });

  await recordSecurityEvent({
    eventType: "credential.created",
    severity: "info",
    actorOpenId: actorOpenId ?? "system",
    employeeId: employee.id,
    badge: employee.badge,
    roleKey: employee.roleKey,
    summary: `Password credential created for ${employee.fullName}.`,
  });

  return { success: true as const, credentialId, username };
}


export async function createEmployeeWithCredential(input: {
  badge: string;
  fullName: string;
  roleKey: RoleKey;
  specialty: string;
  department: string;
  shift: string;
  status: "Pending" | "Active" | "Standby" | "Unavailable" | "Rejected" | "Disabled";
  photoUrl?: string | null;
  isCertified?: boolean;
  username: string;
  password: string;
  recoveryEmail?: string | null;
}, actorOpenId?: string | null) {
  const db = await requireDb();
  const username = input.username.trim().toLowerCase();
  const existing = await db.select().from(authPasswordCredentials).where(eq(authPasswordCredentials.username, username)).limit(1);
  if (existing.length > 0) throw new Error("Username already exists.");
  const employee = await createEmployee({
    badge: input.badge,
    fullName: input.fullName,
    roleKey: actorOpenId === "self-register" ? "technician" : input.roleKey,
    specialty: input.specialty,
    department: input.department,
    shift: input.shift,
    status: actorOpenId === "self-register" ? "Pending" : input.status,
    photoUrl: input.photoUrl ?? null,
    isCertified: input.isCertified ?? false,
  });
  const { salt, hash } = await hashPassword(input.password);
  const credentialId = makeAuthId("cred");
  await db.insert(authPasswordCredentials).values({
    id: credentialId,
    employeeId: employee.id,
    username,
    recoveryEmail: input.recoveryEmail?.trim().toLowerCase() || null,
    passwordHash: hash,
    passwordSalt: salt,
    passwordAlgorithm: "scrypt-sha256",
    status: employee.status === "Active" ? "Active" : "Pending",
    mustChangePassword: 0,
    failedAttempts: 0,
    createdByOpenId: actorOpenId ?? "self-register",
  });
  await createSystemNotification({
    userOpenId: null,
    type: "Action",
    title: "New user approval required",
    message: `${employee.fullName} registered and is waiting for admin approval.`,
    relatedEntity: "User",
    relatedId: employee.id,
    actionUrl: "/users",
    severity: "warning",
  });
  await recordSecurityEvent({
    eventType: "user.pending_approval",
    severity: "info",
    actorOpenId: actorOpenId ?? "self-register",
    employeeId: employee.id,
    badge: employee.badge,
    roleKey: employee.roleKey,
    summary: `${employee.fullName} submitted a registration request. Credential remains Pending until admin approval.`,
  });
  return { employee, credential: { success: true as const, credentialId, username } };
}

export async function authenticatePasswordUser(input: PasswordLoginInput): Promise<PasswordAuthResult> {
  const db = await requireDb();
  const username = input.username.trim().toLowerCase();
  const credentialRows = await db
    .select()
    .from(authPasswordCredentials)
    .where(eq(authPasswordCredentials.username, username))
    .limit(1);
  const credential = credentialRows[0];

  if (!credential || credential.status !== "Active") {
    await recordSecurityEvent({
      eventType: "login.failed",
      severity: "warning",
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      summary: `Failed login for username ${username}.`,
      metadata: { reason: credential ? "inactive" : "not_found" },
    });
    throw new Error("Invalid username or password.");
  }

  const ok = await verifyPassword(input.password, credential.passwordSalt, credential.passwordHash);
  if (!ok) {
    await db
      .update(authPasswordCredentials)
      .set({ failedAttempts: (credential.failedAttempts ?? 0) + 1 })
      .where(eq(authPasswordCredentials.id, credential.id));
    await recordSecurityEvent({
      eventType: "login.failed",
      severity: "warning",
      employeeId: credential.employeeId,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      summary: `Failed password check for ${username}.`,
    });
    throw new Error("Invalid username or password.");
  }

  const employeeRows = await db.select().from(employees).where(eq(employees.id, credential.employeeId)).limit(1);
  const employee = employeeRows[0];
  if (!employee || employee.status !== "Active") throw new Error("Employee is not active.");

  const sessionId = makeAuthId("session");
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const openId = `employee:${employee.id}`;
  await db.insert(sbtsAuthSessions).values({
    id: sessionId,
    employeeId: employee.id,
    badge: employee.badge,
    roleKey: employee.roleKey,
    loginMethod: "password",
    provider: "SBTS Password",
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    expiresAt,
  });

  await db.update(authPasswordCredentials).set({
    failedAttempts: 0,
    lastLoginAt: new Date(),
  }).where(eq(authPasswordCredentials.id, credential.id));

  await recordSecurityEvent({
    eventType: "login.success",
    severity: "info",
    actorOpenId: openId,
    employeeId: employee.id,
    badge: employee.badge,
    roleKey: employee.roleKey,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    summary: `${employee.fullName} signed in using SBTS password authentication.`,
  });

  return {
    authenticated: true,
    sessionId,
    openId,
    employee: {
      id: employee.id,
      badge: employee.badge,
      fullName: employee.fullName,
      roleKey: employee.roleKey as RoleKey,
      status: employee.status,
    },
    expiresAt: expiresAt.toISOString(),
  };
}

export async function revokeAuthSession(sessionId: string, reason = "logout") {
  const db = await getDb();
  if (!db || !sessionId) return;
  const rows = await db.select().from(sbtsAuthSessions).where(eq(sbtsAuthSessions.id, sessionId)).limit(1);
  const session = rows[0];
  if (!session) return;
  await db.update(sbtsAuthSessions).set({
    revokedAt: new Date(),
    revokeReason: reason,
  }).where(eq(sbtsAuthSessions.id, sessionId));
  await recordSecurityEvent({
    eventType: "logout",
    severity: "info",
    actorOpenId: `employee:${session.employeeId}`,
    employeeId: session.employeeId,
    badge: session.badge,
    roleKey: session.roleKey,
    summary: `Session revoked: ${reason}.`,
  });
}

export async function requestPasswordReset(username: string) {
  const db = await requireDb();
  const normalized = username.trim().toLowerCase();
  const rows = await db.select().from(authPasswordCredentials).where(eq(authPasswordCredentials.username, normalized)).limit(1);
  const credential = rows[0];
  if (!credential || !credential.recoveryEmail) {
    // Do not reveal whether a username exists.
    return { success: true as const, message: "If a recovery email exists, a reset request will be created." };
  }
  const rawToken = randomBytes(24).toString("hex");
  const { salt, hash } = await hashPassword(rawToken);
  await db.insert(authPasswordResetTokens).values({
    id: makeAuthId("reset"),
    credentialId: credential.id,
    tokenHash: `${salt}:${hash}`,
    recoveryEmail: credential.recoveryEmail,
    status: "Pending",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  await recordSecurityEvent({
    eventType: "password.reset.requested",
    severity: "info",
    employeeId: credential.employeeId,
    summary: `Password reset requested for ${normalized}.`,
  });
  return { success: true as const, message: "If a recovery email exists, a reset request will be created." };
}


export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export type PhaseKey =
  | "broken"
  | "assembly"
  | "tightTorque"
  | "finalTight"
  | "inspectionReady";
export type RoleKey =
  | "admin"
  | "coordinator"
  | "technician"
  | "qc"
  | "safety"
  | "inspection"
  | "tiEngineer"
  | "metalForeman";
export type WorkflowStatus = "Draft" | "Active" | "Locked";

export type PermissionModel = {
  key: string;
  label: string;
  description: string;
  group: string;
};

export type PermissionGroupModel = {
  group: string;
  permissions: PermissionModel[];
};

export type RoleModel = {
  key: RoleKey;
  name: string;
  subtitle: string;
  members: number;
  color: string;
  permissionKeys: string[];
  menuKeys: string[];
  phaseKeys: PhaseKey[];
};

export type AccessControlModel = {
  permissionGroups: PermissionGroupModel[];
  roles: RoleModel[];
};

export type SaveAccessRoleModelInput = {
  roleKey: RoleKey;
  permissionKeys: string[];
  menuKeys: string[];
  phaseKeys: PhaseKey[];
};

export type AccessControlAuditActor = {
  openId?: string | null;
  name?: string | null;
  roleKey?: string | null;
};

export type WorkflowPhaseInput = {
  id: string;
  label: string;
  phaseKey: PhaseKey;
  roleKey: RoleKey;
  requiredPermissionKey: string;
  gate: string;
  slaHours: number;
  evidence: string[];
  automation: string;
  color: string;
  isCritical: boolean;
};

export type WorkflowTemplateInput = {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  projectType: string;
  version: string;
  phases: WorkflowPhaseInput[];
};

const seedPermissionGroups: PermissionGroupModel[] = [
  {
    group: "Projects & Areas",
    permissions: [
      {
        key: "projects.view",
        label: "View projects",
        description: "Read project and area lists",
        group: "Projects & Areas",
      },
      {
        key: "projects.create",
        label: "Create project",
        description: "Open new project records",
        group: "Projects & Areas",
      },
      {
        key: "projects.edit",
        label: "Edit project",
        description: "Update project details and areas",
        group: "Projects & Areas",
      },
      {
        key: "projects.delete",
        label: "Delete project",
        description: "Archive or remove project data",
        group: "Projects & Areas",
      },
    ],
  },
  {
    group: "Blind Registry",
    permissions: [
      {
        key: "blinds.view",
        label: "View blinds",
        description: "Read blind registry and QR pages",
        group: "Blind Registry",
      },
      {
        key: "blinds.create",
        label: "Create blind",
        description: "Add field blind records",
        group: "Blind Registry",
      },
      {
        key: "blinds.edit",
        label: "Edit blind",
        description: "Modify blind details and metadata",
        group: "Blind Registry",
      },
      {
        key: "blinds.phase.change",
        label: "Change phase",
        description: "Move a blind through workflow",
        group: "Blind Registry",
      },
      {
        key: "blinds.delete",
        label: "Delete blind",
        description: "Archive or delete blind records",
        group: "Blind Registry",
      },
    ],
  },
  {
    group: "Workflow & Sign-off",
    permissions: [
      {
        key: "workflow.view",
        label: "View workflow",
        description: "Read workflow ownership rules",
        group: "Workflow & Sign-off",
      },
      {
        key: "workflow.configure",
        label: "Configure workflow",
        description: "Change owners, gates, and sign-off rules",
        group: "Workflow & Sign-off",
      },
      {
        key: "workflow.approve",
        label: "Approve task",
        description: "Apply approval on assigned phases",
        group: "Workflow & Sign-off",
      },
      {
        key: "workflow.override",
        label: "Emergency override",
        description: "Use controlled admin override",
        group: "Workflow & Sign-off",
      },
    ],
  },
  {
    group: "Users, Roles & Audit",
    permissions: [
      {
        key: "users.view",
        label: "View users",
        description: "Read users and specialties",
        group: "Users, Roles & Audit",
      },
      {
        key: "users.manage",
        label: "Manage users",
        description: "Create, approve, suspend users",
        group: "Users, Roles & Audit",
      },
      {
        key: "roles.manage",
        label: "Manage roles",
        description: "Edit role templates and permissions",
        group: "Users, Roles & Audit",
      },
      {
        key: "audit.view",
        label: "View audit logs",
        description: "Read system activity trail",
        group: "Users, Roles & Audit",
      },
    ],
  },
  {
    group: "Reports & Certificates",
    permissions: [
      {
        key: "reports.view",
        label: "View reports",
        description: "Open dashboard and report cards",
        group: "Reports & Certificates",
      },
      {
        key: "reports.export",
        label: "Export reports",
        description: "Download CSV/PDF summaries",
        group: "Reports & Certificates",
      },
      {
        key: "certificates.manage",
        label: "Manage certificates",
        description: "Configure certificate templates",
        group: "Reports & Certificates",
      },
      {
        key: "qr.manage",
        label: "Manage QR tags",
        description: "Generate or reissue QR links",
        group: "Reports & Certificates",
      },
    ],
  },
];

const allSeedPermissionKeys = seedPermissionGroups.flatMap(group =>
  group.permissions.map(permission => permission.key)
);
const allSeedPhaseKeys: PhaseKey[] = [
  "broken",
  "assembly",
  "tightTorque",
  "finalTight",
  "inspectionReady",
];

const seedRoles: RoleModel[] = [
  {
    key: "admin",
    name: "Administrator",
    subtitle: "Full platform owner and emergency override",
    members: 2,
    color: "#38bdf8",
    permissionKeys: allSeedPermissionKeys,
    menuKeys: [
      "dashboard",
      "projects",
      "blinds",
      "access-control",
      "reports",
      "audit",
      "settings",
    ],
    phaseKeys: allSeedPhaseKeys,
  },
  {
    key: "coordinator",
    name: "Coordinator",
    subtitle: "Project setup, area control, assignment follow-up",
    members: 4,
    color: "#60a5fa",
    permissionKeys: [
      "projects.view",
      "projects.create",
      "projects.edit",
      "blinds.view",
      "blinds.create",
      "blinds.edit",
      "workflow.view",
      "reports.view",
      "users.view",
    ],
    menuKeys: ["dashboard", "projects", "blinds", "reports"],
    phaseKeys: ["broken"],
  },
  {
    key: "technician",
    name: "Technician",
    subtitle: "Field execution and blind status updates",
    members: 18,
    color: "#f59e0b",
    permissionKeys: [
      "projects.view",
      "blinds.view",
      "blinds.phase.change",
      "workflow.view",
      "workflow.approve",
      "qr.manage",
    ],
    menuKeys: ["dashboard", "blinds"],
    phaseKeys: ["assembly"],
  },
  {
    key: "qc",
    name: "QC Inspector",
    subtitle: "Quality verification and final tightening approval",
    members: 7,
    color: "#22c55e",
    permissionKeys: [
      "projects.view",
      "blinds.view",
      "blinds.phase.change",
      "workflow.view",
      "workflow.approve",
      "reports.view",
      "audit.view",
    ],
    menuKeys: ["dashboard", "blinds", "reports", "audit"],
    phaseKeys: ["finalTight", "inspectionReady"],
  },
  {
    key: "safety",
    name: "Safety Officer",
    subtitle: "Safety oversight, restrictions, and compliance review",
    members: 5,
    color: "#ef4444",
    permissionKeys: [
      "projects.view",
      "blinds.view",
      "workflow.view",
      "workflow.approve",
      "reports.view",
      "audit.view",
    ],
    menuKeys: ["dashboard", "blinds", "reports", "audit"],
    phaseKeys: ["broken", "inspectionReady"],
  },
  {
    key: "tiEngineer",
    name: "T&I Engineer",
    subtitle: "Torque gate owner and technical validation",
    members: 6,
    color: "#eab308",
    permissionKeys: [
      "projects.view",
      "blinds.view",
      "blinds.phase.change",
      "workflow.view",
      "workflow.approve",
      "reports.view",
    ],
    menuKeys: ["dashboard", "blinds", "reports"],
    phaseKeys: ["tightTorque"],
  },
  {
    key: "inspection",
    name: "Inspection Team",
    subtitle: "Final inspection readiness and certificate package review",
    members: 9,
    color: "#3b82f6",
    permissionKeys: [
      "projects.view",
      "blinds.view",
      "workflow.view",
      "reports.view",
      "audit.view",
    ],
    menuKeys: ["dashboard", "blinds", "reports", "audit"],
    phaseKeys: ["inspectionReady"],
  },
  {
    key: "metalForeman",
    name: "Metal Foreman",
    subtitle: "Mechanical supervision and craft-level coordination",
    members: 3,
    color: "#94a3b8",
    permissionKeys: [
      "projects.view",
      "blinds.view",
      "blinds.phase.change",
      "workflow.view",
      "workflow.approve",
    ],
    menuKeys: ["dashboard", "blinds"],
    phaseKeys: ["assembly", "tightTorque"],
  },
];

const seedWorkflowTemplates: WorkflowTemplateInput[] = [
  {
    id: "wf-shutdown-standard",
    name: "Shutdown Blind Control",
    description:
      "Standard route for blind installation, torque gate, and final inspection sign-off.",
    status: "Active",
    projectType: "Shutdown / Turnaround",
    version: "1.4",
    phases: [
      {
        id: "wf-prepare",
        label: "Preparation & broken blind request",
        phaseKey: "broken",
        roleKey: "coordinator",
        requiredPermissionKey: "blinds.create",
        gate: "Area and line number must be verified before field execution starts.",
        slaHours: 6,
        evidence: ["Line list", "Isolation reference"],
        automation: "Notify Technician team when approved",
        color: "#ef4444",
        isCritical: true,
      },
      {
        id: "wf-assembly",
        label: "Assembly / installation execution",
        phaseKey: "assembly",
        roleKey: "technician",
        requiredPermissionKey: "workflow.approve",
        gate: "Technician confirms tag, size, blind type, and QR scan from site.",
        slaHours: 12,
        evidence: ["QR scan", "Field photo"],
        automation: "Escalate to Coordinator after SLA breach",
        color: "#f59e0b",
        isCritical: false,
      },
      {
        id: "wf-torque",
        label: "Tight & Torque validation",
        phaseKey: "tightTorque",
        roleKey: "tiEngineer",
        requiredPermissionKey: "workflow.approve",
        gate: "Torque values and flange condition must be signed by T&I Engineering.",
        slaHours: 8,
        evidence: ["Torque sheet", "Tool calibration"],
        automation: "Unlock Final Tight only after approval",
        color: "#eab308",
        isCritical: true,
      },
      {
        id: "wf-final",
        label: "Final Tight quality sign-off",
        phaseKey: "finalTight",
        roleKey: "qc",
        requiredPermissionKey: "workflow.approve",
        gate: "QC inspector verifies final tight and records acceptance.",
        slaHours: 8,
        evidence: ["QC checklist", "Inspector signature"],
        automation: "Create audit event and update dashboard",
        color: "#22c55e",
        isCritical: true,
      },
      {
        id: "wf-inspection",
        label: "Inspection ready handover",
        phaseKey: "inspectionReady",
        roleKey: "inspection",
        requiredPermissionKey: "reports.view",
        gate: "Inspection team can view final status and release certificate package.",
        slaHours: 10,
        evidence: ["Final report", "Certificate reference"],
        automation: "Notify project stakeholders",
        color: "#3b82f6",
        isCritical: false,
      },
    ],
  },
  {
    id: "wf-maintenance-lite",
    name: "Maintenance Quick Route",
    description:
      "Lean workflow for short maintenance scopes that still requires centralized permission ownership.",
    status: "Draft",
    projectType: "Maintenance",
    version: "0.8",
    phases: [
      {
        id: "wf-lite-request",
        label: "Request validation",
        phaseKey: "broken",
        roleKey: "coordinator",
        requiredPermissionKey: "projects.view",
        gate: "Coordinator validates scope and allowed area.",
        slaHours: 4,
        evidence: ["Scope note"],
        automation: "Open task list for Technician",
        color: "#ef4444",
        isCritical: false,
      },
      {
        id: "wf-lite-execute",
        label: "Field execution",
        phaseKey: "assembly",
        roleKey: "technician",
        requiredPermissionKey: "blinds.phase.change",
        gate: "Technician updates blind state from mobile QR scan.",
        slaHours: 8,
        evidence: ["QR scan"],
        automation: "Notify QC when complete",
        color: "#f59e0b",
        isCritical: false,
      },
      {
        id: "wf-lite-close",
        label: "QC closeout",
        phaseKey: "finalTight",
        roleKey: "qc",
        requiredPermissionKey: "workflow.approve",
        gate: "QC reviews closeout evidence and locks the record.",
        slaHours: 6,
        evidence: ["Closeout note"],
        automation: "Write audit log entry",
        color: "#22c55e",
        isCritical: true,
      },
    ],
  },
];

function deserializeJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function deserializeEvidence(value: string | null | undefined): string[] {
  return deserializeJsonArray(value);
}

function normalizeWorkflowRows(
  templates: (typeof workflowTemplates.$inferSelect)[],
  phases: (typeof workflowPhases.$inferSelect)[]
): WorkflowTemplateInput[] {
  return templates.map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    status: template.status,
    projectType: template.projectType,
    version: template.version,
    phases: phases
      .filter(phase => phase.workflowId === template.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(phase => ({
        id: phase.id,
        label: phase.label,
        phaseKey: phase.phaseKey,
        roleKey: phase.roleKey as RoleKey,
        requiredPermissionKey: phase.requiredPermissionKey,
        gate: phase.gate,
        slaHours: phase.slaHours,
        evidence: deserializeEvidence(phase.evidenceJson),
        automation: phase.automation,
        color: phase.color,
        isCritical: phase.isCritical === 1,
      })),
  }));
}

async function assertAccessReferences(
  input: WorkflowTemplateInput
): Promise<void> {
  await seedAccessControl();
  const db = await requireDb();
  const [roleRows, permissionRows] = await Promise.all([
    db.select({ key: accessRoles.key }).from(accessRoles),
    db.select({ key: accessPermissions.key }).from(accessPermissions),
  ]);
  const roleKeys = new Set(roleRows.map(role => role.key));
  const permissionKeys = new Set(
    permissionRows.map(permission => permission.key)
  );

  for (const phase of input.phases) {
    if (!roleKeys.has(phase.roleKey)) {
      throw new Error(`Unknown workflow role key: ${phase.roleKey}`);
    }
    if (!permissionKeys.has(phase.requiredPermissionKey)) {
      throw new Error(
        `Unknown workflow permission key: ${phase.requiredPermissionKey}`
      );
    }
  }
}

export async function getAccessControlModel(): Promise<AccessControlModel> {
  const db = await getDb();
  if (!db) {
    return { permissionGroups: seedPermissionGroups, roles: seedRoles };
  }
  await seedAccessControl();
  const [permissionRows, roleRows, assignmentRows] = await Promise.all([
    db
      .select()
      .from(accessPermissions)
      .orderBy(asc(accessPermissions.group), asc(accessPermissions.label)),
    db.select().from(accessRoles).orderBy(asc(accessRoles.name)),
    db.select().from(accessRolePermissions),
  ]);

  const groups = permissionRows.reduce<PermissionGroupModel[]>(
    (collection, permission) => {
      let group = collection.find(item => item.group === permission.group);
      if (!group) {
        group = { group: permission.group, permissions: [] };
        collection.push(group);
      }
      group.permissions.push({
        key: permission.key,
        label: permission.label,
        description: permission.description,
        group: permission.group,
      });
      return collection;
    },
    []
  );

  const roles: RoleModel[] = roleRows.map(role => ({
    key: role.key as RoleKey,
    name: role.name,
    subtitle: role.subtitle,
    members: role.members,
    color: role.color,
    permissionKeys: assignmentRows
      .filter(assignment => assignment.roleKey === role.key)
      .map(assignment => assignment.permissionKey),
    menuKeys: deserializeJsonArray(role.menuKeysJson),
    phaseKeys: deserializeJsonArray(role.phaseKeysJson) as PhaseKey[],
  }));

  return { permissionGroups: groups, roles };
}

export async function saveAccessRoleModel(
  input: SaveAccessRoleModelInput,
  actor: AccessControlAuditActor = {}
): Promise<{ ok: true; roleKey: RoleKey }> {
  const db = await requireDb();
  await seedAccessControl();

  const normalizedPermissionKeys = Array.from(new Set(input.permissionKeys));
  const normalizedMenuKeys = Array.from(new Set(input.menuKeys));
  const normalizedPhaseKeys = Array.from(new Set(input.phaseKeys));

  const [roleRows, permissionRows] = await Promise.all([
    db.select().from(accessRoles).where(eq(accessRoles.key, input.roleKey)).limit(1),
    db.select({ key: accessPermissions.key }).from(accessPermissions),
  ]);

  const role = roleRows[0];
  if (!role) {
    throw new Error(`Access role was not found: ${input.roleKey}`);
  }

  const allowedPermissionKeys = new Set(permissionRows.map(permission => permission.key));
  const unknownPermissionKeys = normalizedPermissionKeys.filter(key => !allowedPermissionKeys.has(key));
  if (unknownPermissionKeys.length > 0) {
    throw new Error(`Unknown permission key(s): ${unknownPermissionKeys.join(", ")}`);
  }

  const beforeModel = {
    ...role,
    permissionKeys: (await db
      .select({ permissionKey: accessRolePermissions.permissionKey })
      .from(accessRolePermissions)
      .where(eq(accessRolePermissions.roleKey, input.roleKey)))
      .map(item => item.permissionKey),
  };

  await db.transaction(async tx => {
    await tx
      .update(accessRoles)
      .set({
        menuKeysJson: JSON.stringify(normalizedMenuKeys),
        phaseKeysJson: JSON.stringify(normalizedPhaseKeys),
        updatedAt: new Date(),
      })
      .where(eq(accessRoles.key, input.roleKey));

    await tx
      .delete(accessRolePermissions)
      .where(eq(accessRolePermissions.roleKey, input.roleKey));

    if (normalizedPermissionKeys.length > 0) {
      await tx.insert(accessRolePermissions).values(
        normalizedPermissionKeys.map(permissionKey => ({
          roleKey: input.roleKey,
          permissionKey,
          createdAt: new Date(),
        }))
      );
    }

    await tx.insert(auditTrail).values({
      entityType: "ACCESS_CONTROL",
      entityId: input.roleKey,
      action: "ACCESS_ROLE_MODEL_SAVED",
      actorOpenId: actor.openId ?? null,
      actorName: actor.name ?? "System Admin",
      actorRoleKey: actor.roleKey ?? "admin",
      summary: `Access role model updated for ${input.roleKey}.`,
      beforeJson: JSON.stringify(beforeModel),
      afterJson: JSON.stringify({
        roleKey: input.roleKey,
        permissionKeys: normalizedPermissionKeys,
        menuKeys: normalizedMenuKeys,
        phaseKeys: normalizedPhaseKeys,
      }),
    });
  });

  return { ok: true, roleKey: input.roleKey };
}

export async function getAllWorkflows(): Promise<WorkflowTemplateInput[]> {
  const db = await getDb();
  if (!db) {
    return seedWorkflowTemplates;
  }
  await seedAccessControl();
  await seedWorkflows();
  const templateRows = await db
    .select()
    .from(workflowTemplates)
    .orderBy(asc(workflowTemplates.name));
  const phaseRows = await db
    .select()
    .from(workflowPhases)
    .orderBy(asc(workflowPhases.sortOrder));
  return normalizeWorkflowRows(templateRows, phaseRows);
}

export async function getWorkflowById(
  id: string
): Promise<WorkflowTemplateInput | undefined> {
  const db = await getDb();
  if (!db) {
    return seedWorkflowTemplates.find(workflow => workflow.id === id);
  }
  const templateRows = await db
    .select()
    .from(workflowTemplates)
    .where(eq(workflowTemplates.id, id))
    .limit(1);
  if (!templateRows[0]) return undefined;
  const phaseRows = await db
    .select()
    .from(workflowPhases)
    .where(eq(workflowPhases.workflowId, id))
    .orderBy(asc(workflowPhases.sortOrder));
  return normalizeWorkflowRows(templateRows, phaseRows)[0];
}

export async function upsertWorkflow(
  input: WorkflowTemplateInput,
  userOpenId?: string
): Promise<WorkflowTemplateInput> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Demo mode: workflow save was accepted in memory only because DATABASE_URL is not configured."
    );
    return input;
  }
  await assertAccessReferences(input);
  await db.transaction(async tx => {
    await tx
      .insert(workflowTemplates)
      .values({
        id: input.id,
        name: input.name,
        description: input.description,
        status: input.status,
        projectType: input.projectType,
        version: input.version,
        createdByOpenId: userOpenId,
        updatedByOpenId: userOpenId,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: input.name,
          description: input.description,
          status: input.status,
          projectType: input.projectType,
          version: input.version,
          updatedByOpenId: userOpenId,
        },
      });

    await tx
      .delete(workflowPhases)
      .where(eq(workflowPhases.workflowId, input.id));

    if (input.phases.length > 0) {
      await tx.insert(workflowPhases).values(
        input.phases.map((phase, index) => ({
          id: phase.id,
          workflowId: input.id,
          sortOrder: index,
          label: phase.label,
          phaseKey: phase.phaseKey,
          roleKey: phase.roleKey,
          requiredPermissionKey: phase.requiredPermissionKey,
          gate: phase.gate,
          slaHours: phase.slaHours,
          evidenceJson: JSON.stringify(phase.evidence),
          automation: phase.automation,
          color: phase.color,
          isCritical: phase.isCritical ? 1 : 0,
        }))
      );
    }
  });

  const saved = await getWorkflowById(input.id);
  if (!saved) throw new Error("Workflow could not be read after save.");
  return saved;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const db = await requireDb();
  await db.transaction(async tx => {
    await tx.delete(workflowPhases).where(eq(workflowPhases.workflowId, id));
    await tx.delete(workflowTemplates).where(eq(workflowTemplates.id, id));
  });
}

export async function seedAccessControl(): Promise<void> {
  const db = await requireDb();
  const existingPermissions = await db
    .select({ key: accessPermissions.key })
    .from(accessPermissions)
    .limit(1);
  if (existingPermissions.length > 0) return;

  await db.transaction(async tx => {
    const now = new Date();
    const permissions = seedPermissionGroups.flatMap(
      group => group.permissions
    );
    await tx.insert(accessPermissions).values(
      permissions.map(permission => ({
        ...permission,
        createdAt: now,
        updatedAt: now,
      }))
    );
    await tx.insert(accessRoles).values(
      seedRoles.map(role => ({
        key: role.key,
        name: role.name,
        subtitle: role.subtitle,
        members: role.members,
        color: role.color,
        menuKeysJson: JSON.stringify(role.menuKeys),
        phaseKeysJson: JSON.stringify(role.phaseKeys),
        createdAt: now,
        updatedAt: now,
      }))
    );
    await tx
      .insert(accessRolePermissions)
      .values(
        seedRoles.flatMap(role =>
          role.permissionKeys.map(permissionKey => ({
            roleKey: role.key,
            permissionKey,
            createdAt: now,
          }))
        )
      );
  });
}

export async function seedWorkflows(): Promise<void> {
  await seedAccessControl();
  const db = await requireDb();
  const existing = await db
    .select({ id: workflowTemplates.id })
    .from(workflowTemplates)
    .limit(1);
  if (existing.length > 0) return;

  for (const workflow of seedWorkflowTemplates) {
    await upsertWorkflow(workflow, "system-seed");
  }
}

// -----------------------------------------------------------------------------
// Sprint 1 — Database Core: Areas, Projects, Blinds
// -----------------------------------------------------------------------------

export type AreaStatus = "Active" | "Standby" | "Closed";
export type ProjectStatus =
  | "Planning"
  | "Active"
  | "Final Review"
  | "Completed"
  | "On Hold";
export type BlindStatus =
  | "Open"
  | "In Progress"
  | "Pending Approval"
  | "Completed"
  | "Archived";
export type BlindPriority = "Low" | "Normal" | "High" | "Critical";

export type AreaModel = {
  id: string;
  code: string;
  name: string;
  plant: string;
  ownerRoleKey: RoleKey;
  description?: string | null;
  status: AreaStatus;
};

export type ProjectModel = {
  id: string;
  projectNo: string;
  name: string;
  areaId: string;
  areaCode: string;
  areaName: string;
  workflowId?: string | null;
  status: ProjectStatus;
  progress: number;
  blindCount: number;
  startDate?: string | null;
  targetDate?: string | null;
  maintenanceReason?: string | null;
};

export type BlindModel = {
  id: string;
  blindNo: string;
  tagNo: string;
  projectId: string;
  projectName: string;
  areaId: string;
  areaCode: string;
  lineNo: string;
  size: string;
  rating?: string | null;
  blindType: string;
  currentPhaseKey: PhaseKey;
  phaseLabel: string;
  ownerRoleKey: RoleKey;
  ownerLabel: string;
  status: BlindStatus;
  priority: BlindPriority;
  qrCode: string;
  locationNote?: string | null;
};

export type DashboardSummaryModel = {
  totalAreas: number;
  totalProjects: number;
  totalBlinds: number;
  completedBlinds: number;
  inProgressBlinds: number;
  pendingApprovalBlinds: number;
  highPriorityBlinds: number;
  completionPercent: number;
  phaseCounts: {
    key: PhaseKey;
    label: string;
    count: number;
    owner: string;
    color: string;
  }[];
};

const phaseDictionary: Record<
  PhaseKey,
  { label: string; owner: string; color: string }
> = {
  broken: {
    label: "Broken / Preparation",
    owner: "Coordinator",
    color: "#ef4444",
  },
  assembly: { label: "Assembly", owner: "Technician", color: "#f59e0b" },
  tightTorque: {
    label: "Tight & Torque",
    owner: "T&I Engineer",
    color: "#eab308",
  },
  finalTight: { label: "Final Tight", owner: "QC Inspector", color: "#22c55e" },
  inspectionReady: {
    label: "Inspection Ready",
    owner: "Inspection",
    color: "#3b82f6",
  },
};

const roleDisplayNames: Record<RoleKey, string> = {
  admin: "Administrator",
  coordinator: "Coordinator",
  technician: "Technician",
  qc: "QC Inspector",
  safety: "Safety Officer",
  inspection: "Inspection",
  tiEngineer: "T&I Engineer",
  metalForeman: "Metal Foreman",
};

const seedAreas: AreaModel[] = [
  {
    id: "area-sgp-04",
    code: "SGP-04",
    name: "Shedgum Train-4",
    plant: "Shedgum Gas Plant",
    ownerRoleKey: "coordinator",
    description: "Shutdown execution area for train isolation scopes.",
    status: "Active",
  },
  {
    id: "area-nmg-02",
    code: "NMG-02",
    name: "North Manifold",
    plant: "Shedgum Gas Plant",
    ownerRoleKey: "safety",
    description:
      "High visibility manifold isolation and de-isolation boundary.",
    status: "Active",
  },
  {
    id: "area-uhm-01",
    code: "UHM-01",
    name: "Utility Header",
    plant: "Shedgum Gas Plant",
    ownerRoleKey: "inspection",
    description: "Utility header maintenance and final inspection package.",
    status: "Standby",
  },
];

const seedProjectsCore: ProjectModel[] = [
  {
    id: "project-1027",
    projectNo: "PRJ-1027",
    name: "Shedgum Train-4 Shutdown",
    areaId: "area-sgp-04",
    areaCode: "SGP-04",
    areaName: "Shedgum Train-4",
    workflowId: "wf-shutdown-standard",
    status: "Active",
    progress: 74,
    blindCount: 0,
    startDate: "2026-05-01",
    targetDate: "2026-05-21",
    maintenanceReason: "Shutdown isolation package for Train-4 maintenance and safe equipment access.",
  },
  {
    id: "project-1033",
    projectNo: "PRJ-1033",
    name: "North Manifold Isolation",
    areaId: "area-nmg-02",
    areaCode: "NMG-02",
    areaName: "North Manifold",
    workflowId: "wf-shutdown-standard",
    status: "Active",
    progress: 58,
    blindCount: 0,
    startDate: "2026-05-02",
    targetDate: "2026-05-19",
    maintenanceReason: "Manifold isolation required for planned maintenance and verification of boundary control.",
  },
  {
    id: "project-1041",
    projectNo: "PRJ-1041",
    name: "Utility Header Maintenance",
    areaId: "area-uhm-01",
    areaCode: "UHM-01",
    areaName: "Utility Header",
    workflowId: "wf-maintenance-lite",
    status: "Final Review",
    progress: 91,
    blindCount: 0,
    startDate: "2026-04-26",
    targetDate: "2026-05-12",
    maintenanceReason: "Utility header maintenance scope with final inspection readiness package.",
  },
];

const seedBlindsCore: BlindModel[] = [
  {
    id: "blind-4219",
    blindNo: "BL-4219",
    tagNo: "SB-4219",
    projectId: "project-1027",
    projectName: "Shedgum Train-4 Shutdown",
    areaId: "area-sgp-04",
    areaCode: "SGP-04",
    lineNo: "D-111",
    size: "12 in",
    rating: "300#",
    blindType: "Slip Blind",
    currentPhaseKey: "finalTight",
    phaseLabel: "Final Tight",
    ownerRoleKey: "qc",
    ownerLabel: "QC Inspector",
    status: "Pending Approval",
    priority: "High",
    qrCode: "/qr/SB-4219",
    locationNote: "Train-4 exchanger bay",
  },
  {
    id: "blind-4244",
    blindNo: "BL-4244",
    tagNo: "SB-4244",
    projectId: "project-1033",
    projectName: "North Manifold Isolation",
    areaId: "area-nmg-02",
    areaCode: "NMG-02",
    lineNo: "NMG-208",
    size: "8 in",
    rating: "600#",
    blindType: "Spectacle Blind",
    currentPhaseKey: "assembly",
    phaseLabel: "Assembly",
    ownerRoleKey: "technician",
    ownerLabel: "Technician",
    status: "In Progress",
    priority: "Normal",
    qrCode: "/qr/SB-4244",
    locationNote: "North manifold block valve",
  },
  {
    id: "blind-4302",
    blindNo: "BL-4302",
    tagNo: "SB-4302",
    projectId: "project-1041",
    projectName: "Utility Header Maintenance",
    areaId: "area-uhm-01",
    areaCode: "UHM-01",
    lineNo: "UHM-077",
    size: "16 in",
    rating: "150#",
    blindType: "Slip Blind",
    currentPhaseKey: "inspectionReady",
    phaseLabel: "Inspection Ready",
    ownerRoleKey: "inspection",
    ownerLabel: "Inspection",
    status: "Completed",
    priority: "High",
    qrCode: "/qr/SB-4302",
    locationNote: "Utility header final package",
  },
  {
    id: "blind-4338",
    blindNo: "BL-4338",
    tagNo: "SB-4338",
    projectId: "project-1027",
    projectName: "Shedgum Train-4 Shutdown",
    areaId: "area-sgp-04",
    areaCode: "SGP-04",
    lineNo: "D-118",
    size: "6 in",
    rating: "300#",
    blindType: "Spacer",
    currentPhaseKey: "tightTorque",
    phaseLabel: "Tight & Torque",
    ownerRoleKey: "tiEngineer",
    ownerLabel: "T&I Engineer",
    status: "In Progress",
    priority: "Normal",
    qrCode: "/qr/SB-4338",
    locationNote: "Requires torque record before final tight",
  },
  {
    id: "blind-4381",
    blindNo: "BL-4381",
    tagNo: "SB-4381",
    projectId: "project-1027",
    projectName: "Shedgum Train-4 Shutdown",
    areaId: "area-sgp-04",
    areaCode: "SGP-04",
    lineNo: "D-125",
    size: "10 in",
    rating: "300#",
    blindType: "Drop Spool",
    currentPhaseKey: "broken",
    phaseLabel: "Broken / Preparation",
    ownerRoleKey: "coordinator",
    ownerLabel: "Coordinator",
    status: "Open",
    priority: "Critical",
    qrCode: "/qr/SB-4381",
    locationNote: "Prepare isolation reference before break joint",
  },
];

const seedEmployees: EmployeeModel[] = [
  {
    id: "emp-admin",
    badge: "admin",
    fullName: "System Admin",
    roleKey: "admin",
    roleLabel: "System Admin",
    specialty: "Platform Owner",
    department: "SBTS Admin",
    shift: "Day",
    status: "Active",
    photoUrl: null,
    initials: "SA",
    isCertified: true,
  },
  {
    id: "emp-100245",
    badge: "100245",
    fullName: "Abdullah Alaqil",
    roleKey: "coordinator",
    roleLabel: "Coordinator",
    specialty: "Blind Coordinator",
    department: "Maintenance",
    shift: "A",
    status: "Active",
    photoUrl: null,
    initials: "AA",
    isCertified: true,
  },
  {
    id: "emp-co-014",
    badge: "CO-014",
    fullName: "Hassan Al-Mutairi",
    roleKey: "coordinator",
    roleLabel: "Coordinator",
    specialty: "Shutdown Coordinator",
    department: "Operations",
    shift: "B",
    status: "Active",
    photoUrl: null,
    initials: "HM",
    isCertified: true,
  },
  {
    id: "emp-tech-211",
    badge: "TECH-211",
    fullName: "Fahad Al-Qahtani",
    roleKey: "technician",
    roleLabel: "Technician",
    specialty: "Field Technician",
    department: "Craft",
    shift: "A",
    status: "Active",
    photoUrl: null,
    initials: "FQ",
    isCertified: true,
  },
  {
    id: "emp-tech-238",
    badge: "TECH-238",
    fullName: "Mohammed Al-Harbi",
    roleKey: "technician",
    roleLabel: "Technician",
    specialty: "Blind Installation",
    department: "Craft",
    shift: "B",
    status: "Standby",
    photoUrl: null,
    initials: "MH",
    isCertified: true,
  },
  {
    id: "emp-ti-001",
    badge: "TI-001",
    fullName: "T&I Engineer Lead",
    roleKey: "tiEngineer",
    roleLabel: "T&I Engineer",
    specialty: "Torque Gate Owner",
    department: "Engineering",
    shift: "Day",
    status: "Active",
    photoUrl: null,
    initials: "TI",
    isCertified: true,
  },
  {
    id: "emp-torque-lead",
    badge: "TORQUE-LEAD",
    fullName: "Torque Lead",
    roleKey: "tiEngineer",
    roleLabel: "T&I Engineer",
    specialty: "Hydraulic Torque",
    department: "Maintenance",
    shift: "A",
    status: "Active",
    photoUrl: null,
    initials: "TL",
    isCertified: true,
  },
  {
    id: "emp-qc-01",
    badge: "QC-01",
    fullName: "QC Inspector 01",
    roleKey: "qc",
    roleLabel: "QC Inspector",
    specialty: "Final Tight QC",
    department: "QA/QC",
    shift: "Day",
    status: "Active",
    photoUrl: null,
    initials: "QC",
    isCertified: true,
  },
  {
    id: "emp-insp-07",
    badge: "INSP-07",
    fullName: "Inspection Reviewer",
    roleKey: "inspection",
    roleLabel: "Inspection",
    specialty: "Final Package",
    department: "Inspection",
    shift: "Day",
    status: "Active",
    photoUrl: null,
    initials: "IR",
    isCertified: true,
  },
  {
    id: "emp-mf-03",
    badge: "MF-03",
    fullName: "Metal Foreman",
    roleKey: "metalForeman",
    roleLabel: "Metal Foreman",
    specialty: "Slip Blind / Metal",
    department: "Craft",
    shift: "A",
    status: "Active",
    photoUrl: null,
    initials: "MF",
    isCertified: true,
  },
  {
    id: "emp-safe-02",
    badge: "SAFE-02",
    fullName: "Safety Officer",
    roleKey: "safety",
    roleLabel: "Safety Officer",
    specialty: "Isolation Safety",
    department: "Safety",
    shift: "Day",
    status: "Active",
    photoUrl: null,
    initials: "SO",
    isCertified: true,
  },
];

function makeDefaultProjectAssignments(projectId: string): ProjectPhaseAssignmentModel[] {
  const defaults: Record<PhaseKey, { roleKey: RoleKey; badges: string[]; note: string }> = {
    broken: {
      roleKey: "coordinator",
      badges: ["admin", "100245", "CO-014"],
      note: "Only the assigned blind coordinator can authorize preparation/broken phase updates.",
    },
    assembly: {
      roleKey: "technician",
      badges: ["admin", "TECH-211", "TECH-238"],
      note: "Field execution updates require an assigned craft technician.",
    },
    tightTorque: {
      roleKey: "tiEngineer",
      badges: ["admin", "TI-001", "TORQUE-LEAD"],
      note: "Torque phase requires approved T&I / torque signature and torque record.",
    },
    finalTight: {
      roleKey: "qc",
      badges: ["admin", "QC-01"],
      note: "Final tight can only be signed by QA/QC.",
    },
    inspectionReady: {
      roleKey: "inspection",
      badges: ["admin", "INSP-07"],
      note: "Final package handover belongs to Inspection.",
    },
  };

  return workflowSequence.map(phaseKey => {
    const rule = defaults[phaseKey];
    const authorizedEmployees = seedEmployees.filter(employee =>
      rule.badges.map(badge => badge.toLowerCase()).includes(employee.badge.toLowerCase())
    );
    return {
      projectId,
      phaseKey,
      phaseLabel: phaseDictionary[phaseKey].label,
      roleKey: rule.roleKey,
      roleLabel: roleDisplayNames[rule.roleKey],
      authorizedEmployeeBadges: rule.badges,
      authorizedEmployees,
      note: rule.note,
      updatedAt: new Date().toISOString(),
    };
  });
}

const workflowSequence: PhaseKey[] = [
  "broken",
  "assembly",
  "tightTorque",
  "finalTight",
  "inspectionReady",
];

export type BlindLogModel = {
  id: string | number;
  blindId: string;
  fromPhaseKey?: string | null;
  toPhaseKey: string;
  action: string;
  actorOpenId?: string | null;
  actorRoleKey?: string | null;
  remarks?: string | null;
  createdAt: string;
};

export type BlindDetailModel = BlindModel & {
  projectNo?: string;
  areaName?: string;
  nextPhaseKey?: PhaseKey | null;
  nextPhaseLabel?: string | null;
  logs: BlindLogModel[];
};

export type CreateAreaInput = {
  code: string;
  name: string;
  plant: string;
  ownerRoleKey?: RoleKey;
  description?: string | null;
  status: AreaStatus;
};

export type UpdateAreaInput = {
  id: string;
  code: string;
  name: string;
  plant: string;
  description?: string | null;
  status: AreaStatus;
};

export type CreateProjectInput = {
  projectNo: string;
  name: string;
  areaId: string;
  workflowId?: string | null;
  status?: ProjectStatus;
  progress?: number;
  startDate?: string | null;
  targetDate?: string | null;
  maintenanceReason?: string | null;
};

export type UpdateProjectInput = {
  id: string;
  projectNo: string;
  name: string;
  areaId: string;
  workflowId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  maintenanceReason?: string | null;
};

export type CreateBlindInput = {
  blindNo: string;
  tagNo: string;
  projectId: string;
  areaId: string;
  lineNo: string;
  size: string;
  rating?: string | null;
  blindType: string;
  currentPhaseKey?: PhaseKey;
  ownerRoleKey?: RoleKey;
  status?: BlindStatus;
  priority?: BlindPriority;
  locationNote?: string | null;
};

export type MoveBlindPhaseInput = {
  blindId: string;
  toPhaseKey: PhaseKey;
  actorRoleKey: RoleKey;
  signatureId?: string | null;
  remarks?: string | null;
  torqueType?: string | null;
  psi?: number | null;
  toolId?: string | null;
  technicianName?: string | null;
  technicianBadge?: string | null;
};

export type EmployeeModel = {
  id: string;
  badge: string;
  fullName: string;
  roleKey: RoleKey;
  roleLabel: string;
  specialty: string;
  department: string;
  shift: string;
  status: "Pending" | "Active" | "Standby" | "Unavailable" | "Rejected" | "Disabled";
  photoUrl?: string | null;
  initials: string;
  isCertified: boolean;
};

export type UserSecurityStatus = "Active" | "Standby" | "Suspended" | "Unavailable";

export type UserManagementModel = EmployeeModel & {
  accessLevel: "Admin" | "Supervisor" | "Field User" | "Viewer";
  menuScope: string[];
  lastActiveAt?: string | null;
  securityNote?: string | null;
};

export type CreateEmployeeInput = {
  badge: string;
  fullName: string;
  roleKey: RoleKey;
  specialty: string;
  department: string;
  shift: string;
  status?: EmployeeModel["status"];
  photoUrl?: string | null;
  isCertified?: boolean;
};

export type UpdateEmployeeInput = CreateEmployeeInput & {
  id: string;
};

export type ProjectPhaseAssignmentModel = {
  id?: string | number;
  projectId: string;
  phaseKey: PhaseKey;
  phaseLabel: string;
  roleKey: RoleKey;
  roleLabel: string;
  authorizedEmployeeBadges: string[];
  authorizedEmployees: EmployeeModel[];
  note?: string | null;
  updatedAt?: string | null;
};

export type SaveProjectPhaseAssignmentInput = {
  projectId: string;
  assignments: {
    phaseKey: PhaseKey;
    roleKey: RoleKey;
    authorizedEmployeeBadges: string[];
    note?: string | null;
  }[];
};

export type PhaseGatePreviewModel = {
  blindId: string;
  projectId: string;
  targetPhaseKey: PhaseKey;
  targetPhaseLabel: string;
  authorizedRoleKey: RoleKey;
  authorizedRoleLabel: string;
  authorizedEmployees: EmployeeModel[];
  requiresTorque: boolean;
  isConfigured: boolean;
  message: string;
};

export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

export type ApprovalModel = {
  id: string | number;
  blindId: string;
  blindNo: string;
  tagNo: string;
  projectId: string;
  projectName: string;
  areaCode: string;
  lineNo: string;
  size: string;
  rating?: string | null;
  phaseKey: PhaseKey;
  phaseLabel: string;
  requiredRoleKey: RoleKey;
  requiredRoleLabel: string;
  approvedByOpenId?: string | null;
  approvedByName?: string | null;
  status: ApprovalStatus;
  remarks?: string | null;
  createdAt: string;
  approvedAt?: string | null;
};

export type ApprovalActionInput = {
  approvalId: string;
  decision: "Approved" | "Rejected";
  signatureId: string;
  remarks?: string | null;
};

export type TorqueRecordModel = {
  id: string | number;
  blindId: string;
  blindNo: string;
  tagNo: string;
  projectId: string;
  projectName: string;
  areaCode: string;
  lineNo: string;
  phaseKey: PhaseKey;
  phaseLabel: string;
  machineType: string;
  psiValue: number;
  technicianOpenId?: string | null;
  technicianName?: string | null;
  technicianBadge?: string | null;
  remarks?: string | null;
  createdAt: string;
};

export type CertificateRecordModel = {
  id: string | number;
  blindId: string;
  blindNo: string;
  tagNo: string;
  projectId: string;
  projectNo?: string | null;
  projectName: string;
  areaCode: string;
  certificateNo: string;
  certificateType: string;
  revision: number;
  templateVersion: string;
  qrValue?: string | null;
  status: "Draft" | "Issued" | "Printed" | "Superseded";
  issuedByOpenId?: string | null;
  issuedAt?: string | null;
  printCount: number;
  lastPrintedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CertificateIssueInput = {
  blindId: string;
  status?: "Draft" | "Issued" | "Printed";
};

export type TagDesignerSettingsModel = {
  id?: string | number;
  scopeType: "Global" | "Project";
  projectId?: string | null;
  templateName: string;
  tagWidthCm: number;
  tagHeightCm: number;
  tagColor: string;
  accentColor: string;
  textColor: string;
  logoText: string;
  showLogo: boolean;
  showHole: boolean;
  showStatus: boolean;
  showProjectNo: boolean;
  showLocationNote: boolean;
  qrSizePx: number;
  fontScale: number;
  layoutMode: "Operational Split" | "Compact Field" | "Large QR";
  updatedAt?: string | null;
};

export type SaveTagDesignerSettingsInput = Omit<TagDesignerSettingsModel, "id" | "updatedAt">;

export type SystemSettingsModel = {
  general: {
    systemName: string;
    facilityName: string;
    departmentName: string;
    defaultLanguage: "English" | "Arabic" | "Bilingual";
    dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
    timeFormat: "24H" | "12H";
    logoText: string;
    logoUrl?: string | null;
    appVersionNumber?: string | null;
    releaseName?: string | null;
    releaseYear?: string | null;
    appIconDataUrl?: string | null;
    companyName?: string | null;
    companyShortName?: string | null;
    companySubtitle?: string | null;
    companyLogoDataUrl?: string | null;
    showCompanyNameBesideLogo?: boolean;
    showCompanyOnCertificates?: boolean;
    showCompanyOnTags?: boolean;
    showCompanyOnReports?: boolean;
    appDescription?: string | null;
    dashboardHeroTitle?: string | null;
    dashboardHeroDescription?: string | null;
    themeTemplate?: "Template 1" | "Template 2 Classic" | "Template 3 SAP" | "Template 4 Custom" | "Template 5 Command Pro";
    customAccentColor?: string;
  };
  tags: {
    defaultTagWidthCm: number;
    defaultTagHeightCm: number;
    defaultTagColor: string;
    defaultAccentColor: string;
    defaultTextColor: string;
    defaultQrSizePx: number;
    showArea: boolean;
    showLine: boolean;
    showSize: boolean;
    showRating: boolean;
    showProjectNo: boolean;
    showBlindType: boolean;
    companyLogoUrl?: string | null;
    showHole?: boolean;
    holeSizePx?: number;
    fontScale?: number;
  };
  certificates: {
    certificateTitle: string;
    certificateNoFormat: string;
    requireFinalApprovalBeforeIssue: boolean;
    showTorqueSection: boolean;
    showApprovalSection: boolean;
    showQrCode: boolean;
    showActivitySummary: boolean;
    showRevisionNumber: boolean;
    certificateLogoUrl?: string | null;
    fontScale?: number;
    layoutMode?: "Executive" | "Classic" | "Compact";
  };
  approvals?: {
    profiles: { blindType: string; requiredApprovers: string[]; requireAll: boolean; unlockCertificate: boolean }[];
  };
  masterData?: {
    blindTypes: string[];
  };
  notifications: {
    notifyOnNewBlind: boolean;
    notifyOnPhaseUpdate: boolean;
    notifyOnApprovalRequired: boolean;
    notifyOnCertificateIssued: boolean;
    notifyOnTagPrinted: boolean;
    notifyOnRejectedApproval: boolean;
  };
  security: {
    sessionTimeoutHours: number;
    requireLoginForQrActions: boolean;
    allowVisitorQrView: boolean;
    adminPagesHardLock: boolean;
    allowDeleteActions: boolean;
    requireDeleteConfirmation: boolean;
    enableAuditTrail: boolean;
  };
  updatedAt: string;
  updatedByOpenId?: string | null;
};

export type SaveSystemSettingsInput = Omit<SystemSettingsModel, "updatedAt" | "updatedByOpenId">;

export type ApprovalProfileModel = {
  blindType: string;
  requiredApprovers: string[];
  approvers: { label: string; roleKey: RoleKey; required: boolean; sortOrder: number }[];
  requireAll: boolean;
  unlockCertificate: boolean;
};

export type CertificateLockStatusModel = {
  blindId: string;
  blindType: string;
  profile?: ApprovalProfileModel | null;
  locked: boolean;
  unlockCertificate: boolean;
  requiredApprovers: { label: string; roleKey: RoleKey; status: ApprovalStatus | "Missing"; approvalId?: string | number | null; approvedByName?: string | null; approvedAt?: string | null }[];
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  missingCount: number;
  reason: string;
};



export type ReportCenterModel = {
  generatedAt: string;
  scope: { projectId?: string | null; projectName: string; label: string };
  kpis: {
    totalProjects: number;
    totalBlinds: number;
    completedBlinds: number;
    inProgressBlinds: number;
    pendingApprovals: number;
    torqueRecords: number;
    certificatesIssued: number;
    tagsPrinted: number;
    completionPercent: number;
    delayedProjects: number;
  };
  projectProgress: {
    projectId: string;
    projectNo: string;
    projectName: string;
    areaCode: string;
    progress: number;
    status: ProjectStatus;
    blindCount: number;
    completedCount: number;
    pendingApprovalCount: number;
    targetDate?: string | null;
  }[];
  areaPerformance: {
    areaId: string;
    areaCode: string;
    areaName: string;
    projectCount: number;
    blindCount: number;
    completionPercent: number;
    pendingApprovalCount: number;
  }[];
  phaseBreakdown: {
    phaseKey: PhaseKey;
    phaseLabel: string;
    owner: string;
    count: number;
    percent: number;
  }[];
  exportPackages: {
    id: string;
    title: string;
    description: string;
    format: "CSV" | "PDF" | "Excel" | "PowerPoint" | "Print";
    rowCount: number;
    recommendedFor: string;
  }[];
  rows: {
    blindId: string;
    projectId: string;
    projectNo: string;
    projectName: string;
    areaCode: string;
    tagNo: string;
    blindNo: string;
    lineNo: string;
    size: string;
    rating?: string | null;
    blindType: string;
    phaseLabel: string;
    status: BlindStatus;
    priority: BlindPriority;
  }[];
};

export type NotificationSeverity = "info" | "success" | "warning" | "danger";
export type NotificationModel = {
  id: string | number;
  userOpenId?: string | null;
  type: "Action" | "System" | "Warning" | "Admin" | "Certificate" | "Tag" | "Approval";
  title: string;
  message: string;
  relatedEntity?: string | null;
  relatedId?: string | null;
  actionUrl?: string | null;
  severity: NotificationSeverity;
  status: "Unread" | "Read" | "Archived";
  createdAt: string;
};

export type AuditTrailModel = {
  id: string | number;
  entityType: "Certificate" | "Tag" | "Approval" | "Workflow" | "Project" | "Blind" | "Notification" | "Settings";
  entityId: string;
  projectId?: string | null;
  blindId?: string | null;
  action: string;
  actorOpenId?: string | null;
  actorName?: string | null;
  actorRoleKey?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
};

export type NotificationActionInput = {
  notificationId: string;
  action: "read" | "archive" | "restore";
};

export type AuditRecordInput = {
  entityType: AuditTrailModel["entityType"];
  entityId: string;
  projectId?: string | null;
  blindId?: string | null;
  action: string;
  actorOpenId?: string | null;
  actorName?: string | null;
  actorRoleKey?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
};


let demoAreas = [...seedAreas];
let demoProjects = [...seedProjectsCore];
let demoBlinds = [...seedBlindsCore];
let demoEmployees = [...seedEmployees];
let demoPhaseAssignments: ProjectPhaseAssignmentModel[] = seedProjectsCore.flatMap(project =>
  makeDefaultProjectAssignments(project.id)
);
let demoLogs: BlindLogModel[] = seedBlindsCore.map((blind, index) => ({
  id: `demo-log-${index + 1}`,
  blindId: blind.id,
  fromPhaseKey: null,
  toPhaseKey: blind.currentPhaseKey,
  action: "Seed record created",
  actorOpenId: "system-demo",
  actorRoleKey: blind.ownerRoleKey,
  remarks: "Initial Sprint demo workflow state.",
  createdAt: new Date(Date.now() - (index + 1) * 3600_000).toISOString(),
}));

let demoApprovals: ApprovalModel[] = seedBlindsCore
  .filter(blind => blind.status === "Pending Approval" || blind.currentPhaseKey === "finalTight")
  .map((blind, index) => ({
    id: `approval-demo-${index + 1}`,
    blindId: blind.id,
    blindNo: blind.blindNo,
    tagNo: blind.tagNo,
    projectId: blind.projectId,
    projectName: blind.projectName,
    areaCode: blind.areaCode,
    lineNo: blind.lineNo,
    size: blind.size,
    rating: blind.rating,
    phaseKey: "finalTight",
    phaseLabel: phaseDictionary.finalTight.label,
    requiredRoleKey: "qc",
    requiredRoleLabel: roleDisplayNames.qc,
    approvedByOpenId: null,
    approvedByName: null,
    status: "Pending",
    remarks: "Final tight approval is waiting for authorized QC signature.",
    createdAt: new Date(Date.now() - (index + 2) * 1800_000).toISOString(),
    approvedAt: null,
  }));

let demoTorqueRecords: TorqueRecordModel[] = seedBlindsCore
  .filter(blind => blind.currentPhaseKey === "tightTorque" || blind.currentPhaseKey === "finalTight" || blind.currentPhaseKey === "inspectionReady")
  .map((blind, index) => ({
    id: `torque-demo-${index + 1}`,
    blindId: blind.id,
    blindNo: blind.blindNo,
    tagNo: blind.tagNo,
    projectId: blind.projectId,
    projectName: blind.projectName,
    areaCode: blind.areaCode,
    lineNo: blind.lineNo,
    phaseKey: "tightTorque",
    phaseLabel: phaseDictionary.tightTorque.label,
    machineType: "Hydraulic",
    psiValue: 4200 + index * 250,
    technicianOpenId: "TORQUE-LEAD",
    technicianName: "Torque Lead",
    technicianBadge: "TORQUE-LEAD",
    remarks: "Demo torque record generated for Sprint 4 display.",
    createdAt: new Date(Date.now() - (index + 3) * 2400_000).toISOString(),
  }));

const defaultTagDesignerSettings: TagDesignerSettingsModel = {
  scopeType: "Global",
  projectId: null,
  templateName: "SBTS Standard Site Tag",
  tagWidthCm: 11,
  tagHeightCm: 7,
  tagColor: "#ffffff",
  accentColor: "#0891b2",
  textColor: "#0f172a",
  logoText: "Smart Blind Tag System",
  showLogo: true,
  showHole: true,
  showStatus: true,
  showProjectNo: true,
  showLocationNote: false,
  qrSizePx: 132,
  fontScale: 100,
  layoutMode: "Operational Split",
  updatedAt: new Date().toISOString(),
};

let demoTagSettings: TagDesignerSettingsModel[] = [defaultTagDesignerSettings];

const defaultSystemSettings: SystemSettingsModel = {
  general: {
    systemName: "Smart Blind Tag System",
    facilityName: "Shedgum Gas Plant",
    departmentName: "Maintenance",
    defaultLanguage: "Bilingual",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24H",
    logoText: "SBTS Professional",
    logoUrl: "",
    appVersionNumber: "V1.0",
    releaseName: "Pilot Live",
    releaseYear: "2026",
    appIconDataUrl: "",
    companyName: "Company Name",
    companyShortName: "Company",
    companySubtitle: "Shedgum Gas Plant / Maintenance Department",
    companyLogoDataUrl: "",
    showCompanyNameBesideLogo: true,
    showCompanyOnCertificates: true,
    showCompanyOnTags: true,
    showCompanyOnReports: true,
    appDescription: "Operational isolation governance platform",
    dashboardHeroTitle: "Digital blind isolation control built for field execution and management visibility.",
    dashboardHeroDescription: "SBTS connects projects, blinds, QR tags, phase updates, approvals, certificates, notifications, and audit history in one maintainable React command center.",
    themeTemplate: "Template 1",
    customAccentColor: "#0891b2",
  },
  tags: {
    defaultTagWidthCm: 11,
    defaultTagHeightCm: 7,
    defaultTagColor: "#ffffff",
    defaultAccentColor: "#0891b2",
    defaultTextColor: "#0f172a",
    defaultQrSizePx: 132,
    showArea: true,
    showLine: true,
    showSize: true,
    showRating: true,
    showProjectNo: true,
    showBlindType: true,
    companyLogoUrl: "",
    showHole: true,
    fontScale: 100,
    holeSizePx: 20,
  },
  certificates: {
    certificateTitle: "Blind Completion Certificate",
    certificateNoFormat: "SBTS-CERT-{PROJECT}-{BLIND}-R{REV}",
    requireFinalApprovalBeforeIssue: true,
    showTorqueSection: true,
    showApprovalSection: true,
    showQrCode: true,
    showActivitySummary: true,
    showRevisionNumber: true,
    certificateLogoUrl: "",
    fontScale: 100,
    layoutMode: "Executive",
  },
  approvals: {
    profiles: [
      { blindType: "Blind", requiredApprovers: ["Operation Foreman", "Project Engineer", "Inspection Unit"], requireAll: true, unlockCertificate: true },
      { blindType: "Slip Blind", requiredApprovers: ["Operation Foreman", "Project Engineer", "Inspection Unit", "Metal Foreman"], requireAll: true, unlockCertificate: true },
      { blindType: "Drop Spool", requiredApprovers: ["Operation Foreman", "Project Engineer", "Inspection Unit"], requireAll: true, unlockCertificate: true },
    ],
  },
  masterData: {
    blindTypes: ["Slip Blind", "Spectacle Blind", "Spacer", "Drop Spool", "Isolation Blind"],
  },
  notifications: {
    notifyOnNewBlind: true,
    notifyOnPhaseUpdate: true,
    notifyOnApprovalRequired: true,
    notifyOnCertificateIssued: true,
    notifyOnTagPrinted: true,
    notifyOnRejectedApproval: true,
  },
  security: {
    sessionTimeoutHours: 12,
    requireLoginForQrActions: true,
    allowVisitorQrView: true,
    adminPagesHardLock: true,
    allowDeleteActions: true,
    requireDeleteConfirmation: true,
    enableAuditTrail: true,
  },
  updatedAt: new Date().toISOString(),
  updatedByOpenId: "system-default",
};


function roleKeyFromApproverLabel(label: string): RoleKey {
  const normalized = label.toLowerCase();
  if (normalized.includes("metal")) return "metalForeman";
  if (normalized.includes("inspection")) return "inspection";
  if (normalized.includes("project") || normalized.includes("engineer") || normalized.includes("t&i")) return "tiEngineer";
  if (normalized.includes("qc")) return "qc";
  if (normalized.includes("safety")) return "safety";
  if (normalized.includes("operation") || normalized.includes("foreman")) return "coordinator";
  return "coordinator";
}

function normalizeApprovalProfiles(settings: SystemSettingsModel): ApprovalProfileModel[] {
  const profiles = settings.approvals?.profiles?.length ? settings.approvals.profiles : defaultSystemSettings.approvals.profiles;
  return profiles.map(profile => ({
    blindType: profile.blindType,
    requiredApprovers: profile.requiredApprovers,
    approvers: profile.requiredApprovers.map((label, index) => ({
      label,
      roleKey: roleKeyFromApproverLabel(label),
      required: true,
      sortOrder: index + 1,
    })),
    requireAll: profile.requireAll,
    unlockCertificate: profile.unlockCertificate,
  }));
}

function matchApprovalProfile(blindType: string, profiles: ApprovalProfileModel[]) {
  const normalized = blindType.toLowerCase();
  return profiles.find(profile => normalized.includes(profile.blindType.toLowerCase()))
    ?? profiles.find(profile => profile.blindType.toLowerCase() === "blind")
    ?? profiles[0]
    ?? null;
}

let demoSystemSettings: SystemSettingsModel = defaultSystemSettings;
let demoCertificates: CertificateRecordModel[] = [];

let demoNotifications: NotificationModel[] = [
  {
    id: "notif-demo-1",
    userOpenId: null,
    type: "Approval",
    title: "Final Tight approval waiting",
    message: "SB-4219 requires authorized QC sign-off in Approval Center.",
    relatedEntity: "Approval",
    relatedId: "approval-demo-1",
    actionUrl: "/approvals",
    severity: "warning",
    status: "Unread",
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
  },
  {
    id: "notif-demo-2",
    userOpenId: null,
    type: "Tag",
    title: "Tag designer ready",
    message: "Project tag layout can now be controlled from Project Setup and audited after printing.",
    relatedEntity: "TagSettings",
    relatedId: "global",
    actionUrl: "/projects/project-1027/tag-settings",
    severity: "info",
    status: "Unread",
    createdAt: new Date(Date.now() - 90 * 60_000).toISOString(),
  },
];

let demoAuditTrail: AuditTrailModel[] = [
  {
    id: "audit-demo-1",
    entityType: "Approval",
    entityId: "approval-demo-1",
    projectId: "project-1027",
    blindId: "blind-4219",
    action: "Approval request created",
    actorOpenId: "system-demo",
    actorName: "SBTS Automation",
    actorRoleKey: "system",
    summary: "Final Tight reached and pending QC approval was created.",
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
  },
  {
    id: "audit-demo-2",
    entityType: "Tag",
    entityId: "project-1027",
    projectId: "project-1027",
    action: "Tag settings initialized",
    actorOpenId: "system-demo",
    actorName: "SBTS Automation",
    actorRoleKey: "system",
    summary: "Default 11 × 7 cm site tag template prepared for QR printing.",
    createdAt: new Date(Date.now() - 100 * 60_000).toISOString(),
  },
];


function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function hydrateBlind(
  blind: Omit<
    BlindModel,
    "projectName" | "areaCode" | "phaseLabel" | "ownerLabel"
  > &
    Partial<BlindModel>,
  projectList = demoProjects,
  areaList = demoAreas
): BlindModel {
  const project = projectList.find(item => item.id === blind.projectId);
  const area = areaList.find(item => item.id === blind.areaId);
  const phase = phaseDictionary[blind.currentPhaseKey];
  return {
    ...blind,
    projectName: project?.name ?? blind.projectName ?? "Unknown Project",
    areaCode: area?.code ?? blind.areaCode ?? "N/A",
    phaseLabel: phase?.label ?? blind.currentPhaseKey,
    ownerLabel: roleDisplayNames[blind.ownerRoleKey] ?? blind.ownerRoleKey,
  };
}

function getNextPhase(current: PhaseKey): PhaseKey | null {
  const index = workflowSequence.indexOf(current);
  return index >= 0 && index < workflowSequence.length - 1
    ? workflowSequence[index + 1]
    : null;
}

function phaseProgressValue(phaseKey: PhaseKey): number {
  const map: Record<PhaseKey, number> = {
    broken: 15,
    assembly: 40,
    tightTorque: 65,
    finalTight: 85,
    inspectionReady: 100,
  };
  return map[phaseKey] ?? 0;
}

function deriveProjectStatus(
  progress: number,
  blindCount: number
): ProjectStatus {
  if (blindCount === 0) return "Planning";
  if (progress >= 100) return "Completed";
  if (progress >= 85) return "Final Review";
  return "Active";
}

function addBlindCounts(
  projectList: ProjectModel[],
  blindList: BlindModel[]
): ProjectModel[] {
  return projectList.map(project => {
    const projectBlinds = blindList.filter(
      blind => blind.projectId === project.id
    );
    const blindCount = projectBlinds.length;
    const progress =
      blindCount > 0
        ? Math.round(
            projectBlinds.reduce(
              (sum, blind) => sum + phaseProgressValue(blind.currentPhaseKey),
              0
            ) / blindCount
          )
        : 0;
    return {
      ...project,
      blindCount,
      progress,
      status: deriveProjectStatus(progress, blindCount),
    };
  });
}

function toDateString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function parseJsonStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function normalizeBadge(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function hydrateEmployee(row: EmployeeModel): EmployeeModel;
function hydrateEmployee(row: typeof employees.$inferSelect): EmployeeModel;
function hydrateEmployee(row: EmployeeModel | typeof employees.$inferSelect): EmployeeModel {
  const roleKey = row.roleKey as RoleKey;
  return {
    id: row.id,
    badge: row.badge,
    fullName: "fullName" in row ? row.fullName : row.fullName,
    roleKey,
    roleLabel: roleDisplayNames[roleKey] ?? roleKey,
    specialty: row.specialty,
    department: row.department,
    shift: row.shift,
    status: row.status as EmployeeModel["status"],
    photoUrl: row.photoUrl,
    initials: row.initials,
    isCertified: typeof row.isCertified === "boolean" ? row.isCertified : row.isCertified === 1,
  };
}


function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("") || "U";
}

function accessLevelForRole(roleKey: RoleKey): UserManagementModel["accessLevel"] {
  if (roleKey === "admin") return "Admin";
  if (["coordinator", "tiEngineer", "qc", "inspection", "metalForeman", "safety"].includes(roleKey)) return "Supervisor";
  if (roleKey === "technician") return "Field User";
  return "Viewer";
}

function menuScopeForRole(roleKey: RoleKey): string[] {
  if (roleKey === "admin") return ["Dashboard", "Areas", "Projects", "Slip Blind", "Approval Center", "Inbox", "Audit Trail", "Reports", "Workflow Studio", "User Management", "Access Control"];
  if (["coordinator", "tiEngineer", "qc", "inspection", "metalForeman", "safety"].includes(roleKey)) return ["Dashboard", "Areas", "Projects", "Slip Blind", "Approval Center", "Inbox", "Reports"];
  if (roleKey === "technician") return ["Dashboard", "Projects", "Slip Blind", "Inbox"];
  return ["Dashboard", "Inbox"];
}

function toUserManagementModel(employee: EmployeeModel): UserManagementModel {
  return {
    ...employee,
    accessLevel: accessLevelForRole(employee.roleKey),
    menuScope: menuScopeForRole(employee.roleKey),
    lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 72) * 60 * 60 * 1000).toISOString(),
    securityNote: employee.roleKey === "admin" ? "Admin hard-lock bypass enabled." : "Admin pages are hard locked for this user.",
  };
}

function normalizeEmployeeInput(input: CreateEmployeeInput, id?: string): EmployeeModel {
  const roleLabel = roleDisplayNames[input.roleKey] ?? input.roleKey;
  return {
    id: id ?? `emp-${input.badge.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`,
    badge: input.badge.trim(),
    fullName: input.fullName.trim(),
    roleKey: input.roleKey,
    roleLabel,
    specialty: input.specialty.trim(),
    department: input.department.trim(),
    shift: input.shift.trim(),
    status: input.status ?? "Active",
    photoUrl: input.photoUrl ?? null,
    initials: makeInitials(input.fullName),
    isCertified: input.isCertified ?? true,
  };
}

async function getEmployeeDirectory(): Promise<EmployeeModel[]> {
  const db = await getDb();
  if (!db) return demoEmployees;
  await seedEmployeeDirectory();
  const rows = await db.select().from(employees).orderBy(asc(employees.fullName));
  return rows.map(row => hydrateEmployee(row));
}

async function seedEmployeeDirectory(): Promise<void> {
  const db = await requireDb();
  const existing = await db.select({ id: employees.id }).from(employees).limit(1);
  if (existing.length > 0) return;
  await db.insert(employees).values(
    seedEmployees.map(employee => ({
      id: employee.id,
      badge: employee.badge,
      fullName: employee.fullName,
      roleKey: employee.roleKey,
      specialty: employee.specialty,
      department: employee.department,
      shift: employee.shift,
      status: employee.status,
      photoUrl: employee.photoUrl,
      initials: employee.initials,
      isCertified: employee.isCertified ? 1 : 0,
    }))
  );
}


export type AuthSessionProfile = {
  id: string;
  badge: string;
  fullName: string;
  roleKey: RoleKey;
  roleLabel: string;
  initials: string;
  status: EmployeeModel["status"];
};

export async function authenticateEmployeeSession(input: { badge: string; roleKey?: RoleKey | null }): Promise<{
  success: true;
  profile: AuthSessionProfile;
  sessionBinding: {
    sessionId: string;
    provider: "SBTS Employee Directory" | "PostgreSQL Employee Directory";
    issuedAt: string;
    expiresAt: string;
    productionReady: boolean;
  };
}> {
  const directory = await getEmployeeDirectory();
  const employee = directory.find(item => normalizeBadge(item.badge) === normalizeBadge(input.badge));
  if (!employee) throw new Error("Badge was not found in SBTS Employee Directory.");
  if (employee.status !== "Active") throw new Error("This user is not Active and cannot start a session.");
  if (input.roleKey && employee.roleKey !== input.roleKey) {
    throw new Error("Selected role does not match this employee directory record.");
  }

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 12 * 60 * 60 * 1000);
  const db = await getDb();
  const profile: AuthSessionProfile = {
    id: employee.id,
    badge: employee.badge,
    fullName: employee.fullName,
    roleKey: employee.roleKey,
    roleLabel: employee.roleLabel,
    initials: employee.initials,
    status: employee.status,
  };

  if (!db) {
    demoAuditTrail = [{
      id: `audit-login-${Date.now()}`,
      entityType: "Security",
      entityId: employee.id,
      action: "User login",
      summary: `${employee.fullName} started an authenticated SBTS session as ${employee.roleLabel}.`,
      actorOpenId: employee.badge,
      severity: employee.roleKey === "admin" ? "Warning" : "Info",
      createdAt: issuedAt.toISOString(),
    }, ...demoAuditTrail];
  }

  return {
    success: true,
    profile,
    sessionBinding: {
      sessionId: `sbts-${employee.badge}-${issuedAt.getTime()}`,
      provider: db ? "PostgreSQL Employee Directory" : "SBTS Employee Directory",
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      productionReady: Boolean(db),
    },
  };
}

export async function getEmployees(): Promise<EmployeeModel[]> {
  return getEmployeeDirectory();
}

export async function getUserManagement(): Promise<UserManagementModel[]> {
  const employeeDirectory = await getEmployeeDirectory();
  return employeeDirectory.map(toUserManagementModel);
}

export async function createEmployee(input: CreateEmployeeInput): Promise<UserManagementModel> {
  const employeeDirectory = await getEmployeeDirectory();
  if (employeeDirectory.some(employee => normalizeBadge(employee.badge) === normalizeBadge(input.badge))) {
    throw new Error("Employee badge already exists.");
  }
  const model = normalizeEmployeeInput(input);
  const db = await getDb();
  if (!db) {
    demoEmployees = [model, ...demoEmployees];
    demoAuditTrail = [
      {
        id: `audit-user-${Date.now()}`,
        entityType: "User",
        entityId: model.id,
        action: "User created",
        summary: `${model.fullName} was added as ${model.roleLabel}.`,
        actorOpenId: "local-demo-user",
        severity: "Info",
        createdAt: new Date().toISOString(),
      },
      ...demoAuditTrail,
    ];
    return toUserManagementModel(model);
  }
  await db.insert(employees).values({
    id: model.id,
    badge: model.badge,
    fullName: model.fullName,
    roleKey: model.roleKey,
    specialty: model.specialty,
    department: model.department,
    shift: model.shift,
    status: model.status,
    photoUrl: model.photoUrl,
    initials: model.initials,
    isCertified: model.isCertified ? 1 : 0,
  });
  return toUserManagementModel(model);
}

export async function updateEmployee(input: UpdateEmployeeInput): Promise<UserManagementModel> {
  const model = normalizeEmployeeInput(input, input.id);
  const existing = await getEmployeeDirectory();
  const duplicateBadge = existing.some(employee => employee.id !== input.id && normalizeBadge(employee.badge) === normalizeBadge(input.badge));
  if (duplicateBadge) throw new Error("Employee badge already exists.");

  const db = await getDb();
  if (!db) {
    const exists = demoEmployees.some(employee => employee.id === input.id);
    if (!exists) throw new Error("Employee was not found.");
    demoEmployees = demoEmployees.map(employee => employee.id === input.id ? model : employee);
    demoAuditTrail = [
      {
        id: `audit-user-${Date.now()}`,
        entityType: "User",
        entityId: model.id,
        action: "User updated",
        summary: `${model.fullName} updated. Role: ${model.roleLabel}, Status: ${model.status}.`,
        actorOpenId: "local-demo-user",
        severity: model.status === "Unavailable" ? "Warning" : "Info",
        createdAt: new Date().toISOString(),
      },
      ...demoAuditTrail,
    ];
    return toUserManagementModel(model);
  }

  await db.update(employees).set({
    badge: model.badge,
    fullName: model.fullName,
    roleKey: model.roleKey,
    specialty: model.specialty,
    department: model.department,
    shift: model.shift,
    status: model.status,
    photoUrl: model.photoUrl,
    initials: model.initials,
    isCertified: model.isCertified ? 1 : 0,
  }).where(eq(employees.id, input.id));
  return toUserManagementModel(model);
}

export async function deleteEmployee(id: string): Promise<{ success: true }> {
  const employeeDirectory = await getEmployeeDirectory();
  const employee = employeeDirectory.find(item => item.id === id);
  if (!employee) throw new Error("Employee was not found.");
  if (employee.roleKey === "admin") {
    const admins = employeeDirectory.filter(item => item.roleKey === "admin" && item.status === "Active");
    if (admins.length <= 1) throw new Error("Cannot delete the last active admin.");
  }
  const assignments = demoPhaseAssignments.filter(item => item.authorizedEmployeeBadges.some(badge => normalizeBadge(badge) === normalizeBadge(employee.badge)));
  if (assignments.length > 0) {
    throw new Error("Employee is assigned to project phase gates. Remove the assignment before deletion.");
  }
  const db = await getDb();
  if (!db) {
    demoEmployees = demoEmployees.filter(item => item.id !== id);
    demoAuditTrail = [
      {
        id: `audit-user-${Date.now()}`,
        entityType: "User",
        entityId: id,
        action: "User deleted",
        summary: `${employee.fullName} was removed from SBTS user directory.`,
        actorOpenId: "local-demo-user",
        severity: "Warning",
        createdAt: new Date().toISOString(),
      },
      ...demoAuditTrail,
    ];
    return { success: true };
  }
  await db.delete(employees).where(eq(employees.id, id));
  return { success: true };
}


export async function getProjectPhaseAssignments(
  projectId: string
): Promise<ProjectPhaseAssignmentModel[]> {
  const db = await getDb();
  if (!db) {
    const existing = demoPhaseAssignments.filter(item => item.projectId === projectId);
    if (existing.length > 0) return existing;
    const defaults = makeDefaultProjectAssignments(projectId);
    demoPhaseAssignments = [...demoPhaseAssignments, ...defaults];
    return defaults;
  }
  await seedCoreData();
  await seedProjectPhaseAssignments(projectId);
  const [rows, employeeRows] = await Promise.all([
    db
      .select()
      .from(projectPhaseAssignments)
      .where(eq(projectPhaseAssignments.projectId, projectId)),
    getEmployeeDirectory(),
  ]);
  return rows.map(row => {
    const badges = parseJsonStringArray(row.authorizedEmployeeBadgesJson);
    const authorizedEmployees = employeeRows.filter(employee =>
      badges.map(normalizeBadge).includes(normalizeBadge(employee.badge))
    );
    return {
      id: row.id,
      projectId: row.projectId,
      phaseKey: row.phaseKey as PhaseKey,
      phaseLabel: phaseDictionary[row.phaseKey as PhaseKey].label,
      roleKey: row.roleKey as RoleKey,
      roleLabel: roleDisplayNames[row.roleKey as RoleKey] ?? row.roleKey,
      authorizedEmployeeBadges: badges,
      authorizedEmployees,
      note: row.note,
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  });
}

async function seedProjectPhaseAssignments(projectId: string): Promise<void> {
  const db = await requireDb();
  const existing = await db
    .select({ id: projectPhaseAssignments.id })
    .from(projectPhaseAssignments)
    .where(eq(projectPhaseAssignments.projectId, projectId))
    .limit(1);
  if (existing.length > 0) return;
  const defaults = makeDefaultProjectAssignments(projectId);
  await db.insert(projectPhaseAssignments).values(
    defaults.map(item => ({
      projectId: item.projectId,
      phaseKey: item.phaseKey,
      roleKey: item.roleKey,
      authorizedEmployeeBadgesJson: JSON.stringify(item.authorizedEmployeeBadges),
      note: item.note,
      assignedByOpenId: "system-default",
    }))
  );
}

export async function saveProjectPhaseAssignments(
  input: SaveProjectPhaseAssignmentInput,
  assignedByOpenId?: string
): Promise<ProjectPhaseAssignmentModel[]> {
  const projectList = await getProjectsCore();
  const project = projectList.find(item => item.id === input.projectId);
  if (!project) throw new Error("Project was not found.");

  const employeeDirectory = await getEmployeeDirectory();
  for (const assignment of input.assignments) {
    const validRole = seedRoles.some(role => role.key === assignment.roleKey);
    if (!validRole) throw new Error(`Unknown role for assignment: ${assignment.roleKey}`);
    if (assignment.authorizedEmployeeBadges.length === 0) {
      throw new Error(`${phaseDictionary[assignment.phaseKey].label} must have at least one authorized employee.`);
    }
    for (const badge of assignment.authorizedEmployeeBadges) {
      const employee = employeeDirectory.find(item => normalizeBadge(item.badge) === normalizeBadge(badge));
      if (!employee) throw new Error(`Unknown employee badge: ${badge}`);
      if (employee.roleKey !== assignment.roleKey && employee.roleKey !== "admin") {
        throw new Error(`${employee.fullName} is not valid for ${roleDisplayNames[assignment.roleKey]}.`);
      }
    }
  }

  const db = await getDb();
  if (!db) {
    demoPhaseAssignments = demoPhaseAssignments.filter(item => item.projectId !== input.projectId);
    const nextAssignments = input.assignments.map(assignment => {
      const authorizedEmployees = employeeDirectory.filter(employee =>
        assignment.authorizedEmployeeBadges.map(normalizeBadge).includes(normalizeBadge(employee.badge))
      );
      return {
        projectId: input.projectId,
        phaseKey: assignment.phaseKey,
        phaseLabel: phaseDictionary[assignment.phaseKey].label,
        roleKey: assignment.roleKey,
        roleLabel: roleDisplayNames[assignment.roleKey],
        authorizedEmployeeBadges: assignment.authorizedEmployeeBadges,
        authorizedEmployees,
        note: assignment.note ?? null,
        updatedAt: new Date().toISOString(),
      } satisfies ProjectPhaseAssignmentModel;
    });
    demoPhaseAssignments = [...demoPhaseAssignments, ...nextAssignments];
    return getProjectPhaseAssignments(input.projectId);
  }

  await seedCoreData();
  await db.transaction(async tx => {
    await tx
      .delete(projectPhaseAssignments)
      .where(eq(projectPhaseAssignments.projectId, input.projectId));
    await tx.insert(projectPhaseAssignments).values(
      input.assignments.map(assignment => ({
        projectId: input.projectId,
        phaseKey: assignment.phaseKey,
        roleKey: assignment.roleKey,
        authorizedEmployeeBadgesJson: JSON.stringify(assignment.authorizedEmployeeBadges),
        note: assignment.note ?? null,
        assignedByOpenId: assignedByOpenId ?? "local-demo-user",
      }))
    );
  });
  return getProjectPhaseAssignments(input.projectId);
}

export async function getPhaseGatePreview(
  blindId: string,
  targetPhaseKey: PhaseKey
): Promise<PhaseGatePreviewModel> {
  const blind = await getBlindDetail(blindId);
  if (!blind) throw new Error("Blind was not found.");
  const assignments = await getProjectPhaseAssignments(blind.projectId);
  const assignment = assignments.find(item => item.phaseKey === targetPhaseKey);
  const requiresTorque = targetPhaseKey === "tightTorque";
  return {
    blindId: blind.id,
    projectId: blind.projectId,
    targetPhaseKey,
    targetPhaseLabel: phaseDictionary[targetPhaseKey].label,
    authorizedRoleKey: assignment?.roleKey ?? phaseDefaultRole(targetPhaseKey),
    authorizedRoleLabel: assignment?.roleLabel ?? roleDisplayNames[phaseDefaultRole(targetPhaseKey)],
    authorizedEmployees: assignment?.authorizedEmployees ?? [],
    requiresTorque,
    isConfigured: Boolean(assignment && assignment.authorizedEmployeeBadges.length > 0),
    message: assignment
      ? "Backend gate is configured. Only selected badges can sign this phase."
      : "No assignment exists; configure Project Setup before updating this phase.",
  };
}

function phaseDefaultRole(phaseKey: PhaseKey): RoleKey {
  const map: Record<PhaseKey, RoleKey> = {
    broken: "coordinator",
    assembly: "technician",
    tightTorque: "tiEngineer",
    finalTight: "qc",
    inspectionReady: "inspection",
  };
  return map[phaseKey];
}

async function assertPhaseGate(input: MoveBlindPhaseInput, current: BlindDetailModel): Promise<ProjectPhaseAssignmentModel> {
  const assignments = await getProjectPhaseAssignments(current.projectId);
  const assignment = assignments.find(item => item.phaseKey === input.toPhaseKey);
  if (!assignment) {
    throw new Error("This phase has no Project Setup assignment. Configure Phase Task Assignment first.");
  }
  if (assignment.roleKey !== input.actorRoleKey && input.actorRoleKey !== "admin") {
    throw new Error(`Selected role is not allowed. Required role: ${assignment.roleLabel}.`);
  }
  const signature = normalizeBadge(input.signatureId);
  if (!signature) {
    throw new Error("Signature ID / Badge No. is required for phase update.");
  }
  const authorized = assignment.authorizedEmployeeBadges.map(normalizeBadge).includes(signature);
  if (!authorized) {
    throw new Error("This badge is not authorized for the selected phase. Update Project Setup → Phase Task Assignment.");
  }
  const signer = assignment.authorizedEmployees.find(employee => normalizeBadge(employee.badge) === signature);
  if (!signer) {
    throw new Error("Authorized signer could not be found in Employee Directory.");
  }
  if (input.toPhaseKey === "tightTorque") {
    if (!input.psi || input.psi <= 0 || !input.toolId?.trim()) {
      throw new Error("Tight & Torque requires PSI value and Tool/Machine ID before phase update.");
    }
  }
  return assignment;
}

export async function seedCoreData(): Promise<void> {
  await seedWorkflows();
  await seedEmployeeDirectory();
  const db = await requireDb();
  const existingAreas = await db.select({ id: areas.id }).from(areas).limit(1);
  if (existingAreas.length > 0) return;

  await db.transaction(async tx => {
    await tx.insert(areas).values(
      seedAreas.map(area => ({
        id: area.id,
        code: area.code,
        name: area.name,
        plant: area.plant,
        ownerRoleKey: area.ownerRoleKey,
        description: area.description,
        status: area.status,
      }))
    );

    await tx.insert(projects).values(
      seedProjectsCore.map(project => ({
        id: project.id,
        projectNo: project.projectNo,
        name: project.name,
        areaId: project.areaId,
        workflowId: project.workflowId,
        status: project.status,
        progress: project.progress,
        startDate: project.startDate,
        targetDate: project.targetDate,
        createdByOpenId: "system-seed",
      }))
    );

    await tx.insert(blinds).values(
      seedBlindsCore.map(blind => ({
        id: blind.id,
        blindNo: blind.blindNo,
        tagNo: blind.tagNo,
        projectId: blind.projectId,
        areaId: blind.areaId,
        lineNo: blind.lineNo,
        size: blind.size,
        rating: blind.rating,
        blindType: blind.blindType,
        currentPhaseKey: blind.currentPhaseKey,
        ownerRoleKey: blind.ownerRoleKey,
        status: blind.status,
        priority: blind.priority,
        qrCode: blind.qrCode,
        locationNote: blind.locationNote,
        createdByOpenId: "system-seed",
      }))
    );
  });
}

export async function getAreas(): Promise<AreaModel[]> {
  const db = await getDb();
  if (!db) return demoAreas;
  await seedCoreData();
  const rows = await db.select().from(areas).orderBy(asc(areas.code));
  return rows.map(area => ({
    id: area.id,
    code: area.code,
    name: area.name,
    plant: area.plant,
    ownerRoleKey: area.ownerRoleKey as RoleKey,
    description: area.description,
    status: area.status as AreaStatus,
  }));
}

export async function getProjectsCore(): Promise<ProjectModel[]> {
  const db = await getDb();
  if (!db) return addBlindCounts(demoProjects, demoBlinds);
  await seedCoreData();
  const [projectRows, areaRows, blindRows] = await Promise.all([
    db.select().from(projects).orderBy(asc(projects.projectNo)),
    db.select().from(areas),
    db
      .select({
        id: blinds.id,
        projectId: blinds.projectId,
        currentPhaseKey: blinds.currentPhaseKey,
      })
      .from(blinds),
  ]);

  return projectRows.map(project => {
    const area = areaRows.find(item => item.id === project.areaId);
    return {
      id: project.id,
      projectNo: project.projectNo,
      name: project.name,
      areaId: project.areaId,
      areaCode: area?.code ?? "N/A",
      areaName: area?.name ?? "Unknown Area",
      workflowId: project.workflowId,
      status: (() => {
        const rows = blindRows.filter(blind => blind.projectId === project.id);
        const progress =
          rows.length > 0
            ? Math.round(
                rows.reduce(
                  (sum, blind) =>
                    sum + phaseProgressValue(blind.currentPhaseKey as PhaseKey),
                  0
                ) / rows.length
              )
            : 0;
        return deriveProjectStatus(progress, rows.length);
      })(),
      progress: (() => {
        const rows = blindRows.filter(blind => blind.projectId === project.id);
        return rows.length > 0
          ? Math.round(
              rows.reduce(
                (sum, blind) =>
                  sum + phaseProgressValue(blind.currentPhaseKey as PhaseKey),
                0
              ) / rows.length
            )
          : 0;
      })(),
      blindCount: blindRows.filter(blind => blind.projectId === project.id)
        .length,
      startDate: toDateString(project.startDate),
      targetDate: toDateString(project.targetDate),
      maintenanceReason: (project as any).maintenanceReason ?? null,
    };
  });
}

export async function getBlindsCore(): Promise<BlindModel[]> {
  const db = await getDb();
  if (!db) return demoBlinds;
  await seedCoreData();
  const [blindRows, projectRows, areaRows] = await Promise.all([
    db.select().from(blinds).orderBy(asc(blinds.tagNo)),
    db.select().from(projects),
    db.select().from(areas),
  ]);

  return blindRows.map(blind => {
    const project = projectRows.find(item => item.id === blind.projectId);
    const area = areaRows.find(item => item.id === blind.areaId);
    const phase = phaseDictionary[blind.currentPhaseKey as PhaseKey];
    return {
      id: blind.id,
      blindNo: blind.blindNo,
      tagNo: blind.tagNo,
      projectId: blind.projectId,
      projectName: project?.name ?? "Unknown Project",
      areaId: blind.areaId,
      areaCode: area?.code ?? "N/A",
      lineNo: blind.lineNo,
      size: blind.size,
      rating: blind.rating,
      blindType: blind.blindType,
      currentPhaseKey: blind.currentPhaseKey as PhaseKey,
      phaseLabel: phase?.label ?? blind.currentPhaseKey,
      ownerRoleKey: blind.ownerRoleKey as RoleKey,
      ownerLabel:
        roleDisplayNames[blind.ownerRoleKey as RoleKey] ?? blind.ownerRoleKey,
      status: blind.status as BlindStatus,
      priority: blind.priority as BlindPriority,
      qrCode: blind.qrCode,
      locationNote: blind.locationNote,
    };
  });
}

export async function createArea(input: CreateAreaInput): Promise<AreaModel> {
  const normalized: AreaModel = {
    id: makeId("area"),
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    plant: input.plant.trim(),
    ownerRoleKey: input.ownerRoleKey ?? "coordinator",
    description: input.description?.trim() || null,
    status: input.status,
  };
  const db = await getDb();
  if (!db) {
    demoAreas = [normalized, ...demoAreas];
    return normalized;
  }
  await seedCoreData();
  await db.insert(areas).values(normalized);
  await recordPersistenceEvent({ eventType: "create", domain: "Areas", status: "Success", summary: `Area ${normalized.code} persisted to database.`, metadata: { areaId: normalized.id } });
  return normalized;
}

export async function updateArea(input: UpdateAreaInput): Promise<AreaModel> {
  const normalized: AreaModel = {
    id: input.id,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    plant: input.plant.trim(),
    ownerRoleKey: "coordinator",
    description: input.description?.trim() || null,
    status: input.status,
  };
  const db = await getDb();
  if (!db) {
    const exists = demoAreas.some(area => area.id === input.id);
    if (!exists) throw new Error("Area was not found.");
    demoAreas = demoAreas.map(area =>
      area.id === input.id ? { ...area, ...normalized } : area
    );
    demoProjects = demoProjects.map(project =>
      project.areaId === input.id
        ? { ...project, areaCode: normalized.code, areaName: normalized.name }
        : project
    );
    demoBlinds = demoBlinds.map(blind =>
      blind.areaId === input.id
        ? { ...blind, areaCode: normalized.code }
        : blind
    );
    return normalized;
  }
  await seedCoreData();
  const existing = await db
    .select()
    .from(areas)
    .where(eq(areas.id, input.id))
    .limit(1);
  if (existing.length === 0) throw new Error("Area was not found.");
  await db
    .update(areas)
    .set({
      code: normalized.code,
      name: normalized.name,
      plant: normalized.plant,
      ownerRoleKey: "coordinator",
      description: normalized.description,
      status: normalized.status,
    })
    .where(eq(areas.id, input.id));
  return normalized;
}

export async function deleteArea(id: string): Promise<{ success: true }> {
  const db = await getDb();
  if (!db) {
    const linkedProjects = demoProjects.filter(
      project => project.areaId === id
    );
    if (linkedProjects.length > 0)
      throw new Error(
        "Cannot delete this area because it has linked projects. Move or delete the projects first."
      );
    const before = demoAreas.length;
    demoAreas = demoAreas.filter(area => area.id !== id);
    if (demoAreas.length === before) throw new Error("Area was not found.");
    return { success: true };
  }
  await seedCoreData();
  const linkedProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.areaId, id))
    .limit(1);
  if (linkedProjects.length > 0)
    throw new Error(
      "Cannot delete this area because it has linked projects. Move or delete the projects first."
    );
  await db.delete(areas).where(eq(areas.id, id));
  return { success: true };
}

export async function createProject(
  input: CreateProjectInput,
  createdByOpenId?: string
): Promise<ProjectModel> {
  const db = await getDb();
  const areaList = db ? await getAreas() : demoAreas;
  const area = areaList.find(item => item.id === input.areaId);
  if (!area) throw new Error("Selected area was not found.");
  const model: ProjectModel = {
    id: makeId("project"),
    projectNo: input.projectNo.trim().toUpperCase(),
    name: input.name.trim(),
    areaId: input.areaId,
    areaCode: area.code,
    areaName: area.name,
    workflowId: input.workflowId || "wf-shutdown-standard",
    status: input.status ?? "Planning",
    progress: input.progress ?? 0,
    blindCount: 0,
    startDate: input.startDate || null,
    targetDate: input.targetDate || null,
    maintenanceReason: input.maintenanceReason || null,
  };
  if (!db) {
    demoProjects = [model, ...demoProjects];
    return model;
  }
  await seedCoreData();
  await db.insert(projects).values({
    id: model.id,
    projectNo: model.projectNo,
    name: model.name,
    areaId: model.areaId,
    workflowId: model.workflowId,
    status: model.status,
    progress: model.progress,
    startDate: model.startDate,
    targetDate: model.targetDate,
    createdByOpenId: createdByOpenId ?? "local-demo-user",
  });
  await recordPersistenceEvent({ eventType: "create", domain: "Projects", status: "Success", summary: `Project ${model.projectNo} persisted to database.`, metadata: { projectId: model.id }, actorOpenId: createdByOpenId });
  return model;
}

export async function updateProject(
  input: UpdateProjectInput
): Promise<ProjectModel> {
  const db = await getDb();
  const areaList = db ? await getAreas() : demoAreas;
  const area = areaList.find(item => item.id === input.areaId);
  if (!area) throw new Error("Selected area was not found.");
  if (!db) {
    const current = demoProjects.find(project => project.id === input.id);
    if (!current) throw new Error("Project was not found.");
    const next: ProjectModel = {
      ...current,
      projectNo: input.projectNo.trim().toUpperCase(),
      name: input.name.trim(),
      areaId: input.areaId,
      areaCode: area.code,
      areaName: area.name,
      workflowId:
        input.workflowId || current.workflowId || "wf-shutdown-standard",
      startDate: input.startDate || null,
      targetDate: input.targetDate || null,
      maintenanceReason: input.maintenanceReason || null,
    };
    demoProjects = demoProjects.map(project =>
      project.id === input.id ? next : project
    );
    demoBlinds = demoBlinds.map(blind =>
      blind.projectId === input.id
        ? {
            ...blind,
            projectName: next.name,
            areaId: next.areaId,
            areaCode: next.areaCode,
          }
        : blind
    );
    return addBlindCounts([next], demoBlinds)[0];
  }
  await seedCoreData();
  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.id, input.id))
    .limit(1);
  if (existing.length === 0) throw new Error("Project was not found.");
  await db
    .update(projects)
    .set({
      projectNo: input.projectNo.trim().toUpperCase(),
      name: input.name.trim(),
      areaId: input.areaId,
      workflowId: input.workflowId || "wf-shutdown-standard",
      startDate: input.startDate || null,
      targetDate: input.targetDate || null,
    })
    .where(eq(projects.id, input.id));
  const updated = (await getProjectsCore()).find(
    project => project.id === input.id
  );
  if (!updated) throw new Error("Project could not be read after update.");
  return updated;
}

export async function deleteProject(id: string): Promise<{ success: true }> {
  const db = await getDb();
  if (!db) {
    const linkedBlinds = demoBlinds.filter(blind => blind.projectId === id);
    if (linkedBlinds.length > 0)
      throw new Error(
        "Cannot delete this project because it has linked blinds. Delete or move the blinds first."
      );
    const before = demoProjects.length;
    demoProjects = demoProjects.filter(project => project.id !== id);
    if (demoProjects.length === before)
      throw new Error("Project was not found.");
    return { success: true };
  }
  await seedCoreData();
  const linkedBlinds = await db
    .select({ id: blinds.id })
    .from(blinds)
    .where(eq(blinds.projectId, id))
    .limit(1);
  if (linkedBlinds.length > 0)
    throw new Error(
      "Cannot delete this project because it has linked blinds. Delete or move the blinds first."
    );
  await db.delete(projects).where(eq(projects.id, id));
  return { success: true };
}

export async function createBlind(
  input: CreateBlindInput,
  createdByOpenId?: string
): Promise<BlindModel> {
  const db = await getDb();
  const [projectList, areaList] = db
    ? await Promise.all([getProjectsCore(), getAreas()])
    : [addBlindCounts(demoProjects, demoBlinds), demoAreas];
  const project = projectList.find(item => item.id === input.projectId);
  const area = areaList.find(item => item.id === input.areaId);
  if (!project) throw new Error("Selected project was not found.");
  if (!area) throw new Error("Selected area was not found.");
  const phaseKey = input.currentPhaseKey ?? "broken";
  const ownerRoleKey = input.ownerRoleKey ?? "coordinator";
  const model = hydrateBlind(
    {
      id: makeId("blind"),
      blindNo: input.blindNo.trim().toUpperCase(),
      tagNo: input.tagNo.trim().toUpperCase(),
      projectId: input.projectId,
      areaId: input.areaId,
      lineNo: input.lineNo.trim().toUpperCase(),
      size: input.size.trim(),
      rating: input.rating?.trim() || null,
      blindType: input.blindType.trim(),
      currentPhaseKey: phaseKey,
      ownerRoleKey,
      status: input.status ?? "Open",
      priority: input.priority ?? "Normal",
      qrCode: `/qr/${input.tagNo.trim().toUpperCase()}`,
      locationNote: input.locationNote?.trim() || null,
    },
    projectList,
    areaList
  );
  const log: BlindLogModel = {
    id: makeId("log"),
    blindId: model.id,
    fromPhaseKey: null,
    toPhaseKey: model.currentPhaseKey,
    action: "Blind created",
    actorOpenId: createdByOpenId ?? "local-demo-user",
    actorRoleKey: model.ownerRoleKey,
    remarks: "Created from Sprint 2 CRUD Core wizard.",
    createdAt: new Date().toISOString(),
  };
  if (!db) {
    demoBlinds = [model, ...demoBlinds];
    demoLogs = [log, ...demoLogs];
    return model;
  }
  await seedCoreData();
  await db.transaction(async tx => {
    await tx.insert(blinds).values({
      id: model.id,
      blindNo: model.blindNo,
      tagNo: model.tagNo,
      projectId: model.projectId,
      areaId: model.areaId,
      lineNo: model.lineNo,
      size: model.size,
      rating: model.rating,
      blindType: model.blindType,
      currentPhaseKey: model.currentPhaseKey,
      ownerRoleKey: model.ownerRoleKey,
      status: model.status,
      priority: model.priority,
      qrCode: model.qrCode,
      locationNote: model.locationNote,
      createdByOpenId: createdByOpenId ?? "local-demo-user",
    });
    await tx.insert(blindWorkflowLogs).values({
      blindId: model.id,
      fromPhaseKey: null,
      toPhaseKey: model.currentPhaseKey,
      action: log.action,
      actorOpenId: log.actorOpenId,
      actorRoleKey: log.actorRoleKey,
      remarks: log.remarks,
    });
  });
  await recordPersistenceEvent({ eventType: "create", domain: "Blinds", status: "Success", summary: `Blind ${model.blindNo} persisted to database.`, metadata: { blindId: model.id, projectId: model.projectId }, actorOpenId: createdByOpenId });
  return model;
}

export async function getBlindDetail(
  id: string
): Promise<BlindDetailModel | undefined> {
  const db = await getDb();
  if (!db) {
    const blind = demoBlinds.find(
      item => item.id === id || item.tagNo === id || item.blindNo === id
    );
    if (!blind) return undefined;
    const project = addBlindCounts(demoProjects, demoBlinds).find(
      item => item.id === blind.projectId
    );
    const area = demoAreas.find(item => item.id === blind.areaId);
    const nextPhaseKey = getNextPhase(blind.currentPhaseKey);
    return {
      ...blind,
      projectNo: project?.projectNo,
      areaName: area?.name,
      nextPhaseKey,
      nextPhaseLabel: nextPhaseKey ? phaseDictionary[nextPhaseKey].label : null,
      logs: demoLogs
        .filter(log => log.blindId === blind.id)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    };
  }
  await seedCoreData();
  const [blindList, logRows] = await Promise.all([
    getBlindsCore(),
    db
      .select()
      .from(blindWorkflowLogs)
      .where(eq(blindWorkflowLogs.blindId, id))
      .orderBy(asc(blindWorkflowLogs.id)),
  ]);
  const blind = blindList.find(
    item => item.id === id || item.tagNo === id || item.blindNo === id
  );
  if (!blind) return undefined;
  const projectList = await getProjectsCore();
  const areaList = await getAreas();
  const project = projectList.find(item => item.id === blind.projectId);
  const area = areaList.find(item => item.id === blind.areaId);
  const nextPhaseKey = getNextPhase(blind.currentPhaseKey);
  return {
    ...blind,
    projectNo: project?.projectNo,
    areaName: area?.name,
    nextPhaseKey,
    nextPhaseLabel: nextPhaseKey ? phaseDictionary[nextPhaseKey].label : null,
    logs: logRows
      .map(log => ({
        id: log.id,
        blindId: log.blindId,
        fromPhaseKey: log.fromPhaseKey,
        toPhaseKey: log.toPhaseKey,
        action: log.action,
        actorOpenId: log.actorOpenId,
        actorRoleKey: log.actorRoleKey,
        remarks: log.remarks,
        createdAt:
          log.createdAt instanceof Date
            ? log.createdAt.toISOString()
            : String(log.createdAt),
      }))
      .reverse(),
  };
}

export async function moveBlindPhase(
  input: MoveBlindPhaseInput,
  actorOpenId?: string
): Promise<BlindDetailModel> {
  const db = await getDb();
  const current = await getBlindDetail(input.blindId);
  if (!current) throw new Error("Blind was not found.");

  const assignment = await assertPhaseGate(input, current);
  const signer = assignment.authorizedEmployees.find(
    employee => normalizeBadge(employee.badge) === normalizeBadge(input.signatureId)
  );
  if (!signer) throw new Error("Authorized signer could not be resolved.");

  const phase = phaseDictionary[input.toPhaseKey];
  const nextStatus: BlindStatus =
    input.toPhaseKey === "inspectionReady"
      ? "Completed"
      : input.toPhaseKey === "finalTight"
        ? "Pending Approval"
        : "In Progress";
  const updated = hydrateBlind({
    ...current,
    currentPhaseKey: input.toPhaseKey,
    phaseLabel: phase.label,
    ownerRoleKey: assignment.roleKey,
    ownerLabel: roleDisplayNames[assignment.roleKey],
    status: nextStatus,
  });

  const torqueNote =
    input.toPhaseKey === "tightTorque"
      ? ` | Torque: ${input.psi} PSI, ${input.torqueType ?? "Hydraulic"}, Tool: ${input.toolId}, Tech Badge: ${input.technicianBadge ?? signer.badge}`
      : "";
  const log: BlindLogModel = {
    id: makeId("log"),
    blindId: current.id,
    fromPhaseKey: current.currentPhaseKey,
    toPhaseKey: input.toPhaseKey,
    action: "Phase gate approved",
    actorOpenId: signer.badge,
    actorRoleKey: assignment.roleKey,
    remarks:
      input.remarks ||
      `Moved to ${phase.label} by ${signer.fullName} (${signer.badge})${torqueNote}`,
    createdAt: new Date().toISOString(),
  };

  if (!db) {
    demoBlinds = demoBlinds.map(blind =>
      blind.id === current.id ? updated : blind
    );
    if (input.toPhaseKey === "tightTorque") {
      demoTorqueRecords = [
        enrichTorqueFromBlind({
          id: makeId("torque"),
          blindId: current.id,
          phaseKey: input.toPhaseKey,
          machineType: input.torqueType ?? "Hydraulic",
          psiValue: input.psi ?? 0,
          technicianOpenId: signer.badge,
          technicianName: input.technicianName || signer.fullName,
          technicianBadge: input.technicianBadge ?? signer.badge,
          remarks: `Tool/Machine: ${input.toolId ?? "N/A"}${input.remarks ? ` · ${input.remarks}` : ""}`,
          createdAt: new Date().toISOString(),
        }),
        ...demoTorqueRecords,
      ];
    }
    demoLogs = [log, ...demoLogs];
    await recordAuditTrail({
      entityType: "Workflow",
      entityId: current.id,
      projectId: current.projectId,
      blindId: current.id,
      action: "Phase gate approved",
      actorOpenId: signer.badge,
      actorName: signer.fullName,
      actorRoleKey: assignment.roleKey,
      summary: `${current.tagNo} moved from ${current.phaseLabel} to ${phase.label}.`,
      before: { phase: current.currentPhaseKey, status: current.status },
      after: { phase: input.toPhaseKey, status: nextStatus },
    });
    await createSystemNotification({
      userOpenId: null,
      type: input.toPhaseKey === "finalTight" ? "Approval" : "System",
      title: `${current.tagNo} moved to ${phase.label}`,
      message: `${signer.fullName} signed the phase update for ${current.tagNo}.`,
      relatedEntity: "Blind",
      relatedId: current.id,
      actionUrl: `/blinds/${current.id}`,
      severity: input.toPhaseKey === "finalTight" ? "warning" : "info",
    });
    if (input.toPhaseKey === "finalTight") {
      const detailForApproval = await getBlindDetail(current.id);
      if (detailForApproval) {
        await ensureFinalApprovalRequests(detailForApproval, signer.badge);
      }
    }
    const detail = await getBlindDetail(current.id);
    if (!detail) throw new Error("Blind could not be read after phase update.");
    return detail;
  }

  await db.transaction(async tx => {
    await tx
      .update(blinds)
      .set({
        currentPhaseKey: input.toPhaseKey,
        ownerRoleKey: assignment.roleKey,
        status: nextStatus,
      })
      .where(eq(blinds.id, current.id));

    if (input.toPhaseKey === "tightTorque") {
      await tx.insert(torqueRecords).values({
        blindId: current.id,
        phaseKey: input.toPhaseKey,
        machineType: input.torqueType ?? "Hydraulic",
        psiValue: input.psi ?? 0,
        technicianOpenId: signer.badge,
        technicianBadge: input.technicianBadge ?? signer.badge,
        remarks: `Tool/Machine: ${input.toolId ?? "N/A"}${input.technicianName ? ` · Technician: ${input.technicianName}` : ""}`,
      });
    }

    await tx.insert(blindWorkflowLogs).values({
      blindId: current.id,
      fromPhaseKey: current.currentPhaseKey,
      toPhaseKey: input.toPhaseKey,
      action: log.action,
      actorOpenId: log.actorOpenId,
      actorRoleKey: log.actorRoleKey,
      remarks: log.remarks,
    });


  });
  if (input.toPhaseKey === "finalTight") {
    const detailForApproval = await getBlindDetail(current.id);
    if (detailForApproval) {
      await ensureFinalApprovalRequests(detailForApproval, signer.badge);
    }
  }
  await recordAuditTrail({
    entityType: "Workflow",
    entityId: current.id,
    projectId: current.projectId,
    blindId: current.id,
    action: "Phase gate approved",
    actorOpenId: signer.badge,
    actorName: signer.fullName,
    actorRoleKey: assignment.roleKey,
    summary: `${current.tagNo} moved from ${current.phaseLabel} to ${phase.label}.`,
    before: { phase: current.currentPhaseKey, status: current.status },
    after: { phase: input.toPhaseKey, status: nextStatus },
  });
  await createSystemNotification({
    userOpenId: null,
    type: input.toPhaseKey === "finalTight" ? "Approval" : "System",
    title: `${current.tagNo} moved to ${phase.label}`,
    message: `${signer.fullName} signed the phase update for ${current.tagNo}.`,
    relatedEntity: "Blind",
    relatedId: current.id,
    actionUrl: `/blinds/${current.id}`,
    severity: input.toPhaseKey === "finalTight" ? "warning" : "info",
  });
  const detail = await getBlindDetail(current.id);
  if (!detail) throw new Error("Blind could not be read after phase update.");
  return detail;
}


function enrichApprovalFromBlind(
  approval: Omit<ApprovalModel, "blindNo" | "tagNo" | "projectId" | "projectName" | "areaCode" | "lineNo" | "size" | "rating" | "phaseLabel" | "requiredRoleLabel"> &
    Partial<ApprovalModel>,
  blindList = demoBlinds
): ApprovalModel {
  const blind = blindList.find(item => item.id === approval.blindId);
  const employee = approval.approvedByOpenId
    ? demoEmployees.find(item => normalizeBadge(item.badge) === normalizeBadge(approval.approvedByOpenId))
    : undefined;
  return {
    id: approval.id,
    blindId: approval.blindId,
    blindNo: blind?.blindNo ?? approval.blindNo ?? "N/A",
    tagNo: blind?.tagNo ?? approval.tagNo ?? "N/A",
    projectId: blind?.projectId ?? approval.projectId ?? "N/A",
    projectName: blind?.projectName ?? approval.projectName ?? "Unknown Project",
    areaCode: blind?.areaCode ?? approval.areaCode ?? "N/A",
    lineNo: blind?.lineNo ?? approval.lineNo ?? "N/A",
    size: blind?.size ?? approval.size ?? "N/A",
    rating: blind?.rating ?? approval.rating ?? null,
    phaseKey: approval.phaseKey,
    phaseLabel: phaseDictionary[approval.phaseKey].label,
    requiredRoleKey: approval.requiredRoleKey,
    requiredRoleLabel: roleDisplayNames[approval.requiredRoleKey],
    approvedByOpenId: approval.approvedByOpenId ?? null,
    approvedByName: approval.approvedByName ?? employee?.fullName ?? null,
    status: approval.status,
    remarks: approval.remarks ?? null,
    createdAt: approval.createdAt,
    approvedAt: approval.approvedAt ?? null,
  };
}

function enrichTorqueFromBlind(
  record: Omit<TorqueRecordModel, "blindNo" | "tagNo" | "projectId" | "projectName" | "areaCode" | "lineNo" | "phaseLabel"> &
    Partial<TorqueRecordModel>,
  blindList = demoBlinds
): TorqueRecordModel {
  const blind = blindList.find(item => item.id === record.blindId);
  const employee = record.technicianBadge
    ? demoEmployees.find(item => normalizeBadge(item.badge) === normalizeBadge(record.technicianBadge))
    : undefined;
  return {
    id: record.id,
    blindId: record.blindId,
    blindNo: blind?.blindNo ?? record.blindNo ?? "N/A",
    tagNo: blind?.tagNo ?? record.tagNo ?? "N/A",
    projectId: blind?.projectId ?? record.projectId ?? "N/A",
    projectName: blind?.projectName ?? record.projectName ?? "Unknown Project",
    areaCode: blind?.areaCode ?? record.areaCode ?? "N/A",
    lineNo: blind?.lineNo ?? record.lineNo ?? "N/A",
    phaseKey: record.phaseKey,
    phaseLabel: phaseDictionary[record.phaseKey].label,
    machineType: record.machineType,
    psiValue: record.psiValue,
    technicianOpenId: record.technicianOpenId ?? null,
    technicianName: record.technicianName ?? employee?.fullName ?? null,
    technicianBadge: record.technicianBadge ?? null,
    remarks: record.remarks ?? null,
    createdAt: record.createdAt,
  };
}

async function createPendingApprovalRequest(
  blind: BlindDetailModel,
  phaseKey: PhaseKey,
  requiredRoleKey: RoleKey,
  remarks?: string | null
): Promise<void> {
  const db = await getDb();
  const existingDemo = demoApprovals.find(
    item => item.blindId === blind.id && item.phaseKey === phaseKey && item.status === "Pending"
  );
  if (!db) {
    if (existingDemo) return;
    const approval = enrichApprovalFromBlind({
      id: makeId("approval"),
      blindId: blind.id,
      phaseKey,
      requiredRoleKey,
      approvedByOpenId: null,
      approvedByName: null,
      status: "Pending",
      remarks: remarks ?? `Approval requested for ${phaseDictionary[phaseKey].label}.`,
      createdAt: new Date().toISOString(),
      approvedAt: null,
    });
    demoApprovals = [approval, ...demoApprovals];
    await recordAuditTrail({
      entityType: "Approval",
      entityId: String(approval.id),
      projectId: blind.projectId,
      blindId: blind.id,
      action: "Approval request created",
      actorOpenId: "system-demo",
      actorName: "SBTS Automation",
      actorRoleKey: "system",
      summary: `${blind.tagNo} requires ${roleDisplayNames[requiredRoleKey]} approval for ${phaseDictionary[phaseKey].label}.`,
      after: approval,
    });
    await createSystemNotification({
      userOpenId: null,
      type: "Approval",
      title: "Approval required",
      message: `${blind.tagNo} is waiting for ${roleDisplayNames[requiredRoleKey]} approval.`,
      relatedEntity: "Approval",
      relatedId: String(approval.id),
      actionUrl: "/approvals",
      severity: "warning",
    });
    return;
  }
  // Sprint 4 DB mode: create a pending approval row. Duplicate prevention can be tightened with an index later.
  await db.insert(approvals).values({
    blindId: blind.id,
    phaseKey,
    requiredRoleKey,
    approvedByOpenId: null,
    status: "Pending",
    remarks: remarks ?? `Approval requested for ${phaseDictionary[phaseKey].label}.`,
  });
  await recordAuditTrail({
    entityType: "Approval",
    entityId: `${blind.id}-${phaseKey}`,
    projectId: blind.projectId,
    blindId: blind.id,
    action: "Approval request created",
    actorOpenId: "system-demo",
    actorName: "SBTS Automation",
    actorRoleKey: "system",
    summary: `${blind.tagNo} requires ${roleDisplayNames[requiredRoleKey]} approval for ${phaseDictionary[phaseKey].label}.`,
  });
  await createSystemNotification({
    userOpenId: null,
    type: "Approval",
    title: "Approval required",
    message: `${blind.tagNo} is waiting for ${roleDisplayNames[requiredRoleKey]} approval.`,
    relatedEntity: "Approval",
    relatedId: `${blind.id}-${phaseKey}`,
    actionUrl: "/approvals",
    severity: "warning",
  });
}


export async function getApprovalProfiles(): Promise<ApprovalProfileModel[]> {
  const db = await getDb();
  if (!db) return normalizeApprovalProfiles(demoSystemSettings);

  try {
    const [profileRows, approverRows] = await Promise.all([
      db.select().from(approvalProfiles).orderBy(asc(approvalProfiles.blindType)),
      db.select().from(approvalProfileApprovers).orderBy(asc(approvalProfileApprovers.sortOrder)),
    ]);

    if (profileRows.length > 0) {
      return profileRows
        .filter(profile => profile.status === "Active")
        .map(profile => {
          const approvers = approverRows
            .filter(approver => approver.profileId === profile.id)
            .map(approver => ({
              label: approver.approverLabel,
              roleKey: approver.roleKey as RoleKey,
              required: Boolean(approver.isRequired),
              sortOrder: approver.sortOrder,
            }))
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return {
            blindType: profile.blindType,
            requiredApprovers: approvers.map(approver => approver.label),
            approvers,
            requireAll: Boolean(profile.requireAll),
            unlockCertificate: Boolean(profile.unlockCertificate),
          };
        });
    }
  } catch (error) {
    console.warn("[ApprovalProfiles] Falling back to system settings:", error);
  }

  return normalizeApprovalProfiles(await getSystemSettings());
}

async function ensureFinalApprovalRequests(
  blind: BlindDetailModel,
  actorOpenId?: string | null
): Promise<ApprovalModel[]> {
  const profiles = await getApprovalProfiles();
  const profile = matchApprovalProfile(blind.blindType, profiles);
  if (!profile) return [];

  const existing = (await getApprovalCenter()).filter(
    approval => approval.blindId === blind.id && approval.phaseKey === "finalTight"
  );
  const created: ApprovalModel[] = [];
  const db = await getDb();

  for (const approver of profile.approvers.filter(item => item.required)) {
    const alreadyExists = existing.some(
      approval => approval.requiredRoleKey === approver.roleKey && approval.status !== "Rejected"
    );
    if (alreadyExists) continue;

    const remarks = `${profile.blindType} final approval requires ${approver.label}. Certificate unlock: ${profile.unlockCertificate ? "enabled" : "disabled"}.`;

    if (!db) {
      const approval: ApprovalModel = enrichApprovalFromBlind({
        id: makeId("approval"),
        blindId: blind.id,
        phaseKey: "finalTight",
        requiredRoleKey: approver.roleKey,
        approvedByOpenId: null,
        approvedByName: null,
        status: "Pending",
        remarks,
        createdAt: new Date().toISOString(),
        approvedAt: null,
      });
      demoApprovals = [approval, ...demoApprovals];
      created.push(approval);
      continue;
    }

    await db.insert(approvals).values({
      blindId: blind.id,
      phaseKey: "finalTight",
      requiredRoleKey: approver.roleKey,
      approvedByOpenId: null,
      status: "Pending",
      remarks,
    });
  }

  const allApprovals = (await getApprovalCenter()).filter(
    approval => approval.blindId === blind.id && approval.phaseKey === "finalTight"
  );

  if (profile.approvers.length > 0) {
    await createSystemNotification({
      userOpenId: null,
      type: "Approval",
      title: `${blind.tagNo} final approval profile applied`,
      message: `${blind.blindType} requires ${profile.requiredApprovers.join(", ")} before certificate release.`,
      relatedEntity: "Blind",
      relatedId: blind.id,
      actionUrl: `/approvals`,
      severity: "warning",
    });
    await recordAuditTrail({
      entityType: "ApprovalProfile",
      entityId: blind.id,
      projectId: blind.projectId,
      blindId: blind.id,
      action: "Approval profile applied",
      actorOpenId: actorOpenId ?? "system",
      actorName: actorOpenId ?? "SBTS Automation",
      actorRoleKey: "system",
      summary: `${blind.tagNo} received ${profile.blindType} approval profile with ${profile.requiredApprovers.length} required approvals.`,
      after: { profile, approvals: allApprovals },
    });
  }

  return allApprovals;
}

export async function getCertificateLockStatus(blindId: string, checkedByOpenId?: string | null): Promise<CertificateLockStatusModel> {
  const blind = await getBlindDetail(blindId);
  if (!blind) throw new Error("Blind was not found.");

  const settings = await getSystemSettings();
  const profiles = await getApprovalProfiles();
  const profile = matchApprovalProfile(blind.blindType, profiles);
  const approvalsForBlind = (await getApprovalCenter()).filter(
    approval => approval.blindId === blind.id && approval.phaseKey === "finalTight"
  );

  if (!settings.certificates.requireFinalApprovalBeforeIssue) {
    return {
      blindId: blind.id,
      blindType: blind.blindType,
      profile,
      locked: false,
      unlockCertificate: false,
      requiredApprovers: [],
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      missingCount: 0,
      reason: "Certificate final-approval lock is disabled in settings.",
    };
  }

  if (!profile || !profile.unlockCertificate) {
    return {
      blindId: blind.id,
      blindType: blind.blindType,
      profile,
      locked: false,
      unlockCertificate: false,
      requiredApprovers: [],
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      missingCount: 0,
      reason: "No certificate-unlock approval profile is required for this blind type.",
    };
  }

  const requiredApprovers = profile.approvers.filter(item => item.required).map(approver => {
    const matching = approvalsForBlind.find(approval => approval.requiredRoleKey === approver.roleKey);
    return {
      label: approver.label,
      roleKey: approver.roleKey,
      status: matching?.status ?? "Missing",
      approvalId: matching?.id ?? null,
      approvedByName: matching?.approvedByName ?? null,
      approvedAt: matching?.approvedAt ?? null,
    };
  });

  const approvedCount = requiredApprovers.filter(item => item.status === "Approved").length;
  const pendingCount = requiredApprovers.filter(item => item.status === "Pending").length;
  const rejectedCount = requiredApprovers.filter(item => item.status === "Rejected").length;
  const missingCount = requiredApprovers.filter(item => item.status === "Missing").length;
  const locked = profile.requireAll
    ? approvedCount < requiredApprovers.length || rejectedCount > 0 || missingCount > 0
    : approvedCount === 0 || rejectedCount > 0;

  const missingApprovers = requiredApprovers.filter(item => item.status !== "Approved").map(item => item.label);
  const reason = locked
    ? `Certificate locked. Missing/unfinished approvals: ${missingApprovers.join(", ") || "None"}.`
    : "Certificate unlocked. Required final approvals are complete.";

  const db = await getDb();
  if (db && checkedByOpenId) {
    await db.insert(certificateLockEvents).values({
      blindId: blind.id,
      lockStatus: locked ? "Locked" : "Unlocked",
      reason,
      missingApproversJson: JSON.stringify(missingApprovers),
      checkedByOpenId,
    });
  }

  return {
    blindId: blind.id,
    blindType: blind.blindType,
    profile,
    locked,
    unlockCertificate: true,
    requiredApprovers,
    approvedCount,
    pendingCount,
    rejectedCount,
    missingCount,
    reason,
  };
}

export async function getApprovalCenter(): Promise<ApprovalModel[]> {
  const db = await getDb();
  if (!db) return demoApprovals.map(item => enrichApprovalFromBlind(item));
  await seedCoreData();
  const [rows, blindRows, projectRows, areaRows, employeeRows] = await Promise.all([
    db.select().from(approvals).orderBy(asc(approvals.id)),
    db.select().from(blinds),
    db.select().from(projects),
    db.select().from(areas),
    getEmployeeDirectory(),
  ]);
  const mappedBlinds = blindRows.map(blind => {
    const project = projectRows.find(item => item.id === blind.projectId);
    const area = areaRows.find(item => item.id === blind.areaId);
    return hydrateBlind({
      id: blind.id,
      blindNo: blind.blindNo,
      tagNo: blind.tagNo,
      projectId: blind.projectId,
      projectName: project?.name ?? "Unknown Project",
      areaId: blind.areaId,
      areaCode: area?.code ?? "N/A",
      lineNo: blind.lineNo,
      size: blind.size,
      rating: blind.rating,
      blindType: blind.blindType,
      currentPhaseKey: blind.currentPhaseKey as PhaseKey,
      ownerRoleKey: blind.ownerRoleKey as RoleKey,
      status: blind.status as BlindStatus,
      priority: blind.priority as BlindPriority,
      qrCode: blind.qrCode,
      locationNote: blind.locationNote,
    });
  });
  return rows.map(row => {
    const employee = row.approvedByOpenId
      ? employeeRows.find(item => normalizeBadge(item.badge) === normalizeBadge(row.approvedByOpenId))
      : undefined;
    return enrichApprovalFromBlind({
      id: row.id,
      blindId: row.blindId,
      phaseKey: row.phaseKey as PhaseKey,
      requiredRoleKey: row.requiredRoleKey as RoleKey,
      approvedByOpenId: row.approvedByOpenId,
      approvedByName: employee?.fullName ?? null,
      status: row.status as ApprovalStatus,
      remarks: row.remarks,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      approvedAt: row.approvedAt instanceof Date ? row.approvedAt.toISOString() : row.approvedAt ? String(row.approvedAt) : null,
    }, mappedBlinds);
  }).reverse();
}

export async function getPendingApprovalInbox(): Promise<ApprovalModel[]> {
  const approvalsList = await getApprovalCenter();
  return approvalsList.filter(item => item.status === "Pending");
}

export async function approveWorkflowRequest(
  input: ApprovalActionInput,
  actorOpenId?: string
): Promise<ApprovalModel> {
  const approvalList = await getApprovalCenter();
  const approval = approvalList.find(item => String(item.id) === String(input.approvalId));
  if (!approval) throw new Error("Approval request was not found.");
  if (approval.status !== "Pending") throw new Error("This approval request is already closed.");
  const blindDetail = await getBlindDetail(approval.blindId);
  if (!blindDetail) throw new Error("Blind was not found for this approval.");
  const assignments = await getProjectPhaseAssignments(blindDetail.projectId);
  const assignment = assignments.find(item => item.phaseKey === approval.phaseKey);
  if (!assignment) throw new Error("Approval phase assignment was not found. Configure Project Setup first.");
  const signer = assignment.authorizedEmployees.find(
    employee => normalizeBadge(employee.badge) === normalizeBadge(input.signatureId)
  );
  if (!signer && normalizeBadge(input.signatureId) !== "admin") {
    throw new Error("This badge is not authorized to close this approval request.");
  }
  const signerBadge = signer?.badge ?? input.signatureId.trim();
  const signerName = signer?.fullName ?? "System Admin";
  const now = new Date().toISOString();
  const nextStatus = input.decision;
  const db = await getDb();
  const log: BlindLogModel = {
    id: makeId("log"),
    blindId: approval.blindId,
    fromPhaseKey: approval.phaseKey,
    toPhaseKey: approval.phaseKey,
    action: nextStatus === "Approved" ? "Approval approved" : "Approval rejected",
    actorOpenId: signerBadge,
    actorRoleKey: assignment.roleKey,
    remarks: `${nextStatus} by ${signerName} (${signerBadge}). ${input.remarks ?? ""}`.trim(),
    createdAt: now,
  };
  if (!db) {
    demoApprovals = demoApprovals.map(item =>
      String(item.id) === String(input.approvalId)
        ? {
            ...item,
            status: nextStatus,
            approvedByOpenId: signerBadge,
            approvedByName: signerName,
            remarks: input.remarks ?? item.remarks,
            approvedAt: now,
          }
        : item
    );
    demoLogs = [log, ...demoLogs];
    const updatedApproval = enrichApprovalFromBlind(demoApprovals.find(item => String(item.id) === String(input.approvalId))!);
    await recordAuditTrail({
      entityType: "Approval",
      entityId: String(updatedApproval.id),
      projectId: updatedApproval.projectId,
      blindId: updatedApproval.blindId,
      action: nextStatus === "Approved" ? "Approval approved" : "Approval rejected",
      actorOpenId: signerBadge,
      actorName: signerName,
      actorRoleKey: assignment.roleKey,
      summary: `${updatedApproval.tagNo} ${nextStatus.toLowerCase()} by ${signerName}.`,
      after: updatedApproval,
    });
    await createSystemNotification({
      userOpenId: null,
      type: "Approval",
      title: nextStatus === "Approved" ? "Approval completed" : "Approval rejected",
      message: `${updatedApproval.tagNo} was ${nextStatus.toLowerCase()} by ${signerName}.`,
      relatedEntity: "Approval",
      relatedId: String(updatedApproval.id),
      actionUrl: `/blinds/${updatedApproval.blindId}`,
      severity: nextStatus === "Approved" ? "success" : "danger",
    });
    if (nextStatus === "Approved" && updatedApproval.phaseKey === "finalTight") {
      const lockStatus = await getCertificateLockStatus(updatedApproval.blindId, signerBadge);
      if (!lockStatus.locked) {
        demoBlinds = demoBlinds.map(blind =>
          blind.id === updatedApproval.blindId ? { ...blind, status: "Completed" } : blind
        );
      }
    }
    return updatedApproval;
  }
  await db.transaction(async tx => {
    await tx
      .update(approvals)
      .set({
        status: nextStatus,
        approvedByOpenId: signerBadge,
        remarks: input.remarks ?? approval.remarks ?? null,
        approvedAt: new Date(),
      })
      .where(eq(approvals.id, Number(input.approvalId)));
    await tx.insert(blindWorkflowLogs).values({
      blindId: approval.blindId,
      fromPhaseKey: approval.phaseKey,
      toPhaseKey: approval.phaseKey,
      action: log.action,
      actorOpenId: log.actorOpenId,
      actorRoleKey: log.actorRoleKey,
      remarks: log.remarks,
    });
  });
  if (nextStatus === "Approved" && approval.phaseKey === "finalTight") {
    const lockStatus = await getCertificateLockStatus(approval.blindId, actorOpenId ?? signerBadge);
    const dbAfter = await getDb();
    if (!lockStatus.locked) {
      if (!dbAfter) {
        demoBlinds = demoBlinds.map(blind =>
          blind.id === approval.blindId ? { ...blind, status: "Completed" } : blind
        );
      } else {
        await dbAfter.update(blinds).set({ status: "Completed" }).where(eq(blinds.id, approval.blindId));
      }
      await recordAuditTrail({
        entityType: "CertificateLock",
        entityId: approval.blindId,
        projectId: approval.projectId,
        blindId: approval.blindId,
        action: "Certificate unlocked",
        actorOpenId: signerBadge,
        actorName: signerName,
        actorRoleKey: assignment.roleKey,
        summary: `${approval.tagNo} certificate unlocked after final approvals.`,
        after: lockStatus,
      });
    }
  }
  const updated = (await getApprovalCenter()).find(item => String(item.id) === String(input.approvalId));
  if (!updated) throw new Error("Approval could not be read after update.");
  await recordAuditTrail({
    entityType: "Approval",
    entityId: String(updated.id),
    projectId: updated.projectId,
    blindId: updated.blindId,
    action: nextStatus === "Approved" ? "Approval approved" : "Approval rejected",
    actorOpenId: signerBadge,
    actorName: signerName,
    actorRoleKey: assignment.roleKey,
    summary: `${updated.tagNo} ${nextStatus.toLowerCase()} by ${signerName}.`,
    after: updated,
  });
  await createSystemNotification({
    userOpenId: null,
    type: "Approval",
    title: nextStatus === "Approved" ? "Approval completed" : "Approval rejected",
    message: `${updated.tagNo} was ${nextStatus.toLowerCase()} by ${signerName}.`,
    relatedEntity: "Approval",
    relatedId: String(updated.id),
    actionUrl: `/blinds/${updated.blindId}`,
    severity: nextStatus === "Approved" ? "success" : "danger",
  });
  return updated;
}

export async function getTorqueRecords(blindId?: string | null): Promise<TorqueRecordModel[]> {
  const db = await getDb();
  if (!db) {
    return demoTorqueRecords
      .filter(item => !blindId || item.blindId === blindId)
      .map(item => enrichTorqueFromBlind(item));
  }
  await seedCoreData();
  const [rows, blindRows, projectRows, areaRows, employeeRows] = await Promise.all([
    db.select().from(torqueRecords).orderBy(asc(torqueRecords.id)),
    db.select().from(blinds),
    db.select().from(projects),
    db.select().from(areas),
    getEmployeeDirectory(),
  ]);
  const mappedBlinds = blindRows.map(blind => {
    const project = projectRows.find(item => item.id === blind.projectId);
    const area = areaRows.find(item => item.id === blind.areaId);
    return hydrateBlind({
      id: blind.id,
      blindNo: blind.blindNo,
      tagNo: blind.tagNo,
      projectId: blind.projectId,
      projectName: project?.name ?? "Unknown Project",
      areaId: blind.areaId,
      areaCode: area?.code ?? "N/A",
      lineNo: blind.lineNo,
      size: blind.size,
      rating: blind.rating,
      blindType: blind.blindType,
      currentPhaseKey: blind.currentPhaseKey as PhaseKey,
      ownerRoleKey: blind.ownerRoleKey as RoleKey,
      status: blind.status as BlindStatus,
      priority: blind.priority as BlindPriority,
      qrCode: blind.qrCode,
      locationNote: blind.locationNote,
    });
  });
  return rows
    .filter(row => !blindId || row.blindId === blindId)
    .map(row => {
      const employee = row.technicianBadge
        ? employeeRows.find(item => normalizeBadge(item.badge) === normalizeBadge(row.technicianBadge))
        : undefined;
      return enrichTorqueFromBlind({
        id: row.id,
        blindId: row.blindId,
        phaseKey: row.phaseKey as PhaseKey,
        machineType: row.machineType,
        psiValue: row.psiValue,
        technicianOpenId: row.technicianOpenId,
        technicianName: employee?.fullName ?? null,
        technicianBadge: row.technicianBadge,
        remarks: row.remarks,
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      }, mappedBlinds);
    })
    .reverse();
}


function toBooleanFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function hydrateTagSettings(row: TagDesignerSettingsModel): TagDesignerSettingsModel;
function hydrateTagSettings(row: typeof tagDesignerSettings.$inferSelect): TagDesignerSettingsModel;
function hydrateTagSettings(row: TagDesignerSettingsModel | typeof tagDesignerSettings.$inferSelect): TagDesignerSettingsModel {
  return {
    id: row.id,
    scopeType: (row.scopeType as "Global" | "Project") ?? "Global",
    projectId: row.projectId ?? null,
    templateName: row.templateName ?? defaultTagDesignerSettings.templateName,
    tagWidthCm: Number(row.tagWidthCm ?? 11),
    tagHeightCm: Number(row.tagHeightCm ?? 7),
    tagColor: row.tagColor ?? "#ffffff",
    accentColor: row.accentColor ?? "#0891b2",
    textColor: row.textColor ?? "#0f172a",
    logoText: row.logoText ?? "Smart Blind Tag System",
    showLogo: toBooleanFlag(row.showLogo),
    showHole: toBooleanFlag(row.showHole),
    showStatus: toBooleanFlag(row.showStatus),
    showProjectNo: toBooleanFlag(row.showProjectNo),
    showLocationNote: toBooleanFlag(row.showLocationNote),
    qrSizePx: Number(row.qrSizePx ?? 132),
    fontScale: Number(row.fontScale ?? 100),
    layoutMode: (row.layoutMode as TagDesignerSettingsModel["layoutMode"]) ?? "Operational Split",
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt ? String(row.updatedAt) : null,
  };
}

function mergeTagSettings(globalSettings: TagDesignerSettingsModel, projectSettings?: TagDesignerSettingsModel | null): TagDesignerSettingsModel {
  return {
    ...globalSettings,
    ...(projectSettings ?? {}),
    id: projectSettings?.id ?? globalSettings.id,
    scopeType: projectSettings ? "Project" : globalSettings.scopeType,
    projectId: projectSettings?.projectId ?? null,
  };
}


function mergeSystemSettings(input?: Partial<SaveSystemSettingsInput>): SystemSettingsModel {
  return {
    ...defaultSystemSettings,
    ...input,
    general: { ...defaultSystemSettings.general, ...(input?.general ?? {}) },
    tags: { ...defaultSystemSettings.tags, ...(input?.tags ?? {}) },
    certificates: { ...defaultSystemSettings.certificates, ...(input?.certificates ?? {}) },
    approvals: { ...defaultSystemSettings.approvals, ...(input?.approvals ?? {}) },
    masterData: { ...defaultSystemSettings.masterData, ...(input?.masterData ?? {}) },
    notifications: { ...defaultSystemSettings.notifications, ...(input?.notifications ?? {}) },
    security: { ...defaultSystemSettings.security, ...(input?.security ?? {}) },
    updatedAt: new Date().toISOString(),
    updatedByOpenId: "system-default",
  };
}

const SYSTEM_SETTINGS_CACHE_TTL_MS = Number(process.env.SBTS_SETTINGS_CACHE_TTL_MS ?? 5 * 60 * 1000);
let systemSettingsCache: { value: SystemSettingsModel; expiresAt: number } | null = null;

function clearSystemSettingsCache() {
  systemSettingsCache = null;
}

function parseSystemSettingsPayload(raw: string | null | undefined): SaveSystemSettingsInput | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as SaveSystemSettingsInput;
  } catch {
    return undefined;
  }
}

export async function getSystemSettings(): Promise<SystemSettingsModel> {
  if (systemSettingsCache && Date.now() < systemSettingsCache.expiresAt) {
    return systemSettingsCache.value;
  }

  const db = await getDb();
  if (!db) return demoSystemSettings;
  const rows = await db.select().from(systemSettings).where(eq(systemSettings.key, "global")).limit(1);
  if (!rows[0]) {
    await db.insert(systemSettings).values({
      key: "global",
      category: "System",
      valueJson: JSON.stringify(defaultSystemSettings),
      updatedByOpenId: "system-default",
    });
    systemSettingsCache = { value: defaultSystemSettings, expiresAt: Date.now() + SYSTEM_SETTINGS_CACHE_TTL_MS };
    return defaultSystemSettings;
  }
  const value = {
    ...mergeSystemSettings(parseSystemSettingsPayload(rows[0].valueJson)),
    updatedAt: rows[0].updatedAt instanceof Date ? rows[0].updatedAt.toISOString() : new Date().toISOString(),
    updatedByOpenId: rows[0].updatedByOpenId,
  };
  systemSettingsCache = { value, expiresAt: Date.now() + SYSTEM_SETTINGS_CACHE_TTL_MS };
  return value;
}

export async function saveSystemSettings(
  input: SaveSystemSettingsInput,
  updatedByOpenId?: string
): Promise<SystemSettingsModel> {
  const normalized = mergeSystemSettings(input);
  normalized.updatedByOpenId = updatedByOpenId ?? "local-demo-user";
  clearSystemSettingsCache();
  const db = await getDb();
  if (!db) {
    const before = demoSystemSettings;
    demoSystemSettings = normalized;
    await recordAuditTrail({
      entityType: "Settings",
      entityId: "global",
      action: "System settings saved",
      actorOpenId: normalized.updatedByOpenId,
      actorName: "System Admin",
      actorRoleKey: "admin",
      summary: "System Settings Center was updated. General, tag, certificate, notification, and security defaults are now synchronized.",
      before,
      after: normalized,
    });
    await createSystemNotification({
      userOpenId: null,
      type: "System",
      title: "System settings updated",
      message: "Global SBTS settings were updated by an administrator.",
      relatedEntity: "Settings",
      relatedId: "global",
      actionUrl: "/settings",
      severity: "info",
    });
    return demoSystemSettings;
  }

  const values = {
    key: "global",
    category: "System",
    valueJson: JSON.stringify(input),
    updatedByOpenId: normalized.updatedByOpenId,
  };
  await db.insert(systemSettings).values(values).onDuplicateKeyUpdate({
    set: {
      category: values.category,
      valueJson: values.valueJson,
      updatedByOpenId: values.updatedByOpenId,
    },
  });
  await recordAuditTrail({
    entityType: "Settings",
    entityId: "global",
    action: "System settings saved",
    actorOpenId: normalized.updatedByOpenId,
    actorName: "System Admin",
    actorRoleKey: "admin",
    summary: "System Settings Center was updated.",
    after: normalized,
  });
  await recordPersistenceEvent({ eventType: "settings.save", domain: "System Settings", status: "Success", summary: "Global system settings persisted to database.", metadata: { key: "global" }, actorOpenId: normalized.updatedByOpenId });
  await createSystemNotification({
    userOpenId: null,
    type: "System",
    title: "System settings updated",
    message: "Global SBTS settings were updated by an administrator.",
    relatedEntity: "Settings",
    relatedId: "global",
    actionUrl: "/settings",
    severity: "info",
  });
  return getSystemSettings();
}

export async function getTagDesignerSettings(projectId?: string | null): Promise<TagDesignerSettingsModel> {
  const db = await getDb();
  if (!db) {
    const globalSettings = demoTagSettings.find(item => item.scopeType === "Global") ?? defaultTagDesignerSettings;
    const projectSettings = projectId ? demoTagSettings.find(item => item.scopeType === "Project" && item.projectId === projectId) : undefined;
    return mergeTagSettings(globalSettings, projectSettings);
  }
  const rows = await db.select().from(tagDesignerSettings).orderBy(asc(tagDesignerSettings.id));
  if (rows.length === 0) {
    await db.insert(tagDesignerSettings).values({
      scopeType: "Global",
      projectId: null,
      templateName: defaultTagDesignerSettings.templateName,
      tagWidthCm: defaultTagDesignerSettings.tagWidthCm,
      tagHeightCm: defaultTagDesignerSettings.tagHeightCm,
      tagColor: defaultTagDesignerSettings.tagColor,
      accentColor: defaultTagDesignerSettings.accentColor,
      textColor: defaultTagDesignerSettings.textColor,
      logoText: defaultTagDesignerSettings.logoText,
      showLogo: 1,
      showHole: 1,
      showStatus: 1,
      showProjectNo: 1,
      showLocationNote: 0,
      qrSizePx: defaultTagDesignerSettings.qrSizePx,
      fontScale: defaultTagDesignerSettings.fontScale,
      layoutMode: defaultTagDesignerSettings.layoutMode,
      updatedByOpenId: "system-default",
    });
    return getTagDesignerSettings(projectId);
  }
  const hydrated = rows.map(row => hydrateTagSettings(row));
  const globalSettings = hydrated.find(item => item.scopeType === "Global") ?? defaultTagDesignerSettings;
  const projectSettings = projectId ? hydrated.find(item => item.scopeType === "Project" && item.projectId === projectId) : undefined;
  return mergeTagSettings(globalSettings, projectSettings);
}

export async function saveTagDesignerSettings(
  input: SaveTagDesignerSettingsInput,
  updatedByOpenId?: string
): Promise<TagDesignerSettingsModel> {
  const normalized: TagDesignerSettingsModel = {
    ...defaultTagDesignerSettings,
    ...input,
    id: undefined,
    projectId: input.scopeType === "Project" ? input.projectId ?? null : null,
    tagWidthCm: Math.min(30, Math.max(5, Number(input.tagWidthCm || 11))),
    tagHeightCm: Math.min(30, Math.max(4, Number(input.tagHeightCm || 7))),
    qrSizePx: Math.min(260, Math.max(72, Number(input.qrSizePx || 132))),
    fontScale: Math.min(140, Math.max(80, Number(input.fontScale || 100))),
    updatedAt: new Date().toISOString(),
  };
  if (normalized.scopeType === "Project" && !normalized.projectId) {
    throw new Error("Project tag setting requires a project ID.");
  }
  const db = await getDb();
  if (!db) {
    demoTagSettings = demoTagSettings.filter(item => !(item.scopeType === normalized.scopeType && (item.projectId ?? null) === (normalized.projectId ?? null)));
    demoTagSettings = [{ ...normalized, id: makeId("tag-template") }, ...demoTagSettings];
    await recordAuditTrail({
      entityType: "Tag",
      entityId: normalized.projectId ?? "global",
      projectId: normalized.projectId ?? null,
      action: "Tag designer settings saved",
      actorOpenId: updatedByOpenId ?? "local-demo-user",
      actorName: "Local User",
      actorRoleKey: "coordinator",
      summary: `${normalized.templateName} saved for ${normalized.scopeType.toLowerCase()} scope.`,
      after: normalized,
    });
    await createSystemNotification({
      userOpenId: null,
      type: "Tag",
      title: "Tag designer settings saved",
      message: `${normalized.templateName} was updated. QR tag printing will use the latest settings.`,
      relatedEntity: "TagSettings",
      relatedId: normalized.projectId ?? "global",
      actionUrl: normalized.projectId ? `/projects/${normalized.projectId}/tag-settings` : "/projects",
      severity: "success",
    });
    return getTagDesignerSettings(normalized.projectId);
  }
  const existing = await db
    .select()
    .from(tagDesignerSettings)
    .where(eq(tagDesignerSettings.scopeType, normalized.scopeType))
    .then(rows => rows.filter(row => (row.projectId ?? null) === (normalized.projectId ?? null)));
  const values = {
    scopeType: normalized.scopeType,
    projectId: normalized.projectId,
    templateName: normalized.templateName,
    tagWidthCm: normalized.tagWidthCm,
    tagHeightCm: normalized.tagHeightCm,
    tagColor: normalized.tagColor,
    accentColor: normalized.accentColor,
    textColor: normalized.textColor,
    logoText: normalized.logoText,
    showLogo: normalized.showLogo ? 1 : 0,
    showHole: normalized.showHole ? 1 : 0,
    showStatus: normalized.showStatus ? 1 : 0,
    showProjectNo: normalized.showProjectNo ? 1 : 0,
    showLocationNote: normalized.showLocationNote ? 1 : 0,
    qrSizePx: normalized.qrSizePx,
    fontScale: normalized.fontScale,
    layoutMode: normalized.layoutMode,
    updatedByOpenId: updatedByOpenId ?? "local-demo-user",
  };
  if (existing[0]) {
    await db.update(tagDesignerSettings).set(values).where(eq(tagDesignerSettings.id, existing[0].id));
  } else {
    await db.insert(tagDesignerSettings).values(values);
  }
  await recordAuditTrail({
    entityType: "Tag",
    entityId: normalized.projectId ?? "global",
    projectId: normalized.projectId ?? null,
    action: "Tag designer settings saved",
    actorOpenId: updatedByOpenId ?? "local-demo-user",
    actorName: "Local User",
    actorRoleKey: "coordinator",
    summary: `${normalized.templateName} saved for ${normalized.scopeType.toLowerCase()} scope.`,
    after: normalized,
  });
  await createSystemNotification({
    userOpenId: null,
    type: "Tag",
    title: "Tag designer settings saved",
    message: `${normalized.templateName} was updated. QR tag printing will use the latest settings.`,
    relatedEntity: "TagSettings",
    relatedId: normalized.projectId ?? "global",
    actionUrl: normalized.projectId ? `/projects/${normalized.projectId}/tag-settings` : "/projects",
    severity: "success",
  });
  return getTagDesignerSettings(normalized.projectId);
}

function enrichCertificateFromBlind(
  cert: Omit<CertificateRecordModel, "blindNo" | "tagNo" | "projectId" | "projectName" | "areaCode"> & Partial<CertificateRecordModel>,
  blindList = demoBlinds,
  projectList = demoProjects
): CertificateRecordModel {
  const blind = blindList.find(item => item.id === cert.blindId);
  const project = blind ? projectList.find(item => item.id === blind.projectId) : undefined;
  return {
    id: cert.id,
    blindId: cert.blindId,
    blindNo: blind?.blindNo ?? cert.blindNo ?? "N/A",
    tagNo: blind?.tagNo ?? cert.tagNo ?? "N/A",
    projectId: blind?.projectId ?? cert.projectId ?? "N/A",
    projectNo: project?.projectNo ?? cert.projectNo ?? null,
    projectName: blind?.projectName ?? project?.name ?? cert.projectName ?? "Unknown Project",
    areaCode: blind?.areaCode ?? cert.areaCode ?? "N/A",
    certificateNo: cert.certificateNo,
    certificateType: cert.certificateType ?? "Blind Completion",
    revision: cert.revision ?? 1,
    templateVersion: cert.templateVersion ?? "SBTS-CERT-V1",
    qrValue: cert.qrValue ?? null,
    status: cert.status ?? "Draft",
    issuedByOpenId: cert.issuedByOpenId ?? null,
    issuedAt: cert.issuedAt ?? null,
    printCount: cert.printCount ?? 0,
    lastPrintedAt: cert.lastPrintedAt ?? null,
    createdAt: cert.createdAt,
    updatedAt: cert.updatedAt ?? cert.createdAt,
  };
}

function certificateNoFor(blind: BlindDetailModel, revision: number): string {
  const cleanTag = blind.tagNo.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return `SBTS-CERT-${cleanTag}-R${String(revision).padStart(2, "0")}`;
}

export async function getCertificates(input?: { blindId?: string | null; projectId?: string | null }): Promise<CertificateRecordModel[]> {
  const db = await getDb();
  if (!db) {
    return demoCertificates
      .filter(item => !input?.blindId || item.blindId === input.blindId)
      .filter(item => !input?.projectId || item.projectId === input.projectId)
      .map(item => enrichCertificateFromBlind(item))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  await seedCoreData();
  const [rows, blindRows, projectRows, areaRows] = await Promise.all([
    db.select().from(certificates).orderBy(asc(certificates.id)),
    db.select().from(blinds),
    db.select().from(projects),
    db.select().from(areas),
  ]);
  const mappedBlinds = blindRows.map(blind => {
    const project = projectRows.find(item => item.id === blind.projectId);
    const area = areaRows.find(item => item.id === blind.areaId);
    return hydrateBlind({
      id: blind.id,
      blindNo: blind.blindNo,
      tagNo: blind.tagNo,
      projectId: blind.projectId,
      projectName: project?.name ?? "Unknown Project",
      areaId: blind.areaId,
      areaCode: area?.code ?? "N/A",
      lineNo: blind.lineNo,
      size: blind.size,
      rating: blind.rating,
      blindType: blind.blindType,
      currentPhaseKey: blind.currentPhaseKey as PhaseKey,
      ownerRoleKey: blind.ownerRoleKey as RoleKey,
      status: blind.status as BlindStatus,
      priority: blind.priority as BlindPriority,
      qrCode: blind.qrCode,
      locationNote: blind.locationNote,
    });
  });
  const mappedProjects = projectRows.map(project => ({
    id: project.id,
    projectNo: project.projectNo,
    name: project.name,
    areaId: project.areaId,
    areaCode: areaRows.find(area => area.id === project.areaId)?.code ?? "N/A",
    areaName: areaRows.find(area => area.id === project.areaId)?.name ?? "N/A",
    workflowId: project.workflowId,
    status: project.status as ProjectStatus,
    progress: project.progress,
    blindCount: 0,
    startDate: toDateString(project.startDate),
    targetDate: toDateString(project.targetDate),
  }));
  return rows
    .map(row => enrichCertificateFromBlind({
      id: row.id,
      blindId: row.blindId,
      certificateNo: row.certificateNo,
      certificateType: row.certificateType ?? "Blind Completion",
      revision: row.revision ?? 1,
      templateVersion: row.templateVersion ?? "SBTS-CERT-V1",
      qrValue: row.qrValue,
      status: row.status as CertificateRecordModel["status"],
      issuedByOpenId: row.issuedByOpenId,
      issuedAt: row.issuedAt instanceof Date ? row.issuedAt.toISOString() : row.issuedAt ? String(row.issuedAt) : null,
      printCount: row.printCount ?? 0,
      lastPrintedAt: row.lastPrintedAt instanceof Date ? row.lastPrintedAt.toISOString() : row.lastPrintedAt ? String(row.lastPrintedAt) : null,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt ? String(row.updatedAt) : null,
    }, mappedBlinds, mappedProjects))
    .filter(item => !input?.blindId || item.blindId === input.blindId)
    .filter(item => !input?.projectId || item.projectId === input.projectId)
    .reverse();
}

export async function issueCertificate(
  input: CertificateIssueInput,
  issuedByOpenId?: string
): Promise<CertificateRecordModel> {
  const blind = await getBlindDetail(input.blindId);
  if (!blind) throw new Error("Blind was not found.");
  const targetStatus = input.status ?? "Issued";
  if (targetStatus !== "Draft") {
    const lockStatus = await getCertificateLockStatus(blind.id, issuedByOpenId ?? "local-demo-user");
    if (lockStatus.locked) {
      await recordAuditTrail({
        entityType: "CertificateLock",
        entityId: blind.id,
        projectId: blind.projectId,
        blindId: blind.id,
        action: "Certificate issue blocked",
        actorOpenId: issuedByOpenId ?? "local-demo-user",
        actorName: issuedByOpenId ?? "Local User",
        actorRoleKey: "inspection",
        summary: lockStatus.reason,
        after: lockStatus,
      });
      throw new Error(lockStatus.reason);
    }
  }
  const existing = await getCertificates({ blindId: blind.id });
  const revision = existing.length + 1;
  const now = new Date().toISOString();
  const cert: CertificateRecordModel = enrichCertificateFromBlind({
    id: makeId("cert"),
    blindId: blind.id,
    certificateNo: certificateNoFor(blind, revision),
    certificateType: "Blind Completion",
    revision,
    templateVersion: "SBTS-CERT-V1",
    qrValue: `/blinds/${blind.id}`,
    status: input.status ?? "Issued",
    issuedByOpenId: issuedByOpenId ?? "local-demo-user",
    issuedAt: now,
    printCount: input.status === "Printed" ? 1 : 0,
    lastPrintedAt: input.status === "Printed" ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  const db = await getDb();
  if (!db) {
    demoCertificates = demoCertificates.map(item => item.blindId === blind.id ? { ...item, status: "Superseded" } : item);
    demoCertificates = [cert, ...demoCertificates];
    demoLogs = [{
      id: makeId("log"),
      blindId: blind.id,
      fromPhaseKey: blind.currentPhaseKey,
      toPhaseKey: blind.currentPhaseKey,
      action: "Certificate issued",
      actorOpenId: cert.issuedByOpenId,
      actorRoleKey: "inspection",
      remarks: `${cert.certificateNo} persisted as ${cert.status}.`,
      createdAt: now,
    }, ...demoLogs];
    await recordAuditTrail({
      entityType: "Certificate",
      entityId: String(cert.id),
      projectId: blind.projectId,
      blindId: blind.id,
      action: cert.status === "Printed" ? "Certificate printed" : "Certificate issued",
      actorOpenId: cert.issuedByOpenId,
      actorName: cert.issuedByOpenId === "local-demo-user" ? "Local User" : cert.issuedByOpenId ?? "Unknown",
      actorRoleKey: "inspection",
      summary: `${cert.certificateNo} persisted as ${cert.status}.`,
      after: cert,
    });
    await createSystemNotification({
      userOpenId: null,
      type: "Certificate",
      title: cert.status === "Printed" ? "Certificate printed" : "Certificate issued",
      message: `${cert.certificateNo} for ${blind.tagNo} was saved as ${cert.status}.`,
      relatedEntity: "Certificate",
      relatedId: String(cert.id),
      actionUrl: `/blinds/${blind.id}/certificate`,
      severity: "success",
    });
    return cert;
  }
  await db.transaction(async tx => {
    await tx.update(certificates).set({ status: "Superseded" }).where(eq(certificates.blindId, blind.id));
    await tx.insert(certificates).values({
      blindId: blind.id,
      certificateNo: cert.certificateNo,
      certificateType: cert.certificateType,
      revision: cert.revision,
      templateVersion: cert.templateVersion,
      qrValue: cert.qrValue,
      blindSnapshotJson: JSON.stringify(blind),
      torqueSnapshotJson: JSON.stringify(await getTorqueRecords(blind.id)),
      approvalSnapshotJson: JSON.stringify((await getApprovalCenter()).filter(item => item.blindId === blind.id)),
      workflowSnapshotJson: JSON.stringify(blind.logs ?? []),
      issuedByOpenId: cert.issuedByOpenId,
      status: cert.status,
      printCount: cert.printCount,
      issuedAt: new Date(),
      lastPrintedAt: cert.lastPrintedAt ? new Date() : null,
    });
    await tx.insert(blindWorkflowLogs).values({
      blindId: blind.id,
      fromPhaseKey: blind.currentPhaseKey,
      toPhaseKey: blind.currentPhaseKey,
      action: "Certificate issued",
      actorOpenId: cert.issuedByOpenId,
      actorRoleKey: "inspection",
      remarks: `${cert.certificateNo} persisted as ${cert.status}.`,
    });
  });
  await recordAuditTrail({
    entityType: "Certificate",
    entityId: cert.certificateNo,
    projectId: blind.projectId,
    blindId: blind.id,
    action: cert.status === "Printed" ? "Certificate printed" : "Certificate issued",
    actorOpenId: cert.issuedByOpenId,
    actorName: cert.issuedByOpenId === "local-demo-user" ? "Local User" : cert.issuedByOpenId ?? "Unknown",
    actorRoleKey: "inspection",
    summary: `${cert.certificateNo} persisted as ${cert.status}.`,
    after: cert,
  });
  await createSystemNotification({
    userOpenId: null,
    type: "Certificate",
    title: cert.status === "Printed" ? "Certificate printed" : "Certificate issued",
    message: `${cert.certificateNo} for ${blind.tagNo} was saved as ${cert.status}.`,
    relatedEntity: "Certificate",
    relatedId: cert.certificateNo,
    actionUrl: `/blinds/${blind.id}/certificate`,
    severity: "success",
  });
  const saved = (await getCertificates({ blindId: blind.id })).find(item => item.certificateNo === cert.certificateNo);
  if (!saved) throw new Error("Certificate could not be read after issue.");
  return saved;
}


// -----------------------------------------------------------------------------
// Sprint 7 — Notifications, Inbox Actions, Certificate/Tag Audit Trail
// -----------------------------------------------------------------------------

function normalizeNotification(row: NotificationModel | typeof notifications.$inferSelect): NotificationModel {
  return {
    id: row.id,
    userOpenId: row.userOpenId ?? null,
    type: (row.type as NotificationModel["type"]) ?? "System",
    title: row.title,
    message: row.message,
    relatedEntity: row.relatedEntity ?? null,
    relatedId: row.relatedId ?? null,
    actionUrl: "actionUrl" in row ? row.actionUrl ?? null : null,
    severity: (("severity" in row ? row.severity : "info") as NotificationSeverity) ?? "info",
    status: row.status as NotificationModel["status"],
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

function normalizeAudit(row: AuditTrailModel | typeof auditTrail.$inferSelect): AuditTrailModel {
  return {
    id: row.id,
    entityType: row.entityType as AuditTrailModel["entityType"],
    entityId: row.entityId,
    projectId: row.projectId ?? null,
    blindId: row.blindId ?? null,
    action: row.action,
    actorOpenId: row.actorOpenId ?? null,
    actorName: row.actorName ?? null,
    actorRoleKey: row.actorRoleKey ?? null,
    summary: row.summary,
    before: "beforeJson" in row && row.beforeJson ? safeParseJson(row.beforeJson) : (row as AuditTrailModel).before,
    after: "afterJson" in row && row.afterJson ? safeParseJson(row.afterJson) : (row as AuditTrailModel).after,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

function safeParseJson(value: string | null | undefined): unknown {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

async function createSystemNotification(input: Omit<NotificationModel, "id" | "createdAt" | "status"> & { status?: NotificationModel["status"] }): Promise<NotificationModel> {
  const model: NotificationModel = {
    id: makeId("notif"),
    status: input.status ?? "Unread",
    createdAt: new Date().toISOString(),
    ...input,
  };
  const db = await getDb();
  if (!db) {
    demoNotifications = [model, ...demoNotifications];
    return model;
  }
  await db.insert(notifications).values({
    userOpenId: model.userOpenId ?? null,
    type: model.type,
    title: model.title,
    message: model.message,
    relatedEntity: model.relatedEntity ?? null,
    relatedId: model.relatedId ?? null,
    actionUrl: model.actionUrl ?? null,
    severity: model.severity,
    status: model.status,
  });
  return model;
}

export async function recordAuditTrail(input: AuditRecordInput): Promise<AuditTrailModel> {
  const model: AuditTrailModel = {
    id: makeId("audit"),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const db = await getDb();
  if (!db) {
    demoAuditTrail = [model, ...demoAuditTrail];
    return model;
  }
  await db.insert(auditTrail).values({
    entityType: model.entityType,
    entityId: model.entityId,
    projectId: model.projectId ?? null,
    blindId: model.blindId ?? null,
    action: model.action,
    actorOpenId: model.actorOpenId ?? null,
    actorName: model.actorName ?? null,
    actorRoleKey: model.actorRoleKey ?? null,
    summary: model.summary,
    beforeJson: model.before === undefined ? null : JSON.stringify(model.before),
    afterJson: model.after === undefined ? null : JSON.stringify(model.after),
  });
  return model;
}

const operationalNotificationTypes = new Set([
  "Action",
  "Approval",
  "Certificate",
  "USER_PENDING_APPROVAL",
  "FINAL_APPROVAL_REQUIRED",
  "PHASE_ASSIGNED",
  "CERTIFICATE_ISSUED",
  "CERTIFICATE_LOCKED",
  "ADMIN_ANNOUNCEMENT",
  "APPROVAL_REJECTED",
  "RETURNED_FOR_CORRECTION",
]);

function isOperationalNotification(notification: NotificationModel) {
  return operationalNotificationTypes.has(notification.type) && notification.status !== "Archived";
}

export async function getNotificationInbox(): Promise<NotificationModel[]> {
  const db = await getDb();
  if (!db) {
    return [...demoNotifications]
      .filter(isOperationalNotification)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  const rows = await db.select().from(notifications).orderBy(asc(notifications.id));
  return rows.map(normalizeNotification).filter(isOperationalNotification).reverse();
}

export async function updateNotificationStatus(input: NotificationActionInput): Promise<NotificationModel> {
  const nextStatus: NotificationModel["status"] = input.action === "archive" ? "Archived" : input.action === "restore" ? "Unread" : "Read";
  const db = await getDb();
  if (!db) {
    const found = demoNotifications.find(item => String(item.id) === input.notificationId);
    if (!found) throw new Error("Notification was not found.");
    const updated = { ...found, status: nextStatus };
    demoNotifications = demoNotifications.map(item => String(item.id) === input.notificationId ? updated : item);
    demoAuditTrail = [{
      id: makeId("audit"),
      entityType: "Notification",
      entityId: input.notificationId,
      action: `Notification ${nextStatus.toLowerCase()}`,
      actorOpenId: "local-demo-user",
      actorName: "Local User",
      actorRoleKey: "admin",
      summary: `${found.title} marked as ${nextStatus}.`,
      createdAt: new Date().toISOString(),
    }, ...demoAuditTrail];
    return updated;
  }
  await db.update(notifications).set({ status: nextStatus }).where(eq(notifications.id, Number(input.notificationId)));
  await recordAuditTrail({
    entityType: "Notification",
    entityId: input.notificationId,
    action: `Notification ${nextStatus.toLowerCase()}`,
    actorOpenId: "local-demo-user",
    actorName: "Local User",
    actorRoleKey: "admin",
    summary: `Notification marked as ${nextStatus}.`,
  });
  const updated = (await getNotificationInbox()).find(item => String(item.id) === input.notificationId);
  if (!updated) throw new Error("Notification could not be read after update.");
  return updated;
}

export async function getAuditTrail(input?: { projectId?: string | null; blindId?: string | null; entityType?: string | null }): Promise<AuditTrailModel[]> {
  const db = await getDb();
  if (!db) {
    return demoAuditTrail
      .filter(item => !input?.projectId || item.projectId === input.projectId)
      .filter(item => !input?.blindId || item.blindId === input.blindId)
      .filter(item => !input?.entityType || item.entityType === input.entityType)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  const rows = await db.select().from(auditTrail).orderBy(asc(auditTrail.id));
  return rows.map(normalizeAudit)
    .filter(item => !input?.projectId || item.projectId === input.projectId)
    .filter(item => !input?.blindId || item.blindId === input.blindId)
    .filter(item => !input?.entityType || item.entityType === input.entityType)
    .reverse();
}

export async function recordTagPrint(input: { projectId?: string | null; blindId?: string | null; scope: "Project" | "Blind"; tagCount: number; }, actorOpenId?: string): Promise<AuditTrailModel> {
  const projectId = input.projectId ?? (input.blindId ? (await getBlindDetail(input.blindId))?.projectId : null) ?? null;
  const summary = input.scope === "Project"
    ? `${input.tagCount} QR tags printed/exported for project package.`
    : `Single QR tag printed/exported for blind.`;
  const audit = await recordAuditTrail({
    entityType: "Tag",
    entityId: input.scope === "Project" ? (projectId ?? "project-tags") : (input.blindId ?? "blind-tag"),
    projectId,
    blindId: input.blindId ?? null,
    action: input.scope === "Project" ? "Project tags printed" : "Blind tag printed",
    actorOpenId: actorOpenId ?? "local-demo-user",
    actorName: "Local User",
    actorRoleKey: "coordinator",
    summary,
    after: input,
  });
  await createSystemNotification({
    userOpenId: null,
    type: "Tag",
    title: input.scope === "Project" ? "Project tags printed" : "Blind tag printed",
    message: summary,
    relatedEntity: "Tag",
    relatedId: String(audit.entityId),
    actionUrl: projectId ? `/projects/${projectId}/tags` : input.blindId ? `/blinds/${input.blindId}/tag` : "/projects",
    severity: "success",
  });
  return audit;
}


export async function getReportCenter(input?: { projectId?: string | null }): Promise<ReportCenterModel> {
  const [projectsList, blindsList, approvalsList, torqueList, certificatesList, auditList] = await Promise.all([
    getProjectsCore(),
    getBlindsCore(),
    getPendingApprovalInbox(),
    getTorqueRecords(),
    getCertificates(),
    getAuditTrail(),
  ]);

  const scopedProjects = input?.projectId
    ? projectsList.filter(project => project.id === input.projectId)
    : projectsList;
  const scopedProjectIds = new Set(scopedProjects.map(project => project.id));
  const scopedBlinds = blindsList.filter(blind => scopedProjectIds.has(blind.projectId));
  const scopedApprovals = approvalsList.filter(item => scopedProjectIds.has(item.projectId));
  const scopedTorque = torqueList.filter(item => scopedProjectIds.has(item.projectId));
  const scopedCertificates = certificatesList.filter(item => scopedProjectIds.has(item.projectId));
  const scopedAudit = auditList.filter(item => !item.projectId || scopedProjectIds.has(item.projectId));
  const totalBlinds = scopedBlinds.length;
  const completedBlinds = scopedBlinds.filter(blind => blind.status === "Completed" || blind.currentPhaseKey === "inspectionReady").length;
  const today = new Date();
  const isDelayedProject = (project: ProjectModel) => Boolean(project.targetDate && new Date(project.targetDate) < today && project.progress < 100);

  const projectProgress = scopedProjects.map(project => {
    const projectBlinds = scopedBlinds.filter(blind => blind.projectId === project.id);
    const completedCount = projectBlinds.filter(blind => blind.status === "Completed" || blind.currentPhaseKey === "inspectionReady").length;
    const pendingApprovalCount = projectBlinds.filter(blind => blind.status === "Pending Approval" || blind.currentPhaseKey === "finalTight").length;
    return {
      projectId: project.id,
      projectNo: project.projectNo,
      projectName: project.name,
      areaCode: project.areaCode,
      progress: project.progress,
      status: project.status,
      blindCount: projectBlinds.length,
      completedCount,
      pendingApprovalCount,
      targetDate: project.targetDate,
    };
  });

  const areaMap = new Map<string, { areaId: string; areaCode: string; areaName: string; projectIds: Set<string>; blinds: BlindModel[] }>();
  scopedProjects.forEach(project => {
    const item = areaMap.get(project.areaId) ?? { areaId: project.areaId, areaCode: project.areaCode, areaName: project.areaName, projectIds: new Set<string>(), blinds: [] };
    item.projectIds.add(project.id);
    areaMap.set(project.areaId, item);
  });
  scopedBlinds.forEach(blind => {
    const project = scopedProjects.find(item => item.id === blind.projectId);
    if (!project) return;
    const area = areaMap.get(project.areaId);
    if (area) area.blinds.push(blind);
  });

  const areaPerformance = Array.from(areaMap.values()).map(area => {
    const blindCount = area.blinds.length;
    const completed = area.blinds.filter(blind => blind.status === "Completed" || blind.currentPhaseKey === "inspectionReady").length;
    return {
      areaId: area.areaId,
      areaCode: area.areaCode,
      areaName: area.areaName,
      projectCount: area.projectIds.size,
      blindCount,
      completionPercent: blindCount ? Math.round((completed / blindCount) * 100) : 0,
      pendingApprovalCount: area.blinds.filter(blind => blind.status === "Pending Approval" || blind.currentPhaseKey === "finalTight").length,
    };
  });

  const phaseBreakdown = (Object.keys(phaseDictionary) as PhaseKey[]).map(phaseKey => {
    const count = scopedBlinds.filter(blind => blind.currentPhaseKey === phaseKey).length;
    return {
      phaseKey,
      phaseLabel: phaseDictionary[phaseKey].label,
      owner: phaseDictionary[phaseKey].owner,
      count,
      percent: totalBlinds ? Math.round((count / totalBlinds) * 100) : 0,
    };
  });

  const rows = scopedBlinds.map(blind => {
    const project = projectsList.find(item => item.id === blind.projectId);
    return {
      blindId: blind.id,
      projectId: blind.projectId,
      projectNo: project?.projectNo ?? "N/A",
      projectName: blind.projectName,
      areaCode: blind.areaCode,
      tagNo: blind.tagNo,
      blindNo: blind.blindNo,
      lineNo: blind.lineNo,
      size: blind.size,
      rating: blind.rating,
      blindType: blind.blindType,
      phaseLabel: blind.phaseLabel,
      status: blind.status,
      priority: blind.priority,
    };
  });

  const scopeProject = input?.projectId ? scopedProjects[0] : null;
  return {
    generatedAt: new Date().toISOString(),
    scope: {
      projectId: input?.projectId ?? null,
      projectName: scopeProject?.name ?? "All Projects",
      label: scopeProject ? `${scopeProject.projectNo} • ${scopeProject.name}` : "Enterprise SBTS Overview",
    },
    kpis: {
      totalProjects: scopedProjects.length,
      totalBlinds,
      completedBlinds,
      inProgressBlinds: scopedBlinds.filter(blind => blind.status === "In Progress").length,
      pendingApprovals: scopedApprovals.filter(item => item.status === "Pending").length,
      torqueRecords: scopedTorque.length,
      certificatesIssued: scopedCertificates.filter(item => item.status === "Issued" || item.status === "Printed").length,
      tagsPrinted: scopedAudit.filter(item => item.entityType === "Tag" && item.action.includes("print")).length,
      completionPercent: totalBlinds ? Math.round((completedBlinds / totalBlinds) * 100) : 0,
      delayedProjects: scopedProjects.filter(isDelayedProject).length,
    },
    projectProgress,
    areaPerformance,
    phaseBreakdown,
    exportPackages: [
      { id: "blind-register", title: "Blind Register", description: "Operational list of all blinds with phase, project, area, size, rating, status, and priority.", format: "CSV", rowCount: rows.length, recommendedFor: "Daily field coordination" },
      { id: "management-summary", title: "Management Summary", description: "KPI snapshot for projects, completion, pending approvals, torque records, and certificates.", format: "CSV", rowCount: projectProgress.length, recommendedFor: "Weekly management update" },
      { id: "area-performance", title: "Area Performance", description: "Area-level readiness, blind counts, project counts, and pending approvals.", format: "CSV", rowCount: areaPerformance.length, recommendedFor: "Area owner review" },
      { id: "phase-breakdown", title: "Phase Breakdown", description: "Workflow phase distribution across the selected scope.", format: "CSV", rowCount: phaseBreakdown.length, recommendedFor: "Workflow control review" },
    ],
    rows,
  };
}

export async function recordReportExport(input: { projectId?: string | null; packageName: string; fileType: "CSV" | "PDF" | "Excel" | "PowerPoint" | "Print"; rowCount: number }, actorOpenId: string): Promise<{ success: true }> {
  await recordAuditTrail({
    entityType: "Project",
    entityId: input.projectId ?? "all-projects",
    projectId: input.projectId ?? null,
    action: "report.export",
    actorOpenId,
    actorName: "Report Center",
    actorRoleKey: "coordinator",
    summary: `${input.packageName} exported as ${input.fileType} with ${input.rowCount} rows.`,
    after: input,
  });
  demoNotifications = [{
    id: makeId("notif"),
    userOpenId: null,
    type: "System",
    title: "Report exported",
    message: `${input.packageName} package generated from Reports & Export Center.`,
    relatedEntity: "Project",
    relatedId: input.projectId ?? null,
    actionUrl: input.projectId ? `/projects/${input.projectId}` : "/reports",
    severity: "success",
    status: "Unread",
    createdAt: new Date().toISOString(),
  }, ...demoNotifications];
  return { success: true };
}

export async function getDashboardSummary(): Promise<DashboardSummaryModel> {
  const [areaList, projectList, blindList] = await Promise.all([
    getAreas(),
    getProjectsCore(),
    getBlindsCore(),
  ]);
  const completedBlinds = blindList.filter(
    blind =>
      blind.status === "Completed" ||
      blind.currentPhaseKey === "inspectionReady"
  ).length;
  const totalBlinds = blindList.length;
  const phaseCounts = (Object.keys(phaseDictionary) as PhaseKey[]).map(key => ({
    key,
    label: phaseDictionary[key].label,
    owner: phaseDictionary[key].owner,
    color: phaseDictionary[key].color,
    count: blindList.filter(blind => blind.currentPhaseKey === key).length,
  }));

  return {
    totalAreas: areaList.length,
    totalProjects: projectList.length,
    totalBlinds,
    completedBlinds,
    inProgressBlinds: blindList.filter(blind => blind.status === "In Progress")
      .length,
    pendingApprovalBlinds: blindList.filter(
      blind => blind.status === "Pending Approval"
    ).length,
    highPriorityBlinds: blindList.filter(
      blind => blind.priority === "High" || blind.priority === "Critical"
    ).length,
    completionPercent:
      totalBlinds > 0 ? Math.round((completedBlinds / totalBlinds) * 100) : 0,
    phaseCounts,
  };
}
