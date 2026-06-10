# SBTS Professional Edition

Smart Blind Tag System (SBTS) is a React + TypeScript + Vite application for field isolation workflow control, QR tag printing, certificates, approvals, audit logs, and operational dashboards.

## Run locally

```powershell
pnpm install
pnpm dev
```

If `pnpm` is not installed:

```powershell
npm install -g pnpm
pnpm install
pnpm dev
```

Open the local URL shown in the terminal, usually:

```txt
http://localhost:3000/login
```

## Useful commands

```powershell
pnpm dev       # local development
pnpm check     # TypeScript check
pnpm build     # production build
pnpm test      # tests
```

## Project structure

```txt
client/              React frontend
server/              Node / Express / tRPC backend shell
shared/              shared schema and types
drizzle/             database schema and migrations
docs/releases/       sprint release notes
docs/notes/          working notes and review notes
tools/legacy/        old helper scripts kept for reference
```

## Sprint 10.4.5 cleanup notes

This version removes development-only Manus/Builder Vite plugins, cleans the root folder, and moves historical sprint notes into `docs/releases/` so the project is easier to maintain.


## Sprint 11 Production Persistence

This build introduces the production database persistence foundation.

### Setup

```powershell
pnpm install
copy .env.example .env
# Edit DATABASE_URL
pnpm db:push
pnpm db:status
pnpm qa:full
pnpm dev
```

### New checks

```powershell
pnpm db:status
pnpm qa:static
pnpm qa:full
```

`core.persistenceStatus` also reports whether SBTS is running in Database mode or Demo fallback mode.


## Sprint 11.1 Database Binding Verification

After configuring `DATABASE_URL`, verify database binding:

```powershell
pnpm db:status
pnpm db:verify:readonly
pnpm db:verify
```

For a stronger database smoke test with commit and cleanup:

```powershell
pnpm db:verify:commit
```


## Sprint 12 Real Authentication

Sprint 12 adds backend password authentication and server-side session validation.

```powershell
pnpm auth:static
pnpm qa:security
```

Production auth flow now has backend endpoints:
- `core.registerPasswordCredential`
- `core.passwordLogin`
- `core.requestPasswordReset`
- `core.sessionBinding`

The next UI-focused sprint should expose credential management and password login in the application screens.


## Sprint 12.1 Authentication UI Binding

The app UI now exposes:
- Username/password login.
- Forgot password request.
- Registration with employee + credential creation.
- Admin credential manager from User Management.

Run:

```powershell
pnpm auth:static
pnpm qa:security
```


## Sprint 13 Approval Profiles & Certificate Lock

Run:

```powershell
pnpm approval:static
pnpm qa:approval
```

Certificate issue/print is now blocked until the matching blind type approval profile is complete.


## Sprint 14 Print / PDF Production Finalization

Print/PDF QA:

```powershell
pnpm print:static
pnpm qa:print
```

PDF output is generated through the browser print dialog using SBTS print modes:
- certificate
- certificate-package
- tag
- tag-register
- report


## Sprint 15 Pilot Ready Package

Pilot QA:

```powershell
pnpm pilot:static
pnpm qa:pilot
```

Pilot documentation is located in:

```txt
docs/pilot/
```

Pilot sample files:

```txt
samples/pilot_sample_data.json
samples/pilot_blinds_import_template.csv
```

Recommended controlled pilot path:
1. Configure database.
2. Run all QA commands.
3. Configure company identity.
4. Create pilot users.
5. Create pilot area/project/blinds.
6. Validate workflow, approvals, tags, certificates, and reports.
7. Complete `docs/pilot/PILOT_ACCEPTANCE_FORM.md`.

## Sprint 16 Online Deployment & Production Environment Setup

Deployment QA:

```powershell
pnpm deploy:check
pnpm qa:deploy
```

Production deployment sequence:

```powershell
pnpm install
pnpm db:push
pnpm db:verify
pnpm seed:admin
pnpm qa:deploy
pnpm build
pnpm start
```

Health check:

```txt
/api/health
```

Deployment docs:

```txt
docs/deployment/ONLINE_DEPLOYMENT_GUIDE.md
docs/deployment/MYSQL_DEPLOYMENT_CHECKLIST.md
docs/deployment/RAILWAY_RENDER_DEPLOYMENT_NOTES.md
```


## Sprint 17 Pilot Polish

Sprint 17 improves the live pilot user experience and print/PDF readiness.

Run:

```powershell
pnpm polish:static
pnpm qa:polish
```

Key areas:
- Pending user approval flow
- Version and release control in Settings
- Clean user-facing labels without Sprint wording
- Tag Designer Pro layer controls
- Professional tag/certificate/report print CSS
- Safer certificate date formatting
