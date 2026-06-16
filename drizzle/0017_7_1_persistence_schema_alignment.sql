-- Sprint 17.7.1 — Persistence Schema Alignment
-- Purpose: keep db:verify persistence smoke test aligned with production_persistence_events.
-- Existing Railway database may miss this column because it was created before the
-- Sprint 17.7 persistence verification script expected priority.

ALTER TABLE production_persistence_events
ADD COLUMN priority VARCHAR(32) NOT NULL DEFAULT 'normal';
