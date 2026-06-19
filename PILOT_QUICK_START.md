# SBTS Final Closure Quick Start

1. Copy package files over `C:\Users\princ\Downloads\SBTS_PRODUCTION_CLEAN`.
2. Do not delete `.git`, `.env`, or `node_modules`.
3. Run:

```bash
pnpm install --no-frozen-lockfile
pnpm audit:report-closure
pnpm audit:final
pnpm build
```

4. Commit and push:

```bash
git add .
git commit -m "Sprint 17 final online E2E and type safety closure"
git push
```

5. After Railway deploy:

```bash
railway run pnpm db:verify
```

6. Set E2E environment variables locally or in your terminal session:

```bash
set SBTS_E2E_BASE_URL=https://sbts-online.up.railway.app
set SBTS_E2E_ADMIN_USERNAME=admin
set SBTS_E2E_ADMIN_PASSWORD=YOUR_PASSWORD
set SBTS_E2E_SUPERVISOR_USERNAME=SUPERVISOR_USER
set SBTS_E2E_SUPERVISOR_PASSWORD=SUPERVISOR_PASSWORD
set SBTS_E2E_TECHNICIAN_USERNAME=TECHNICIAN_USER
set SBTS_E2E_TECHNICIAN_PASSWORD=TECHNICIAN_PASSWORD
```

7. Run online E2E and evidence generation:

```bash
pnpm e2e:install
pnpm e2e:online
pnpm e2e:evidence
```

8. Attach the generated file from `docs/evidence/ONLINE_TEST_RUN_*.md` to the final pilot report.
