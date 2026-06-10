# SBTS Sprint 2.2 — Areas Management Fix

## Scope
This patch fixes the Areas page based on field/UX feedback.

## Changes

### Areas UI
- Removed `Owner` from the Add Area modal.
- Removed owner display from Area cards.
- Area card click now opens the Projects page filtered by that selected area.
- Added explicit `Edit` and `Delete` buttons on each Area card.
- Delete is protected: an area cannot be deleted while linked projects exist.

### Projects UI
- Projects page now reads the `?area=<areaId>` query parameter so it can open already filtered from the Areas page.

### API / Backend
- Added `core.updateArea`.
- Added `core.deleteArea`.
- `core.createArea` no longer requires `ownerRoleKey` from the frontend. Internally it defaults to `coordinator` to keep database compatibility with the current schema.

## Run
```powershell
pnpm install
pnpm dev
```

## Notes
This is a UX correction patch before continuing Sprint 3 Workflow Engine.
