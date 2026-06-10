-- Sprint 3 — Backend Workflow Engine & Approval Gate
-- Adds employee directory and project-level phase assignment gate tables.

CREATE TABLE IF NOT EXISTS `employees` (
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `employees_id` PRIMARY KEY(`id`),
  CONSTRAINT `employees_badge_unique` UNIQUE(`badge`)
);

CREATE TABLE IF NOT EXISTS `project_phase_assignments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` varchar(48) NOT NULL,
  `phaseKey` enum('broken','assembly','tightTorque','finalTight','inspectionReady') NOT NULL,
  `roleKey` varchar(80) NOT NULL,
  `authorizedEmployeeBadgesJson` text NOT NULL,
  `note` text,
  `assignedByOpenId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `project_phase_assignments_id` PRIMARY KEY(`id`)
);

ALTER TABLE `project_phase_assignments`
  ADD CONSTRAINT `project_phase_assignments_projectId_projects_id_fk`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
