-- Sprint 11 — Production Database Persistence
-- Adds production metadata tables without changing the current user workflow.
-- Asset Hierarchy is intentionally deferred; these tables support persistence hardening first.

CREATE TABLE IF NOT EXISTS `sbts_schema_versions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `version` varchar(80) NOT NULL,
  `label` varchar(220) NOT NULL,
  `appliedByOpenId` varchar(64),
  `notes` text,
  `appliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sbts_schema_versions_version_unique` (`version`)
);

CREATE TABLE IF NOT EXISTS `file_uploads` (
  `id` varchar(96) NOT NULL,
  `ownerOpenId` varchar(64),
  `entityType` varchar(80) NOT NULL,
  `entityId` varchar(120) NOT NULL,
  `purpose` varchar(120) NOT NULL,
  `fileName` varchar(260) NOT NULL,
  `mimeType` varchar(120) NOT NULL,
  `sizeBytes` int NOT NULL DEFAULT 0,
  `storageKey` varchar(500),
  `publicUrl` varchar(500),
  `dataUrlPreview` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `user_preferences` (
  `openId` varchar(64) NOT NULL,
  `employeeId` varchar(64),
  `displayName` varchar(180),
  `recoveryEmail` varchar(320),
  `specialtyDescription` text,
  `avatarUploadId` varchar(96),
  `avatarDataUrl` text,
  `themePreferenceMode` varchar(40) NOT NULL DEFAULT 'system',
  `themeTemplate` varchar(80) NOT NULL DEFAULT 'Template 1',
  `customAccentColor` varchar(24) NOT NULL DEFAULT '#0891b2',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`openId`)
);

CREATE TABLE IF NOT EXISTS `production_persistence_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventType` varchar(100) NOT NULL,
  `domain` varchar(100) NOT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'Info',
  `summary` text NOT NULL,
  `metadataJson` text,
  `actorOpenId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

INSERT IGNORE INTO `sbts_schema_versions`
  (`version`, `label`, `appliedByOpenId`, `notes`)
VALUES
  ('10.4.9', 'QA & Build Stabilization baseline', 'system', 'Last demo-stable baseline before production persistence.'),
  ('11.0.0', 'Production Database Persistence foundation', 'system', 'Adds persistence metadata, file upload references, user preferences, and production persistence event tracking.');
