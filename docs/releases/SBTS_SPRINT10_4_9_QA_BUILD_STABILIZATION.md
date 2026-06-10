# Sprint 10.4.9 — QA & Build Stabilization

## Purpose
This sprint stabilizes the current UI-heavy MVP before the next backend/database hardening step.

## What changed
- Removed `node_modules` from the delivery package.
- Added `scripts/qa-static.mjs` to catch project hygiene issues before build.
- Added package scripts:
  - `pnpm qa:static`
  - `pnpm qa:full`
- Verified that old development/helper UI phrases are not present.
- Verified that root release notes are kept under `docs/releases`.
- Confirmed the app shell exposes a version stamp.

## Recommended local QA sequence
```powershell
pnpm install
pnpm qa:static
pnpm check
pnpm build
pnpm dev
```

## Manual test path
1. Login as Admin.
2. Confirm sidebar logo, company identity, and version stamp.
3. Open Dashboard, Areas, Projects, Project Dashboard, Blind Details.
4. Test Settings save and theme switching.
5. Test Tag print, Certificate print, Reports print view.
6. Confirm no demo helper banners are visible in operational pages.

## Known note
If package installation warns about deprecated nested dependencies from `drizzle-kit`, this is a tooling warning and does not block the SBTS application. Keep `drizzle-kit` until the database migration strategy is finalized.
