# SBTS Sprint 17.4 — Production Hardening & ISA Field Safety Control

## Scope
This patch hardens the online SBTS pilot build before field use in a gas plant / industrial area. It focuses on backend authorization, active-user enforcement, operational API protection, cleaner inbox data, and database performance indexes.

## Key Changes
- Added `server/security/permissionGuard.ts` for unified active-user, role, permission, area, project, phase, and certificate lock guards.
- Hardened tRPC middleware so protected/admin/role procedures reject pending or inactive users.
- Loaded role permission keys and phase keys into session context from Access Control tables.
- Converted operational read APIs from public to protected/admin procedures.
- Protected Access Control model behind admin procedure.
- Protected Workflow Studio save behind supervisor/admin procedure.
- Forced self-registration requests to `Pending` with a safe default technician role until admin approval.
- Cleaned Notification Inbox so archived/debug-style messages are not shown in the operational inbox.
- Added database indexes for projects, blinds, approvals, workflow logs, torque records, certificates, notifications, and audit trail.

## ISA / Field Safety Intent
- No operational API access without an active approved user.
- Pending users cannot access protected backend procedures.
- Phase updates are checked against role/phase authorization.
- Certificate issuance remains blocked until final-approval unlock rules are satisfied.
- Access Control is no longer publicly readable.

## Validation Commands
Run after installing dependencies in the real development environment:

```bash
pnpm install
pnpm check
pnpm db:push
pnpm db:verify
pnpm dev
```

For Railway:

```bash
railway run pnpm db:push
railway run pnpm db:verify
```

## Notes
This patch intentionally avoids UI redesign and print/PDF changes. Tag Designer and PDF polish should continue in Sprint 17.5 after this hardening layer is verified.
