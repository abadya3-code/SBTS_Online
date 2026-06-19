import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import type { AuthSessionUser } from "./_core/context";
import { getRuntimeMonitoringSnapshot } from "./_core/observability";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
  coordinatorProcedure,
  supervisorProcedure,
} from "./_core/trpc";
import {
  requireActiveUser,
  requireAdmin,
  requireAreaAccess,
  requireCertificateUnlocked,
  requirePermission,
  requirePhaseAuthorization,
  requirePhaseSignatureBinding,
  requireProjectAccess,
} from "./security/permissionGuard";
import {
  deleteWorkflow,
  getAccessControlModel,
  saveAccessRoleModel,
  getAllWorkflows,
  getWorkflowById,
  upsertWorkflow,
  getAreas,
  getProjectsCore,
  getBlindsCore,
  getDashboardSummary,
  createArea,
  updateArea,
  deleteArea,
  createProject,
  updateProject,
  deleteProject,
  createBlind,
  getBlindDetail,
  moveBlindPhase,
  getEmployees,
  getProjectPhaseAssignments,
  saveProjectPhaseAssignments,
  getPhaseGatePreview,
  getApprovalCenter,
  getPendingApprovalInbox,
  approveWorkflowRequest,
  getTorqueRecords,
  getCertificates,
  issueCertificate,
  getTagDesignerSettings,
  saveTagDesignerSettings,
  getNotificationInbox,
  updateNotificationStatus,
  getAuditTrail,
  recordTagPrint,
  getReportCenter,
  recordReportExport,
  getUserManagement,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  authenticateEmployeeSession,
  registerPasswordCredential,
  createEmployeeWithCredential,
  authenticatePasswordUser,
  requestPasswordReset,
  revokeAuthSession,
  getSystemSettings,
  saveSystemSettings,
  getProductionPersistenceStatus,
  getObservabilityDatabaseSnapshot,
  getApprovalProfiles,
  getCertificateLockStatus,
  getBlindMutationLockStatus,
  getUserPreferences,
  saveUserPreferences,
} from "./db";

const workflowPhaseSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(220),
  phaseKey: z.enum([
    "broken",
    "assembly",
    "tightTorque",
    "finalTight",
    "inspectionReady",
  ]),
  roleKey: z.enum([
    "admin",
    "coordinator",
    "technician",
    "qc",
    "safety",
    "inspection",
    "tiEngineer",
    "metalForeman",
  ]),
  requiredPermissionKey: z.string().min(1).max(120),
  gate: z.string().min(1),
  slaHours: z.number().int().min(0).max(8760),
  evidence: z.array(z.string().min(1).max(120)).default([]),
  automation: z.string().min(1),
  color: z.string().min(3).max(24),
  isCritical: z.boolean(),
});

const workflowTemplateSchema = z.object({
  id: z.string().min(1).max(96),
  name: z.string().min(1).max(180),
  description: z.string().min(1),
  status: z.enum(["Draft", "Active", "Locked"]),
  projectType: z.string().min(1).max(120),
  version: z.string().min(1).max(32),
  phases: z.array(workflowPhaseSchema).min(1),
});

const roleKeySchema = z.enum([
  "admin",
  "coordinator",
  "technician",
  "qc",
  "safety",
  "inspection",
  "tiEngineer",
  "metalForeman",
]);
const employeeStatusSchema = z.enum([
  "Pending",
  "Active",
  "Standby",
  "Unavailable",
  "Rejected",
  "Disabled",
]);
const passwordSchema = z
  .string()
  .min(10)
  .max(160)
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number");
const usernameSchema = z
  .string()
  .min(3)
  .max(120)
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Use letters, numbers, dot, underscore, or dash only"
  );
const areaStatusSchema = z.enum(["Active", "Standby", "Closed"]);
const projectStatusSchema = z.enum([
  "Planning",
  "Active",
  "Final Review",
  "Completed",
  "On Hold",
]);
const blindStatusSchema = z.enum([
  "Open",
  "In Progress",
  "Pending Approval",
  "Completed",
  "Archived",
]);
const blindPrioritySchema = z.enum(["Low", "Normal", "High", "Critical"]);
const phaseKeySchema = z.enum([
  "broken",
  "assembly",
  "tightTorque",
  "finalTight",
  "inspectionReady",
]);

const routerPhaseMeta: Record<
  z.infer<typeof phaseKeySchema>,
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

