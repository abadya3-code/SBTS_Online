# SBTS Sprint 17.5 — Print / PDF Professionalization

## Scope
Focused print professionalization for the SBTS certificate and tag printing flows.

## Updated Areas
- Single Blind Certificate print page
- Project Certificate Package print page
- Project Tag Print page
- Single Tag Print page
- Shared Print CSS rules
- Shared professional print layout components

## Main Changes
1. Added a reusable professional certificate sheet layout.
2. Added a reusable professional field tag layout.
3. Each certificate now prints as one A4 portrait page.
4. Certificate layout now includes:
   - Corporate identity / logo area
   - Certificate title and approval status
   - Certificate number
   - Generated date without Invalid Date fallback
   - Area, project, blind/tag, line, type, size, rating, status, and phase
   - QR code linked to live blind record
   - Workflow summary section
   - Torque / technical evidence section
   - Final approvals section
   - Safety / traceability / lock notes
   - Digital approval footer boxes
5. Project certificate package now prints one certificate per blind.
6. Tag print layout now uses a modern 11 × 7 cm field tag design.
7. Tag layout includes:
   - Punch-hole mark
   - Company logo / initials
   - Large QR code
   - Tag ID, area, line, and size
   - Month/year marker
   - Project or phase footer
8. Print CSS improved for A4 certificates, tag pages, report pages, page breaks, and color accuracy.

## Validation Performed
- Static TSX transpilation check completed for modified files.
- Could not run `pnpm check` in this sandbox because Corepack attempted to download pnpm from npm registry and internet access is unavailable.

## Recommended Local Checks
Run locally or in Manus/Railway shell:

```bash
pnpm install
pnpm check
pnpm build
pnpm dev
```

Then test:
- Print one blind certificate
- Print project certificate package
- Print one tag
- Print project tags
- Save as PDF using browser print dialog
