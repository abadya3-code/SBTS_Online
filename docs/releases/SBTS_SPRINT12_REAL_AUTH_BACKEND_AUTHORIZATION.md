# Sprint 12 — Real Authentication & Backend Authorization

## Summary

Sprint 12 adds the backend foundation for real authentication and authorization.

## Added

- `auth_password_credentials`
- `auth_password_reset_tokens`
- `security_events`
- Server-side session lookup from `sbts_auth_sessions`
- Password login API
- Password credential creation API
- Password reset request foundation
- Backend role procedures:
  - `roleProcedure`
  - `coordinatorProcedure`
  - `supervisorProcedure`
- Static authorization QA script:
  - `scripts/auth-security-static.mjs`
- Documentation:
  - `docs/AUTH_BACKEND_AUTHORIZATION_RUNBOOK.md`

## New commands

```powershell
pnpm auth:static
pnpm qa:security
```

## Important

This sprint focuses on backend security foundation. The user-facing login page can still be polished in a following sprint to expose username/password and password reset workflows fully.

## Recommended next sprint

Sprint 12.1 — Authentication UI Binding & Admin Credential Manager.
