# AMS Backend — Complete Developer Guide

> **Last Updated:** 24 April 2026  
> **Tech Stack:** Django 6.0.3 + Django REST Framework + PostgreSQL  
> **Project Folder:** `ams-backend/`

---

## 📁 Folder Structure

```
ams-backend/
├── manage.py                  # Django CLI entry point
├── ams_core/                  # Django project config
│   ├── settings.py            # DB, installed apps, static/media root config
│   ├── urls.py                # Root URL config + Static media file serving
│   ├── wsgi.py                # WSGI entry for production (gunicorn)
│   └── asgi.py                # ASGI entry (not used currently)
├── portal/                    # Main app — ALL business logic lives here
│   ├── models.py              # Database models (20+ tables)
│   ├── serializers.py         # DRF serializers (API input/output formatting)
│   ├── views.py               # ViewSets + custom API endpoints
│   ├── permissions.py         # Custom RBAC permission classes
│   ├── urls.py                # DRF router — maps URLs to ViewSets
│   └── apps.py                # App config
├── .env                       # Environment variables (DB credentials, SECRET_KEY)
└── venv/                      # Python virtual environment (don't touch)
```

---

## 🔐 Role System & Branch Isolation

The app has exactly **3 user types**:

| Role | Slug | What they can do |
|------|------|-----------------|
| **Super Admin** | `is_superuser=True` | Everything. Sees all branches. Can delete users permanently. |
| **Branch Admin** | `branch-admin` | Manages one branch. Can CRUD employees, admissions, enquiries. |
| **Employee** | `employee` | Can create admissions & enquiries. Can read payments/receipts. |

### Strict Database Isolation
Every single ViewSet (Student, Admission, Payment, Document, etc.) implements an overridden `get_queryset()`. 
If the user is NOT a Super Admin, the backend forcefully filters the queryset to `branch_id=user.branch_id`. A user in Pune can *never* query or see data from Latur. 

---

## 📄 File-by-File Explanation

---

### `ams_core/settings.py` & `.env` — Environment Config
- Hardcoded secrets have been stripped out.
- Relies on `python-dotenv` to load database credentials (PostgreSQL) and Django `SECRET_KEY`.
- Defines `MEDIA_URL = '/media/'` and `MEDIA_ROOT` for uploaded files.

### `ams_core/urls.py` — Routing & Media Serving
- The root URL router includes a critical fix: it unconditionally routes `re_path(r'^media/(?P<path>.*)$', django.views.static.serve)` to handle uploaded PDFs and images directly via Django. This resolves 502/404 Gateway errors in production.

---

### `portal/models.py` — Database Models

Key additions and updates:
- **`Admission`**: Now features robust sequential numbering logic (e.g., `CCP001`, `CCP002`) generated atomically under a lock to prevent duplicates.
- **`AdmissionDocument`**: Renamed file paths. Uploaded files are now dynamically stored as `[Student_Name]_[Document_Type].[ext]`.
- **`Payment` & `Receipt`**: Core models powering the new Payments Module.

---

### `portal/views.py` — API Logic

| ViewSet | Special Logic & Fixes |
|---------|-----------------------|
| `AdmissionViewSet` | **Custom `create()`**: Wraps admission number generation in a `select_for_update()` block to prevent race conditions. Auto-sets "Documents Pending" status. |
| `PortalViewSet` | **Document Uploading**: Intercepts file uploads, normalizes the filename, and prefixes it with the student's name for highly identifiable file storage. |
| `PaymentViewSet` | **Permissions**: Employees have `IsAuthenticated` read-only access (needed to view the Dashboard and Receipt pages), while write access is locked to Branch Admins. |
| `ReceiptViewSet` | Identical read-access fixes as `PaymentViewSet` above. |
| `UserViewSet` | Auto-generates passwords for new staff; handles suspension vs hard-deletion. |

---

### `portal/permissions.py` — Role-Based Access Control

| Permission Class | What It Guards | Logic |
|-----------------|----------------|-------|
| `IsBranchAdminOrSuperAdmin` | Write operations on Payments/Receipts/Settings | Blocks regular Employees from changing sensitive financial records. |
| `CanCreateAdmission` | POST to `/api/admissions/` | Only `employee` and `branch-admin` slugs can create. |
| `CanEditFinalizedAdmission` | PUT/PATCH on finalized admissions | Once `is_finalized=True`, only `branch-admin` and Super Admin can edit. |

---

## 🚀 Deployment & Infrastructure

The backend runs on a Linux VM managed by PM2.

**Architecture:**
- **Nginx** handles reverse proxying on port 80/443.
- **PM2** runs `gunicorn ams_core.wsgi` on port 8000.
- **PostgreSQL** runs natively as the database engine.

**The `deploy.sh` Script Flow:**
1. Pulls from Git
2. Activates VENV
3. Runs `python manage.py migrate` (Schema sync)
4. Rebuilds the Next.js frontend
5. Restarts PM2 processes (`pm2 restart all`)
6. Adjusts ownership to `www-data` to prevent static/media permission errors.

---

## 📝 Recent Change Log

| Date | What Changed |
|------|-------------|
| 24 Apr 2026 | Refactored `PaymentViewSet` and `ReceiptViewSet` permissions so Employees can read them (fixed Dashboard). |
| 23 Apr 2026 | Updated `ams_core/urls.py` to unconditionally serve media files, fixing 502/404 errors. |
| 23 Apr 2026 | Implemented document renaming logic in views (`{Student_Name}_{Doc_Type}.pdf`). |
| 20 Apr 2026 | Hardened infrastructure: migrated to PostgreSQL + `.env` file management. |
| 19 Apr 2026 | Built Payment and Receipt REST APIs to support new frontend module. |
| 18 Apr 2026 | Implemented sequential Admission Number logic (`CCP001`) with atomic DB locks. |
| 18 Apr 2026 | Enforced rigid backend branch isolation in `get_queryset` across all modules. |
