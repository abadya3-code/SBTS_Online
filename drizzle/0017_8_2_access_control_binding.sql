-- Sprint 17.8.2 - Access Control real database binding support
-- No destructive changes. This migration adds indexes that support admin role/permission reads and saves.
CREATE INDEX idx_access_role_permissions_role_key ON access_role_permissions (roleKey);
CREATE INDEX idx_access_role_permissions_permission_key ON access_role_permissions (permissionKey);
CREATE INDEX idx_employees_role_status ON employees (roleKey, status);
CREATE INDEX idx_audit_trail_entity_action ON audit_trail (entityType, action);
