-- Sprint 10.1 — System Settings Center
-- Global SBTS settings are stored by category in a JSON payload so the settings
-- center can grow without forcing a new database table for every toggle.

CREATE TABLE IF NOT EXISTS `system_settings` (
  `key` varchar(120) NOT NULL,
  `category` varchar(80) NOT NULL,
  `valueJson` text NOT NULL,
  `updatedByOpenId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
);

INSERT INTO `system_settings` (`key`, `category`, `valueJson`, `updatedByOpenId`)
VALUES (
  'global',
  'System',
  '{"general":{"systemName":"Smart Blind Tag System","facilityName":"Shedgum Gas Plant","departmentName":"Maintenance","defaultLanguage":"Bilingual","dateFormat":"YYYY-MM-DD","timeFormat":"24H","logoText":"SBTS Professional"},"tags":{"defaultTagWidthCm":11,"defaultTagHeightCm":7,"defaultTagColor":"#ffffff","defaultAccentColor":"#0891b2","defaultTextColor":"#0f172a","defaultQrSizePx":132,"showArea":true,"showLine":true,"showSize":true,"showRating":true,"showProjectNo":true,"showBlindType":true},"certificates":{"certificateTitle":"Blind Completion Certificate","certificateNoFormat":"SBTS-CERT-{PROJECT}-{BLIND}-R{REV}","requireFinalApprovalBeforeIssue":true,"showTorqueSection":true,"showApprovalSection":true,"showQrCode":true,"showActivitySummary":true,"showRevisionNumber":true},"notifications":{"notifyOnNewBlind":true,"notifyOnPhaseUpdate":true,"notifyOnApprovalRequired":true,"notifyOnCertificateIssued":true,"notifyOnTagPrinted":true,"notifyOnRejectedApproval":true},"security":{"sessionTimeoutHours":12,"requireLoginForQrActions":true,"allowVisitorQrView":true,"adminPagesHardLock":true,"allowDeleteActions":true,"requireDeleteConfirmation":true,"enableAuditTrail":true}}',
  'system-default'
)
ON DUPLICATE KEY UPDATE `category` = VALUES(`category`);
