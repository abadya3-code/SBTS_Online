# SBTS Sprint 17.10 — Observability & Error Logging

## Scope

Sprint 17.10 adds production observability without changing permission rules or workflow business logic.

## Added

- Server observability module: `server/_core/observability.ts`
- Optional Sentry server initialization using `SENTRY_DSN`
- Optional Sentry client initialization using `VITE_SENTRY_DSN`
- Runtime request timing middleware
- tRPC `onError` capture
- Frontend global error and unhandled rejection capture
- React ErrorBoundary error capture
- `/api/client-error` endpoint for client-side error reports
- Admin-only `/monitoring` dashboard
- `core.performanceMonitoring` tRPC route guarded by `adminProcedure`

## Railway Variables

```env
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=17.10
SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=17.10
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05
```

Leaving DSN values blank is safe. The monitoring dashboard still works with runtime metrics and database security events.

## Acceptance Test

1. Login as Admin.
2. Open `/monitoring`.
3. Confirm database status appears.
4. Confirm Sentry status is either `Enabled` or `Not set`.
5. Navigate through Dashboard / Projects / Reports.
6. Return to `/monitoring` and verify route metrics are populated.
7. Trigger a harmless UI error during development only and verify it appears under Recent Errors.

## Security Boundary

- `/monitoring` is Admin-only in the UI.
- `core.performanceMonitoring` is `adminProcedure` on the server.
- No project/area/phase/certificate permission logic was weakened.
