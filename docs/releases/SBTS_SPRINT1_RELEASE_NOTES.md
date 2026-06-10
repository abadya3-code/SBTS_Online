# SBTS Sprint 1 — Database Core Release Notes

## Release name
SBTS_MVP_Sprint1_Database_Core

## Goal
Build the first real data foundation for SBTS so the application can move away from scattered mock data and toward a real database-backed MVP.

## What was added

### 1. Core database tables
Added the main SBTS domain tables in `drizzle/schema.ts`:

- `areas`
- `projects`
- `blinds`
- `blind_workflow_logs`
- `approvals`
- `torque_records`
- `certificates`
- `notifications`

These tables sit beside the existing:

- `users`
- `access_permissions`
- `access_roles`
- `access_role_permissions`
- `workflow_templates`
- `workflow_phases`

### 2. Database migration file
Added a manual Sprint 1 migration:

```txt
/drizzle/0003_sprint1_database_core.sql
```

This migration creates the new core tables and foreign keys for MySQL.

### 3. Core seed data
Added seed models for:

- 3 operational areas
- 3 projects
- 5 blinds

The demo seed data is aligned with SBTS field use cases such as Train-4 Shutdown, North Manifold Isolation, and Utility Header Maintenance.

### 4. Core tRPC API
Added a new `core` API router:

```txt
core.areas
core.projects
core.blinds
core.dashboardSummary
```

These APIs return real database rows when `DATABASE_URL` is configured. If no database is connected, they safely return demo data so the app still runs in local demo mode.

### 5. Frontend connection
Updated these pages to consume the new Core API:

- Dashboard
- Projects & Areas
- Blinds Registry

Each page now shows whether it is using:

- Core API / Database model
- Demo fallback model

### 6. Windows run fix
Updated `package.json` scripts to use `cross-env` so Windows PowerShell can run the project with:

```powershell
pnpm dev
```

instead of failing on `NODE_ENV=development`.

## How to run locally

```powershell
pnpm install
pnpm dev
```

Open the shown localhost URL.

## Database mode

For demo mode, no database is required.

For database mode, add a `.env` file with:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

Then run migrations using your preferred Drizzle workflow.

## Sprint 1 result

The project now has a real data foundation for:

```txt
Area → Project → Blind → Workflow Phase → Approval / Torque / Certificate / Notification
```

## Next Sprint

Sprint 2 should focus on CRUD Core:

- Create Area form
- Create Project form
- Create Blind wizard
- Blind Details page
- Move Blind Phase action
- Initial Activity Log display
