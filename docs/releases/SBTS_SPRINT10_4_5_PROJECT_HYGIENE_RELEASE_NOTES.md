# SBTS Sprint 10.4.5 — Project Hygiene & Dependency Cleanup

## Summary

This sprint cleans the project structure and removes development-only dependencies that were creating noisy install warnings and making the root folder hard to maintain.

## Changes

- Moved all sprint release notes to `docs/releases/`.
- Moved working notes to `docs/notes/`.
- Moved legacy helper scripts to `tools/legacy/`.
- Added a clean `README.md` with run commands and project structure.
- Simplified `vite.config.ts` to only use production-relevant Vite plugins:
  - React
  - Tailwind CSS
- Removed development-only Manus/Builder tooling from Vite.
- Removed unused dev dependencies from `package.json`:
  - `@builder.io/vite-plugin-jsx-loc`
  - `vite-plugin-manus-runtime`
  - `pnpm`
  - `add`
- Updated the lockfile importer to match the cleaned package manifest.
- Deleted `client/public/__manus__` debug assets from source.
- Renamed the internal localStorage key to `sbts-session-user-info`.
- Updated `.gitignore` for runtime and debug artifacts.

## Expected install behavior

The old Vite peer dependency warning from `@builder.io/vite-plugin-jsx-loc` should be gone.

A deprecated-subdependency warning may still appear from `drizzle-kit` because that database migration tool currently brings `@esbuild-kit/*` internally. This is not caused by SBTS application code and does not stop the app from running.

## Recommended validation

```powershell
pnpm install
pnpm dev
pnpm check
pnpm build
```
