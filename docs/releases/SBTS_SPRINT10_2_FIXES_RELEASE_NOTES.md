# SBTS Sprint 10.2 — UX Corrections, Settings Activation, Login Registration, Dashboard Refinement

## Scope
This sprint addresses the correction list provided after Sprint 10.1. It focuses on making the application easier to maintain, reducing operator mistakes, and moving system-wide controls into System Settings.

## Completed

### Authentication
- Added `/register` new user registration shell.
- Login now clearly supports two paths:
  1. Username/password registration path.
  2. SSO / badge-based login path for production identity provider integration.

### Sidebar / User Access
- Removed Inbox from the sidebar navigation list.
- Added Inbox access through the user profile card in the sidebar.
- Added an Inbox button beside the notification bell.
- Header identity now reads from System Settings.

### System Settings Activation
- General Settings now controls application identity:
  - System Name
  - Facility / Plant
  - Department
  - Logo Text
  - Logo URL
  - Header Description
  - Dashboard hero title and description
  - Theme template selector
- Tag Settings now has live preview and global control.
- Certificate Settings now supports logo URL and font scale foundation.

### Dashboard
- Dashboard hero text now comes from Settings.
- Added Areas KPI above Tracked Blinds.
- Reworked Workflow phase ownership into phase statistics without owner labels.
- Added Slip Blind Summary for all projects.
- Current Blind Focus now shows latest 5 only.

### Areas / Projects
- Areas page subtitle cleaned.
- Project creation from an Area keeps area locked to reduce wrong selection mistakes.
- Project form now uses Maintenance Reason / Scope Description instead of workflow display.
- Project Scope displays Maintenance Reason.

### Project Dashboard
- Removed project-level Tag Designer action from Project Setup.
- Tag design is now centralized in System Settings to prevent project-by-project layout mistakes.
- Project Blinds QR icon now opens printable tag and includes hover guidance.

### Tags / Certificates
- Project and single tag print pages now use global System Settings tag layout.
- Blind status removed from printed tags to keep physical tags clean.
- Certificate Builder reads certificate title, QR visibility, torque visibility, approval visibility, activity summary visibility, and font scale from Settings.

### Blind Details / Phase Update
- Phase update gate is simplified.
- The active logged-in user is the updater.
- Users cannot select another employee to sign the phase update.
- Signature ID must match the logged-in user's badge.
- The update still validates against Phase Task Assignment authorization.

## Pending for next sprint
- Full visual recreation of the legacy patch47.48 certificate layout if the exact target screenshot is provided.
- Final Approvals configuration by blind type: Blind / Slip Blind / Drop Spool.
- Real username/password credential storage and SSO provider binding.
- Full theme engine for Template #2 Classic, Template #3 SAP, and Template #4 Custom.
