-- Sprint 6 — Certificate Persistence + Tag Designer Settings
-- Adds persistent certificate snapshots and project/global tag designer templates.

ALTER TABLE certificates
  ADD COLUMN certificateType varchar(80) NOT NULL DEFAULT 'Blind Completion',
  ADD COLUMN revision int NOT NULL DEFAULT 1,
  ADD COLUMN templateVersion varchar(40) NOT NULL DEFAULT 'SBTS-CERT-V1',
  ADD COLUMN qrValue varchar(500),
  ADD COLUMN blindSnapshotJson text,
  ADD COLUMN torqueSnapshotJson text,
  ADD COLUMN approvalSnapshotJson text,
  ADD COLUMN workflowSnapshotJson text,
  ADD COLUMN printCount int NOT NULL DEFAULT 0,
  ADD COLUMN lastPrintedAt timestamp NULL,
  ADD COLUMN updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS tag_designer_settings (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  scopeType varchar(40) NOT NULL DEFAULT 'Global',
  projectId varchar(48),
  templateName varchar(120) NOT NULL DEFAULT 'SBTS Standard Site Tag',
  tagWidthCm int NOT NULL DEFAULT 11,
  tagHeightCm int NOT NULL DEFAULT 7,
  tagColor varchar(24) NOT NULL DEFAULT '#ffffff',
  accentColor varchar(24) NOT NULL DEFAULT '#0891b2',
  textColor varchar(24) NOT NULL DEFAULT '#0f172a',
  logoText varchar(160) NOT NULL DEFAULT 'Smart Blind Tag System',
  showLogo int NOT NULL DEFAULT 1,
  showHole int NOT NULL DEFAULT 1,
  showStatus int NOT NULL DEFAULT 1,
  showProjectNo int NOT NULL DEFAULT 1,
  showLocationNote int NOT NULL DEFAULT 0,
  qrSizePx int NOT NULL DEFAULT 132,
  fontScale int NOT NULL DEFAULT 100,
  layoutMode varchar(60) NOT NULL DEFAULT 'Operational Split',
  updatedByOpenId varchar(64),
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT tag_designer_project_fk FOREIGN KEY (projectId) REFERENCES projects(id)
);
