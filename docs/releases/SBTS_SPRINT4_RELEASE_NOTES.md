# SBTS Sprint 4 — Approval Center + Pending Approval Inbox + Torque Records Display

## Scope
Sprint 4 connects the workflow gate from Sprint 3 to an approval control layer and a visible torque record trail.

## Added

### 1. Approval Center Page
New route:

```txt
/approvals
```

The page includes:

- Pending Approval Inbox
- Approval KPI cards
- Search by tag, blind, project, line, area, or phase
- Filter by status and required role
- Approve / Reject actions
- Authorized badge validation through backend workflow assignment
- Direct link to Blind Details

### 2. Backend Approval API
New API methods under `core`:

```txt
core.approvalCenter
core.pendingApprovals
core.approveRequest
```

Approval requests are validated against Project Setup → Phase Task Assignment before closing.

### 3. Automatic Approval Request
When a blind is moved to:

```txt
Final Tight
```

The system automatically creates a pending approval request for the authorized phase role.

### 4. Torque Records API
New API method:

```txt
core.torqueRecords
```

The backend now exposes torque records for:

- all blinds
- a specific blind by ID

### 5. Torque Records Display in Blind Details
Blind Details now has a dedicated **Torque Records** card showing:

- Machine type
- PSI value
- Phase
- Technician name / badge
- Tool / machine remarks
- Timestamp

### 6. Navigation Update
The sidebar now includes:

```txt
Approval Center
```

## Demo Mode Behavior
The app still works without `DATABASE_URL`.

Demo store now tracks:

- approvals
- pending approvals
- closed approvals
- torque records
- approval logs

## Database Mode Behavior
The app uses the existing Sprint 1 database tables:

```txt
approvals
torque_records
blind_workflow_logs
```

No new table is required for Sprint 4.

## Test Scenario
1. Open a project.
2. Open a blind.
3. Move the blind to **Tight & Torque** and enter torque data.
4. Confirm the torque record appears in Blind Details.
5. Move the blind to **Final Tight**.
6. Open **Approval Center**.
7. Approve or reject the pending request with an authorized badge.
8. Confirm the Blind activity log reflects the approval decision.

## Next Recommended Sprint

### Sprint 5 — Certificate Builder + Tag Printing
Recommended scope:

- Certificate preview
- Certificate print/PDF
- Torque + approvals embedded in certificate
- QR code package
- Export all tags from Project Setup
- Print selected / print all tags
