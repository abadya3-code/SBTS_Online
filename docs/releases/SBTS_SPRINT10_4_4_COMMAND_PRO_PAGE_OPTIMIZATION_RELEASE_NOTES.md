# SBTS Sprint 10.4.4 — Command Pro Page Optimization

## Purpose
This sprint refines the new SBTS Command Pro theme from a visual experiment into a cleaner production-grade layout.

## Changes

### Command Pro Shell
- Removed the separate mini icon rail on the far left.
- Enlarged the main sidebar and improved navigation spacing.
- Rebalanced the Command Pro palette to a refined petrol/teal industrial style.
- Converted the app identity area into a single integrated brand card.
- Moved Inbox and Logout to proper quick actions instead of the removed rail.
- Removed the visible theme-name/debug label from the sidebar footer.

### Application Logo
- Added an Application Logo upload control in Settings → General.
- The logo is saved through the existing `general.logoUrl` setting as an uploaded data URL.
- The logo now appears inside the Command Pro app identity card.

### Command Pro Page Styling
- Improved card surfaces, borders, shadows, headers, inputs, tables, and active navigation under `.theme-command-pro` only.
- The Command Pro styling remains isolated so Future/Modern, Classic SBTS, SAP Clean, and Custom Accent do not inherit these changes.

## QA Notes
- Select `SBTS Command Pro` from Settings → General → Theme Template.
- Save settings.
- Ensure User Profile → Theme Mode is set to `Use System Settings theme`.
- Upload an Application Logo from Settings → General and confirm it appears in the Command Pro sidebar identity card.
