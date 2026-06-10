-- Sprint 9 — User Management + Admin Security Hard Lock
-- The employees table from Sprint 3 is the operational user directory.
-- This migration adds a security event ledger for production-grade user/admin audits.

CREATE TABLE IF NOT EXISTS user_security_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId VARCHAR(64),
  badge VARCHAR(80),
  action VARCHAR(160) NOT NULL,
  previousRoleKey VARCHAR(80),
  nextRoleKey VARCHAR(80),
  previousStatus VARCHAR(40),
  nextStatus VARCHAR(40),
  actorOpenId VARCHAR(64),
  summary TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_security_events_employee (employeeId),
  INDEX idx_user_security_events_badge (badge),
  INDEX idx_user_security_events_action (action)
);
