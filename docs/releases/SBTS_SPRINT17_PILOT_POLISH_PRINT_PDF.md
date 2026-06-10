# Sprint 17 — Pilot Polish, User Approval, Tag Designer Pro & Print/PDF Professionalization

## Added
- Application favicon/app icon asset.
- Version and release naming controls in System Settings.
- Pending user registration flow.
- Admin approval activation for credentials.
- Tag Designer Pro layer positioning controls.
- Stronger tag/certificate/report print CSS.
- Safe certificate date formatting.
- Sprint wording cleanup from page headers.

## Updated
- `client/src/components/layout/AppShell.tsx`
- `client/src/pages/SystemSettingsCenter.tsx`
- `client/src/pages/RegisterUser.tsx`
- `client/src/pages/UserManagement.tsx`
- `client/src/pages/TagDesignerSettings.tsx`
- `client/src/pages/CertificateBuilder.tsx`
- `client/src/components/print/PrintStyles.tsx`
- `server/db.ts`
- `server/routers.ts`
- `Dockerfile`
- `package.json`

## New QA
- `scripts/sprint17-polish-static.mjs`
- `pnpm polish:static`
- `pnpm qa:polish`

## Database
No new migration is required for this sprint. User pending/active/rejected values use the existing employee status varchar field and credential status field.
