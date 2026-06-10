# SBTS Sprint 2 — CRUD Core & Blind Details

## Purpose
Sprint 2 moves SBTS from read-only database core into the first usable field workflow scenario:

Create Area → Create Project → Create Blind → Open Blind Details → Move Phase → Write Activity Log.

## Completed

### Backend / tRPC
- Added `core.createArea` mutation.
- Added `core.createProject` mutation.
- Added `core.createBlind` mutation.
- Added `core.blindDetail` query.
- Added `core.moveBlindPhase` mutation.
- Added Demo Store fallback so CRUD works during local testing without `DATABASE_URL`.
- Added activity-log creation for blind creation and phase movement.

### Frontend
- Upgraded `Projects & Areas` page with:
  - Create Area form.
  - Create Project form.
  - Live project cards.
  - Navigation to filtered blind context.
- Upgraded `Blinds Registry` page with:
  - Create Blind form.
  - Project / Area linkage.
  - Phase / role / priority selection.
  - Action button to open Blind Details.
- Added new `BlindDetails.tsx` page with:
  - Operational snapshot.
  - QR field placeholder.
  - Workflow progress visualization.
  - Move Phase form.
  - Activity Log.
- Added route `/blinds/:id`.

## Local Run

```powershell
pnpm install
pnpm dev
```

Open the local URL shown in the terminal.

## Important Notes
- Without `DATABASE_URL`, records are stored in server memory only. They persist while the dev server is running and reset after restart.
- With `DATABASE_URL`, the existing Drizzle schema is used for real tables.
- I could not run full dependency install in this environment because pnpm was unavailable and the container could not download it from npm registry. I performed static review and syntax-level checks on the edited files.

## Next Sprint Recommendation
Sprint 3 — Workflow Engine & Approval Gate

Recommended scope:
1. Enforce phase transition sequence.
2. Require role-based permission before phase movement.
3. Add approval records per phase.
4. Add torque modal for `tightTorque` phase.
5. Add certificate preview foundation.
