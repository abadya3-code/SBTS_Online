# Sprint 17.8.3 — Security & Permission Closure

## Purpose

This sprint hardens SBTS operational access after the database persistence layer passed verification. It focuses on backend enforcement rather than UI-only restrictions.

## Delivered Controls

1. **Project / Area ownership validation**
   - Authenticated employee sessions now include `projectIds` and `areaIds` derived from `project_phase_assignments`.
   - Area, project, blind, approval, torque, certificate, audit, and report routes are scoped to those assignments.
   - Admin keeps full scope; non-admin users are limited to assigned projects/areas.

2. **Phase authorization hardening**
   - Phase movement requires the role's phase access.
   - Phase movement requires the signature badge to match the authenticated employee badge unless the user is Admin.
   - Existing Project Setup phase assignment validation remains active inside `moveBlindPhase`.

3. **Certificate lock enforcement**
   - Workflow mutation routes check whether a blind is locked by an already issued/printed certificate.
   - Certificate issuing still checks final-approval lock status.
   - Approval and phase changes are blocked after a certificate locks the blind.

4. **Role permission gates**
   - Phase movement requires `blinds.phase.change`.
   - Certificate issuing requires `certificates.manage`.
   - Approval requires `workflow.approve`.
   - Audit trail requires `audit.view`.
   - Report export requires `reports.export`.

5. **Role test matrix foundation**
   - Admin: full visibility and modification rights.
   - Supervisor / Coordinator: scoped projects and phase setup only.
   - Technician: scoped project visibility and own-badge phase update only.

## Validation Commands

```powershell
pnpm audit:17.8.3
pnpm build
railway run pnpm db:verify
```

## Manual Test Matrix

| Test | Admin | Supervisor/Coordinator | Technician |
|---|---:|---:|---:|
| View all areas/projects | Pass | Scoped only | Scoped only |
| Access Control save | Pass | Forbidden | Forbidden |
| Move assigned phase | Pass | If assigned | Own badge only |
| Move unassigned phase | Pass | Forbidden | Forbidden |
| Issue certificate | Pass if approvals complete | Permission required | Forbidden |
| Edit after certificate issued/printed | Override only | Blocked | Blocked |
| View audit trail | Pass | Permission required | Permission required |

## Notes

This sprint intentionally does not remove remaining mock data from Dashboard or Workflow Studio. That should be addressed in a separate UI data-binding sprint after the backend authorization controls remain stable in pilot testing.
