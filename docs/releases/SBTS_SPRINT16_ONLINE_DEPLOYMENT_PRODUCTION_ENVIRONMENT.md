# Sprint 16 — Online Deployment & Production Environment Setup

## Summary
Sprint 16 prepares SBTS for online deployment as a complete Node app with React/Vite frontend, tRPC API, Drizzle ORM, and MySQL database.

## Added
- `/api/health` health check.
- Production environment template: `.env.production.example`.
- Admin seed script: `scripts/seed-admin.mjs`.
- Deployment static QA: `scripts/deployment-static.mjs`.
- Deployment commands:
  - `pnpm seed:admin`
  - `pnpm deploy:check`
  - `pnpm qa:deploy`
- Deployment docs:
  - `docs/deployment/ONLINE_DEPLOYMENT_GUIDE.md`
  - `docs/deployment/MYSQL_DEPLOYMENT_CHECKLIST.md`
  - `docs/deployment/RAILWAY_RENDER_DEPLOYMENT_NOTES.md`
- Dockerfile for containerized deployment option.

## Recommended online setup
```powershell
pnpm install
pnpm db:push
pnpm db:verify
pnpm seed:admin
pnpm qa:deploy
pnpm build
pnpm start
```

## Database decision
Sprint 16 keeps MySQL as the deployment database because the current schema uses Drizzle MySQL tables and migrations. PostgreSQL migration is deferred to a dedicated future sprint.
