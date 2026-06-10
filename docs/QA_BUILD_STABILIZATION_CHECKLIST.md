# SBTS QA & Build Stabilization Checklist

## Automated checks
Run these from the project root:

```powershell
pnpm install
pnpm qa:static
pnpm check
pnpm build
```

## UI smoke test
- Login page loads.
- Register page loads.
- Dashboard loads after login.
- Sidebar has no visible debug/help card.
- Sidebar displays company identity and application version.
- Topbar Inbox, Notification, Profile, and Logout actions work.
- Settings saves General, Corporate Identity, Theme, Tags, Certificates, Notifications, and Security settings.
- Theme switching works and does not affect other templates unexpectedly.

## Workflow smoke test
- Create Area.
- Open Area projects.
- Create Project.
- Add Blind inside Project.
- Open Blind Details.
- Update Phase using current user signature.
- Create/approve final approval request when applicable.
- Generate Certificate.
- Print Tag and Certificate.

## Print QA
- Single Tag print is one tag per print layout.
- Project Tags print is clean and does not print app navigation.
- Single Certificate fits one page.
- Project Certificates print one certificate per page.
- Reports print view uses report layout, not application page layout.

## Production blockers still remaining
- Real persistent database binding.
- Real authentication and password hashing.
- Production file storage for logos and avatars.
- Server-side permission enforcement for every critical action.
- Backup/restore strategy.
