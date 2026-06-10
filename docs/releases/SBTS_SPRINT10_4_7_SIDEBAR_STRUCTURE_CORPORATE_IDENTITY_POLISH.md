# SBTS Sprint 10.4.7 — Sidebar Structure & Corporate Identity Polish

## Purpose
Polish the Command Pro sidebar so it looks like a production application identity panel, removes the visible sidebar scrollbar, and presents the company logo/name/app title in a cleaner hierarchy.

## Changes

### Command Pro Sidebar
- Removed the visible navigation scrollbar by compacting the Command Pro sidebar layout.
- Reduced vertical spacing and made the navigation fit better on standard laptop screens.
- Rebalanced the sidebar into a compact structure:
  - Corporate/app identity card
  - Active user card
  - grouped navigation
  - compact footer actions

### Corporate Identity Header
- Reworked the brand block to show:
  - company short name / company name
  - Smart Blind Tag System name
  - facility and department line
- Reduced the logo size to a more professional, comfortable size.
- Kept the uploaded company logo inside the identity card.

### Footer Cleanup
- Removed the large lower text card.
- Replaced it with compact Profile and Logout actions.
- Kept Inbox in the topbar to avoid duplicated sidebar actions.

### Command Pro Visual Polish
- Adjusted Command Pro spacing, card radius, typography, and compact-mode behavior.
- Added responsive compacting for shorter screens.
- Changes are isolated under `.theme-command-pro` so Modern, Classic, SAP, and Custom themes are not affected.

## Validation Note
A full TypeScript check could not be completed in the build environment because `node_modules` type packages are not installed in the extracted archive (`node` and `vite/client` type definitions are missing). The edited files were reviewed for JSX/CSS structure.

## Run

```powershell
pnpm install
pnpm dev
```

If pnpm is not installed:

```powershell
npm install -g pnpm
pnpm install
pnpm dev
```
