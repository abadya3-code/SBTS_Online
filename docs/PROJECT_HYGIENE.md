# Sprint 10.4.5 — Project Hygiene & Dependency Cleanup

## Completed

- Moved sprint release notes from the project root to `docs/releases/`.
- Moved working notes to `docs/notes/`.
- Moved legacy Python helper scripts to `tools/legacy/`.
- Removed the development-only Manus debug collector from `vite.config.ts`.
- Removed `@builder.io/vite-plugin-jsx-loc` and `vite-plugin-manus-runtime` from the Vite pipeline.
- Removed unnecessary dev dependencies from `package.json`:
  - `@builder.io/vite-plugin-jsx-loc`
  - `vite-plugin-manus-runtime`
  - `pnpm`
  - `add`
- Renamed internal browser storage key from `manus-runtime-user-info` to `sbts-session-user-info`.
- Updated `.gitignore` for local debug/runtime artifacts.
- Added a clean `README.md`.

## Expected result

The following warnings should be reduced or removed after reinstalling dependencies:

- Deprecated subdependency warnings related to `@esbuild-kit/*` coming from the old Builder plugin.
- Vite peer dependency warning from `@builder.io/vite-plugin-jsx-loc` expecting Vite 4/5 while the app uses Vite 7.

## What to run after extracting this version

```powershell
pnpm install
pnpm dev
```

Optional checks:

```powershell
pnpm check
pnpm build
```

## Notes

The existing `pnpm-lock.yaml` may still contain old entries until `pnpm install` refreshes it locally. That is normal. The source of truth for installed packages is now the cleaned `package.json`.
