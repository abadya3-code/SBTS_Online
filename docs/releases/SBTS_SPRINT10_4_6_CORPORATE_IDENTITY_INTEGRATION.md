# SBTS Sprint 10.4.6 — Corporate Identity Integration

## Purpose
Centralize the company logo and company name as a system-level identity instead of duplicating branding across tags, certificates, reports, and app headers.

## Completed
- Added corporate identity fields under `Settings → General`:
  - Company Name
  - Company Short Name
  - Company Subtitle
  - Company Logo Upload
  - Show company name beside logo
  - Show corporate identity on certificates
  - Show corporate identity on tags
  - Show corporate identity on reports
- Added a live Corporate Identity Preview in Settings.
- Added a shared helper: `client/src/lib/corporateIdentity.ts`.
- Connected the corporate identity to:
  - Login page
  - Command Pro sidebar identity card
  - App shell header/sidebar fallback identity
  - Single tag printing
  - Project tag printing
  - Tag register print view
  - Single certificate builder
  - Project certificate package
  - Reports print view
- Kept Application Logo as a fallback app icon, while Corporate Logo controls official branding.
- Removed the duplicate tag-specific company logo upload from the Tag Settings UI to reduce future maintenance errors.

## Technical Notes
- Corporate logo is currently stored as a data URL inside system settings for demo/MVP use.
- In production, logo/image uploads should move to a `file_uploads` table or object storage with a saved file reference.
- `system_settings` already stores JSON, so no SQL table structure migration is required for this sprint.

## Next Recommended Step
Sprint 10.4.7 — QA & Build Stabilization Pass.
