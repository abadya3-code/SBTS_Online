# SBTS Sprint 5 — Certificate Builder + QR Tag Printing

## Scope
Sprint 5 makes every blind printable and field-ready by adding a dedicated QR tag package and certificate builder.

## Implemented

### 1. QR code engine
- Added `QRCodeBlock` component.
- QR values point to the live SBTS Blind Details route: `/blinds/:id`.
- QR generation uses high error correction for field labels.

### 2. Project tag printing
New route:

```txt
/projects/:id/tags
```

Features:
- Print all blind tags for a project.
- Each tag is sized for 11 cm × 7 cm printing.
- Each tag includes:
  - Tag No
  - Blind No
  - Area
  - Line
  - Size
  - Rating
  - Type
  - Status
  - Project No
  - QR code
- Exports a tag register CSV.

### 3. Single blind tag printing
New route:

```txt
/blinds/:id/tag
```

Features:
- Print one tag only.
- Same 11 cm × 7 cm field tag design.

### 4. Certificate builder
New route:

```txt
/blinds/:id/certificate
```

Certificate pulls from:
- Blind details
- Workflow logs
- Torque records
- Approval Center records
- QR code

### 5. Project certificate print package
New route:

```txt
/projects/:id/certificates
```

Features:
- Batch certificate cover pages for all blinds in the project.
- Each certificate includes QR for live verification.

### 6. Project Setup integration
Project Setup now connects:
- Export All Tags → `/projects/:id/tags`
- Print Certificates → `/projects/:id/certificates`

### 7. Blind Details integration
Blind Details now connects:
- Print Tag → `/blinds/:id/tag`
- Certificate → `/blinds/:id/certificate`

## New dependency

```txt
qrcode
@types/qrcode
```

After downloading the sprint, run:

```powershell
pnpm install
pnpm dev
```

## Notes
- Certificate persistence can use the existing `certificates` database table in the next backend persistence sprint.
- Current Sprint 5 focuses on professional print workflow and live QR routing.
