# AMS Frontend — Complete Developer Guide

> **Last Updated:** 11 April 2026  
> **Tech Stack:** Next.js 14.2 + TypeScript + Tailwind-style CSS (custom tokens)  
> **Project Folder:** `ams-ui/ams-ui/`  
> **Runs on:** `http://localhost:3000`

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
│   │   │   └── Topbar.tsx     # Top header bar
│   │   ├── modules/           # Feature modules (main screens)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Enquiries.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Admissions.tsx
│   │   │   ├── Branches.tsx
│   │   │   ├── Users.tsx
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
└── next.config.mjs
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

### `src/app/layout.tsx` — Root Layout

- Sets the HTML `lang` and loads Google Font (Outfit)
- Wraps entire app in `ThemeProvider` for dark/light mode
- No auth logic here — that's in `page.tsx`

---

### `src/app/globals.css` — Global Styles

Contains:
- CSS custom properties (color tokens listed above)
- Tailwind `@theme` block mapping tokens to utility classes
- Custom animations: `fade-in`, `slide-in`, `pulse-dot`
- Table row hover styles
- Grid background pattern
- Status color classes for badges

---

### `src/app/page.tsx` — Main App Shell

**This is the homepage after login.**

How it works:
1. On load, checks `localStorage` for `ams_user`. If missing → redirect to `/login`
2. Renders `Sidebar` + `Topbar` + the active module
3. Uses a `switch(active)` to render the correct module component
4. Module switching is client-side only (no page navigation)

Page metadata mapping:
```
dashboard  → DashboardModule
enquiries  → EnquiriesModule
students   → StudentsModule
admissions → AdmissionsModule
branches   → BranchesModule
users      → UsersModule
payments   → PlaceholderModule (not built yet)
settings   → PlaceholderModule (not built yet)
```

---

### `src/app/login/page.tsx` — Login Page

Two screens in one file:

**Screen 1 — Login Form**
- Email + Password inputs
- Calls `authApi.login(email, password)`
- On success: stores user data in `localStorage` as `ams_user`
- If `user.must_change_password` is true → shows Screen 2

**Screen 2 — Force Password Change**
- Shows for first-time login employees (auto-generated password)
- New Password + Confirm Password inputs
- Calls `authApi.changePassword(userId, newPassword, confirmPassword)`
- On success: updates localStorage and navigates to dashboard

---

### `src/components/layout/Sidebar.tsx` — Navigation

**Role-based navigation:**

| User Type | Visible Nav Items |
|-----------|------------------|
| **Employee** | Dashboard, Enquiries, Students, Admissions (4 items) |
| **Branch Admin / Super Admin** | All 8 items including Payments, Branches, Users, Settings |

How role is detected:
```typescript
const isEmployee = user.role && user.role.toLowerCase().includes('employee')
const navItems = isEmployee ? BASE_NAV : ADMIN_NAV
```

Features:
- Collapsible sidebar (desktop: toggle button, mobile: hamburger menu)
- Shows user avatar (initials), name, and role at the bottom
- Logout button clears `localStorage` and redirects to `/login`

---

### `src/components/layout/Topbar.tsx` — Header Bar

- Shows page title + subtitle
- Has a search bar (UI only, not functional yet)
- Notification bell icon (UI only)
- Shows current date

---

### `src/components/ui/index.tsx` — Reusable UI Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `Badge` | `status`, `channel` | Colored status pills (Admitted=green, Pending=amber, etc.) |
| `Button` | `variant`, `size` | 4 variants: `primary` (blue), `secondary` (bordered), `ghost` (transparent), `danger` (red) |
| `Card` | `glow` | Bordered card container with optional glow effect |
| `StatCard` | `label`, `value`, `icon`, `trend` | Dashboard metric card with animation |
| `Table` | `columns`, `data`, `keyField` | Generic data table with custom column renderers |
| `EmptyState` | `message` | Placeholder for empty lists |
| `SectionHeader` | `title`, `action` | Section title with optional action button |
| `Dot` | `color` | Tiny colored dot indicator |

---

### `src/lib/api.ts` — API Client (CRITICAL FILE)

**All backend communication goes through this file.** Every API call follows the same pattern:

```typescript
const API_BASE = 'http://localhost:8000/api'
// Every function calls apiFetch() which:
// 1. Adds Content-Type: application/json
// 2. Appends trailing slash (Django requires it)
// 3. Throws error with detail message on non-OK responses
// 4. Returns parsed JSON
```

#### Available API Modules:

