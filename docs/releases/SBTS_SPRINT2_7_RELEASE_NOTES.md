# SBTS Sprint 2.7 — Smart Employee Picker

## Purpose
This release improves **Project Setup → Phase Task Assignment** so it remains clean and professional even when the employee list grows to 100+ people.

## What Changed

### Phase Task Assignment
- Replaced the old large employee-card grid with a **Smart Employee Picker**.
- Employees are no longer all displayed at once.
- Supervisor selects the phase and authorized role, then searches by:
  - Employee name
  - Badge / Signature ID
  - Specialty
  - Status
- Search results are limited to the top 6 matches to avoid visual clutter.
- Selected employees are shown in a separate **Authorized for this Phase** panel.
- Selected employees can be removed cleanly using a Remove button.
- Gate badges are still displayed for audit clarity.

## Operational Logic
The supervisor configures exactly who is authorized to update each phase. In Blind Details, phase update remains controlled by the authorized badge/signature list.

## Why This Is Better
- Works better for 100+ employees.
- Cleaner UX for supervisors.
- Better future fit for database-backed employee search.
- Ready for Sprint 3 backend enforcement.

## Next Step
Sprint 3 — Backend Workflow Engine & Approval Gate:
- Move phase assignments from localStorage to database tables.
- Validate phase-update signatures on the backend.
- Add role/permission gate for phase updates.
- Add approval and torque requirements per phase.
