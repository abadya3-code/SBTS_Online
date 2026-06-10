# SBTS Sprint 2.4 — Project Setup & Area Cleanup

## Changes

- Removed manual Area Status from the Add/Edit Area modal.
- Removed Area Status badge from Area cards. Area cards now focus on area identity and linked projects.
- Kept Area cards clickable: Area → filtered Projects page.
- Kept Add/Edit/Delete project controls on Projects page.
- Removed the disabled project status input from Add/Edit Project. Project status stays auto-calculated from progress.
- Project Dashboard header now contains only the Back to Projects button.
- Added Project Setup card directly under Project Scope.
- Moved all project actions into Project Setup:
  - Add Blind
  - Bulk Add from Excel
  - Phase Task Assignment placeholder
  - Export All Tags placeholder
  - Print Certificates placeholder
- Project Blinds card is now display-only; no creation/import buttons inside it.
- Removed responsible/owner field from Add Blind modal. Status and responsibility will be controlled by workflow phases later.

## Next

Sprint 3 should connect Workflow Phase Task Assignment, tag export, and certificate batch printing to real backend logic.
