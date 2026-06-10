-- Sprint 13 — Approval Profiles & Certificate Lock

CREATE TABLE IF NOT EXISTS `approval_profiles` (
  `id` varchar(96) NOT NULL,
  `blindType` varchar(120) NOT NULL,
  `requireAll` int NOT NULL DEFAULT 1,
  `unlockCertificate` int NOT NULL DEFAULT 1,
  `status` varchar(40) NOT NULL DEFAULT 'Active',
  `updatedByOpenId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `approval_profiles_blind_type_unique` (`blindType`)
);

CREATE TABLE IF NOT EXISTS `approval_profile_approvers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profileId` varchar(96) NOT NULL,
  `approverLabel` varchar(160) NOT NULL,
  `roleKey` varchar(80) NOT NULL,
  `sortOrder` int NOT NULL DEFAULT 0,
  `isRequired` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `certificate_lock_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `blindId` varchar(48) NOT NULL,
  `lockStatus` varchar(40) NOT NULL,
  `reason` text NOT NULL,
  `missingApproversJson` text,
  `checkedByOpenId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

INSERT IGNORE INTO `sbts_schema_versions`
  (`version`, `label`, `appliedByOpenId`, `notes`)
VALUES
  ('13.0.0', 'Approval Profiles & Certificate Lock', 'system', 'Adds approval profile catalog and certificate lock traceability.');

INSERT IGNORE INTO `approval_profiles` (`id`, `blindType`, `requireAll`, `unlockCertificate`, `status`, `updatedByOpenId`) VALUES
  ('apf-blind', 'Blind', 1, 1, 'Active', 'system'),
  ('apf-slip-blind', 'Slip Blind', 1, 1, 'Active', 'system'),
  ('apf-drop-spool', 'Drop Spool', 1, 1, 'Active', 'system');

INSERT INTO `approval_profile_approvers` (`profileId`, `approverLabel`, `roleKey`, `sortOrder`, `isRequired`) VALUES
  ('apf-blind', 'Operation Foreman', 'coordinator', 1, 1),
  ('apf-blind', 'Project Engineer', 'tiEngineer', 2, 1),
  ('apf-blind', 'Inspection Unit', 'inspection', 3, 1),
  ('apf-slip-blind', 'Operation Foreman', 'coordinator', 1, 1),
  ('apf-slip-blind', 'Project Engineer', 'tiEngineer', 2, 1),
  ('apf-slip-blind', 'Inspection Unit', 'inspection', 3, 1),
  ('apf-slip-blind', 'Metal Foreman', 'metalForeman', 4, 1),
  ('apf-drop-spool', 'Operation Foreman', 'coordinator', 1, 1),
  ('apf-drop-spool', 'Project Engineer', 'tiEngineer', 2, 1),
  ('apf-drop-spool', 'Inspection Unit', 'inspection', 3, 1);
