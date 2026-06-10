# SBTS Pilot Backup & Restore Plan

## Goal
Protect pilot data while SBTS is being evaluated.

## Minimum backup approach
- Daily database backup.
- Weekly exported reports.
- Keep a copy of the deployment zip.
- Keep `.env` securely outside the project zip.
- Keep pilot sign-off documents in a controlled folder.

## Recommended backup schedule
| Frequency | Item |
|---|---|
| Daily | Database backup |
| Daily | Export audit/report CSV |
| Weekly | Full project folder snapshot |
| Before update | Database backup + app zip |
| After update | QA checklist + build result |

## Restore procedure
1. Stop the application.
2. Restore database backup.
3. Confirm `.env` points to restored database.
4. Run `pnpm db:status`.
5. Run `pnpm db:verify`.
6. Start application.
7. Validate Dashboard, Areas, Projects, Blinds, Certificates.

## Production note
Before official production use, backup/restore should be automated and tested with IT.
