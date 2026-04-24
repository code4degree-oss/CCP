# AMS Frontend — Complete Developer Guide

> **Last Updated:** 24 April 2026  
> **Tech Stack:** Next.js 14.2 + TypeScript + Tailwind-style CSS (custom tokens)  
> **Project Folder:** `ams-ui/ams-ui/`  
> **Runs on:** `http://localhost:3000` (or `ccp.dybusinesssolutions.com`)

---

## 📁 Folder Structure

```
ams-ui/ams-ui/
├── public/                    # Static assets (logos, SVGs)
│   ├── LOGO SVG.svg           # Dark theme logo
│   └── LOGO CCP.png           # Light theme logo
├── src/
│   ├── app/                   # Next.js App Router (pages)
│   │   ├── layout.tsx         # Root layout (fonts, theme provider)
│   │   ├── globals.css        # Global CSS with design tokens
│   │   ├── page.tsx           # Main dashboard shell (after login)
│   │   └── login/
│   │       └── page.tsx       # Login page + force password change
│   ├── components/
│   │   ├── layout/            # Shell components
│   │   │   ├── Sidebar.tsx    # Left navigation bar
│   │   │   └── Topbar.tsx     # Top header bar (Notification bell removed)
│   │   ├── modules/           # Feature modules (main screens)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Enquiries.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Admissions.tsx
│   │   │   ├── Branches.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── Payments.tsx               # Fully functional Payment module
│   │   │   ├── PrintFeeReceipt.tsx        # Receipt printing view
│   │   │   ├── PrintAdmissionForm.tsx     # 5-page admission form printable
│   │   │   ├── Placeholder.tsx
│   │   │   └── StudentDetailsSidepanel.tsx
│   │   ├── ui/
│   │   │   └── index.tsx      # Reusable UI components (Badge, Button, Card, Table, etc.)
│   │   ├── theme-provider.tsx # Dark/light theme wrapper
│   │   └── theme-toggle.tsx   # Theme switch button
│   ├── lib/
│   │   └── api.ts             # API client — ALL backend calls
│   └── types/
│       └── index.ts           # TypeScript interfaces
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js             # Contains proxy rewrites for /api/ and /media/
```

---

## 🎨 Design System

The app uses a **custom dark theme** with CSS variables defined in `globals.css`:

| Token | Purpose | Value |
|-------|---------|-------|
| `--bg-base` | Page background | `#0a0a0b` |
| `--bg-surface` | Sidebar, modals | `#111113` |
| `--bg-card` | Cards | `#141416` |
| `--accent-blue` | Primary actions | `#3b82f6` |
| `--accent-green` | Success states | `#22c55e` |
| `--accent-red` | Danger states | `#ef4444` |
| `--accent-purple` | Super Admin badge | `#8b5cf6` |
| `--txt-primary` | Main text | `#f0f0f1` |
| `--txt-muted` | Labels, hints | `#4a4a52` |

---

## 📄 File-by-File Explanation

---

### `src/app/page.tsx` — Main App Shell & Routing Security

**This is the homepage after login.**

How it works:
1. **Security:** On load, checks `localStorage` for `ams_user` and `session_cookie`. If missing → forces hard redirect to `/login` to prevent unauthorized access.
2. **Hash-Based SPA Routing:** Listens to `window.location.hash` (e.g., `#dashboard`, `#admissions`) to determine the active module. This allows back/forward browser navigation without leaving the app.
3. Renders `Sidebar` + `Topbar` + the active module using a `switch(active)` statement.

---

### `src/app/login/page.tsx` — Login Page

Two screens in one file:

**Screen 1 — Login Form**
- Email + Password inputs
- Calls `authApi.login(email, password)`
- On success: stores user data in `localStorage` as `ams_user` and sets a dummy `session_cookie`.
- If `user.must_change_password` is true → shows Screen 2

