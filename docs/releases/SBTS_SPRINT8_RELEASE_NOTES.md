# SBTS Sprint 8 — Reports & Export Center

## Scope
Sprint 8 adds a management-ready Reports & Export Center to consolidate SBTS operational reporting into one page.

## New Route
- `/reports` — Enterprise reports and export center
- `/reports?projectId=<id>` — Project-filtered report view

## Backend / API
Added Core API endpoints:

- `core.reportCenter`
  - Returns KPI snapshot
  - Project progress summary
  - Area performance
  - Phase breakdown
  - Blind register rows
  - Export package metadata

- `core.recordReportExport`
  - Records report export events into Audit Trail
  - Creates a system notification for export traceability

## Frontend
Added page:

- `client/src/pages/ReportsExportCenter.tsx`

Features:

- Scope selector: All Projects or selected project
- KPI cards
- Project progress summary
- Area performance table
- Phase breakdown panel
- Blind register preview
- CSV export packages:
  - Blind Register
  - Management Summary
  - Area Performance
  - Phase Breakdown
- Print view button
- Audit-backed export logging

## Navigation
Added `Reports` to the main sidebar and mobile navigation.

## Project Dashboard Integration
Added `Reports & Export` button inside Project Setup to open the report center filtered to that project.

## Notes
CSV export is implemented in-browser for immediate usability. PDF / Excel / PowerPoint export package hooks are represented in the reporting model and can be upgraded later to server-side document generation.
