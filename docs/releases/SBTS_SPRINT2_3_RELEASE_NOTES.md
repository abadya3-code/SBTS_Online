# SBTS Sprint 2.3 — Project Management + Slip Blind Dashboard

## Purpose
This sprint corrects the flow based on field/owner feedback:
- Areas and Projects stay separated.
- Projects opened from an Area show only projects under that Area.
- Project status is not entered manually anymore; it is derived from progress inside the project.
- Blinds are added only from the Project Dashboard.
- The general Blinds Registry route is removed from navigation to reduce confusion.
- A dedicated Slip Blind Dashboard was added based on the original patch47.48 idea.

## Changes

### Projects Page
- Add Project is a clean modal.
- Project status field was removed from the Add/Edit form.
- Status now follows calculated progress:
  - No blinds: Planning
  - 1%–84%: Active
  - 85%–99%: Final Review
  - 100%: Completed
- Added Edit Project.
- Added Delete Project.
- Delete is blocked if the project has linked blinds.
- Area cards still open `/projects?area=<area-id>`.

### Project Dashboard
- Add Blind modal no longer contains Blind Status.
- Add Blind modal no longer contains Owner/Responsible Role.
- Blind status and owner remain workflow-driven.
- Added Bulk Add from Excel / pasted rows.
- Bulk columns:
  `Blind No, Tag No, Line No, Size, Rating, Type, Priority, Location Note`

### Blinds Registry
- Removed from sidebar navigation.
- `/blinds/:id` remains active for Blind Details links.
- General blind creation is intentionally project-only.

### Slip Blind Dashboard
- New route: `/slip-blinds`
- Added sidebar navigation item: Slip Blind.
- Layout follows patch47.48 concept:
  - KPI summary: Total, Completed, In Progress
  - Area cards
  - Project cards within selected Area
  - Slip Blind table within selected Project
  - Selection counter and clear selection
  - Open Blind Details action

### Backend / Core API
- Added `core.updateProject`.
- Added `core.deleteProject`.
- Project status/progress is computed from blinds and workflow phase position.

## Run
```powershell
pnpm install
pnpm dev
```