**Screen 2 — Force Password Change**
- Shows for first-time login employees (auto-generated password)
- New Password + Confirm Password inputs
- Calls `authApi.changePassword(userId, newPassword, confirmPassword)`

---

### `src/components/layout/Sidebar.tsx` — Navigation

**Role-based navigation:**

| User Type | Visible Nav Items |
|-----------|------------------|
| **Employee / Branch Admin** | Dashboard, Enquiries, Students, Admissions, Payments, Reports (6 items) |
| **Super Admin** | All items including Branches, Users, Settings |

Features:
- **Logout Action:** Completely clears `localStorage`, wipes cookies, and does a hard `window.location.href = '/login'` to prevent logout-loop bugs.

---

### `next.config.js` — Proxy Settings

Critical for production deployment. It contains `rewrites`:
- `/api/:path*` → Proxies to Django `http://127.0.0.1:8000/api/:path*`
- `/media/:path*` → Proxies to Django `http://127.0.0.1:8000/media/:path*` (crucial for document downloads).

---

### `src/lib/api.ts` — API Client

**All backend communication goes through this file.** 
Every API call is wrapped in `apiFetch()`, which handles CSRF tokens and error throwing.

---

## 📦 Module Components (Feature Screens)

---

### `modules/Dashboard.tsx` — Dashboard

What it shows:
- **6 stat cards**: Enquiries, Students, Admissions, Admitted, Pending Docs, Success Rate
- **Conversion funnel**: Visual bar chart
- **Recent admissions**: Last 5 admissions

Data filtering & Resilience:
- **Resilience:** Uses `Promise.allSettled` (via individual try/catch blocks) so if one API fails (e.g., payments), the other stats still load successfully.
- **Filtering:** Relies ENTIRELY on the backend to filter branch-specific data. The frontend local filtering was removed to fix zero-count bugs.

---

### `modules/Admissions.tsx` & `PrintAdmissionForm.tsx`

**Draft-to-Final workflow:**
1. Form starts as Draft (`is_finalized=false`)
2. Employee checks consent boxes and clicks "Save (Finalize)".
3. After finalization, Employees can PRINT the form.
4. **Printing Protocol:** The `handlePrint` action dispatches a custom `ams-print-admission` event. This forces the browser to render the full, 5-page `PrintAdmissionForm.tsx` component (which includes the Category-aware Document Checklist and Terms & Conditions) instead of just screenshotting the UI.

---

### `modules/Payments.tsx` & `PrintFeeReceipt.tsx`

- Replaced the old placeholder with a fully functional Payments management module.
- Tracks course fees, total paid, and pending balances.
- **Fee Receipts:** Generates dynamic, printable PDF-style fee receipts.
- **Signature Layout:** The receipt has been refined to feature a clean row of 3 signature lines: "Parent Sign", "Student Sign", and "Coordinator Sign" (removing redundant name/date fields).

---

## 📝 Recent Change Log

| Date | What Changed |
|------|-------------|
| 24 Apr 2026 | Removed unused Notification Bell from Topbar for a cleaner UI. |
| 24 Apr 2026 | Made Dashboard API resilient to individual failures (fixed 0 stat bug). |
| 24 Apr 2026 | Updated `PrintFeeReceipt.tsx` to strictly use 3 signature blocks (Parent, Student, Coordinator). |
| 24 Apr 2026 | Removed local branch filtering from `Dashboard.tsx` to rely on backend isolation. |
| 22 Apr 2026 | Refactored print mechanisms to trigger the full 5-page `PrintAdmissionForm.tsx`. |
| 21 Apr 2026 | Implemented `#hash` based routing and strict route protection in `page.tsx`. |
| 19 Apr 2026 | Built full Payments module and multi-receipt generation system. |
| 18 Apr 2026 | Added `/media/` proxy rewrite to `next.config.js` to fix 502 Bad Gateway download errors. |
| 18 Apr 2026 | Hardened logout flow to completely wipe local states and prevent redirect loops. |
