# SBTS Sprint 17.11 — Type Safety Cleanup

## Scope

Sprint 17.11 starts the Type Safety cleanup by removing unsafe casts from the security-sensitive backend path and adding a no-regression audit.

## Completed in this package

- Replaced `ctx.user as any` usage in `server/routers.ts` and `server/_core/trpc.ts`.
- Added typed `AuthSessionUser` usage in router helpers.
- Removed duplicate self-registration schema field.
- Replaced IME composition `any` casts in shared UI input/dialog components.
- Reworked `usePersistFn` to avoid explicit `any`.
- Added `scripts/sprint17-11-type-safety-static.mjs` to prevent unsafe backend regression.

## Important Note

This sprint does not claim that every legacy UI file is fully typed yet. The remaining `any` usage is concentrated in print layouts, settings forms, and legacy generated SDK adapters. Those are lower risk than the auth/router/security path and should be cleaned in follow-up micro-patches.

## Recommended follow-up sequence

1. `17.11.1` — Print layout DTO types.
2. `17.11.2` — System settings DTO and theme DTO.
3. `17.11.3` — User Management DTO.
4. `17.11.4` — Certificate / Tag DTO.
5. `17.11.5` — SDK adapter isolation.

## Acceptance Test

```bash
pnpm audit:17.11
pnpm check
pnpm build
```