| Module | Methods | Backend Endpoint |
|--------|---------|-----------------|
| `authApi` | `login(email, password)`, `changePassword(userId, newPw, confirmPw)` | `/api/login/`, `/api/change-password/` |
| `branchesApi` | `list()`, `get(id)`, `create(data)`, `update(id, data)`, `remove(id)` | `/api/branches/` |
| `branchCoursesApi` | `list(branchId?)`, `create(data)`, `update(id, data)`, `remove(id)` | `/api/branch-courses/` |
| `orgsApi` | `list()`, `get(id)`, `create(data)`, `update(id, data)` | `/api/organizations/` |
| `studentsApi` | `list()`, `get(id)`, `create(data)`, `update(id, data)`, `remove(id)` | `/api/students/` |
| `enquiriesApi` | `list(qs?)`, `create(data)`, `update(id, data)`, `remove(id)` | `/api/enquiries/` |
| `admissionsApi` | `list(qs?)`, `get(id)`, `create(data)`, `update(id, data)` | `/api/admissions/` |
| `streamsApi` | `list()`, `create(data)` | `/api/streams/` |
| `coursesApi` | `list()`, `create(data)` | `/api/courses/` |
| `collegesApi` | `list()`, `create(data)` | `/api/colleges/` |
| `usersApi` | `list(qs?)`, `get(id)`, `create(data)`, `update(id, data)`, `remove(id)`, `suspend(id)` | `/api/users/` |
| `rolesApi` | `list()`, `create(data)` | `/api/roles/` |
| `feesApi` | `list()`, `create(data)`, `update(id, data)` | `/api/branch-fee-configs/` |
| `paymentsApi` | `list()`, `create(data)` | `/api/payments/` |

> ⚠️ **For production:** Change `API_BASE` to use an environment variable: `process.env.NEXT_PUBLIC_API_URL`

---

### `src/types/index.ts` — TypeScript Interfaces

Defines TypeScript types for all data models. These are used mainly by `StudentDetailsSidepanel.tsx`.

> **Note:** Most modules (Admissions.tsx, Users.tsx, etc.) define their own inline interfaces instead of using these shared types, because the API response shape doesn't always match these types exactly.

Key types: `Student`, `Admission`, `Payment`, `User`, `Branch`, `Organization`, `StatusHistory`

---

## 📦 Module Components (Feature Screens)

---

### `modules/Dashboard.tsx` — Dashboard

What it shows:
- **6 stat cards**: Enquiries, Students, Admissions, Admitted, Pending, Success Rate
- **Conversion funnel**: Visual bar chart (Enquiries → Students → Admitted)
- **Recent admissions**: Last 5 admissions with status badges

Data filtering:
- **Super Admin**: Sees ALL data across all branches
- **Branch Admin / Employee**: Sees only their branch's data

Special states:
- If user has no role + no branch → shows "Account Inactive" message
- If user has role but no branch (or vice versa) → shows warning banner

---

### `modules/Enquiries.tsx` — Enquiry Management

Features:
- Table with columns: Name, Mobile, Branch, **Filled By**, Course Interest, Source, Expected NEET, Date
- "New Enquiry" button (hidden for Super Admin)
- Modal form for creating/editing enquiries
- Search functionality by name/mobile

Form fields: Full Name, Mobile, Parent Mobile, Branch, Category, Course Interest, Source, NEET Expected Marks, HSC %, NEET Application No

---

### `modules/Students.tsx` — Student Registry

Features:
- Table with columns: Name (with avatar), Mobile, Branch, Category, NEET Rank, Marks, Date
- Search by name/mobile
- Click a row to open the Student Details Sidepanel
- **Delete button** (only for Branch Admin + Super Admin)
  - Opens a confirmation modal that requires typing "delete" to confirm

> **Note:** Students are NOT created manually. They are created only through the Admission workflow.

---

### `modules/StudentDetailsSidepanel.tsx` — Student Details

A right-side sliding panel with 6 tabs:

| Tab | What It Shows |
|-----|--------------|
| **Overview** | NEET rank/marks, basic info grid, document count |
| **Personal** | NEET details, religion, nationality, special statuses (PwD, Orphan, Minority, etc.) |
| **Address** | Full residential address |
| **Category** | Caste certificate, validity, NCL/EWS details |
| **Academic** | SSC/HSC details, subject marks (Physics, Chemistry, Biology, English), PCB/PCBE percentages, reservation info |
| **Documents** | List of uploaded documents with verification status |

---

### `modules/Admissions.tsx` — Admission Management

**This is the most complex module.**

Features:
- Table with columns: ID, Student, Branch, Stream, **Filled By**, Status, **Draft/Final badge**, Actions
- "New Admission" button (hidden for Super Admin)
- Full-page form for creating/editing admissions

**Draft-to-Final workflow:**
1. Form starts as Draft (`is_finalized=false`)
2. Two checkboxes at the bottom:
   - ☐ "All information provided is correct and verified"
   - ☐ "I authorize this admission and consent to proceed"
3. When BOTH are checked → "Save Draft" button changes to "Save (Finalize)"
4. After finalization:
   - Employees see a **Print** button (calls `window.print()`)
   - Employees CANNOT edit finalized admissions
   - Branch Admin CAN still edit finalized admissions

