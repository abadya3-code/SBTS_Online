# Sprint 17.1 — Default Tag Settings Reorder

## Summary
Updated the Project Tag Designer / Default Tag Settings page to match the preferred classic arrangement:

- Left side: toolbar + live tag canvas.
- Right side: templates, global tag color, company logo upload, tag size, row/font controls, layer position, date size, snap grid, and template change log.
- Added mouse drag behavior for title, logo, hole, QR, data block, and date.
- Default tag orientation changed to 70mm × 110mm vertical.
- Local template layout state is stored in browser local storage while main tag print settings continue to save through the existing project tag settings API.

## Updated file
- `client/src/pages/TagDesignerSettings.tsx`

## Database impact
No database migration required.
