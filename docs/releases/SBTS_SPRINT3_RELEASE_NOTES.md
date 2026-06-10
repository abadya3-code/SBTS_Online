# SBTS Sprint 3 — Backend Workflow Engine & Approval Gate

## Goal
Move phase authorization from frontend/local-only behavior into the backend model so the system becomes connected and ready for PostgreSQL/Node production wiring.

## Added Backend Core

### Employee Directory
New backend/API model:

- Employee ID
- Badge / Signature ID
- Full name
- Role key
- Specialty
- Department
- Shift
- Status
- Photo URL placeholder
- Initials
- Certification flag

New API:

```txt
core.employees
```

### Project Phase Assignment Gate
New backend/API model:

- Project ID
- Phase key
- Authorized role
- Authorized employee badge list
- Supervisor note
- Assigned by
- Updated at

New APIs:

```txt
core.phaseAssignments
core.savePhaseAssignments
core.phaseGatePreview
```

## Backend Validation Added

`core.moveBlindPhase` now validates before moving a blind:

1. The project has a phase assignment for the target phase.
2. The submitted role matches the authorized role.
3. The entered Signature ID / Badge No. exists in the authorized badge list.
4. The badge exists in the Employee Directory.
5. Tight & Torque phase requires PSI and Tool/Machine ID.
6. Successful move writes workflow log with the signer badge and role.
7. Tight & Torque also creates a torque record in DB mode.

## Frontend Connected

### Project Dashboard → Project Setup → Phase Task Assignment
The Smart Employee Picker now reads employees from the backend API and saves assignments to backend/demo store.

### Blind Details → Update Phase
The modal now sends the full backend-gate payload:

- Target phase
- Authorized role
- Signature/badge
- Remarks
- Torque type
- PSI
- Tool/Machine ID
- Technician name/badge

The backend is now the final authority, not the UI.

## Database Migration
Added:

```txt
drizzle/0004_sprint3_workflow_gate.sql
```

New tables:

```txt
employees
project_phase_assignments
```

## Demo Mode
If `DATABASE_URL` is not configured, Sprint 3 still works using an in-memory demo store so the UI can be tested locally before PostgreSQL connection.

## Next Sprint Recommendation
Sprint 4 should focus on:

```txt
Approval Center
Pending Approval Inbox
Certificate Gate
Torque records display
Audit log hardening
```