**Role-based behavior:**
| Action | Employee | Branch Admin | Super Admin |
|--------|----------|-------------|-------------|
| View all branch admissions | ✅ | ✅ | ✅ (all branches) |
| Create new admission | ✅ | ✅ | ❌ |
| Edit draft admission | ✅ | ✅ | ✅ |
| Edit finalized admission | ❌ | ✅ | ✅ |
| Print admission | ✅ | ✅ | ✅ |

---

### `modules/Branches.tsx` — Branch Management

Features:
- Branch cards showing: name, city/state, district, pincode, mobile, login ID, **Branch Admin** name
- Expandable course & fee structure per branch
- Create/Edit modal with:
  - Organization selector
  - Branch info fields (name, city, state, district, pincode, mobile)
  - **Branch Admin** dropdown (assign a user as admin)
  - Course rows (select course + set fee amount, can add multiple)

---

### `modules/Users.tsx` — User/Employee Management

Features:
- Table with columns: Name (with avatar), Mobile, Designation (role badge), Branch, **Created By**, Status, Actions
- Search by name/email/mobile
- Full-page form for creating/editing users

**Creating a new employee:**
1. Fill: Full Name, Email, Mobile, Role, Branch (if Super Admin)
2. **No password field** — backend auto-generates a random password
3. After creation → popup shows generated credentials with **Copy** button

**Editing an employee:**
- Full name is locked (can't be changed)
- Optional: change password, change role, toggle active status

**Action buttons per role:**
| Action | Branch Admin sees | Super Admin sees |
|--------|------------------|-----------------|
| Suspend (deactivate) | ✅ Shield icon | ❌ |
| Delete (permanent) | ❌ | ✅ Trash icon |
| Edit | ✅ Pencil icon | ✅ Pencil icon |

---

### `modules/Placeholder.tsx` — Coming Soon

Simple placeholder for unbuilt modules (Payments, Settings). Shows a "Coming Soon" message with the module name.

---

### `components/theme-provider.tsx` — Theme Wrapper

Wraps the app with `next-themes` for dark/light mode support. Currently the app defaults to dark mode.

---

### `components/theme-toggle.tsx` — Theme Switch

A button to toggle between dark and light themes. Uses `next-themes` `useTheme()` hook.

---

## 🔑 Authentication Flow

```
1. User opens app → page.tsx checks localStorage for 'ams_user'
2. If missing → redirect to /login
3. User enters email + password → POST /api/login/
4. Backend returns user object with: id, email, full_name, role, branch_id, must_change_password
5. If must_change_password=true → show change password screen
6. After password change (or if not needed) → save to localStorage → navigate to /
7. All subsequent role checks read from localStorage:
   - user.is_superuser → Super Admin
   - user.role includes 'employee' → Employee
   - Otherwise → Branch Admin
8. Logout → clear localStorage → redirect to /login
```

> ⚠️ **Important:** There are NO auth tokens sent with API requests. The backend currently uses AllowAny. For production, implement JWT authentication.

---

## 🛠️ How to Run

```bash
cd ams-ui/ams-ui
npm install
npm run dev
```

Opens on: `http://localhost:3000`  
Make sure backend is running on: `http://localhost:8000`

---

## 📝 Change Log

| Date | What Changed | Files |
|------|-------------|-------|
| 11 Apr 2026 | Added "Filled By" column to Admissions and Enquiries tables | `Admissions.tsx`, `Enquiries.tsx` |
| 11 Apr 2026 | Added Draft/Final status badge to Admissions table | `Admissions.tsx` |
| 11 Apr 2026 | Removed employee-only filter — all employees now see all branch admissions | `Admissions.tsx`, `Dashboard.tsx`, `api.ts` |
| 11 Apr 2026 | Renamed all "Manager"/"Counselor" labels to "Branch Admin"/"Filled By" | `Branches.tsx`, `Users.tsx`, `StudentDetailsSidepanel.tsx`, `page.tsx` |
| 11 Apr 2026 | Removed unused imports across all modules | Multiple files |
| 11 Apr 2026 | Fixed `admissionsApi.list()` and `enquiriesApi.list()` to accept query strings | `api.ts` |
| 11 Apr 2026 | Fixed `theme-provider.tsx` broken import path | `theme-provider.tsx` |
| 11 Apr 2026 | Removed dead PLACEHOLDER_META entry for 'users' | `page.tsx` |
| 10 Apr 2026 | Added draft-to-finalize workflow with consent checkboxes | `Admissions.tsx` |
| 10 Apr 2026 | Added double-confirmation delete modal (type "delete") for students | `Students.tsx` |
| 10 Apr 2026 | Implemented role-based sidebar navigation | `Sidebar.tsx` |
| 10 Apr 2026 | Added user suspend/delete actions with role guards | `Users.tsx` |
| 10 Apr 2026 | Added credential copy modal for new employee creation | `Users.tsx` |
| 10 Apr 2026 | Added branch-level dashboard filtering | `Dashboard.tsx` |
| 08 Apr 2026 | Added branch creation with nested course/fee structure | `Branches.tsx` |
| 08 Apr 2026 | Added force password change flow on first login | `login/page.tsx` |
