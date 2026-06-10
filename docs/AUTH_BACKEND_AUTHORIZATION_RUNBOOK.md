# SBTS Sprint 12 — Real Authentication & Backend Authorization Runbook

## Purpose

Sprint 12 starts moving SBTS from UI-only/demo login toward real backend-controlled authentication and authorization.

## What changed

### Real authentication foundation
- Added salted password credential table.
- Added password reset token foundation.
- Added security events table.
- Added server-side session authentication from `sbts_auth_sessions`.
- Added password login endpoint that creates a secure server-side session cookie.

### Backend authorization foundation
Critical mutations are no longer treated as purely public operations.

Protected levels introduced:
- `adminProcedure`
- `coordinatorProcedure`
- `supervisorProcedure`
- `protectedProcedure`

## New backend routes

```txt
core.registerPasswordCredential
core.passwordLogin
core.requestPasswordReset
core.sessionBinding
```

## New database tables

```txt
auth_password_credentials
auth_password_reset_tokens
security_events
```

## New QA commands

```powershell
pnpm auth:static
pnpm qa:security
```

## Recommended sequence

```powershell
pnpm install
pnpm db:push
pnpm db:verify
pnpm auth:static
pnpm qa:security
pnpm check
pnpm build
pnpm dev
```

## Manual test flow

1. Ensure `DATABASE_URL` is configured.
2. Run migrations.
3. Create or confirm an active employee exists.
4. As an admin session, call `core.registerPasswordCredential`.
5. Use `core.passwordLogin` with username/password.
6. Confirm `core.sessionBinding` returns:
   - authenticated = true
   - employeeId
   - badge
   - roleKey
7. Call a protected mutation, for example createBlind.
8. Logout.
9. Confirm protected mutations are rejected.
10. Confirm `security_events` contains login success/failure records.

## Authorization rules applied in this sprint

### Admin only
- Save system settings
- Manage users
- Save tag settings
- Delete area
- Delete project
- Delete workflow

### Coordinator/Admin
- Create/edit areas
- Create/edit projects

### Supervisor/Admin
- Save phase assignments

### Authenticated
- Create blind
- Move phase
- Approve/reject
- Issue certificate
- Record tag/report export

## Still required before production

- Add password change screen in the UI.
- Add admin screen to create credentials for employees.
- Add email provider for real reset emails.
- Add CSRF hardening if the app is exposed outside a trusted internal network.
- Enforce fine-grained permission keys per action, not only role buckets.
- Add rate limiting for login and password reset.
