# SBTS MySQL Deployment Checklist

## Database
- [ ] Managed MySQL database created.
- [ ] Database user created.
- [ ] Password stored securely.
- [ ] External connection allowed only from hosting provider where possible.
- [ ] `DATABASE_URL` configured.

## Migration
Run:

```powershell
pnpm db:push
pnpm db:status
pnpm db:verify
```

## Expected verification
The following domains should verify:

- Areas
- Projects
- Blinds
- Workflow logs
- Phase assignments
- Approvals
- Torque records
- Certificates
- Notifications
- Audit trail
- System settings
- Employees
- Auth sessions
- User preferences
- File upload references
- Approval profiles
- Certificate lock events

## First admin
Run once:

```powershell
pnpm seed:admin
```

Then remove `SBTS_ADMIN_PASSWORD` from hosting variables or rotate it.

## Backup
Before pilot starts:

- [ ] Confirm manual DB backup works.
- [ ] Confirm restore procedure is documented.
- [ ] Export pilot reports weekly.
