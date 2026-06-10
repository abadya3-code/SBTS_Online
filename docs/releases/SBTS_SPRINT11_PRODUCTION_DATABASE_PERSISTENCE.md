# Sprint 11 — Production Database Persistence

## Summary
This sprint begins the transition from demo-friendly MVP behavior to production database persistence.

## Added
- New Drizzle schema tables:
  - `sbts_schema_versions`
  - `file_uploads`
  - `user_preferences`
  - `production_persistence_events`
- New migration:
  - `drizzle/0012_sprint11_production_persistence.sql`
- New backend API:
  - `core.persistenceStatus`
- New database status script:
  - `pnpm db:status`
- New production persistence plan:
  - `docs/PRODUCTION_DATABASE_PERSISTENCE_PLAN.md`
- New `.env.example`

## Important design decision
Asset Hierarchy is deferred. Sprint 11 focuses on persistence stability first so users can continue learning the existing flow:
`Area → Project → Blind → Workflow → Approval → Certificate`.

## Test sequence
```powershell
pnpm install
pnpm qa:static
pnpm check
pnpm build
pnpm db:status
pnpm dev
```

## Known note
Without `DATABASE_URL`, SBTS continues to run in demo mode. This is intentional for local presentations and training.
