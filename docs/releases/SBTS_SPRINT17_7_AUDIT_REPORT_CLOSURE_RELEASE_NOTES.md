# SBTS Sprint 17.7 — Audit Report Closure & Production Governance

## Purpose
Sprint 17.7 closes the most important findings from the third-party review before the pilot is expanded. The focus is IT/ISA/security hardening, workflow data integrity, database performance, and administrator-safe operations.

## Closed / Improved Findings

### Critical Findings
1. **Database Indexes**
   - Added Sprint 17.7 index migration for authentication, sessions, role permissions, workflow assignment, system settings, security events, and persistence events.
   - Keeps Sprint 17.4 operational indexes for areas, projects, blinds, approvals, certificates, notifications, and audit trail.

2. **Permissions Consistency**
   - Operational APIs remain protected by `protectedProcedure`, `adminProcedure`, `coordinatorProcedure`, and `supervisorProcedure`.
   - Access Control is admin-protected.
   - Pending/inactive users are blocked in middleware.

3. **Ownership / Scope Validation**
   - Project/Area access guards remain in the router layer for project-sensitive actions.
   - Blind detail, tag settings, report center, and create blind operations check area/project access before returning or writing operational data.

4. **AccessControl Mock Data**
   - Access Control reads through the database-backed model when `DATABASE_URL` is active.
   - Demo fallback remains only for local/no-database mode.

5. **Transactions**
   - Existing workflow phase movement, approval update, and certificate issue database branches use `db.transaction` for related writes.
   - Audit and notification records remain traceability records after the core transaction completes.

### High / Medium Findings
1. **Rate Limiting**
   - Added `express-rate-limit` to `/api/trpc`.
   - Defaults: 300 requests per 15 minutes; configurable by `SBTS_RATE_LIMIT_WINDOW_MS` and `SBTS_RATE_LIMIT_MAX`.

2. **Security Headers**
   - Added `helmet` for production security headers while keeping Vite/print compatibility.

3. **Pagination**
   - Added backend pagination endpoints:
     - `core.areasPage`
     - `core.projectsPage`
     - `core.blindsPage`
   - These provide a safe path to replace full-list pages as data grows.

4. **Caching**
   - Added short TTL cache for global system settings.
   - Default TTL: 5 minutes; configurable by `SBTS_SETTINGS_CACHE_TTL_MS`.
   - Cache clears after settings save.

5. **Error Handling**
   - Added centralized tRPC error formatter for clearer user-facing messages.
   - Zod validation details remain available to developers in the error data.

6. **Tag Settings Validation**
   - Fixed the `defaultTagWidthCm` / `defaultTagHeightCm` issue by allowing decimal centimeters.
   - QR pixel size remains integer validated.

## Remaining Items Not Fully Closed
- Full elimination of all `any` usage still requires a dedicated TypeScript refactor sprint.
- Full UI migration to paginated endpoints is prepared but not forced to avoid breaking existing pages.
- Dark Mode, breadcrumbs, keyboard shortcuts, Sentry, and performance monitoring remain optional improvement items for Sprint 18+.

## New Commands
```bash
pnpm audit:17.7
pnpm qa:17.7
```

## Required Railway Steps
After pushing Sprint 17.7:
```bash
railway run pnpm db:push
railway run pnpm db:verify
railway run pnpm seed:admin
```

Recommended variables:
```env
DATABASE_URL=${{ MySQL.MYSQL_PUBLIC_URL }}
SBTS_ADMIN_USERNAME=admin
SBTS_ADMIN_PASSWORD=<strong-password>
SBTS_RATE_LIMIT_MAX=300
SBTS_RATE_LIMIT_WINDOW_MS=900000
SBTS_SETTINGS_CACHE_TTL_MS=300000
```

## Acceptance Checklist
- `/api/health` returns OK.
- `pnpm audit:17.7` passes.
- `pnpm build` passes.
- Login works with seeded admin.
- Settings save accepts `11.2 cm` tag width.
- Access Control is not available to non-admin users.
- Certificate locked records cannot be modified through protected operations.
- Railway deploy remains Active.
