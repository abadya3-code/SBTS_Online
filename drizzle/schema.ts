import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workflowStatusEnum = mysqlEnum("status", ["Draft", "Active", "Locked"]);
export const workflowPhaseKeyEnum = mysqlEnum("phaseKey", ["broken", "assembly", "tightTorque", "finalTight", "inspectionReady"]);

/**
 * Sprint 1 domain enums.
 * These keep the operational SBTS language consistent across DB, API, and UI.
 */
export const areaStatusEnum = mysqlEnum("areaStatus", ["Active", "Standby", "Closed"]);
export const projectStatusEnum = mysqlEnum("projectStatus", ["Planning", "Active", "Final Review", "Completed", "On Hold"]);
export const blindStatusEnum = mysqlEnum("blindStatus", ["Open", "In Progress", "Pending Approval", "Completed", "Archived"]);
export const blindPriorityEnum = mysqlEnum("blindPriority", ["Low", "Normal", "High", "Critical"]);
export const approvalStatusEnum = mysqlEnum("approvalStatus", ["Pending", "Approved", "Rejected", "Skipped"]);
export const notificationStatusEnum = mysqlEnum("notificationStatus", ["Unread", "Read", "Archived"]);

/**
 * Central permission catalog used by Access Control and Workflow Studio.
 */
