-- Sprint 7 — Notifications + Inbox Actions + Certificate/Tag Audit Trail
-- Adds action metadata to notifications and a dedicated immutable audit trail.

ALTER TABLE notifications
  ADD COLUMN actionUrl varchar(500) NULL,
  ADD COLUMN severity varchar(40) NOT NULL DEFAULT 'info';

CREATE TABLE IF NOT EXISTS audit_trail (
  id int AUTO_INCREMENT PRIMARY KEY,
  entityType varchar(80) NOT NULL,
  entityId varchar(120) NOT NULL,
  projectId varchar(48) NULL,
  blindId varchar(48) NULL,
  action varchar(160) NOT NULL,
  actorOpenId varchar(64) NULL,
  actorName varchar(180) NULL,
  actorRoleKey varchar(80) NULL,
  summary text NOT NULL,
  beforeJson text NULL,
  afterJson text NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entity ON audit_trail(entityType, entityId);
CREATE INDEX idx_audit_project ON audit_trail(projectId);
CREATE INDEX idx_audit_blind ON audit_trail(blindId);
