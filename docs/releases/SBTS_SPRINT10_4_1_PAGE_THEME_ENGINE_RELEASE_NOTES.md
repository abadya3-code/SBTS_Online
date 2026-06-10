# SBTS Sprint 10.4.1 — Page Theme Engine + Sidebar Overflow Fix

## What changed

- Upgraded the theme system from simple shell colors to a page-level theme engine.
- Theme selection now affects:
  - App background
  - Sidebar
  - Header/topbar
  - Page headers
  - Cards/panels
  - Buttons/accent styles
  - Radius and shadows
  - SAP flat layout style
- Added semantic CSS hooks:
  - `sbts-sidebar`
  - `sbts-topbar`
  - `sbts-main`
  - `sbts-page-header`
  - `sbts-card`
  - `sbts-nav-link-active`
- Fixed the User Profile sidebar overflow where the text “Open Inbox and pending messages” could appear as a random white block near the bottom of the page.

## Theme behavior

- Future / Modern: keeps the current premium SBTS command center appearance.
- Classic SBTS: stronger original SBTS blue identity with simpler cards.
- SAP Clean: flat white/grey business style, minimal shadows, smaller radius.
- Custom Accent: keeps the modern SBTS layout but follows the user-selected accent color.

## Notes for future maintenance

New pages should use `PageHeader` and `sbts-card` whenever possible so the theme engine can style them automatically.
