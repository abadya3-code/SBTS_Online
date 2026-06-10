# SBTS Sprint 10 — Authentication Shell + Role-Based Login + Production Session Binding

## Purpose
Sprint 10 adds a professional authentication layer before the operational application. The goal is to stop treating session switching as only a User Management demo action and make SBTS behave like a secured role-based system.

## Implemented

### 1. Secure Login Page
Added a new route:

```txt
/login
```

The login screen includes:
- Employee search by name, badge, role, specialty, or department.
- Active employee list only.
- Selected session preview.
- Quick demo admin login.
- Industrial command-center visual style.

### 2. Authentication Gate
All operational routes are now protected by an authentication shell.

If no active SBTS session exists, the app redirects to:

```txt
/login
```

After login, the user is routed to:

```txt
/dashboard
```

### 3. Role-Based Session Binding
The selected employee becomes the active SBTS session:
- Badge / Signature ID
- Full name
- Role key
- Role label
- Status
- Session ID
- Issued time
- Expiry time
- Login method

### 4. Admin Hard Lock Still Active
Sprint 9 hard locks remain in place. Admin-only pages are still protected:
- User Management
- Access Control
- Workflow Studio
- Audit Trail

### 5. AppShell Session Controls
The top bar now shows:
- Active user
- Role
- Login method
- Logout button

### 6. Backend Login API
Added:

```txt
core.login
core.sessionBinding
```

The backend validates:
- Badge exists in Employee Directory
- Employee is Active
- Selected role matches employee role

### 7. Production Binding Readiness
Added migration:

```txt
drizzle/0009_sprint10_auth_shell_session_binding.sql
```

It prepares a future `sbts_auth_sessions` table for production session persistence.

## How to test

```powershell
pnpm install
pnpm dev
```

Then open the app. You should land on the login page.

Test flow:
1. Search for an employee.
2. Select the employee.
3. Click Login.
4. Confirm the side menu changes based on the role.
5. Logout.
6. Login as a non-admin user.
7. Try to open `/users` or `/workflow-studio`; the admin hard lock should block access.

## Next recommended sprint
Sprint 11 — Production Database Persistence + Real Auth Provider Integration.
