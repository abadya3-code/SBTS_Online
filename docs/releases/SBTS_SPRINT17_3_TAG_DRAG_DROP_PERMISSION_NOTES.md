# Sprint 17.3 — Default Tag Drag & Drop Polish

## Summary
Improved `Settings → Tags → Default Tag Settings` so tag preview elements can be moved directly with the mouse.

## Updated
- `client/src/pages/SystemSettingsCenter.tsx`

## What changed
- Added true mouse drag/drop movement for:
  - Hanging hole
  - Company logo
  - Title
  - QR code
  - Data block
  - MM/YYYY date
- Selected element is highlighted with a blue ring.
- Layout is saved locally in the browser and also persisted when saving settings.
- Reset default restores both tag values and element positions.

## Database impact
No database migration required.

## Permission notes
If the UI shows `You do not have required permission (10001/10002)`, the current session is not authorized for that action. In production, log in with the seeded `admin` account or ensure the user is Active and has the correct admin/supervisor role.
