-- Sprint 17.4 — Production Hardening Indexes
-- Purpose: improve lookup performance for project/area scope, QR search,
-- approval inbox, workflow logs, certificate generation, notifications, and audit trail.

CREATE INDEX idx_projects_area_id ON projects(areaId);
CREATE INDEX idx_projects_project_no ON projects(projectNo);

CREATE INDEX idx_blinds_project_id ON blinds(projectId);
CREATE INDEX idx_blinds_area_id ON blinds(areaId);
CREATE INDEX idx_blinds_tag_no ON blinds(tagNo);
CREATE INDEX idx_blinds_qr_code ON blinds(qrCode);
CREATE INDEX idx_blinds_status ON blinds(status);
CREATE INDEX idx_blinds_current_phase ON blinds(currentPhaseKey);

CREATE INDEX idx_approvals_blind_id ON approvals(blindId);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_required_role ON approvals(requiredRoleKey);

CREATE INDEX idx_workflow_logs_blind_id ON blind_workflow_logs(blindId);
CREATE INDEX idx_workflow_logs_created_at ON blind_workflow_logs(createdAt);

CREATE INDEX idx_torque_records_blind_id ON torque_records(blindId);
CREATE INDEX idx_certificates_blind_id ON certificates(blindId);

CREATE INDEX idx_notifications_user_open_id ON notifications(userOpenId);
CREATE INDEX idx_notifications_status ON notifications(status);

CREATE INDEX idx_audit_trail_entity ON audit_trail(entityType, entityId);
CREATE INDEX idx_audit_trail_project_id ON audit_trail(projectId);
CREATE INDEX idx_audit_trail_blind_id ON audit_trail(blindId);

INSERT IGNORE INTO `sbts_schema_versions`
  (`version`, `label`, `appliedByOpenId`, `notes`)
VALUES
  ('17.4.0', 'Production Hardening Indexes', 'system', 'Adds operational indexes for permissions, workflow, approval, certificate, notification, and audit performance.');
