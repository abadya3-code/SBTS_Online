# SBTS Sprint 10.4.3 — SBTS Command Pro Theme

## Purpose
This release adds a new fully isolated visual theme called **SBTS Command Pro**. It is designed as an engineer-led industrial command interface for SBTS, distinct from Future / Modern, Classic SBTS, SAP Clean, and Custom Accent.

## What changed

### 1. New Theme Option
Added a fifth theme option:

- **SBTS Command Pro**

It is available in:

- Settings → General → Theme Template
- User Profile → Preferred Theme, when personal theme mode is enabled

### 2. Dedicated App Shell Layout
Unlike a simple color swap, Command Pro changes the app shell layout:

- Left micro rail for system actions
- Grouped navigation sidebar
- Operator card with active session status
- Industrial top command bar
- Production-bound status pills
- Wider workspace for dashboards and registers

### 3. Isolated CSS System
All Command Pro styling is isolated under:

```css
.theme-command-pro
```

Switching back to Future / Modern, Classic SBTS, SAP Clean, or Custom Accent does not inherit Command Pro layout rules.

### 4. Visual Identity
Command Pro uses:

- Deep petrol navy background
- Signal cyan action color
- Safety green status accent
- Amber warning and red lockout status colors
- Industrial grid background
- Command-style grouped navigation

### 5. Page-Level Styling
Command Pro applies a distinct look to:

- Page headers
- Cards
- Tables
- Inputs
- Buttons
- Sidebar
- Topbar
- Active navigation

## How to test

1. Run the app:

```powershell
pnpm install
pnpm dev
```

2. Login as Admin.
3. Open Settings → General.
4. Set Theme Template to **SBTS Command Pro**.
5. Save Settings.
6. Open User Profile and ensure Theme Mode is set to **Use System Settings theme**, unless testing a personal theme override.

## Engineering note
This theme was built as an independent theme shell and should be treated as a premium SBTS visual mode. Future page-specific optimizations can add Command Pro dashboard arrangements without affecting other themes.
