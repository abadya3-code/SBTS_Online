# Sprint 12.1 — Authentication UI Binding & Admin Credential Manager

## Purpose

Sprint 12 added backend authentication and authorization. Sprint 12.1 connects those backend capabilities to the user interface.

## Included UI work

### Login Page
- Added Username / Password login mode.
- Added password visibility toggle.
- Added password reset request action.
- Kept badge/SSO demo login as a separate mode for controlled pilot/demo use.
- Password login calls `core.passwordLogin` and creates a backend session cookie.

### Register Page
- Registration now calls `core.registerEmployeeCredential`.
- Creates both employee directory record and password credential.
- Enforces password rule in UI:
  - 10+ characters
  - uppercase letter
  - lowercase letter
  - number

### User Management
- Added admin credential manager action per employee.
- Admin can create a username/password credential for an existing employee.
- Credential creation calls `core.registerPasswordCredential`.

## New/updated API bindings

```txt
core.passwordLogin
core.requestPasswordReset
core.registerEmployeeCredential
core.registerPasswordCredential
```

## QA Commands

```powershell
pnpm auth:static
pnpm qa:security
```

## Manual QA

1. Configure database and run migrations.
2. Open Register page.
3. Create a new user with username/password.
4. Return to login.
5. Login using username/password.
6. Confirm dashboard opens.
7. Confirm `core.sessionBinding` returns employee ID, badge, and role.
8. Logout.
9. Login as admin.
10. Open User Management.
11. Create password credential for an existing employee.
12. Test login with that credential.
13. Test Forgot Password action.

## Important

Password reset currently creates a backend reset request foundation. Actual email sending still requires an email provider in a future sprint.