const accessRoleModelSaveSchema = z.object({
  roleKey: roleKeySchema,
  permissionKeys: z.array(z.string().min(1).max(120)).default([]),
  menuKeys: z.array(z.string().min(1).max(120)).default([]),
  phaseKeys: z.array(phaseKeySchema).default([]),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(10).max(100).default(25),
  search: z.string().max(120).optional().nullable(),
});

function paginateRows<T>(rows: T[], input: z.infer<typeof paginationSchema>) {
  const start = (input.page - 1) * input.limit;
  return {
    rows: rows.slice(start, start + input.limit),
    total: rows.length,
    page: input.page,
    limit: input.limit,
    totalPages: Math.max(1, Math.ceil(rows.length / input.limit)),
  };
}

function textMatches(row: unknown, search?: string | null) {
  if (!search) return true;
  const haystack = JSON.stringify(row).toLowerCase();
  return haystack.includes(search.toLowerCase());
}

type RouterUserContext = { user: AuthSessionUser | null };

function isAdminContext(ctx: RouterUserContext) {
  return ctx.user?.roleKey === "admin" || ctx.user?.role === "admin";
}

function scopedAreasForUser<T extends { id: string }>(
  ctx: RouterUserContext,
  rows: T[]
) {
  if (isAdminContext(ctx)) return rows;
  const areaIds = new Set<string>(ctx.user?.areaIds ?? []);
  return rows.filter(row => areaIds.has(row.id));
}

function scopedProjectsForUser<
  T extends { id: string; areaId?: string | null },
>(ctx: RouterUserContext, rows: T[]) {
  if (isAdminContext(ctx)) return rows;
  const projectIds = new Set<string>(ctx.user?.projectIds ?? []);
  const areaIds = new Set<string>(ctx.user?.areaIds ?? []);
  return rows.filter(
    row =>
      projectIds.has(row.id) || (row.areaId ? areaIds.has(row.areaId) : false)
  );
}

function scopedBlindsForUser<
  T extends { projectId: string; areaId?: string | null },
>(ctx: RouterUserContext, rows: T[]) {
  if (isAdminContext(ctx)) return rows;
  const projectIds = new Set<string>(ctx.user?.projectIds ?? []);
  const areaIds = new Set<string>(ctx.user?.areaIds ?? []);
  return rows.filter(
    row =>
      projectIds.has(row.projectId) ||
      (row.areaId ? areaIds.has(row.areaId) : false)
  );
}

function scopedRecordsForUser<
  T extends { projectId?: string | null; areaId?: string | null },
>(ctx: RouterUserContext, rows: T[]) {
  if (isAdminContext(ctx)) return rows;
  const projectIds = new Set<string>(ctx.user?.projectIds ?? []);
  const areaIds = new Set<string>(ctx.user?.areaIds ?? []);
  return rows.filter(row => {
    if (row.projectId && projectIds.has(row.projectId)) return true;
    if (row.areaId && areaIds.has(row.areaId)) return true;
    return false;
  });
}

const certificateStatusSchema = z.enum(["Draft", "Issued", "Printed"]);
const tagLayoutModeSchema = z.enum([
  "Operational Split",
  "Compact Field",
  "Large QR",
]);
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Use HEX color like #0891b2");

const employeeInputSchema = z.object({
  badge: z.string().min(2).max(80),
  fullName: z.string().min(2).max(180),
  roleKey: roleKeySchema,
  specialty: z.string().min(2).max(180),
  department: z.string().min(2).max(140),
  shift: z.string().min(1).max(80),
  status: employeeStatusSchema.default("Active"),
  photoUrl: z.string().max(420).optional().nullable(),
  isCertified: z.boolean().optional(),
});

const tagDesignerSettingsSchema = z.object({
  scopeType: z.enum(["Global", "Project"]),
  projectId: z.string().max(48).optional().nullable(),
  templateName: z.string().min(2).max(120),
  tagWidthCm: z.coerce.number().min(5).max(30),
  tagHeightCm: z.coerce.number().min(4).max(30),
  tagColor: hexColorSchema,
  accentColor: hexColorSchema,
  textColor: hexColorSchema,
  logoText: z.string().min(2).max(160),
  showLogo: z.boolean(),
  showHole: z.boolean(),
  showStatus: z.boolean(),
  showProjectNo: z.boolean(),
  showLocationNote: z.boolean(),
  qrSizePx: z.number().int().min(72).max(260),
  fontScale: z.number().int().min(80).max(140),
  layoutMode: tagLayoutModeSchema,
});

const interfaceThemeModeSchema = z.enum(["light", "dark", "system"]);
const themePreferenceModeSchema = z.enum(["system", "personal"]);

