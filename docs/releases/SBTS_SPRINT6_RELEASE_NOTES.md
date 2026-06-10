# SBTS Sprint 6 — Certificate Persistence + Tag Designer Settings

## Sprint Objective
Move SBTS printing from a fixed preview into a controlled operational package:

1. Certificates are now persisted as system records with revision/status metadata.
2. QR hanging tags now use project-level Tag Designer Settings instead of hard-coded styling.
3. Project Setup now links to Tag Designer Settings, Export All Tags, and Print Certificates.

---

## Backend Additions

### New Core APIs

- `core.certificates`
  - Reads certificate records by `blindId`, `projectId`, or all.

- `core.issueCertificate`
  - Creates a persistent certificate record.
  - Supersedes previous certificate revisions for the same blind.
  - Creates an activity log entry.

- `core.tagSettings`
  - Reads global/project tag designer settings.
  - Project settings inherit from global settings if no project template exists.

- `core.saveTagSettings`
  - Saves project/global tag template settings.

### New / Updated DB Objects

- Enhanced `certificates` table with:
  - `certificateType`
  - `revision`
  - `templateVersion`
  - `qrValue`
  - JSON snapshots for blind, torque, approvals, and workflow
  - `printCount`
  - `lastPrintedAt`
  - `updatedAt`

- New `tag_designer_settings` table with:
  - project/global scope
  - tag dimensions
  - tag color, accent color, text color
  - logo text
  - visible field toggles
  - QR size
  - font scale
  - layout mode

Migration file:

```txt
/drizzle/0005_sprint6_certificate_tag_persistence.sql
```

---

## Frontend Additions

### New Page

```txt
/projects/:id/tag-settings
```

Page name: **Tag Designer Settings**

Features:

- Live tag preview
- Tag size settings
- Color picker for tag/accent/text
- Logo/header text
- QR size
- Font scale
- Visible field toggles
- Layout mode
- Save project template

### Updated Project Dashboard

Project Setup now includes:

- Add Blind
- Bulk Add from Excel
- Phase Task Assignment
- Tag Designer Settings
- Export All Tags
- Print Certificates

### Updated Tag Printing

Pages affected:

```txt
/projects/:id/tags
/blinds/:id/tag
```

Both now read project tag settings from backend and apply:

- tag width / height
- colors
- QR size
- logo text
- field visibility
- font scale

### Updated Certificate Builder

Page affected:

```txt
/blinds/:id/certificate
```

New features:

- Save certificate record
- Print and mark as printed
- Show latest persisted status
- Show revision number
- Show saved records count

### Updated Project Certificate Package

Page affected:

```txt
/projects/:id/certificates
```

New features:

- Certificate register KPIs
- Saved certificates count
- Printed count
- Revision count
- Save missing certificates for project package

---

## How to Run

```powershell
pnpm install
pnpm dev
```

If `pnpm` is missing:

```powershell
npm install -g pnpm
pnpm install
pnpm dev
```

---

## Suggested Test Flow

1. Open a project.
2. Open **Project Setup → Tag Designer Settings**.
3. Change tag accent color, QR size, font scale, and visible fields.
4. Save template.
5. Open **Export All Tags**.
6. Confirm the printed tags follow the saved template.
7. Open a Blind Details page.
8. Open **Certificate**.
9. Click **Save Certificate**.
10. Open **Project Setup → Print Certificates**.
11. Confirm the saved certificate appears in the register.

---

## Next Recommended Sprint

**Sprint 7 — Notifications + Inbox Actions + Certificate/Tag Audit Trail**

Suggested scope:

- Notify assigned users when approval is required.
- Notify when certificate is issued or revised.
- Add print history and tag export history.
- Add certificate archive and revision viewer.