export const accessPermissions = mysqlTable("access_permissions", {
  key: varchar("key", { length: 120 }).primaryKey(),
  label: varchar("label", { length: 180 }).notNull(),
  description: text("description").notNull(),
  group: varchar("group", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Central role catalog. JSON fields keep UI menu and workflow phase ownership explicit.
 */
export const accessRoles = mysqlTable("access_roles", {
  key: varchar("key", { length: 80 }).primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  subtitle: text("subtitle").notNull(),
  members: int("members").default(0).notNull(),
  color: varchar("color", { length: 24 }).notNull(),
  menuKeysJson: text("menuKeysJson").notNull(),
  phaseKeysJson: text("phaseKeysJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Many-to-many role permission assignments.
 */
export const accessRolePermissions = mysqlTable("access_role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleKey: varchar("roleKey", { length: 80 })
    .notNull()
    .references(() => accessRoles.key),
  permissionKey: varchar("permissionKey", { length: 120 })
    .notNull()
    .references(() => accessPermissions.key),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Sprint 3: Employee directory used by Phase Task Assignment and backend gates.
 * Photos are stored as URL/path strings so the UI can show profile avatars now and
 * later point to company identity/SAP/AD profile photos.
 */
export const employees = mysqlTable("employees", {
  id: varchar("id", { length: 64 }).primaryKey(),
  badge: varchar("badge", { length: 80 }).notNull().unique(),
  fullName: varchar("fullName", { length: 180 }).notNull(),
  roleKey: varchar("roleKey", { length: 80 }).notNull(),
  specialty: varchar("specialty", { length: 180 }).notNull(),
  department: varchar("department", { length: 140 }).notNull(),
  shift: varchar("shift", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).default("Active").notNull(),
  photoUrl: varchar("photoUrl", { length: 420 }),
  initials: varchar("initials", { length: 8 }).notNull(),
  isCertified: int("isCertified").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Sprint 10: Production-ready session binding table.
 * Demo mode stores the session in browser localStorage, while production can bind
 * the active web session to employee badge, role, provider, and expiry metadata.
 */
export const sbtsAuthSessions = mysqlTable("sbts_auth_sessions", {
  id: varchar("id", { length: 96 }).primaryKey(),
  employeeId: varchar("employeeId", { length: 64 }).notNull(),
  badge: varchar("badge", { length: 80 }).notNull(),
  roleKey: varchar("roleKey", { length: 80 }).notNull(),
  loginMethod: varchar("loginMethod", { length: 80 }).default("production-bound").notNull(),
  provider: varchar("provider", { length: 160 }).default("SBTS Employee Directory").notNull(),
  ipAddress: varchar("ipAddress", { length: 80 }),
  userAgent: text("userAgent"),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  revokedAt: timestamp("revokedAt"),
  revokeReason: varchar("revokeReason", { length: 255 }),
});

/**
 * Sprint 1: Areas are the operational boundary for project scope, reports, and user visibility.
 */
export const areas = mysqlTable("areas", {
  id: varchar("id", { length: 48 }).primaryKey(),
  code: varchar("code", { length: 48 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  plant: varchar("plant", { length: 180 }).notNull(),
  ownerRoleKey: varchar("ownerRoleKey", { length: 80 }).notNull(),
  description: text("description"),
  status: areaStatusEnum.default("Active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Sprint 1: Projects are containers for blinds, workflows, approvals, and certificates.
 */
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 48 }).primaryKey(),
  projectNo: varchar("projectNo", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 220 }).notNull(),
  areaId: varchar("areaId", { length: 48 })
    .notNull()
    .references(() => areas.id),
  workflowId: varchar("workflowId", { length: 96 }).references(() => workflowTemplates.id),
  status: projectStatusEnum.default("Planning").notNull(),
  progress: int("progress").default(0).notNull(),
  startDate: date("startDate"),
  targetDate: date("targetDate"),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Sprint 3: Project-level phase assignment gate.
 * Every phase in a project has one authorized role plus a selected list of
 * employee badge/signature IDs. Backend validates phase updates against this table.
 */
export const projectPhaseAssignments = mysqlTable("project_phase_assignments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 48 })
    .notNull()
    .references(() => projects.id),
  phaseKey: workflowPhaseKeyEnum.notNull(),
  roleKey: varchar("roleKey", { length: 80 }).notNull(),
  authorizedEmployeeBadgesJson: text("authorizedEmployeeBadgesJson").notNull(),
  note: text("note"),
  assignedByOpenId: varchar("assignedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Workflow template header. A template represents one reusable operational route.
 * Role and permission enforcement is held at phase level so every task owner remains traceable.
 */
export const workflowTemplates = mysqlTable("workflow_templates", {
  id: varchar("id", { length: 96 }).primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").notNull(),
  status: workflowStatusEnum.default("Draft").notNull(),
  projectType: varchar("projectType", { length: 120 }).notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Workflow phase detail. roleKey and requiredPermissionKey deliberately mirror the centralized
 * access-control model, allowing the frontend to verify RBAC alignment and the backend to persist it.
 */
export const workflowPhases = mysqlTable("workflow_phases", {
  id: varchar("id", { length: 120 }).primaryKey(),
  workflowId: varchar("workflowId", { length: 96 })
    .notNull()
    .references(() => workflowTemplates.id),
  sortOrder: int("sortOrder").notNull(),
  label: varchar("label", { length: 220 }).notNull(),
  phaseKey: workflowPhaseKeyEnum.notNull(),
  roleKey: varchar("roleKey", { length: 80 }).notNull(),
  requiredPermissionKey: varchar("requiredPermissionKey", { length: 120 }).notNull(),
  gate: text("gate").notNull(),
  slaHours: int("slaHours").notNull(),
  evidenceJson: text("evidenceJson").notNull(),
  automation: text("automation").notNull(),
  color: varchar("color", { length: 24 }).notNull(),
  isCritical: int("isCritical").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Sprint 1: The main blind registry table.
 */
export const blinds = mysqlTable("blinds", {
  id: varchar("id", { length: 48 }).primaryKey(),
  blindNo: varchar("blindNo", { length: 80 }).notNull().unique(),
  tagNo: varchar("tagNo", { length: 80 }).notNull().unique(),
  projectId: varchar("projectId", { length: 48 })
    .notNull()
    .references(() => projects.id),
  areaId: varchar("areaId", { length: 48 })
    .notNull()
    .references(() => areas.id),
  lineNo: varchar("lineNo", { length: 120 }).notNull(),
  size: varchar("size", { length: 60 }).notNull(),
  rating: varchar("rating", { length: 80 }),
  blindType: varchar("blindType", { length: 120 }).notNull(),
  currentPhaseKey: workflowPhaseKeyEnum.notNull(),
  ownerRoleKey: varchar("ownerRoleKey", { length: 80 }).notNull(),
  status: blindStatusEnum.default("Open").notNull(),
  priority: blindPriorityEnum.default("Normal").notNull(),
  qrCode: varchar("qrCode", { length: 260 }).notNull(),
  locationNote: text("locationNote"),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const blindWorkflowLogs = mysqlTable("blind_workflow_logs", {
  id: int("id").autoincrement().primaryKey(),
  blindId: varchar("blindId", { length: 48 })
    .notNull()
    .references(() => blinds.id),
  fromPhaseKey: varchar("fromPhaseKey", { length: 80 }),
  toPhaseKey: varchar("toPhaseKey", { length: 80 }).notNull(),
  action: varchar("action", { length: 160 }).notNull(),
  actorOpenId: varchar("actorOpenId", { length: 64 }),
  actorRoleKey: varchar("actorRoleKey", { length: 80 }),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  blindId: varchar("blindId", { length: 48 })
    .notNull()
    .references(() => blinds.id),
  phaseKey: workflowPhaseKeyEnum.notNull(),
  requiredRoleKey: varchar("requiredRoleKey", { length: 80 }).notNull(),
  approvedByOpenId: varchar("approvedByOpenId", { length: 64 }),
  status: approvalStatusEnum.default("Pending").notNull(),
  remarks: text("remarks"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const torqueRecords = mysqlTable("torque_records", {
  id: int("id").autoincrement().primaryKey(),
  blindId: varchar("blindId", { length: 48 })
    .notNull()
    .references(() => blinds.id),
  phaseKey: workflowPhaseKeyEnum.notNull(),
  machineType: varchar("machineType", { length: 80 }).notNull(),
  psiValue: int("psiValue").notNull(),
  technicianOpenId: varchar("technicianOpenId", { length: 64 }),
  technicianBadge: varchar("technicianBadge", { length: 80 }),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  blindId: varchar("blindId", { length: 48 })
    .notNull()
    .references(() => blinds.id),
  certificateNo: varchar("certificateNo", { length: 100 }).notNull().unique(),
  certificateType: varchar("certificateType", { length: 80 }).default("Blind Completion").notNull(),
  revision: int("revision").default(1).notNull(),
  templateVersion: varchar("templateVersion", { length: 40 }).default("SBTS-CERT-V1").notNull(),
  qrValue: varchar("qrValue", { length: 500 }),
  blindSnapshotJson: text("blindSnapshotJson"),
  torqueSnapshotJson: text("torqueSnapshotJson"),
  approvalSnapshotJson: text("approvalSnapshotJson"),
  workflowSnapshotJson: text("workflowSnapshotJson"),
  issuedByOpenId: varchar("issuedByOpenId", { length: 64 }),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  status: varchar("status", { length: 80 }).default("Draft").notNull(),
  printCount: int("printCount").default(0).notNull(),
  issuedAt: timestamp("issuedAt"),
  lastPrintedAt: timestamp("lastPrintedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tagDesignerSettings = mysqlTable("tag_designer_settings", {
  id: int("id").autoincrement().primaryKey(),
  scopeType: varchar("scopeType", { length: 40 }).default("Global").notNull(),
  projectId: varchar("projectId", { length: 48 }).references(() => projects.id),
  templateName: varchar("templateName", { length: 120 }).default("SBTS Standard Site Tag").notNull(),
  tagWidthCm: int("tagWidthCm").default(11).notNull(),
  tagHeightCm: int("tagHeightCm").default(7).notNull(),
  tagColor: varchar("tagColor", { length: 24 }).default("#ffffff").notNull(),
  accentColor: varchar("accentColor", { length: 24 }).default("#0891b2").notNull(),
  textColor: varchar("textColor", { length: 24 }).default("#0f172a").notNull(),
  logoText: varchar("logoText", { length: 160 }).default("Smart Blind Tag System").notNull(),
  showLogo: int("showLogo").default(1).notNull(),
  showHole: int("showHole").default(1).notNull(),
  showStatus: int("showStatus").default(1).notNull(),
  showProjectNo: int("showProjectNo").default(1).notNull(),
  showLocationNote: int("showLocationNote").default(0).notNull(),
  qrSizePx: int("qrSizePx").default(132).notNull(),
  fontScale: int("fontScale").default(100).notNull(),
  layoutMode: varchar("layoutMode", { length: 60 }).default("Operational Split").notNull(),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userOpenId: varchar("userOpenId", { length: 64 }),
  type: varchar("type", { length: 80 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  message: text("message").notNull(),
  relatedEntity: varchar("relatedEntity", { length: 80 }),
  relatedId: varchar("relatedId", { length: 120 }),
  actionUrl: varchar("actionUrl", { length: 500 }),
  severity: varchar("severity", { length: 40 }).default("info").notNull(),
  status: notificationStatusEnum.default("Unread").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditTrail = mysqlTable("audit_trail", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 120 }).notNull(),
  projectId: varchar("projectId", { length: 48 }),
  blindId: varchar("blindId", { length: 48 }),
  action: varchar("action", { length: 160 }).notNull(),
  actorOpenId: varchar("actorOpenId", { length: 64 }),
  actorName: varchar("actorName", { length: 180 }),
  actorRoleKey: varchar("actorRoleKey", { length: 80 }),
  summary: text("summary").notNull(),
  beforeJson: text("beforeJson"),
  afterJson: text("afterJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Sprint 10.1: System-level settings center.
 * Store strongly typed configuration as JSON by category so the platform can evolve
 * without forcing a migration for every new toggle, while the API still validates shape.
 */
export const systemSettings = mysqlTable("system_settings", {
  key: varchar("key", { length: 120 }).primaryKey(),
  category: varchar("category", { length: 80 }).notNull(),
  valueJson: text("valueJson").notNull(),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


/**
 * Sprint 11: Production persistence metadata.
 * These tables prepare the MVP for database-backed operation without forcing
 * Asset Hierarchy into the user workflow yet.
 */
export const sbtsSchemaVersions = mysqlTable("sbts_schema_versions", {
  id: int("id").autoincrement().primaryKey(),
  version: varchar("version", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 220 }).notNull(),
  appliedByOpenId: varchar("appliedByOpenId", { length: 64 }),
  notes: text("notes"),
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
});

export const fileUploads = mysqlTable("file_uploads", {
  id: varchar("id", { length: 96 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 120 }).notNull(),
  purpose: varchar("purpose", { length: 120 }).notNull(),
  fileName: varchar("fileName", { length: 260 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").default(0).notNull(),
  storageKey: varchar("storageKey", { length: 500 }),
  publicUrl: varchar("publicUrl", { length: 500 }),
  dataUrlPreview: text("dataUrlPreview"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userPreferences = mysqlTable("user_preferences", {
  openId: varchar("openId", { length: 64 }).primaryKey(),
  employeeId: varchar("employeeId", { length: 64 }),
  displayName: varchar("displayName", { length: 180 }),
  recoveryEmail: varchar("recoveryEmail", { length: 320 }),
  specialtyDescription: text("specialtyDescription"),
  avatarUploadId: varchar("avatarUploadId", { length: 96 }),
  avatarDataUrl: text("avatarDataUrl"),
  themePreferenceMode: varchar("themePreferenceMode", { length: 40 }).default("system").notNull(),
  themeTemplate: varchar("themeTemplate", { length: 80 }).default("Template 1").notNull(),
  customAccentColor: varchar("customAccentColor", { length: 24 }).default("#0891b2").notNull(),
  interfaceThemeMode: varchar("interfaceThemeMode", { length: 20 }).default("system").notNull(),
  commandSearchEnabled: int("commandSearchEnabled").default(1).notNull(),
  keyboardShortcutsEnabled: int("keyboardShortcutsEnabled").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const productionPersistenceEvents = mysqlTable("production_persistence_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  domain: varchar("domain", { length: 100 }).notNull(),
  status: varchar("status", { length: 40 }).default("Info").notNull(),
  priority: varchar("priority", { length: 32 }).default("normal").notNull(),
  summary: text("summary").notNull(),
  metadataJson: text("metadataJson"),
  actorOpenId: varchar("actorOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});



/**
 * Sprint 12: Real authentication foundation.
 * Passwords are stored as salted hashes, sessions are server-side, and reset
 * tokens are represented for a future email flow.
 */
export const authPasswordCredentials = mysqlTable("auth_password_credentials", {
  id: varchar("id", { length: 96 }).primaryKey(),
  employeeId: varchar("employeeId", { length: 64 }).notNull(),
  username: varchar("username", { length: 120 }).notNull().unique(),
  recoveryEmail: varchar("recoveryEmail", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 500 }).notNull(),
  passwordSalt: varchar("passwordSalt", { length: 160 }).notNull(),
  passwordAlgorithm: varchar("passwordAlgorithm", { length: 80 }).default("scrypt-sha256").notNull(),
  status: varchar("status", { length: 40 }).default("Active").notNull(),
  mustChangePassword: int("mustChangePassword").default(0).notNull(),
  failedAttempts: int("failedAttempts").default(0).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const authPasswordResetTokens = mysqlTable("auth_password_reset_tokens", {
  id: varchar("id", { length: 96 }).primaryKey(),
  credentialId: varchar("credentialId", { length: 96 }).notNull(),
  tokenHash: varchar("tokenHash", { length: 500 }).notNull(),
  recoveryEmail: varchar("recoveryEmail", { length: 320 }).notNull(),
  status: varchar("status", { length: 40 }).default("Pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  usedAt: timestamp("usedAt"),
});

export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 40 }).default("info").notNull(),
  actorOpenId: varchar("actorOpenId", { length: 64 }),
  employeeId: varchar("employeeId", { length: 64 }),
  badge: varchar("badge", { length: 80 }),
  roleKey: varchar("roleKey", { length: 80 }),
  ipAddress: varchar("ipAddress", { length: 80 }),
  userAgent: text("userAgent"),
  summary: text("summary").notNull(),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});



/**
 * Sprint 13: Approval profile catalog and certificate lock traceability.
 * Settings still remain the friendly admin UI, while these tables prepare
 * production storage for per-blind-type approval governance.
 */
export const approvalProfiles = mysqlTable("approval_profiles", {
  id: varchar("id", { length: 96 }).primaryKey(),
  blindType: varchar("blindType", { length: 120 }).notNull().unique(),
  requireAll: int("requireAll").default(1).notNull(),
  unlockCertificate: int("unlockCertificate").default(1).notNull(),
  status: varchar("status", { length: 40 }).default("Active").notNull(),
  updatedByOpenId: varchar("updatedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const approvalProfileApprovers = mysqlTable("approval_profile_approvers", {
  id: int("id").autoincrement().primaryKey(),
  profileId: varchar("profileId", { length: 96 }).notNull(),
  approverLabel: varchar("approverLabel", { length: 160 }).notNull(),
  roleKey: varchar("roleKey", { length: 80 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isRequired: int("isRequired").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const certificateLockEvents = mysqlTable("certificate_lock_events", {
  id: int("id").autoincrement().primaryKey(),
  blindId: varchar("blindId", { length: 48 }).notNull(),
  lockStatus: varchar("lockStatus", { length: 40 }).notNull(),
  reason: text("reason").notNull(),
  missingApproversJson: text("missingApproversJson"),
  checkedByOpenId: varchar("checkedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AccessPermissionRow = typeof accessPermissions.$inferSelect;
export type InsertAccessPermission = typeof accessPermissions.$inferInsert;
export type AccessRoleRow = typeof accessRoles.$inferSelect;
export type InsertAccessRole = typeof accessRoles.$inferInsert;
export type AccessRolePermissionRow = typeof accessRolePermissions.$inferSelect;
export type InsertAccessRolePermission = typeof accessRolePermissions.$inferInsert;
export type AreaRow = typeof areas.$inferSelect;
export type InsertArea = typeof areas.$inferInsert;
export type ProjectRow = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type BlindRow = typeof blinds.$inferSelect;
export type InsertBlind = typeof blinds.$inferInsert;
export type WorkflowTemplateRow = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplates.$inferInsert;
export type WorkflowPhaseRow = typeof workflowPhases.$inferSelect;
export type InsertWorkflowPhase = typeof workflowPhases.$inferInsert;
export type BlindWorkflowLogRow = typeof blindWorkflowLogs.$inferSelect;
export type ApprovalRow = typeof approvals.$inferSelect;
export type TorqueRecordRow = typeof torqueRecords.$inferSelect;
export type CertificateRow = typeof certificates.$inferSelect;
export type TagDesignerSettingsRow = typeof tagDesignerSettings.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
export type AuditTrailRow = typeof auditTrail.$inferSelect;
export type SystemSettingsRow = typeof systemSettings.$inferSelect;
export type SbtsSchemaVersionRow = typeof sbtsSchemaVersions.$inferSelect;
export type FileUploadRow = typeof fileUploads.$inferSelect;
export type UserPreferenceRow = typeof userPreferences.$inferSelect;
export type ProductionPersistenceEventRow = typeof productionPersistenceEvents.$inferSelect;
export type AuthPasswordCredentialRow = typeof authPasswordCredentials.$inferSelect;
export type AuthPasswordResetTokenRow = typeof authPasswordResetTokens.$inferSelect;
export type SecurityEventRow = typeof securityEvents.$inferSelect;
export type ApprovalProfileRow = typeof approvalProfiles.$inferSelect;
export type ApprovalProfileApproverRow = typeof approvalProfileApprovers.$inferSelect;
export type CertificateLockEventRow = typeof certificateLockEvents.$inferSelect;
