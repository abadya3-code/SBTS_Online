# Sprint 14 — Print / PDF Production Finalization Runbook

## Purpose

Sprint 14 stabilizes SBTS printing and browser-PDF output for field tags, certificates, certificate packages, tag registers, and management reports.

## Production print surfaces

- Single Blind Tag
- Project Tag Package
- Tag Register PDF View
- Single Certificate
- Project Certificate Package
- Reports Print/PDF View

## What changed

### Print engine
A small print utility was added:

```txt
client/src/lib/printExport.ts
```

It controls print mode using:

```txt
document.body.dataset.sbtsPrintMode
```

This keeps app navigation, sidebars, headers, and UI controls out of printed/PDF pages.

### Print CSS
`PrintStyles` now includes named print pages:

```txt
sbtsTagPage
sbtsCertificatePage
sbtsReportPage
```

With:
- one tag per page
- one certificate per page
- A4 report layout
- color-preserving print output
- hidden app navigation during print
- safer table page breaks

## Recommended user workflow

### Export PDF
Use the browser print dialog and select:
- Microsoft Print to PDF
- Save as PDF
- Corporate approved PDF printer

### Tags
`Print Tags` prints one tag per page using the tag page size.

### Certificates
`Print Certificate` and `Print Package` print one certificate per page.

### Reports
`Print View` produces an A4 management-ready report without app navigation.

## QA commands

```powershell
pnpm print:static
pnpm qa:print
```

## Manual QA

1. Open a single blind tag.
2. Print preview: confirm only the tag appears.
3. Open project tags.
4. Print preview: confirm each tag is on its own page.
5. Export tag register.
6. Confirm register appears as a report page, not tag cards.
7. Open a single certificate.
8. Confirm certificate lock is visible before print.
9. If unlocked, print preview: one certificate page only.
10. Open project certificate package.
11. Confirm each certificate starts on a new page.
12. Open Reports.
13. Print View and confirm no sidebar/topbar/app controls.
14. Save each output as PDF and confirm file naming/title is clear.

## Known browser note

Browser PDF export depends on the local browser print engine. For final production, Chrome/Edge print settings should be standardized:
- Background graphics: enabled
- Margins: default or none depending on output type
- Scale: 100%
- Paper: A4 for reports/certificates
- Paper: custom 11 cm × 7 cm for tags when supported
