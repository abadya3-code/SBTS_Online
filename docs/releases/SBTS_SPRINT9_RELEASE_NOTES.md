# SBTS Sprint 9 — User Management + Admin Security Hard Lock

## Summary
Sprint 9 adds a professional User Management module and route-level admin protection. The goal is to connect employee profiles, phase assignment authority, admin-only menus, and future authentication into one controlled security model.

## Added

### User Management Page
New route:

```txt
/users
```

Features:

- User directory with search by name, badge, role, specialty, or department
- Role filter
- Status filter
- KPI cards for total users, active users, admins, and certified users
- Add user
- Edit user
- Delete user
- Certification flag
- Profile photo URL support
- Badge / Signature ID maintained as the field signature key

### Demo Active Session Switch
From User Management, an admin can click **Use session** to switch the active demo user. The shell immediately updates navigation and admin locks based on that role.

This supports realistic testing before production login integration:

- Admin sees all admin pages
- Non-admin users do not see admin navigation
- Non-admin users are blocked if they open an admin URL manually

### Admin Hard Lock
Admin-only routes:

```txt
/users
/access-control
/workflow-studio
/audit
```

If the active session is not an Active Admin, the app shows a dedicated hard-lock screen instead of the page.

### Navigation Security
The left menu and mobile navigation hide admin-only items for non-admin users.

### Backend User APIs
New Core APIs:

```txt
core.userManagement
core.createEmployee
core.updateEmployee
core.deleteEmployee
```

These use the Sprint 3 Employee Directory model and are ready to persist to the `employees` table when `DATABASE_URL` is enabled.

### Audit Support
User create/update/delete operations write demo audit records in local/demo mode.

### Migration
Added:

```txt
drizzle/0008_sprint9_user_management_security.sql
```

This introduces a `user_security_events` ledger for production-grade role/status change audit trails.

## Professional Logic
The user profile is now connected to:

- Phase Task Assignment
- Badge / Signature ID validation
- Role visibility
- Admin-only page control
- Future login and corporate identity integration

## Test Flow

1. Open `/users`.
2. Add or edit a user.
3. Click **Use session** on a non-admin user.
4. Confirm admin menu items disappear.
5. Try opening `/workflow-studio` manually.
6. Confirm the hard-lock page appears.
7. Use **Reset demo admin session** on the hard-lock page to return to admin.

## Next Recommended Sprint
Sprint 10 — Authentication Shell + Role-Based Login + Production Session Binding.
