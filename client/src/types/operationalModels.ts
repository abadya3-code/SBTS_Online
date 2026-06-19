import type { LucideIcon } from "lucide-react";

export type JsonObject = Record<string, unknown>;

export type ThemeTemplateName =
  | "Template 1"
  | "Template 2 Classic"
  | "Template 3 SAP"
  | "Template 4 Custom"
  | "Template 5 Command Pro";

export type SystemGeneralSettings = {
  systemName?: string | null;
  facilityName?: string | null;
  departmentName?: string | null;
  logoText?: string | null;
  logoUrl?: string | null;
  appVersionNumber?: string | null;
  releaseName?: string | null;
  releaseYear?: string | null;
  customAccentColor?: string | null;
  dashboardHeroTitle?: string | null;
  dashboardHeroDescription?: string | null;
  themeTemplate?: ThemeTemplateName | null;
  companyName?: string | null;
  companyShortName?: string | null;
  companySubtitle?: string | null;
  companyLogoDataUrl?: string | null;
  showCompanyNameBesideLogo?: boolean | null;
  showCompanyOnCertificates?: boolean | null;
  showCompanyOnTags?: boolean | null;
  showCompanyOnReports?: boolean | null;
};

export type SystemTagSettings = {
  defaultTagWidthCm?: number | null;
  defaultTagHeightCm?: number | null;
  defaultTagColor?: string | null;
  defaultAccentColor?: string | null;
  defaultTextColor?: string | null;
  defaultQrSizePx?: number | null;
  showHole?: boolean | null;
  showProjectNo?: boolean | null;
  showLocationNote?: boolean | null;
  fontScale?: number | null;
  holeSizePx?: number | null;
};

export type CertificateSettings = {
  certificateLogoUrl?: string | null;
  certificateTitle?: string | null;
};

export type DashboardBlind = {
  id?: string;
  tagNo?: string;
  projectName?: string;
  areaCode?: string;
  phaseLabel?: string;
  ownerLabel?: string;
  priority?: string;
  blindType?: string | null;
  status?: string | null;
  currentPhaseKey?: string | null;
};

export type PrintableProject = {
  id?: string;
  projectNo?: string | null;
  name?: string | null;
  areaId?: string | null;
  areaCode?: string | null;
  areaName?: string | null;
};

export type PrintableBlind = {
  id?: string;
  projectId?: string | null;
  areaId?: string | null;
  tagNo?: string | null;
  blindNo?: string | null;
  projectNo?: string | null;
  projectName?: string | null;
  areaCode?: string | null;
  areaName?: string | null;
  lineNo?: string | null;
  blindType?: string | null;
  size?: string | null;
  rating?: string | null;
  phaseLabel?: string | null;
  currentPhase?: string | null;
  currentPhaseKey?: string | null;
  status?: string | null;
  logs?: WorkflowLogRecord[] | null;
};

export type CertificateRecord = {
  id?: string;
  blindId?: string | null;
  certificateNo?: string | null;
  status?: string | null;
  revision?: number | null;
  issuedAt?: string | Date | null;
};

export type WorkflowLogRecord = {
  id?: string | number;
  action?: string | null;
  fromPhaseLabel?: string | null;
  fromPhaseKey?: string | null;
  toPhaseLabel?: string | null;
  toPhaseKey?: string | null;
  workerName?: string | null;
  performedByName?: string | null;
  actorName?: string | null;
  createdAt?: string | Date | null;
};

export type TorqueRecord = {
  id?: string | number;
  machineType?: string | null;
  toolType?: string | null;
  psiValue?: string | number | null;
  psi?: string | number | null;
  technicianName?: string | null;
  createdAt?: string | Date | null;
};

export type ApprovalRecord = {
  id?: string | number;
  label?: string | null;
  phaseLabel?: string | null;
  requiredRoleLabel?: string | null;
  status?: string | null;
  approvedByName?: string | null;
  approvedByOpenId?: string | null;
  by?: string | null;
};

export type ApprovalProfileConfig = {
  blindType: string;
  requiredApprovers?: string[];
  requireAll?: boolean;
  unlockCertificate?: boolean;
};

export type MasterDataSettings = {
  blindTypes?: string[];
};

export type UserManagementRow = {
  id: string;
  badge: string;
  fullName: string;
  roleKey: string;
  roleLabel?: string;
  accessLevel?: string;
  initials?: string;
  status: string;
  specialty?: string;
  department?: string;
  shift?: string;
  photoUrl?: string | null;
  isCertified?: boolean;
};

export type KpiCardDefinition = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
};

export function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" ? (value as JsonObject) : {};
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function optionalStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}
