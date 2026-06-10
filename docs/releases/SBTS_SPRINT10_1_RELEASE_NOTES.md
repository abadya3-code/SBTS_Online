# SBTS Sprint 10.1 — System Settings Center

## Purpose
Sprint 10.1 introduces a professional admin-only **System Settings Center** to centralize global SBTS defaults before moving deeper into production database persistence.

## New Route
- `/settings` — Admin locked by `AdminRouteGate`.

## Navigation
- Added **Settings** to the sidebar for Admin users only.
- Non-admin users do not see Settings and cannot open it directly.

## Settings Tabs
1. **General Settings**
   - System Name
   - Facility / Plant Name
   - Department Name
   - Default Language
   - Date Format
   - Time Format
   - Logo Text

2. **Default Tag Settings**
   - Default tag size
   - QR size
   - Tag / accent / text colors
   - Show/hide default fields: Area, Line, Size, Rating, Project No, Blind Type

3. **Certificate Settings**
   - Certificate title
   - Certificate number format
   - Final approval before issue
   - Show/hide torque, approvals, QR, activity summary, revision number

4. **Notification Settings**
   - New blind
   - Phase update
   - Approval required
   - Certificate issued
   - Tag printed
   - Rejected approval

5. **Security Settings**
   - Session timeout hours
   - QR visitor view
   - Require login for QR actions
   - Admin hard lock
   - Delete action controls
   - Audit trail control

## Backend/API
Added:
- `core.systemSettings`
- `core.saveSystemSettings`

The settings are validated by Zod and saved in demo memory when no database is connected.

## Database Readiness
Added migration:
- `drizzle/0010_sprint10_1_system_settings_center.sql`

Added table:
- `system_settings`

The table stores one global settings payload as JSON so future settings can be extended without redesigning the database every sprint.

## Audit + Notification
Saving settings now creates:
- Audit Trail record
- Inbox notification

## Notes
System Settings are **global defaults**. Project-specific setup remains inside:
- Project Setup
- Tag Designer Settings
- Phase Task Assignment

## Next Recommended Sprint
**Sprint 11 — Production Database Persistence + Real Auth Provider Integration**
