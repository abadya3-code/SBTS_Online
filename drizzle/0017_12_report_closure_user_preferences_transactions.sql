-- Sprint 17 Report Closure
-- Completes DB-backed user preferences and supports the final report closure checks.

ALTER TABLE user_preferences
  ADD COLUMN interfaceThemeMode varchar(20) NOT NULL DEFAULT 'system';

ALTER TABLE user_preferences
  ADD COLUMN commandSearchEnabled int NOT NULL DEFAULT 1;

ALTER TABLE user_preferences
  ADD COLUMN keyboardShortcutsEnabled int NOT NULL DEFAULT 1;

CREATE INDEX idx_user_preferences_employee_id ON user_preferences (employeeId);
CREATE INDEX idx_audit_trail_user_preference ON audit_trail (entityType, entityId);
