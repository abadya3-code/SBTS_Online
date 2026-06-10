# SBTS Sprint 16 — Online Deployment Guide

## Goal
Deploy SBTS online as one full Node application serving:

- React/Vite frontend
- tRPC API
- Node/Express server
- Drizzle ORM
- Managed MySQL database
- Authentication/session cookies
- Certificates, tags, reports, audit trail

## Recommended deployment shape

```txt
Browser
  ↓
Node Web App
  ↓
React/Vite static build + tRPC API
  ↓
Drizzle ORM
  ↓
Managed MySQL Database
```

## Production commands

```powershell
pnpm install
pnpm db:push
pnpm db:verify
pnpm seed:admin
pnpm qa:deploy
pnpm build
pnpm start
```

## Environment variables
Use `.env.production.example` as the template.

Required:

```txt
NODE_ENV=production
PORT=3000
APP_PUBLIC_URL=https://your-sbts-domain.com
ALLOWED_ORIGIN=https://your-sbts-domain.com
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/SBTS_DB
COOKIE_SECURE=true
```

Admin seed variables should be used only during first setup, then removed:

```txt
SBTS_ADMIN_USERNAME=admin
SBTS_ADMIN_PASSWORD=ChangeMe2026!
SBTS_ADMIN_EMAIL=admin@example.com
```

## Health check
After deployment, open:

```txt
https://your-sbts-domain.com/api/health
```

Expected:

```json
{
  "status": "ok",
  "app": "SBTS",
  "version": "16.0.0",
  "database": "connected"
}
```

## Deployment order

1. Create managed MySQL database.
2. Set environment variables on hosting platform.
3. Deploy SBTS Node app.
4. Run `pnpm db:push`.
5. Run `pnpm db:verify`.
6. Run `pnpm seed:admin` once.
7. Run `pnpm qa:deploy`.
8. Open `/api/health`.
9. Login using seeded admin.
10. Configure Corporate Identity.
11. Create pilot users and credentials.
12. Test workflow, approval lock, tags, certificates, and reports.

## Production note
The current Sprint 16 package is optimized for MySQL because the schema is currently Drizzle MySQL. PostgreSQL migration should be done as a separate sprint if required.
