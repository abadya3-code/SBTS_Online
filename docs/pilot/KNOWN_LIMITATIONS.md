# SBTS Pilot Known Limitations

## Current limitations
- Email provider for password reset is not connected yet.
- Fine-grained permission keys are still being hardened beyond role buckets.
- File storage for logos/avatars still supports Data URL fallback; production storage should be added later.
- Asset Hierarchy is intentionally deferred.
- SAP/SSO integration is not connected yet.
- Browser PDF export depends on local print settings.
- Pilot should be controlled and reviewed before official operational use.

## Accepted pilot scope
This pilot validates:
- workflow clarity,
- approval logic,
- certificate lock,
- QR tag printing,
- user login flow,
- reporting usefulness,
- field usability.

## Not accepted as full production yet
- official SAP integration,
- enterprise SSO,
- automated email recovery,
- production file object storage,
- approved IT backup/restore automation.
