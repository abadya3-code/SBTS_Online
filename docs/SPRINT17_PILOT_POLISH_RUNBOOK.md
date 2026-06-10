# Sprint 17 — Pilot Polish, User Approval, Tag Designer Pro & Print/PDF Professionalization

## Purpose
Sprint 17 improves the live pilot experience before wider testing. It focuses on items visible to users and management: identity, user approvals, version display, inbox behavior, tag layout control, certificate dates, and professional print/PDF output.

## Main changes

### Application identity
- Added `client/public/app-icon.svg`.
- Added browser favicon reference in `client/index.html`.
- Added editable version/release fields in System Settings:
  - Application Version
  - Release Name
  - Release Year
- AppShell now reads the version/release from System Settings instead of showing a hard-coded version.

### Header cleanup
- Removed the raw `production-bound` label from the normal topbar.
- The system can still internally distinguish live database vs demo sessions, but the normal user header shows a clean user/role display.

### User approval workflow
- Self-registration now creates a `Pending` user request.
- The credential is stored as `Pending` and does not become active until admin approval.
- User Management includes Pending status and a quick Approve action.
- When admin sets the user to Active, the matching credential is activated.

### Tag Designer Pro
- Added a live layout editor for the tag preview.
- Layers can be selected and positioned with X/Y controls:
  - Title
  - Logo
  - Hole
  - QR
  - Data block
- This is a pilot-ready editor layer. Coordinates are currently UI-level; persisted per-layer coordinates can be added later through a schema migration.

### Print/PDF improvements
- Strengthened tag print CSS for fixed 11 cm × 7 cm output.
- Tightened certificate print layout for one-page A4 portrait output.
- Improved report print sizing and compact table behavior.
- Added safer date formatting in certificates to avoid `Invalid Date`.

### Sprint wording cleanup
- Removed user-facing Sprint labels from page headers.
- PageHeader also sanitizes any remaining Sprint wording defensively.

## QA commands

```powershell
pnpm polish:static
pnpm qa:polish
pnpm build
```

## Deployment update steps

If there is no database schema change:

```powershell
git status
git add .
git commit -m "Sprint 17 pilot polish and print fixes"
git push
```

Railway will redeploy automatically from GitHub.

If a future update adds database fields:

```powershell
$env:DATABASE_URL="MYSQL_PUBLIC_URL_HERE"
pnpm db:push
pnpm db:verify
git add .
git commit -m "Sprint update with database migration"
git push
```

## Database note
Sprint 17 does not require a new database table. It uses existing varchar status fields and existing system settings JSON storage.

## Manual test checklist
- Login with admin.
- Open Settings and set version/release name.
- Register a new user and confirm it is Pending.
- Approve user from User Management and confirm login works.
- Confirm topbar does not show raw `production-bound`.
- Open Tag Designer and move layers.
- Print a single tag and project tag package.
- Print a certificate and confirm one-page layout.
- Print Reports view and confirm clean A4 output.
