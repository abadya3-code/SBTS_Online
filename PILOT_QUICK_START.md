# SBTS Report Closure 100% Quick Start

Apply this package over your current `SBTS_PRODUCTION_CLEAN` folder.

Do not delete:

- `.git`
- `.env`
- `node_modules`

## Commands

```bash
pnpm install --no-frozen-lockfile
pnpm audit:report-closure
pnpm build
```

Commit and deploy:

```bash
git add .
git commit -m "Sprint 17 report closure transactions matrix preferences"
git push
```

Railway:

```bash
railway run pnpm db:push
railway run pnpm db:verify
railway run pnpm seed:admin
```

## Online validation

- Admin: test Access Control, Monitoring, User Profile, phase move, approval, certificate.
- Supervisor: verify assigned project scope only.
- Technician: verify only assigned phase and own badge signature works.
- User Profile: save interface mode, keyboard shortcuts, and command search preferences.
