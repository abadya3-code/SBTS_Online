# Sprint 14 — Print / PDF Production Finalization

## Summary

Sprint 14 finalizes the production print/PDF layer for SBTS.

## Added

- Print utility:
  - `client/src/lib/printExport.ts`
- Enhanced print CSS:
  - named tag/certificate/report page styles
  - hidden app navigation during print
  - one tag per page
  - one certificate per page
  - A4 report print view
- Updated pages:
  - Certificate Builder
  - Project Certificates
  - Single Tag Print
  - Project Tag Print
  - Reports Export Center
- QA script:
  - `scripts/print-production-static.mjs`
- Commands:
  - `pnpm print:static`
  - `pnpm qa:print`

## Design notes

The app uses browser print-to-PDF for production-friendly exports. This avoids introducing a heavy PDF rendering dependency before the pilot phase, while providing clean field-ready print layouts.

## Recommended next sprint

Sprint 15 — Pilot Ready Package.
