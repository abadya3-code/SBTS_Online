# SBTS Sprint 7 — Notifications + Inbox Actions + Certificate/Tag Audit Trail

## Summary
Sprint 7 connects the operational actions into a traceable notification and audit layer.

## Added
- New **Notification Inbox** page at `/inbox`.
- New **Audit Trail** page at `/audit`.
- Inbox actions: Read, Archive, Restore, and Open related page.
- Notification backend APIs:
  - `core.notifications`
  - `core.updateNotification`
- Audit backend APIs:
  - `core.auditTrail`
  - `core.recordTagPrint`
- Certificate issuance/printing now creates audit records and notifications.
- Tag Designer save now creates audit records and notifications.
- Project tag printing and single tag printing now register audit records.
- Workflow phase updates and approval decisions now create system notifications and audit records.

## Database
Added migration:

`drizzle/0006_sprint7_notifications_audit.sql`

It adds:
- `notifications.actionUrl`
- `notifications.severity`
- new `audit_trail` table

## Navigation
Sidebar now includes:
- Inbox
- Audit Trail

## Next Recommended Sprint
**Sprint 8 — Reports & Export Center**
- Management KPI reports
- Area/project performance report
- Certificate register export
- Tag print register export
- Activity / audit PDF export
