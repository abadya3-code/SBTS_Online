# SBTS Sprint 2.5 — Project Setup & Authorized Phase Update Gate

## Completed changes

### 1. Project Dashboard / Add Blind cleanup
- Removed manual Phase selection from Add Blind.
- Blind creation no longer asks for manual status or responsible owner.
- New blinds start from the system default workflow phase; phase/status/responsibility are controlled by the workflow engine.

### 2. Project Blinds table cleanup
- Removed the Phase column from Project Blinds to reduce noise.
- Added a dedicated Size / Rating column.
- Line column now shows only the line number.

### 3. Project Setup enhancement
- Connected Phase Task Assignment as a real setup modal.
- Supervisor/admin can define, per project and phase:
  - authorized role
  - authorized badge/signature IDs
  - supervisor note
- Saved locally using a project-specific localStorage key and ready to migrate to PostgreSQL tables later.

### 4. Blind Details cleanup
- Removed Current Owner from Operational Snapshot.
- Kept status, project, area, line, size/rating, type, priority, QR, and location.

### 5. Professional Phase Update Gate
- Update Phase now requires Signature ID / Badge No.
- The signature must exist in Project Setup → Phase Task Assignment for the selected target phase.
- The modal displays the authorized role and allowed signatures for the selected phase.
- Torque phase still requires PSI and Tool/Machine ID.
- Activity log records the signature and role.

## Important operating rule
Phase update is no longer a free manual action. The project supervisor must first authorize phase updaters in Project Setup. Then only those signatures can update the related phase.

## Next recommended sprint
Sprint 3 — Backend Workflow Engine & Approval Gate:
- Move Phase Task Assignment from localStorage to database tables.
- Add user profiles and real badge identity.
- Add approval gates.
- Add torque records as a proper table.
- Add phase-by-phase permissions validation on the backend.
