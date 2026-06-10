# SBTS Sprint 11.1 — Database Binding Verification & Persistence QA Runbook

## Purpose

Sprint 11.1 verifies that the production database binding is real and safe before SBTS is used as an operational system.

The goal is not to add new business features. The goal is to prove that core SBTS data survives refresh, restart, and deployment.

## New commands

```powershell
pnpm db:status
pnpm db:verify:readonly
pnpm db:verify
pnpm db:verify:commit
pnpm qa:db
```

## Recommended order

```powershell
pnpm install
copy .env.example .env
# Edit DATABASE_URL
pnpm db:push
pnpm db:status
pnpm db:verify:readonly
pnpm db:verify
pnpm check
pnpm build
pnpm dev
```

## What each command does

### `pnpm db:status`
Checks whether the expected persistence tables exist.

### `pnpm db:verify:readonly`
Checks table and column existence only. It does not write test data.

### `pnpm db:verify`
Runs schema checks and a rollback write smoke test. It verifies that the DB accepts inserts across critical SBTS domains, then rolls back.

### `pnpm db:verify:commit`
Runs a commit smoke test, reads the test data back, then deletes the test data. Use this after you trust the connection and want a stronger persistence check.

### `pnpm qa:db`
Runs `db:status` and `db:verify`.

## Domains verified

- Areas
- Projects
- Blinds
- Blind workflow logs
- Phase assignments
- Approvals
- Torque records
- Certificates
- Notifications
- Audit trail
- System settings
- Employees
- Auth sessions
- User preferences
- File upload references
- Production persistence events

## Manual verification checklist

1. Start the application in Database Mode.
2. Create an Area.
3. Restart the server.
4. Confirm the Area remains.
5. Create a Project.
6. Restart the server.
7. Confirm the Project remains.
8. Add a Blind.
9. Restart the server.
10. Confirm Blind Details, workflow log, QR link, and related Project Dashboard remain correct.
11. Configure Phase Task Assignment.
12. Update Phase using an authorized badge.
13. Confirm workflow log persists.
14. Enter Torque data.
15. Confirm Torque Records persist.
16. Generate Approval request.
17. Approve or reject.
18. Confirm Approval Center and Audit Trail persist.
19. Save Certificate.
20. Confirm certificate record remains after restart.
21. Save System Settings.
22. Confirm logo/settings/theme remain after restart.

## Production acceptance rule

Before real use, SBTS must pass:

```powershell
pnpm qa:static
pnpm db:verify
pnpm check
pnpm build
```

And the manual checklist must pass on a clean database.
