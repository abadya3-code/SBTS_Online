# SBTS Sprint 17.9 — UX & Operator Navigation

## Scope

Sprint 17.9 improves operator experience without changing the authorization model or bypassing backend permission enforcement.

This release focuses on:

- Dark Mode with Light / Dark / System options
- Breadcrumbs for operator navigation
- Keyboard Shortcuts and command search
- User Preferences stored safely in the browser
- UX polish that does not weaken security controls

## What changed

### Dark Mode

A switchable `ThemeProvider` now supports:

- `light`
- `dark`
- `system`

The selected theme is stored in local storage under `sbts.themeMode.v1` and applied using the root `dark` class.

### Breadcrumbs

`OperatorBreadcrumbs` was added to the application shell so operators can understand their location inside the operational hierarchy:

`Dashboard → Projects → Project ID → Blinds → Blind ID → Certificate`

### Keyboard Shortcuts

`KeyboardShortcuts` was added globally for authenticated users.

Supported shortcuts:

- `Ctrl + K` / `Cmd + K` — open command search
- `/` — open navigation search
- `Esc` — close command search
- `G` then `D` — Dashboard
- `G` then `A` — Areas
- `G` then `P` — Projects
- `G` then `I` — Inbox
- `G` then `S` — Settings
- `G` then `R` — Reports

No destructive or approval operation is bound to a keyboard shortcut.

### User Preferences

The user profile preference model now includes optional fields for interface theme and shortcut preferences. The sprint stores preferences locally and does not expose any additional backend route.

## Security notes

Sprint 17.9 does not change:

- `publicProcedure`
- `protectedProcedure`
- `adminProcedure`
- Access Control persistence
- Project / Area ownership checks
- Phase authorization
- Certificate lock enforcement

All UX changes sit above the existing backend controls.

## QA checklist

1. Login as admin.
2. Toggle Light, Dark, and System theme modes.
3. Refresh the browser and confirm the selected mode persists.
4. Open Dashboard / Areas / Projects / Blind Details and confirm breadcrumbs appear.
5. Press `Ctrl + K` and navigate to Projects.
6. Press `G` then `D` and confirm Dashboard opens.
7. Press `Esc` and confirm command search closes.
8. Confirm Print Tag / Print Certificate output is not visually polluted by breadcrumbs or theme controls.
9. Login as non-admin and confirm shortcuts only show visible navigation items.
10. Confirm Access Control remains admin-locked.

## Commands

```bash
pnpm audit:17.9
pnpm build
```

Then deploy normally:

```bash
git add .
git commit -m "Sprint 17.9 UX and operator navigation"
git push
```
