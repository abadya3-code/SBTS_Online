-- Sprint 17.7.2 - Blinds priority schema alignment
-- Keeps fresh Railway MySQL databases aligned with the Sprint 17.7 verification smoke test.
ALTER TABLE blinds
ADD COLUMN priority ENUM('Low', 'Normal', 'High', 'Critical') NOT NULL DEFAULT 'Normal';
