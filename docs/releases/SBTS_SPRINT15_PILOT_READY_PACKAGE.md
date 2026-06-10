# Sprint 15 — Pilot Ready Package

## Summary
Sprint 15 packages SBTS for controlled pilot readiness.

## Added
- Pilot admin guide
- Pilot user guide
- Pilot checklist
- Deployment notes
- Backup/restore plan
- Known limitations
- Pilot acceptance form
- Sample pilot dataset
- CSV import template
- Pilot readiness static QA

## New commands
```powershell
pnpm pilot:static
pnpm qa:pilot
```

## Recommended pilot validation
```powershell
pnpm install
pnpm db:push
pnpm db:verify
pnpm qa:security
pnpm qa:approval
pnpm qa:print
pnpm qa:pilot
pnpm check
pnpm build
pnpm dev
```

## Pilot scope
This package is intended for controlled pilot usage, training, validation, and management demonstration.

## Not yet full production
Before official production use, SBTS still requires:
- email provider for password reset,
- fine-grained permission hardening,
- production file storage,
- IT-approved backup automation,
- deployment environment sign-off.
