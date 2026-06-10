-- Sprint 12 — Real Authentication & Backend Authorization
-- Adds salted password credentials, reset-token foundation, and security events.

CREATE TABLE IF NOT EXISTS `auth_password_credentials` (
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
  `lastLoginAt` timestamp NULL,
  `createdByOpenId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_password_credentials_username_unique` (`username`)
);

CREATE TABLE IF NOT EXISTS `auth_password_reset_tokens` (
  `id` varchar(96) NOT NULL,
  `credentialId` varchar(96) NOT NULL,
  `tokenHash` varchar(500) NOT NULL,
  `recoveryEmail` varchar(320) NOT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'Pending',
  `requestedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` timestamp NULL,
  `usedAt` timestamp NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `security_events` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

INSERT IGNORE INTO `sbts_schema_versions`
  (`version`, `label`, `appliedByOpenId`, `notes`)
VALUES
  ('12.0.0', 'Real Authentication & Backend Authorization foundation', 'system', 'Adds salted password credentials, server-side session foundation, security events, and backend authorization helpers.');
