# SBTS Sprint 11 — Production Database Persistence Plan

## Goal
Move SBTS from demo/local fallback behavior toward a database-backed application while keeping the current user workflow simple.

## What Sprint 11 adds
- Production persistence metadata tables.
- File upload reference table for future logo/avatar storage.
- User preferences table for profile/theme/avatar persistence.
- Persistence event table for database hardening traceability.
- API endpoint: `core.persistenceStatus`.
- CLI check: `pnpm db:status`.
- Migration: `drizzle/0012_sprint11_production_persistence.sql`.

## What remains intentionally deferred
Asset Hierarchy is not added to the user workflow in this sprint. It can be introduced later as an optional layer:
`Area → System → Asset / Equipment → Line → Project → Blind`.

## Persistence domains covered by the current schema
- Areas
- Projects
- Blinds
- Workflow logs
- Phase assignments
- Approvals
- Torque records
- Certificates
- Notifications
- Audit trail
- System settings
- User preferences
- File uploads metadata

## Recommended local setup
```powershell
pnpm install
copy .env.example .env
# edit DATABASE_URL
pnpm db:push
pnpm db:status
pnpm qa:full
pnpm dev
```

## Production hardening checklist
- Confirm `DATABASE_URL` points to an approved MySQL-compatible database.
- Run migrations against a clean database.
- Test create/edit/delete for Areas, Projects, and Blinds.
- Test phase update and torque record persistence.
- Test approval creation and approval decision persistence.
- Test certificate save/print history persistence.
- Test settings save and reload after server restart.
- Replace Data URL logo/avatar fallback with production object/file storage.
- Enforce backend authorization for every critical mutation.


## Sprint 11.1 verification layer

Sprint 11.1 adds database verification commands:

```powershell
pnpm db:verify:readonly
pnpm db:verify
pnpm db:verify:commit
pnpm qa:db
```

Use `pnpm db:verify` as the default safe check because it performs a rollback write smoke test.

Use `pnpm db:verify:commit` only when you want to prove commit/read/delete behavior on a test database.
