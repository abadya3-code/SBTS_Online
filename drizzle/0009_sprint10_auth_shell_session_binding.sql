-- Sprint 10 — Authentication Shell + Role-Based Login + Production Session Binding
-- Future production table for binding a web session to an SBTS employee/badge record.
-- Demo mode uses localStorage + Employee Directory; production can persist session metadata here.
CREATE TABLE IF NOT EXISTS sbts_auth_sessions (
  id varchar(96) PRIMARY KEY,
  employeeId varchar(64) NOT NULL,
  badge varchar(80) NOT NULL,
  roleKey varchar(80) NOT NULL,
  loginMethod varchar(80) NOT NULL DEFAULT 'production-bound',
  provider varchar(160) NOT NULL DEFAULT 'SBTS Employee Directory',
  ipAddress varchar(80),
  userAgent text,
  issuedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt timestamp NULL,
  revokedAt timestamp NULL,
  revokeReason varchar(255)
);

-- Add these indexes in production if your migration runner does not auto-manage duplicates:
-- CREATE INDEX idx_sbts_auth_sessions_badge ON sbts_auth_sessions (badge);
-- CREATE INDEX idx_sbts_auth_sessions_employee ON sbts_auth_sessions (employeeId);
-- CREATE INDEX idx_sbts_auth_sessions_role ON sbts_auth_sessions (roleKey);
