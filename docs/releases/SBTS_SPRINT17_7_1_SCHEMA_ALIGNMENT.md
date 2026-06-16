# SBTS Sprint 17.7.1 — Schema Alignment Hotfix

## Purpose
Fixes `db:verify` failure:

```txt
Unknown column 'priority' in 'field list'
```

## Changes
- Adds `priority` to `production_persistence_events` in `drizzle/schema.ts`.
- Adds migration `drizzle/0017_7_1_persistence_schema_alignment.sql` for existing Railway MySQL databases.

## Deploy Steps

```bash
pnpm build
git add .
git commit -m "Sprint 17.7.1 persistence schema alignment"
git push
railway run pnpm db:push
railway run pnpm db:verify
railway run pnpm seed:admin
```

If the column has already been added manually and `db:push` reports duplicate column, ignore it and rerun `db:verify`.
