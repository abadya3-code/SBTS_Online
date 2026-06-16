CREATE TABLE `approval_profile_approvers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` varchar(96) NOT NULL,
	`approverLabel` varchar(160) NOT NULL,
	`roleKey` varchar(80) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isRequired` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_profile_approvers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_profiles` (
	`id` varchar(96) NOT NULL,
	`blindType` varchar(120) NOT NULL,
	`requireAll` int NOT NULL DEFAULT 1,
	`unlockCertificate` int NOT NULL DEFAULT 1,
	`status` varchar(40) NOT NULL DEFAULT 'Active',
	`updatedByOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approval_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `approval_profiles_blindType_unique` UNIQUE(`blindType`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blindId` varchar(48) NOT NULL,
	`phaseKey` enum('broken','assembly','tightTorque','finalTight','inspectionReady') NOT NULL,
	`requiredRoleKey` varchar(80) NOT NULL,
	`approvedByOpenId` varchar(64),
	`approvalStatus` enum('Pending','Approved','Rejected','Skipped') NOT NULL DEFAULT 'Pending',
	`remarks` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` varchar(48) NOT NULL,
	`code` varchar(48) NOT NULL,
	`name` varchar(180) NOT NULL,
	`plant` varchar(180) NOT NULL,
	`ownerRoleKey` varchar(80) NOT NULL,
	`description` text,
	`areaStatus` enum('Active','Standby','Closed') NOT NULL DEFAULT 'Active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `areas_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `audit_trail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(120) NOT NULL,
	`projectId` varchar(48),
	`blindId` varchar(48),
	`action` varchar(160) NOT NULL,
	`actorOpenId` varchar(64),
	`actorName` varchar(180),
	`actorRoleKey` varchar(80),
	`summary` text NOT NULL,
	`beforeJson` text,
	`afterJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_trail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_password_credentials` (
	`id` varchar(96) NOT NULL,
	`employeeId` varchar(64) NOT NULL,
	`username` varchar(120) NOT NULL,
	`recoveryEmail` varchar(320),
	`passwordHash` varchar(500) NOT NULL,
	`passwordSalt` varchar(160) NOT NULL,
	`passwordAlgorithm` varchar(80) NOT NULL DEFAULT 'scrypt-sha256',
	`status` varchar(40) NOT NULL DEFAULT 'Active',
	`mustChangePassword` int NOT NULL DEFAULT 0,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lastLoginAt` timestamp,
	`createdByOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auth_password_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_password_credentials_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `auth_password_reset_tokens` (
	`id` varchar(96) NOT NULL,
	`credentialId` varchar(96) NOT NULL,
	`tokenHash` varchar(500) NOT NULL,
	`recoveryEmail` varchar(320) NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'Pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`usedAt` timestamp,
	CONSTRAINT `auth_password_reset_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blind_workflow_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blindId` varchar(48) NOT NULL,
	`fromPhaseKey` varchar(80),
	`toPhaseKey` varchar(80) NOT NULL,
	`action` varchar(160) NOT NULL,
	`actorOpenId` varchar(64),
	`actorRoleKey` varchar(80),
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blind_workflow_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blinds` (
	`id` varchar(48) NOT NULL,
	`blindNo` varchar(80) NOT NULL,
	`tagNo` varchar(80) NOT NULL,
	`projectId` varchar(48) NOT NULL,
	`areaId` varchar(48) NOT NULL,
	`lineNo` varchar(120) NOT NULL,
	`size` varchar(60) NOT NULL,
	`rating` varchar(80),
	`blindType` varchar(120) NOT NULL,
	`phaseKey` enum('broken','assembly','tightTorque','finalTight','inspectionReady') NOT NULL,
	`ownerRoleKey` varchar(80) NOT NULL,
	`blindStatus` enum('Open','In Progress','Pending Approval','Completed','Archived') NOT NULL DEFAULT 'Open',
	`blindPriority` enum('Low','Normal','High','Critical') NOT NULL DEFAULT 'Normal',
	`qrCode` varchar(260) NOT NULL,
	`locationNote` text,
	`createdByOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blinds_id` PRIMARY KEY(`id`),
	CONSTRAINT `blinds_blindNo_unique` UNIQUE(`blindNo`),
	CONSTRAINT `blinds_tagNo_unique` UNIQUE(`tagNo`)
);
--> statement-breakpoint
CREATE TABLE `certificate_lock_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blindId` varchar(48) NOT NULL,
	`lockStatus` varchar(40) NOT NULL,
	`reason` text NOT NULL,
	`missingApproversJson` text,
	`checkedByOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificate_lock_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blindId` varchar(48) NOT NULL,
	`certificateNo` varchar(100) NOT NULL,
	`certificateType` varchar(80) NOT NULL DEFAULT 'Blind Completion',
	`revision` int NOT NULL DEFAULT 1,
	`templateVersion` varchar(40) NOT NULL DEFAULT 'SBTS-CERT-V1',
	`qrValue` varchar(500),
	`blindSnapshotJson` text,
	`torqueSnapshotJson` text,
	`approvalSnapshotJson` text,
	`workflowSnapshotJson` text,
	`issuedByOpenId` varchar(64),
	`pdfUrl` varchar(500),
	`status` varchar(80) NOT NULL DEFAULT 'Draft',
	`printCount` int NOT NULL DEFAULT 0,
	`issuedAt` timestamp,
	`lastPrintedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateNo_unique` UNIQUE(`certificateNo`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` varchar(64) NOT NULL,
	`badge` varchar(80) NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`roleKey` varchar(80) NOT NULL,
	`specialty` varchar(180) NOT NULL,
	`department` varchar(140) NOT NULL,
	`shift` varchar(80) NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'Active',
	`photoUrl` varchar(420),
	`initials` varchar(8) NOT NULL,
	`isCertified` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_badge_unique` UNIQUE(`badge`)
);
--> statement-breakpoint
CREATE TABLE `file_uploads` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userOpenId` varchar(64),
	`type` varchar(80) NOT NULL,
	`title` varchar(220) NOT NULL,
	`message` text NOT NULL,
	`relatedEntity` varchar(80),
	`relatedId` varchar(120),
	`actionUrl` varchar(500),
	`severity` varchar(40) NOT NULL DEFAULT 'info',
	`notificationStatus` enum('Unread','Read','Archived') NOT NULL DEFAULT 'Unread',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_persistence_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`domain` varchar(100) NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'Info',
	`summary` text NOT NULL,
	`metadataJson` text,
	`actorOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_persistence_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_phase_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` varchar(48) NOT NULL,
	`phaseKey` enum('broken','assembly','tightTorque','finalTight','inspectionReady') NOT NULL,
	`roleKey` varchar(80) NOT NULL,
	`authorizedEmployeeBadgesJson` text NOT NULL,
	`note` text,
	`assignedByOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_phase_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(48) NOT NULL,
	`projectNo` varchar(80) NOT NULL,
	`name` varchar(220) NOT NULL,
	`areaId` varchar(48) NOT NULL,
	`workflowId` varchar(96),
	`projectStatus` enum('Planning','Active','Final Review','Completed','On Hold') NOT NULL DEFAULT 'Planning',
	`progress` int NOT NULL DEFAULT 0,
	`startDate` date,
	`targetDate` date,
	`createdByOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_projectNo_unique` UNIQUE(`projectNo`)
);
--> statement-breakpoint
CREATE TABLE `sbts_auth_sessions` (
	`id` varchar(96) NOT NULL,
	`employeeId` varchar(64) NOT NULL,
	`badge` varchar(80) NOT NULL,
	`roleKey` varchar(80) NOT NULL,
	`loginMethod` varchar(80) NOT NULL DEFAULT 'production-bound',
	`provider` varchar(160) NOT NULL DEFAULT 'SBTS Employee Directory',
	`ipAddress` varchar(80),
	`userAgent` text,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	`revokeReason` varchar(255),
	CONSTRAINT `sbts_auth_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sbts_schema_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(80) NOT NULL,
	`label` varchar(220) NOT NULL,
	`appliedByOpenId` varchar(64),
	`notes` text,
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sbts_schema_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sbts_schema_versions_version_unique` UNIQUE(`version`)
);
--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`severity` varchar(40) NOT NULL DEFAULT 'info',
	`actorOpenId` varchar(64),
	`employeeId` varchar(64),
	`badge` varchar(80),
	`roleKey` varchar(80),
	`ipAddress` varchar(80),
	`userAgent` text,
	`summary` text NOT NULL,
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` varchar(120) NOT NULL,
	`category` varchar(80) NOT NULL,
	`valueJson` text NOT NULL,
	`updatedByOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `tag_designer_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scopeType` varchar(40) NOT NULL DEFAULT 'Global',
	`projectId` varchar(48),
	`templateName` varchar(120) NOT NULL DEFAULT 'SBTS Standard Site Tag',
	`tagWidthCm` int NOT NULL DEFAULT 11,
	`tagHeightCm` int NOT NULL DEFAULT 7,
	`tagColor` varchar(24) NOT NULL DEFAULT '#ffffff',
	`accentColor` varchar(24) NOT NULL DEFAULT '#0891b2',
	`textColor` varchar(24) NOT NULL DEFAULT '#0f172a',
	`logoText` varchar(160) NOT NULL DEFAULT 'Smart Blind Tag System',
	`showLogo` int NOT NULL DEFAULT 1,
	`showHole` int NOT NULL DEFAULT 1,
	`showStatus` int NOT NULL DEFAULT 1,
	`showProjectNo` int NOT NULL DEFAULT 1,
	`showLocationNote` int NOT NULL DEFAULT 0,
	`qrSizePx` int NOT NULL DEFAULT 132,
	`fontScale` int NOT NULL DEFAULT 100,
	`layoutMode` varchar(60) NOT NULL DEFAULT 'Operational Split',
	`updatedByOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tag_designer_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `torque_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blindId` varchar(48) NOT NULL,
	`phaseKey` enum('broken','assembly','tightTorque','finalTight','inspectionReady') NOT NULL,
	`machineType` varchar(80) NOT NULL,
	`psiValue` int NOT NULL,
	`technicianOpenId` varchar(64),
	`technicianBadge` varchar(80),
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `torque_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
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
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_openId` PRIMARY KEY(`openId`)
);
--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_blindId_blinds_id_fk` FOREIGN KEY (`blindId`) REFERENCES `blinds`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blind_workflow_logs` ADD CONSTRAINT `blind_workflow_logs_blindId_blinds_id_fk` FOREIGN KEY (`blindId`) REFERENCES `blinds`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blinds` ADD CONSTRAINT `blinds_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blinds` ADD CONSTRAINT `blinds_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_blindId_blinds_id_fk` FOREIGN KEY (`blindId`) REFERENCES `blinds`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_phase_assignments` ADD CONSTRAINT `project_phase_assignments_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_workflowId_workflow_templates_id_fk` FOREIGN KEY (`workflowId`) REFERENCES `workflow_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tag_designer_settings` ADD CONSTRAINT `tag_designer_settings_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `torque_records` ADD CONSTRAINT `torque_records_blindId_blinds_id_fk` FOREIGN KEY (`blindId`) REFERENCES `blinds`(`id`) ON DELETE no action ON UPDATE no action;