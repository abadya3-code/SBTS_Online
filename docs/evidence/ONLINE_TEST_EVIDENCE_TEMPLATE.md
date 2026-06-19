# SBTS Online Test Evidence Template

Use this file for the formal online test package after Railway deployment.

## Environment

| Field | Value |
|---|---|
| Public URL | https://sbts-online.up.railway.app |
| Git commit |  |
| Railway deployment ID |  |
| Database verify result |  |
| Tester |  |
| Date |  |

## Required Commands

```bash
pnpm audit:final
pnpm build
railway run pnpm db:verify
pnpm e2e:online
pnpm e2e:evidence
```

## Manual Sign-off Matrix

| Area | Admin | Supervisor / Coordinator | Technician | Evidence |
|---|---:|---:|---:|---|
| Login | ☐ | ☐ | ☐ | Screenshot / Playwright trace |
| Dashboard | ☐ | ☐ | ☐ | Screenshot |
| Assigned Projects only | N/A | ☐ | ☐ | Screenshot / DB assignment |
| AccessControl blocked for non-admin | N/A | ☐ | ☐ | Screenshot |
| Monitoring blocked for non-admin | N/A | ☐ | ☐ | Screenshot |
| Workflow phase authorization | ☐ | ☐ | ☐ | Before/after + audit |
| Certificate lock enforcement | ☐ | ☐ | ☐ | Blocked mutation screenshot |
| Print tag layout | ☐ | N/A | N/A | PDF preview |
| Print certificate layout | ☐ | N/A | N/A | PDF preview |
| Audit trail event | ☐ | N/A | N/A | DB row / UI screenshot |

## Acceptance Rule

The report can be marked closed only when every required cell is checked or has a written exception approved by the pilot owner.
