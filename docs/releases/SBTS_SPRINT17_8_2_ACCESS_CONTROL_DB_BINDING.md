# Sprint 17.8.2 — AccessControl Real Database Binding

## Scope
This hotfix closes the third-party audit finding: **AccessControl uses Mock Data**.

## Implemented
- `accessControl.model` remains `adminProcedure` and reads roles, permissions, role-permission assignments, menu visibility, and workflow phase ownership from MySQL.
- New `accessControl.saveRoleModel` mutation is `adminProcedure` only.
- Save operation runs inside a database transaction.
- Old role-permission assignments are replaced atomically.
- Role menu and phase ownership JSON fields are updated in `access_roles`.
- Audit event `ACCESS_ROLE_MODEL_SAVED` is written to `audit_trail`.
- Frontend `AccessControl.tsx` no longer uses `initialRoles` for live role data.
- UI catalogs for menus, phase labels, and permission group icons remain as display metadata only.
- Duplicate role is disabled until a governed role creation workflow is added.

## Verification
Run:

```powershell
pnpm build
railway run pnpm db:verify
```

Then login as Admin and test:

1. Open Access Control.
2. Change a permission, menu, or phase assignment on a role.
3. Save model.
4. Confirm `access_role_permissions` changed.
5. Confirm `audit_trail` has `ACCESS_ROLE_MODEL_SAVED`.
6. Login as Technician and verify Access Control save is forbidden.

## Notes
Do not remove `mockData.ts` yet. Dashboard and Workflow Studio still use shared UI catalogs from it.
