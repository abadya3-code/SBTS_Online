# Sprint 11.1 — Database Binding Verification & Persistence QA

## Summary

This sprint adds verification tooling and QA guidance to prove that SBTS can operate against a real database before production use.

## Added

- `scripts/db-verify-persistence.mjs`
- `pnpm db:verify`
- `pnpm db:verify:readonly`
- `pnpm db:verify:commit`
- `pnpm qa:db`
- `docs/PERSISTENCE_QA_RUNBOOK.md`

## Verification levels

### Read-only verification
Checks table and column presence without writing data.

### Rollback smoke verification
Writes test data across critical SBTS domains inside a transaction and rolls back.

### Commit smoke verification
Writes test data, reads it back, commits, then cleans up.

## Why this matters

Sprint 11 created the persistence foundation. Sprint 11.1 verifies the binding before expanding security, approvals, PDFs, or Asset Hierarchy.

## Asset Hierarchy

Still deferred. This sprint keeps the user workflow focused on:

`Area → Project → Blind → Workflow → Approval → Certificate`

## Recommended command sequence

```powershell
pnpm install
pnpm db:push
pnpm db:status
pnpm db:verify
pnpm check
pnpm build
pnpm dev
```
