# SBTS Sprint 2.6 — Phase Assignment Employee Picker

## Purpose
This patch improves Project Setup → Phase Task Assignment before starting Sprint 3.

## Changes
- Replaced manual comma-separated signature input with a professional employee-card selector.
- Each phase now shows authorized employee cards with:
  - visual avatar / initials
  - employee name
  - badge/signature ID
  - specialty
  - availability status
- Authorized Role filters the visible employee list.
- Selected employee badges are saved into the same project phase assignment storage.
- Blind Details now displays the authorized employee cards in the Update Phase modal.
- Clicking an authorized employee card fills the signature/badge field automatically.
- The phase gate still validates the badge/signature before allowing phase movement.

## Important
This is still frontend/local project setup validation. Sprint 3 will move this into the backend/database with PostgreSQL-ready tables and API validation.

## Next Sprint
Sprint 3 — Backend Workflow Engine & Approval Gate:
- project_phase_assignments table
- project_phase_authorized_users table
- workflow transition validation API
- approval gate API
- torque gate API
- audit log on every phase movement
