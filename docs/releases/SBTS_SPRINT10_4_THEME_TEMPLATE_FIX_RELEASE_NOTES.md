# SBTS Sprint 10.4 — Theme Template Activation Fix

## Goal
Fix the Theme Template selector so it actually changes the application style and responds correctly from System Settings and User Profile.

## What changed

### 1. Central Theme Engine
Added `client/src/lib/themeEngine.ts` to centralize:
- Theme option labels
- Theme-to-CSS-class mapping
- Theme change events

### 2. System Settings Theme Now Works
The General Settings theme selector now controls the live application shell when the user profile is set to **Use System Settings theme**.

### 3. User Profile Theme Mode
Added a clear personal preference mode:
- Use System Settings theme
- Use my personal theme

This prevents the personal default value from blocking the global Settings theme.

### 4. Live Theme Preview
System Settings now includes a live visual preview for:
- Future / Modern
- Classic SBTS
- SAP Clean
- Custom Accent

### 5. Stronger Theme CSS
Added CSS rules that affect the full shell:
- Background
- Sidebar
- Header
- Cards
- Active navigation
- SAP flat mode
- Custom accent color

### 6. Immediate Refresh Events
Saving System Settings now dispatches theme/settings events so the app shell refreshes instead of waiting for stale cache.

## How to test
1. Login as Admin.
2. Open Settings → General.
3. Change Theme Template.
4. Click Save Settings.
5. Sidebar/header/cards/background should change.
6. Open User Profile.
7. Keep Theme Mode as `Use System Settings theme` if you want global setting to control the theme.
8. Choose `Use my personal theme` only when this employee needs a personal override.

## Notes
If an old browser session had a personal theme saved, open User Profile and select **Use System Settings theme**, then save profile.
