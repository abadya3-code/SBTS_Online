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
CREATE TABLE `certificates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `blindId` varchar(48) NOT NULL,
  `certificateNo` varchar(100) NOT NULL,
  `issuedByOpenId` varchar(64),
  `pdfUrl` varchar(500),
  `status` varchar(80) NOT NULL DEFAULT 'Draft',
  `issuedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
  CONSTRAINT `certificates_certificateNo_unique` UNIQUE(`certificateNo`)
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
  `notificationStatus` enum('Unread','Read','Archived') NOT NULL DEFAULT 'Unread',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_workflowId_workflow_templates_id_fk` FOREIGN KEY (`workflowId`) REFERENCES `workflow_templates`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blinds` ADD CONSTRAINT `blinds_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blinds` ADD CONSTRAINT `blinds_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blind_workflow_logs` ADD CONSTRAINT `blind_workflow_logs_blindId_blinds_id_fk` FOREIGN KEY (`blindId`) REFERENCES `blinds`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_blindId_blinds_id_fk` FOREIGN KEY (`blindId`) REFERENCES `blinds`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `torque_records` ADD CONSTRAINT `torque_records_blindId_blinds_id_fk` FOREIGN KEY (`blindId`) REFERENCES `blinds`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_blindId_blinds_id_fk` FOREIGN KEY (`blindId`) REFERENCES `blinds`(`id`) ON DELETE no action ON UPDATE no action;
