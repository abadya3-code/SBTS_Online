# Sprint 17.2 — System Default Tag Settings Reorder

## Summary
This update fixes the correct page the user was viewing:

- `Settings → Tags → Default Tag Settings`
- file: `client/src/pages/SystemSettingsCenter.tsx`

The previous Sprint 17.1 update changed the project-level Tag Designer page:
- `Project Setup → Tag Designer`
- file: `client/src/pages/TagDesignerSettings.tsx`

## What changed in System Settings
The Default Tag Settings tab now follows the preferred classic layout:

- Left side:
  - Reset default
  - Save template
  - Test print
  - Large live tag canvas
  - QR scanning tip

- Right side:
  - Templates
  - Global tag color
  - Company logo upload
  - Tag size in mm
  - Rows / labels visibility
  - Font / QR / hole controls

## Database impact
No database migration is required.
Existing `system_settings` JSON is used.
