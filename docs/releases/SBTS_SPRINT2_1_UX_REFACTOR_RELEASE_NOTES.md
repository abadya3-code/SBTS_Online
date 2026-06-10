# SBTS Sprint 2.1 — UX Refactor & Patch 47.48 Workflow Alignment

## Reference
This sprint uses `SBTS_v1.0_patch47.48_actor_clickable_users_filter` as the product behavior reference and rebuilds the idea inside the current React + TypeScript + Vite + Tailwind + Wouter + tRPC/Drizzle-ready architecture.

## What changed

### 1. Areas separated from Projects
- Added a dedicated `/areas` page.
- Area creation is now independent using an Add Area modal.
- Project creation no longer contains Area creation.
- Sidebar navigation now has separate `Areas` and `Projects` entries.

### 2. Projects page cleaned
- `/projects` is now a Project Register only.
- Add Project opens a clean modal.
- Project cards open a dedicated Project Dashboard.
- New route: `/projects/:id`.

### 3. Project Dashboard added
- Added `ProjectDetails.tsx`.
- Project page is now a dashboard, not a form page.
- Add Blind is a button that opens a modal.
- Project dashboard shows project KPIs, scope, and blinds table.

### 4. Blinds Registry cleaned
- Add Blind form removed from the main page body.
- Add Blind is now a modal action.
- Added filters for project, phase, and search.
- Registry focuses on search, filter, QR, and open details.

### 5. Blind Details rebuilt around patch47.48 behavior
- Rebuilt workflow timeline to show phase rows with status.
- Added Phase Update Gate modal.
- Tight & Torque phase now prompts for torque fields in the modal.
- Added clickable Actor filter in Activity Log.
- Added Action filter in Activity Log.
- Logs are more readable: action, from → to phase, actor, remarks, timestamp.
- Added Final approvals placeholder row for Sprint 3.

## Technical notes
- No database migration was required for Sprint 2.1.
- Current data still uses the Sprint 2 Core API and Demo Store fallback.
- Torque data is currently appended into the phase movement remarks. Dedicated torque persistence should be added in Sprint 3.
- `pnpm install` could not be executed in the build container because registry access is blocked, but TypeScript syntax-level checking was attempted; unresolved-module errors are expected without node_modules.

## Run
```powershell
pnpm install
pnpm dev
```

## Recommended next sprint
Sprint 3 — Workflow Engine & Approval Gate:
- Real approval records.
- Real torque records table/API.
- Phase gate rules from Workflow Studio.
- Prevent movement if required approval or torque is missing.
- Certificates start reading real workflow/approval/torque data.
