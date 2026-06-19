# SBTS Sprint 17 Final Closure

This package closes the final comprehensive-report items:

- Documented online testing evidence
- Playwright E2E automation
- Admin / Supervisor / Technician online test matrix
- Legacy TypeScript `any` cleanup from active source
- Print and certificate regression protection

## Required local checks

```bash
pnpm install --no-frozen-lockfile
pnpm audit:report-closure
pnpm audit:final
pnpm build
```

## Required online checks

```bash
railway run pnpm db:verify
pnpm e2e:install
pnpm e2e:online
pnpm e2e:evidence
```

See `docs/releases/SBTS_SPRINT17_FINAL_ONLINE_E2E_TYPESAFETY.md` and `docs/evidence/ONLINE_TEST_EVIDENCE_TEMPLATE.md`.
