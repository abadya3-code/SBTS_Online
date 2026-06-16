-- Sprint 17.7 — Audit Report Closure
-- Purpose: close remaining third-party review findings around performance and security.
-- This migration intentionally uses unique index names that do not conflict with Sprint 17.4.

CREATE INDEX idx_s177_auth_credentials_status ON auth_password_credentials(status);
CREATE INDEX idx_s177_auth_credentials_employee ON auth_password_credentials(employeeId);
CREATE INDEX idx_s177_auth_sessions_employee ON sbts_auth_sessions(employeeId);
CREATE INDEX idx_s177_auth_sessions_expires ON sbts_auth_sessions(expiresAt);

CREATE INDEX idx_s177_role_permissions_role ON access_role_permissions(roleKey);
CREATE INDEX idx_s177_role_permissions_permission ON access_role_permissions(permissionKey);
CREATE INDEX idx_s177_access_roles_updated ON access_roles(updatedAt);

CREATE INDEX idx_s177_phase_assignments_project ON project_phase_assignments(projectId);
CREATE INDEX idx_s177_phase_assignments_phase ON project_phase_assignments(phaseKey);
CREATE INDEX idx_s177_workflow_phases_workflow ON workflow_phases(workflowId);
CREATE INDEX idx_s177_workflow_templates_status ON workflow_templates(status);

CREATE INDEX idx_s177_employees_role ON employees(roleKey);
CREATE INDEX idx_s177_employees_status ON employees(status);
CREATE INDEX idx_s177_system_settings_category ON system_settings(category);
CREATE INDEX idx_s177_security_events_created ON security_events(createdAt);
CREATE INDEX idx_s177_persistence_events_domain ON production_persistence_events(domain);

INSERT IGNORE INTO `sbts_schema_versions`
  (`version`, `label`, `appliedByOpenId`, `notes`)
VALUES
  ('17.7.0', 'Audit Report Closure', 'system', 'Adds remaining security/performance indexes for auth, sessions, role permissions, workflow assignments, system settings, and monitoring event tables.');
