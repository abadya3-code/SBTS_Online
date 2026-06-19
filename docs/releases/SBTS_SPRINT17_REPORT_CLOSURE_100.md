# SBTS Sprint 17 Report Closure — Transactions, Role Matrix, User Preferences

## Scope
This release closes the remaining report items that were still partial after Sprint 17.10 / 17.11:

1. Sensitive-operation transactions
2. Admin / Supervisor / Technician test matrix
3. Database-backed user preferences

## 1. Sensitive-operation transactions

The following operations now have transaction boundaries that include the core data mutation plus audit trail and operational notification writes:

| Operation | Transaction contents |
|---|---|
| `moveBlindPhase` | Blind phase update, torque record when applicable, workflow log, final-approval request creation, audit trail, notification |
| `approveWorkflowRequest` | Approval status update, workflow log, final-tight completion update, audit trail, notification |
| `issueCertificate` | Supersede older certificates, insert certificate, workflow log, audit trail, notification |
| `saveAccessRoleModel` | Update role menus/phases, replace role permissions, audit trail |
| `saveProjectPhaseAssignments` | Replace project phase assignments atomically |
| `saveUserPreferences` | Upsert user preferences and audit trail |

## 2. Admin / Supervisor / Technician test matrix

### Admin
Expected result:
- Can open Access Control, Monitoring, Settings, User Management, Audit Trail.
- Can see all Areas / Projects / Blinds.
- Can save role model.
- Can issue/print certificate when approval rules allow it.
- Can view `/monitoring`.

### Supervisor / Coordinator
Expected result:
- Can see only assigned Area / Project scope.
- Can manage project/blind records only within scope.
- Can approve or move phases only when role and phase permissions match.
- Cannot open Access Control or Monitoring.
- Cannot bypass certificate lock.

### Technician
Expected result:
- Can see only assigned projects.
- Can move only authorized phase and only with own badge signature.
- Cannot use another employee badge.
- Cannot open Access Control, Monitoring, System Settings, User Management, or Audit Trail.
- Cannot issue certificate.
- Cannot mutate a blind after certificate lock.

## 3. User preferences

User Profile now persists preferences to `user_preferences`:

- Display name
- Recovery email
- Specialty description
- Avatar Data URL
- Theme preference mode
- Preferred theme template
- Accent color
- Interface mode: Light / Dark / System
- Command Search enabled/disabled
- Keyboard Shortcuts enabled/disabled

Preferences are mirrored to local storage for immediate UI response, but the database is now the source of truth after login.

## Acceptance checks

Run:

```bash
pnpm audit:report-closure
pnpm build
railway run pnpm db:verify
```

Then validate online:

1. Login as Admin and save User Profile preferences.
2. Confirm row exists in `user_preferences`.
3. Confirm audit row action `User preferences saved`.
4. Login as Admin and run phase move, approval, certificate issue.
5. Confirm workflow/audit/notification records are written.
6. Login as Technician and confirm restricted pages/actions are blocked.

## Notes

This release does not remove all legacy `any` usage. Type cleanup remains staged because print layouts, legacy settings, and SDK wrappers should be refactored safely without breaking certificate/tag output.
