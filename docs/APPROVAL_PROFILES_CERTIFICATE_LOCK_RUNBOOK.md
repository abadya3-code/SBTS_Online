# Sprint 13 — Approval Profiles & Certificate Lock Runbook

## Purpose

Sprint 13 turns final approvals into a controlled certificate gate.

Certificates can no longer be issued or printed until the required approval profile for the blind type is complete.

## Approval Profile Logic

Default profiles:

### Blind
- Operation Foreman
- Project Engineer
- Inspection Unit

### Slip Blind
- Operation Foreman
- Project Engineer
- Inspection Unit
- Metal Foreman

### Drop Spool
- Operation Foreman
- Project Engineer
- Inspection Unit

## Backend behavior

When a blind reaches `Final Tight`, SBTS applies the matching profile and creates pending approval requests.

When a user approves one request, SBTS checks whether all required approvals are complete.

When a certificate is issued or printed, SBTS checks the certificate lock first.

## New API

```txt
core.approvalProfiles
core.certificateLock
```

## New tables

```txt
approval_profiles
approval_profile_approvers
certificate_lock_events
```

## QA commands

```powershell
pnpm approval:static
pnpm qa:approval
```

## Manual QA

1. Create a Slip Blind.
2. Move it to Final Tight.
3. Confirm Approval Center shows four approval requests.
4. Try to issue certificate before approvals.
5. Confirm certificate is blocked.
6. Approve Operation Foreman.
7. Confirm certificate remains locked.
8. Approve Project Engineer.
9. Confirm certificate remains locked.
10. Approve Inspection Unit.
11. Confirm certificate remains locked if Metal Foreman is still pending.
12. Approve Metal Foreman.
13. Confirm certificate unlocks.
14. Issue certificate.
15. Confirm certificate record is created.
16. Confirm audit trail contains approval profile and certificate lock events.

## Important

Approval Profiles are still editable from Settings JSON in the current UI. The Sprint 13 database tables prepare the next production step where Approval Profiles can have their own dedicated admin page.
