# SBTS Sprint 17 Final Closure — Online Evidence, E2E Automation, Type Safety

## Purpose

This sprint closes the remaining comprehensive-report items:

1. Documented online testing.
2. E2E automation for the pilot-critical flows.
3. Full removal of legacy TypeScript `any` from active application source.
4. Print and certificate regression protection.

## E2E Coverage

The Playwright suite covers:

- Admin login and operational smoke navigation.
- Admin-only Monitoring page.
- AccessControl page no longer using local-only mock persistence text.
- User preferences evidence page.
- Admin / Supervisor / Technician role matrix.
- Print/certificate regression smoke guard.

## Required Environment Variables

```env
SBTS_E2E_BASE_URL=https://sbts-online.up.railway.app
SBTS_E2E_ADMIN_USERNAME=admin
SBTS_E2E_ADMIN_PASSWORD=<admin password>
SBTS_E2E_SUPERVISOR_USERNAME=<optional supervisor user>
SBTS_E2E_SUPERVISOR_PASSWORD=<optional supervisor password>
SBTS_E2E_TECHNICIAN_USERNAME=<optional technician user>
SBTS_E2E_TECHNICIAN_PASSWORD=<optional technician password>
```

Supervisor and Technician credentials are optional for smoke runs, but mandatory for formal closure.

## Commands

```bash
pnpm install --no-frozen-lockfile
pnpm e2e:install
pnpm audit:final
pnpm build
railway run pnpm db:verify
pnpm e2e:online
pnpm e2e:evidence
```

## Type Safety Closure

The active source tree was cleaned from legacy `as any`, `: any`, and `any[]` usage. Print/certificate files now use typed models from:

```txt
client/src/types/operationalModels.ts
```

## Print Regression Guard

The print components keep flexible but typed models:

- `PrintableBlind`
- `PrintableProject`
- `CertificateRecord`
- `WorkflowLogRecord`
- `TorqueRecord`
- `ApprovalRecord`

This removes `any` without changing the visual certificate/tag layout.

## Final Closure Status

Once `pnpm e2e:online` passes against Railway and the evidence markdown is generated, the comprehensive report can be considered closed for pilot-readiness, pending only external cybersecurity review if required by corporate governance.