const userPreferencesSchema = z.object({
  displayName: z.string().max(180).optional().nullable(),
  recoveryEmail: z.string().email().max(320).optional().nullable().or(z.literal("")),
  specialtyDescription: z.string().max(2000).optional().nullable(),
  avatarDataUrl: z.string().max(500000).optional().nullable(),
  themePreferenceMode: themePreferenceModeSchema.default("system"),
  themeTemplate: z.string().max(80).default("Template 1"),
  customAccentColor: hexColorSchema.default("#0891b2"),
  interfaceThemeMode: interfaceThemeModeSchema.default("system"),
  commandSearchEnabled: z.boolean().default(true),
  keyboardShortcutsEnabled: z.boolean().default(true),
});

const systemSettingsSchema = z.object({
  general: z.object({
    systemName: z.string().min(2).max(160),
    facilityName: z.string().min(2).max(180),
    departmentName: z.string().min(2).max(180),
    defaultLanguage: z.enum(["English", "Arabic", "Bilingual"]),
    dateFormat: z.enum(["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]),
    timeFormat: z.enum(["24H", "12H"]),
    logoText: z.string().min(2).max(160),
    logoUrl: z.string().max(500000).optional().nullable(),
    appVersionNumber: z.string().max(40).optional().nullable(),
    releaseName: z.string().max(120).optional().nullable(),
    releaseYear: z.string().max(20).optional().nullable(),
    appIconDataUrl: z.string().max(500000).optional().nullable(),
    companyName: z.string().max(180).optional().nullable(),
    companyShortName: z.string().max(80).optional().nullable(),
    companySubtitle: z.string().max(220).optional().nullable(),
    companyLogoDataUrl: z.string().max(500000).optional().nullable(),
    showCompanyNameBesideLogo: z.boolean().optional(),
    showCompanyOnCertificates: z.boolean().optional(),
    showCompanyOnTags: z.boolean().optional(),
    showCompanyOnReports: z.boolean().optional(),
    appDescription: z.string().max(500).optional().nullable(),
    dashboardHeroTitle: z.string().max(220).optional().nullable(),
    dashboardHeroDescription: z.string().max(800).optional().nullable(),
    themeTemplate: z
      .enum([
        "Template 1",
        "Template 2 Classic",
        "Template 3 SAP",
        "Template 4 Custom",
        "Template 5 Command Pro",
      ])
      .optional(),
    customAccentColor: hexColorSchema.optional(),
  }),
  tags: z.object({
    defaultTagWidthCm: z.coerce.number().min(5).max(30),
    defaultTagHeightCm: z.coerce.number().min(4).max(30),
    defaultTagColor: hexColorSchema,
    defaultAccentColor: hexColorSchema,
    defaultTextColor: hexColorSchema,
    defaultQrSizePx: z.number().int().min(72).max(260),
    showArea: z.boolean(),
    showLine: z.boolean(),
    showSize: z.boolean(),
    showRating: z.boolean(),
    showProjectNo: z.boolean(),
    showBlindType: z.boolean(),
    companyLogoUrl: z.string().max(500000).optional().nullable(),
    showHole: z.boolean().optional(),
    holeSizePx: z.number().int().min(6).max(80).optional(),
    fontScale: z.number().int().min(80).max(150).optional(),
  }),
  certificates: z.object({
    certificateTitle: z.string().min(2).max(180),
    certificateNoFormat: z.string().min(6).max(220),
    requireFinalApprovalBeforeIssue: z.boolean(),
    showTorqueSection: z.boolean(),
    showApprovalSection: z.boolean(),
    showQrCode: z.boolean(),
    showActivitySummary: z.boolean(),
    showRevisionNumber: z.boolean(),
    certificateLogoUrl: z.string().max(500000).optional().nullable(),
    fontScale: z.number().int().min(80).max(150).optional(),
    layoutMode: z.enum(["Executive", "Classic", "Compact"]).optional(),
  }),
  approvals: z
    .object({
      profiles: z
        .array(
          z.object({
            blindType: z.string().min(2).max(120),
            requiredApprovers: z.array(z.string().min(2).max(120)).min(1),
            requireAll: z.boolean(),
            unlockCertificate: z.boolean(),
          })
        )
        .min(1),
    })
    .optional(),
  masterData: z
    .object({
      blindTypes: z.array(z.string().min(2).max(120)).min(1),
    })
    .optional(),
  notifications: z.object({
    notifyOnNewBlind: z.boolean(),
    notifyOnPhaseUpdate: z.boolean(),
    notifyOnApprovalRequired: z.boolean(),
    notifyOnCertificateIssued: z.boolean(),
    notifyOnTagPrinted: z.boolean(),
    notifyOnRejectedApproval: z.boolean(),
  }),
  security: z.object({
    sessionTimeoutHours: z.number().int().min(1).max(72),
    requireLoginForQrActions: z.boolean(),
    allowVisitorQrView: z.boolean(),
    adminPagesHardLock: z.boolean(),
    allowDeleteActions: z.boolean(),
    requireDeleteConfirmation: z.boolean(),
    enableAuditTrail: z.boolean(),
  }),
});

const coreRouter = router({
  login: publicProcedure
    .input(
      z.object({
        badge: z.string().min(1).max(80),
        roleKey: roleKeySchema.optional(),
      })
    )
    .mutation(async ({ input }) => authenticateEmployeeSession(input)),
  sessionBinding: publicProcedure.query(async ({ ctx }) => ({
    authenticated: Boolean(ctx.user),
    openId: ctx.user?.openId ?? null,
    role: ctx.user?.role ?? null,
    employeeId: ctx.user?.employeeId ?? null,
    badge: ctx.user?.badge ?? null,
    roleKey: ctx.user?.roleKey ?? null,
    productionBinding: Boolean(ctx.user),
  })),
  userPreferences: protectedProcedure.query(async ({ ctx }) => {
    return getUserPreferences(
      ctx.user.openId,
      ctx.user.employeeId ?? null,
      ctx.user.name ?? null
    );
  }),
  saveUserPreferences: protectedProcedure
    .input(userPreferencesSchema)
    .mutation(async ({ input, ctx }) => {
      return saveUserPreferences(
        {
          openId: ctx.user.openId,
          employeeId: ctx.user.employeeId ?? null,
          displayName: input.displayName ?? ctx.user.name ?? null,
          recoveryEmail: input.recoveryEmail || null,
          specialtyDescription: input.specialtyDescription ?? null,
          avatarDataUrl: input.avatarDataUrl ?? null,
          themePreferenceMode: input.themePreferenceMode,
          themeTemplate: input.themeTemplate,
          customAccentColor: input.customAccentColor,
          interfaceThemeMode: input.interfaceThemeMode,
          commandSearchEnabled: input.commandSearchEnabled,
          keyboardShortcutsEnabled: input.keyboardShortcutsEnabled,
        },
        ctx.user.openId
      );
    }),
    registerPasswordCredential: adminProcedure
    .input(
      z.object({
        employeeId: z.string().min(1).max(64),
        username: usernameSchema,
        password: passwordSchema,
        recoveryEmail: z.string().email().max(320).optional().nullable(),
        mustChangePassword: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) =>
      registerPasswordCredential(input, ctx.user.openId)
    ),
  registerEmployeeCredential: publicProcedure
    .input(
      z.object({
        badge: z.string().min(2).max(80),
        fullName: z.string().min(2).max(180),
        roleKey: roleKeySchema,
        specialty: z.string().min(2).max(180).default("Pending profile update"),
        department: z.string().min(2).max(140).default("Pending assignment"),
        shift: z.string().min(1).max(80).default("Unassigned"),
        status: employeeStatusSchema.default("Pending"),
        photoUrl: z.string().max(420).optional().nullable(),
        isCertified: z.boolean().optional(),
        username: usernameSchema,
        password: passwordSchema,
        recoveryEmail: z.string().email().max(320),
      })
    )
    .mutation(async ({ input }) => {
      const { roleKey: _requestedRoleKey, status: _requestedStatus, ...safeInput } = input;
      return createEmployeeWithCredential(
        { ...safeInput, status: "Pending", roleKey: "technician" },
        "self-register"
      );
    }),
  passwordLogin: publicProcedure
    .input(
      z.object({
        username: usernameSchema,
        password: z.string().min(1).max(160),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await authenticatePasswordUser({
        ...input,
        ipAddress: String(
          ctx.req.headers["x-forwarded-for"] ??
            ctx.req.socket.remoteAddress ??
            ""
        ),
        userAgent: ctx.req.headers["user-agent"] ?? null,
      });
      ctx.res.cookie(COOKIE_NAME, result.sessionId, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: 12 * 60 * 60 * 1000,
      });
      return result;
    }),
  requestPasswordReset: publicProcedure
    .input(z.object({ username: usernameSchema }))
    .mutation(async ({ input }) => requestPasswordReset(input.username)),
  persistenceStatus: protectedProcedure.query(async () =>
    getProductionPersistenceStatus()
  ),
  performanceMonitoring: adminProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    const [runtime, database, persistence] = await Promise.all([
      Promise.resolve(getRuntimeMonitoringSnapshot()),
      getObservabilityDatabaseSnapshot(),
      getProductionPersistenceStatus(),
    ]);
    return {
      runtime,
      database,
      persistence,
      generatedAt: new Date().toISOString(),
    };
  }),
  systemSettings: protectedProcedure.query(async () => getSystemSettings()),
  saveSystemSettings: adminProcedure
    .input(systemSettingsSchema)
    .mutation(async ({ input, ctx }) =>
      saveSystemSettings(input, ctx.user?.openId ?? "local-demo-user")
    ),
  areas: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    return scopedAreasForUser(ctx, await getAreas());
  }),
  projects: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    return scopedProjectsForUser(ctx, await getProjectsCore());
  }),
  blinds: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    return scopedBlindsForUser(ctx, await getBlindsCore());
  }),
  areasPage: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ input, ctx }) => {
      requireActiveUser(ctx);
      const pageInput = paginationSchema.parse(input ?? {});
      const rows = scopedAreasForUser(ctx, await getAreas()).filter(row =>
        textMatches(row, pageInput.search)
      );
      return paginateRows(rows, pageInput);
    }),
  projectsPage: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ input, ctx }) => {
      requireActiveUser(ctx);
      const pageInput = paginationSchema.parse(input ?? {});
      const rows = scopedProjectsForUser(ctx, await getProjectsCore()).filter(
        row => textMatches(row, pageInput.search)
      );
      return paginateRows(rows, pageInput);
    }),
  blindsPage: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ input, ctx }) => {
      requireActiveUser(ctx);
      const pageInput = paginationSchema.parse(input ?? {});
      const rows = scopedBlindsForUser(ctx, await getBlindsCore()).filter(row =>
        textMatches(row, pageInput.search)
      );
      return paginateRows(rows, pageInput);
    }),
  dashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    if (isAdminContext(ctx)) return getDashboardSummary();

    const scopedAreas = scopedAreasForUser(ctx, await getAreas());
    const scopedProjects = scopedProjectsForUser(ctx, await getProjectsCore());
    const scopedBlinds = scopedBlindsForUser(ctx, await getBlindsCore());
    const completedBlinds = scopedBlinds.filter(
      blind =>
        blind.status === "Completed" ||
        blind.currentPhaseKey === "inspectionReady"
    ).length;
    const inProgressBlinds = scopedBlinds.filter(
      blind => blind.status === "In Progress"
    ).length;
    const pendingApprovalBlinds = scopedBlinds.filter(
      blind => blind.status === "Pending Approval"
    ).length;
    const highPriorityBlinds = scopedBlinds.filter(
      blind => blind.priority === "High" || blind.priority === "Critical"
    ).length;

    return {
      totalAreas: scopedAreas.length,
      totalProjects: scopedProjects.length,
      totalBlinds: scopedBlinds.length,
      completedBlinds,
      inProgressBlinds,
      pendingApprovalBlinds,
      highPriorityBlinds,
      completionPercent: scopedBlinds.length
        ? Math.round((completedBlinds / scopedBlinds.length) * 100)
        : 0,
      phaseCounts: (
        Object.keys(routerPhaseMeta) as Array<z.infer<typeof phaseKeySchema>>
      ).map(key => ({
        key,
        label: routerPhaseMeta[key].label,
        count: scopedBlinds.filter(blind => blind.currentPhaseKey === key)
          .length,
        owner: routerPhaseMeta[key].owner,
        color: routerPhaseMeta[key].color,
      })),
    };
  }),
  employees: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    return getEmployees();
  }),
  userManagement: adminProcedure.query(async () => getUserManagement()),
  createEmployee: adminProcedure
    .input(employeeInputSchema)
    .mutation(async ({ input }) => createEmployee(input)),
  updateEmployee: adminProcedure
    .input(employeeInputSchema.extend({ id: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => updateEmployee(input)),
  deleteEmployee: adminProcedure
    .input(z.object({ id: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => deleteEmployee(input.id)),
  phaseAssignments: protectedProcedure
    .input(z.object({ projectId: z.string().min(1).max(48) }))
    .query(async ({ input, ctx }) => {
      requireProjectAccess(ctx, input.projectId);
      return getProjectPhaseAssignments(input.projectId);
    }),
  savePhaseAssignments: supervisorProcedure
    .input(
      z.object({
        projectId: z.string().min(1).max(48),
        assignments: z
          .array(
            z.object({
              phaseKey: phaseKeySchema,
              roleKey: roleKeySchema,
              authorizedEmployeeBadges: z
                .array(z.string().min(1).max(80))
                .min(1),
              note: z.string().max(1000).optional().nullable(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireProjectAccess(ctx, input.projectId);
      return saveProjectPhaseAssignments(
        input,
        ctx.user?.openId ?? "local-demo-user"
      );
    }),
  phaseGatePreview: protectedProcedure
    .input(
      z.object({
        blindId: z.string().min(1).max(48),
        targetPhaseKey: phaseKeySchema,
      })
    )
    .query(async ({ input, ctx }) => {
      const detail = await getBlindDetail(input.blindId);
      if (detail) {
        requireAreaAccess(ctx, detail.areaId);
        requireProjectAccess(ctx, detail.projectId);
      }
      requirePhaseAuthorization(ctx, input.targetPhaseKey);
      return getPhaseGatePreview(input.blindId, input.targetPhaseKey);
    }),
  approvalProfiles: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    return getApprovalProfiles();
  }),
  approvalCenter: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    return scopedBlindsForUser(ctx, await getApprovalCenter());
  }),
  certificateLock: protectedProcedure
    .input(z.object({ blindId: z.string().min(1).max(48) }))
    .query(async ({ input, ctx }) => {
      const detail = await getBlindDetail(input.blindId);
      if (detail) {
        requireAreaAccess(ctx, detail.areaId);
        requireProjectAccess(ctx, detail.projectId);
      }
      return getCertificateLockStatus(input.blindId, ctx.user?.openId ?? null);
    }),
  pendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    return scopedBlindsForUser(ctx, await getPendingApprovalInbox());
  }),
  approveRequest: protectedProcedure
    .input(
      z.object({
        approvalId: z.string().min(1).max(80),
        decision: z.enum(["Approved", "Rejected"]),
        signatureId: z.string().min(1).max(120),
        remarks: z.string().max(1000).optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "workflow.approve");
      const approval = (await getApprovalCenter()).find(
        item => String(item.id) === String(input.approvalId)
      );
      if (approval) {
        requireProjectAccess(ctx, approval.projectId);
        const lock = await getBlindMutationLockStatus(approval.blindId);
        requireCertificateUnlocked(lock.locked, lock.reason);
      }
      requirePhaseSignatureBinding(ctx, input.signatureId);
      return approveWorkflowRequest(
        input,
        ctx.user?.openId ?? "local-demo-user"
      );
    }),
  torqueRecords: protectedProcedure
    .input(
      z
        .object({ blindId: z.string().min(1).max(48).optional().nullable() })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      requireActiveUser(ctx);
      if (input?.blindId) {
        const detail = await getBlindDetail(input.blindId);
        if (detail) {
          requireAreaAccess(ctx, detail.areaId);
          requireProjectAccess(ctx, detail.projectId);
        }
      }
      return scopedBlindsForUser(ctx, await getTorqueRecords(input?.blindId));
    }),
  certificates: protectedProcedure
    .input(
      z
        .object({
          blindId: z.string().min(1).max(48).optional().nullable(),
          projectId: z.string().min(1).max(48).optional().nullable(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      requireActiveUser(ctx);
      if (input?.projectId) requireProjectAccess(ctx, input.projectId);
      if (input?.blindId) {
        const detail = await getBlindDetail(input.blindId);
        if (detail) {
          requireAreaAccess(ctx, detail.areaId);
          requireProjectAccess(ctx, detail.projectId);
        }
      }
      return scopedBlindsForUser(ctx, await getCertificates(input));
    }),
  issueCertificate: protectedProcedure
    .input(
      z.object({
        blindId: z.string().min(1).max(48),
        status: certificateStatusSchema.optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "certificates.manage");
      const detail = await getBlindDetail(input.blindId);
      if (detail) {
        requireAreaAccess(ctx, detail.areaId);
        requireProjectAccess(ctx, detail.projectId);
      }
      const lock = await getCertificateLockStatus(
        input.blindId,
        ctx.user?.openId ?? null
      );
      requireCertificateUnlocked(lock.locked, lock.reason);
      return issueCertificate(input, ctx.user?.openId ?? "local-demo-user");
    }),
  tagSettings: protectedProcedure
    .input(
      z
        .object({ projectId: z.string().min(1).max(48).optional().nullable() })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      requireActiveUser(ctx);
      if (input?.projectId) requireProjectAccess(ctx, input.projectId);
      return getTagDesignerSettings(input?.projectId);
    }),
  saveTagSettings: adminProcedure
    .input(tagDesignerSettingsSchema)
    .mutation(async ({ input, ctx }) =>
      saveTagDesignerSettings(input, ctx.user?.openId ?? "local-demo-user")
    ),
  notifications: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    return getNotificationInbox();
  }),
  updateNotification: protectedProcedure
    .input(
      z.object({
        notificationId: z.string().min(1).max(80),
        action: z.enum(["read", "archive", "restore"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireActiveUser(ctx);
      return updateNotificationStatus(input);
    }),
  auditTrail: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string().min(1).max(48).optional().nullable(),
          blindId: z.string().min(1).max(48).optional().nullable(),
          entityType: z.string().max(80).optional().nullable(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "audit.view");
      if (input?.projectId) requireProjectAccess(ctx, input.projectId);
      if (input?.blindId) {
        const detail = await getBlindDetail(input.blindId);
        if (detail) {
          requireAreaAccess(ctx, detail.areaId);
          requireProjectAccess(ctx, detail.projectId);
        }
      }
      return scopedRecordsForUser(ctx, await getAuditTrail(input));
    }),
  recordTagPrint: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1).max(48).optional().nullable(),
        blindId: z.string().min(1).max(48).optional().nullable(),
        scope: z.enum(["Project", "Blind"]),
        tagCount: z.number().int().min(1).max(10000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.projectId) requireProjectAccess(ctx, input.projectId);
      if (input.blindId) {
        const detail = await getBlindDetail(input.blindId);
        if (detail) {
          requireAreaAccess(ctx, detail.areaId);
          requireProjectAccess(ctx, detail.projectId);
        }
      }
      return recordTagPrint(input, ctx.user?.openId ?? "local-demo-user");
    }),
  reportCenter: protectedProcedure
    .input(
      z
        .object({ projectId: z.string().min(1).max(48).optional().nullable() })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      requirePermission(ctx, "reports.view");
      if (input?.projectId) {
        requireProjectAccess(ctx, input.projectId);
        return getReportCenter(input);
      }
      if (isAdminContext(ctx)) return getReportCenter(input);
      const firstProjectId = ctx.user?.projectIds?.[0];
      if (!firstProjectId) {
        return getReportCenter({ projectId: "__no_project_scope__" });
      }
      return getReportCenter({ projectId: firstProjectId });
    }),
  recordReportExport: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1).max(48).optional().nullable(),
        packageName: z.string().min(2).max(120),
        fileType: z.enum(["CSV", "PDF", "Excel", "PowerPoint", "Print"]),
        rowCount: z.number().int().min(0).max(100000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "reports.export");
      if (input.projectId) requireProjectAccess(ctx, input.projectId);
      return recordReportExport(input, ctx.user?.openId ?? "local-demo-user");
    }),
  createArea: adminProcedure
    .input(
      z.object({
        code: z.string().min(2).max(48),
        name: z.string().min(2).max(180),
        plant: z.string().min(2).max(180),
        ownerRoleKey: roleKeySchema.optional(),
        description: z.string().max(1000).optional().nullable(),
        status: areaStatusSchema.default("Active"),
      })
    )
    .mutation(async ({ input }) => createArea(input)),
  updateArea: coordinatorProcedure
    .input(
      z.object({
        id: z.string().min(1).max(48),
        code: z.string().min(2).max(48),
        name: z.string().min(2).max(180),
        plant: z.string().min(2).max(180),
        description: z.string().max(1000).optional().nullable(),
        status: areaStatusSchema.default("Active"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireAreaAccess(ctx, input.id);
      return updateArea(input);
    }),
  deleteArea: adminProcedure
    .input(
      z.object({
        id: z.string().min(1).max(48),
      })
    )
    .mutation(async ({ input }) => deleteArea(input.id)),
  createProject: coordinatorProcedure
    .input(
      z.object({
        projectNo: z.string().min(2).max(80),
        name: z.string().min(2).max(220),
        areaId: z.string().min(1).max(48),
        workflowId: z.string().max(96).optional().nullable(),
        status: projectStatusSchema.optional(),
        progress: z.number().int().min(0).max(100).optional(),
        startDate: z.string().max(20).optional().nullable(),
        targetDate: z.string().max(20).optional().nullable(),
        maintenanceReason: z.string().max(1200).optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "projects.create");
      requireAreaAccess(ctx, input.areaId);
      return createProject(input, ctx.user?.openId ?? "local-demo-user");
    }),
  updateProject: coordinatorProcedure
    .input(
      z.object({
        id: z.string().min(1).max(48),
        projectNo: z.string().min(2).max(80),
        name: z.string().min(2).max(220),
        areaId: z.string().min(1).max(48),
        workflowId: z.string().max(96).optional().nullable(),
        startDate: z.string().max(20).optional().nullable(),
        targetDate: z.string().max(20).optional().nullable(),
        maintenanceReason: z.string().max(1200).optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const current = (await getProjectsCore()).find(
        project => project.id === input.id
      );
      if (current) requireProjectAccess(ctx, current.id);
      requirePermission(ctx, "projects.edit");
      requireAreaAccess(ctx, input.areaId);
      return updateProject(input);
    }),
  deleteProject: adminProcedure
    .input(
      z.object({
        id: z.string().min(1).max(48),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireProjectAccess(ctx, input.id);
      return deleteProject(input.id);
    }),
  createBlind: protectedProcedure
    .input(
      z.object({
        blindNo: z.string().min(2).max(80),
        tagNo: z.string().min(2).max(80),
        projectId: z.string().min(1).max(48),
        areaId: z.string().min(1).max(48),
        lineNo: z.string().min(1).max(120),
        size: z.string().min(1).max(60),
        rating: z.string().max(80).optional().nullable(),
        blindType: z.string().min(2).max(120),
        currentPhaseKey: phaseKeySchema.optional(),
        ownerRoleKey: roleKeySchema.optional(),
        status: blindStatusSchema.optional(),
        priority: blindPrioritySchema.optional(),
        locationNote: z.string().max(1000).optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "blinds.create");
      requireAreaAccess(ctx, input.areaId);
      requireProjectAccess(ctx, input.projectId);
      return createBlind(input, ctx.user?.openId ?? "local-demo-user");
    }),
  blindDetail: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(120) }))
    .query(async ({ input, ctx }) => {
      const detail = await getBlindDetail(input.id);
      if (detail) {
        requireAreaAccess(ctx, detail.areaId);
        requireProjectAccess(ctx, detail.projectId);
      }
      return detail;
    }),
  moveBlindPhase: protectedProcedure
    .input(
      z.object({
        blindId: z.string().min(1).max(48),
        toPhaseKey: phaseKeySchema,
        actorRoleKey: roleKeySchema,
        signatureId: z.string().max(120).optional().nullable(),
        remarks: z.string().max(1000).optional().nullable(),
        torqueType: z.string().max(80).optional().nullable(),
        psi: z.number().int().min(0).max(100000).optional().nullable(),
        toolId: z.string().max(120).optional().nullable(),
        technicianName: z.string().max(180).optional().nullable(),
        technicianBadge: z.string().max(80).optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx, "blinds.phase.change");
      const detail = await getBlindDetail(input.blindId);
      if (detail) {
        requireAreaAccess(ctx, detail.areaId);
        requireProjectAccess(ctx, detail.projectId);
      }
      requirePhaseAuthorization(ctx, input.toPhaseKey);
      requirePhaseSignatureBinding(ctx, input.signatureId);
      const lock = await getBlindMutationLockStatus(input.blindId);
      requireCertificateUnlocked(lock.locked, lock.reason);
      return moveBlindPhase(input, ctx.user?.openId ?? "local-demo-user");
    }),
});

const accessControlRouter = router({
  model: adminProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    return getAccessControlModel();
  }),
  saveRoleModel: adminProcedure
    .input(accessRoleModelSaveSchema)
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx);
      return saveAccessRoleModel(input, {
        openId: ctx.user?.openId ?? null,
        name: ctx.user?.name ?? "System Admin",
        roleKey: ctx.user?.roleKey ?? ctx.user?.role ?? "admin",
      });
    }),
});

const workflowRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    requireActiveUser(ctx);
    return getAllWorkflows();
  }),
  get: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(96) }))
    .query(async ({ input }) => getWorkflowById(input.id)),
  save: supervisorProcedure
    .input(workflowTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      requireActiveUser(ctx);
      return upsertWorkflow(input, ctx.user?.openId ?? "local-demo-user");
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string().min(1).max(96) }))
    .mutation(async ({ input }) => {
      await deleteWorkflow(input.id);
      return { success: true } as const;
    }),
});

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.authSessionId) {
        await revokeAuthSession(ctx.authSessionId, "logout");
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  core: coreRouter,
  accessControl: accessControlRouter,
  workflow: workflowRouter,
});

export type AppRouter = typeof appRouter;
