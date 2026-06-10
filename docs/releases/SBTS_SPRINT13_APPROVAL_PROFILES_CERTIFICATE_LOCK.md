# Sprint 13 — Approval Profiles & Certificate Lock

## Summary

Sprint 13 adds per-blind-type final approval profiles and certificate release locking.

## Added

- Approval profile DB foundation:
  - `approval_profiles`
  - `approval_profile_approvers`
  - `certificate_lock_events`
- Migration:
  - `drizzle/0014_sprint13_approval_profiles_certificate_lock.sql`
- Backend:
  - `getApprovalProfiles`
  - `getCertificateLockStatus`
  - Final approval request generation from profile
  - Certificate issue/print lock enforcement
- Frontend:
  - Certificate Builder lock status panel
  - Save/print disabled when lock is active
- QA:
  - `scripts/approval-certificate-static.mjs`
  - `pnpm approval:static`
  - `pnpm qa:approval`

## Design decision

Asset Hierarchy remains deferred. Sprint 13 focuses on approval governance and certificate control.
