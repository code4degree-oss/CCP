# AMS Backend — Complete Developer Guide

> **Last Updated:** 11 April 2026  
> **Tech Stack:** Django 6.0.3 + Django REST Framework + PostgreSQL  
> **Project Folder:** `ams-backend/`

---

## 📁 Folder Structure

```
ams-backend/
├── manage.py                  # Django CLI entry point
├── ams_core/                  # Django project config
│   ├── settings.py            # Database, installed apps, CORS, etc.
│   ├── urls.py                # Root URL config → includes portal/urls.py
│   ├── wsgi.py                # WSGI entry for production (gunicorn)
│   └── asgi.py                # ASGI entry (not used currently)
├── portal/                    # Main app — ALL business logic lives here
│   ├── models.py              # Database models (20+ tables)
│   ├── serializers.py         # DRF serializers (API input/output formatting)
│   ├── views.py               # ViewSets + custom API endpoints
│   ├── permissions.py         # Custom RBAC permission classes
│   ├── urls.py                # DRF router — maps URLs to ViewSets
│   ├── admin.py               # Django admin (minimal, not used)
│   ├── apps.py                # App config
│   ├── tests.py               # Empty (no tests yet)
│   └── management/            # Custom manage.py commands
└── venv/                      # Python virtual environment (don't touch)
```

---

## 🔐 Role System (IMPORTANT — Read This First)

The app has exactly **3 user types**:

| Role | Slug | What they can do |
|------|------|-----------------|
| **Super Admin** | `is_superuser=True` | Everything. Sees all branches. Can delete users permanently. |
| **Branch Admin** | `branch-admin` | Manages one branch. Can CRUD employees, admissions, enquiries, students. Can suspend employees. Can delete students (with confirmation). |
| **Employee** | `employee` | Can create admissions & enquiries. Can see all branch data. Can edit non-finalized admissions. Cannot delete students or users. |

> **Note:** There are NO "Manager" or "Counselor" roles. The DB fields named `manager` and `counselor` are just legacy column names — they mean "the person who created this record".

---

## 📄 File-by-File Explanation

---

### `portal/models.py` — Database Models

This file defines ALL database tables. Here's every model:

#### Section M1: Roles & Permissions
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Role` | Stores role types (Branch Admin, Employee) | `name`, `slug`, `is_active` |
| `Permission` | Individual permissions (not used on frontend yet) | `name`, `module`, `action` |
| `RolePermission` | Links a Role to a Permission | `role → Role`, `permission → Permission` |

#### Section M2: Branch Management
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Organization` | Top-level organization (Chanakya Career Point) | `name`, `slug`, `email` |
| `Branch` | A physical branch location | `name`, `city`, `state`, `district`, `pincode`, `contact_mobile`, `manager → User` (this is the Branch Admin) |

#### Section M3: User Management
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | Custom auth user model (replaces Django's default) | `email` (login ID), `mobile`, `full_name`, `role → Role`, `manager → User` (who created this user), `must_change_password`, `is_active` |
| `UserBranch` | Links a user to a branch (many-to-many) | `user → User`, `branch → Branch`, `is_primary` |

> **LOGIN:** Users log in with `email` + `password`. New employees get auto-generated passwords and must change on first login.

#### Enquiry Module
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Enquiry` | Student enquiry before admission | `branch → Branch`, `counselor → User` (who filled it), `full_name`, `mobile`, `parent_mobile`, `course_interest`, `source`, `neet_expected_marks` |

#### Section M4: Admission Workflow
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Student` | Registered student profile | `branch → Branch`, `counselor → User` (who registered), `full_name`, `mobile`, `enrollment_no`, `aadhaar_no`, `neet_rank`, `neet_marks`, `academic_details` (JSON), `demographic_details` (JSON) |
| `Stream` | Course stream (PCM Group, PCB Group) | `name`, `type` |
| `Course` | Course under a stream | `stream → Stream`, `name` |
| `BranchCourse` | Links a course to a branch WITH branch-specific fee | `branch → Branch`, `course → Course`, `fee_amount` |
| `College` | College database for admission preferences | `name`, `state`, `district` |
| `Admission` | Main admission record | `student → Student`, `branch → Branch`, `manager → User` (who filled the form), `stream → Stream`, `admission_status`, `is_finalized`, `info_verified`, `consent_given` |
| `AdmissionPreference` | Student's preferred college choices | `admission → Admission`, `college → College`, `course → Course`, `preference_order`, `quota_type` |
| `AdmissionDocument` | Documents uploaded for admission | `admission → Admission`, `document_type`, `file_url`, `verification_status` |
| `StatusHistory` | Audit log of status changes | `admission → Admission`, `from_status`, `to_status`, `changed_by → User`, `remarks` |

#### Section M5: Fees & Payments
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `BranchFeeConfig` | Fee configuration per branch | `branch → Branch`, `stream_type`, `fee_amount` |
| `Payment` | Payment record linked to admission | `admission → Admission`, `amount`, `payment_mode`, `status`, `collected_by → User` |
| `Receipt` | Receipt generated after payment | `payment → Payment`, `receipt_no`, `pdf_url` |

#### Section M6: Notifications
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `WhatsappConfig` | WhatsApp Business API credentials | `organization → Organization`, `phone_number_id`, `access_token_enc` |
| `NotificationTemplate` | Message templates | `name`, `channel`, `body_template` |
| `NotificationLog` | Log of all sent notifications | `payment → Payment`, `channel`, `delivery_status` |

---

### `portal/serializers.py` — API Input/Output Formatting

Serializers convert Django model objects to JSON (for API responses) and validate incoming JSON (for creation/updates).

| Serializer | Model | Special Fields |
|------------|-------|---------------|
| `RoleSerializer` | Role | All fields |
| `PermissionSerializer` | Permission | All fields |
| `OrganizationSerializer` | Organization | All fields |
| `StreamSerializer` | Stream | All fields |
| `CourseSerializer` | Course | + `stream_name` (read-only, from related Stream) |
| `BranchCourseSerializer` | BranchCourse | + `course_name`, `stream_name` (read-only) |
| `BranchSerializer` | Branch | + `branch_courses` (nested list), `course_count`, `manager_name` (read-only) |
| `BranchCreateSerializer` | Branch | + `courses` (write-only nested input for atomic creation) |
| `UserSerializer` | User | + `role_name`, `assigned_by_name`, `branch_id`, `branch_name`. Password is write-only. Has custom `create()` and `update()` that hash the password. |
| `ChangePasswordSerializer` | — | Validates `user_id`, `new_password`, `confirm_password` |
| `EnquirySerializer` | Enquiry | + `counselor_name` (read-only — shows who filled the enquiry) |
| `StudentSerializer` | Student | All fields |
| `AdmissionSerializer` | Admission | + `manager_name` (who filled it), `student_name` (read-only) |
| Others | Various | All use `fields = '__all__'` |

---

### `portal/views.py` — API Logic

#### ViewSets (CRUD endpoints auto-generated by DRF Router)

| ViewSet | API Path | Special Logic |
|---------|----------|---------------|
| `RoleViewSet` | `/api/roles/` | Standard CRUD |
| `PermissionViewSet` | `/api/permissions/` | Standard CRUD |
| `OrganizationViewSet` | `/api/organizations/` | Standard CRUD |
| `BranchViewSet` | `/api/branches/` | **Custom `create()`**: Atomically creates branch + BranchCourse rows. Uses `BranchCreateSerializer` for creation, `BranchSerializer` for reads. |
| `BranchCourseViewSet` | `/api/branch-courses/` | Supports `?branch=ID` filter |
| `UserViewSet` | `/api/users/` | **Custom `create()`**: Auto-generates password, creates `UserBranch` mapping, returns `generated_password` in response. **Custom `destroy()`**: Only Super Admin can delete. **Custom `suspend()`**: POST to `/api/users/{id}/suspend/` deactivates the user. Queryset filters out superusers. Supports `?branch_id=ID` filter. |
| `EnquiryViewSet` | `/api/enquiries/` | **Permissions:** `CanCreateEnquiry`. **Queryset:** Filters by branch for non-superusers. **`perform_create()`:** Auto-sets `counselor` to the logged-in user. |
| `StudentViewSet` | `/api/students/` | **Permissions:** `CanDeleteStudent` |
| `AdmissionViewSet` | `/api/admissions/` | **Permissions:** `CanCreateAdmission` + `CanEditFinalizedAdmission`. **Queryset:** Filters by branch for non-superusers. **`perform_create()`:** Auto-sets `manager` to the logged-in user. |
| `PaymentViewSet` | `/api/payments/` | Standard CRUD |
| `ReceiptViewSet` | `/api/receipts/` | Standard CRUD |
| Others | Various | Standard CRUD |

#### Standalone API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/login/` | POST | Authenticates with `email` + `password`. Returns user data including `role`, `branch_id`, `branch_name`, `must_change_password` flag. |
| `/api/change-password/` | POST | Takes `user_id`, `new_password`, `confirm_password`. Clears the `must_change_password` flag. |
| `/api/seed-courses/` | POST | One-time seeder. Creates PCM/PCB streams and their courses (Engineering Guidance, Medical Guidance, etc.). |

#### Helper Functions
| Function | Purpose |
|----------|---------|
| `_slugify_branch_name()` | Converts "Latur Main Branch" → "laturmainbranch" (for email generation) |
| `_generate_password()` | Generates a random 10-char alphanumeric password |

---

### `portal/permissions.py` — Role-Based Access Control

These are DRF permission classes attached to ViewSets. They run before every request.

| Permission Class | What It Guards | Logic |
|-----------------|----------------|-------|
| `IsBranchAdminOrSuperAdmin` | User suspension | Only Branch Admin or Super Admin can suspend employees |
| `CanCreateAdmission` | POST to `/api/admissions/` | Only `employee` and `branch-admin` slugs can create. Super Admin is blocked (they don't fill forms). |
| `CanCreateEnquiry` | POST to `/api/enquiries/` | Same as above |
| `CanDeleteStudent` | DELETE on `/api/students/{id}/` | Only `branch-admin` and Super Admin can delete |
| `CanEditFinalizedAdmission` | PUT/PATCH on finalized admissions | Once `is_finalized=True`, only `branch-admin` and Super Admin can edit |

> **Safety:** All permission classes use `_get_role_slug()` helper which safely handles anonymous/unauthenticated users without crashing.

---

### `portal/urls.py` — URL Routing

Uses DRF's `DefaultRouter` to auto-generate REST endpoints for all ViewSets:

```
/api/roles/              → RoleViewSet
/api/branches/           → BranchViewSet
/api/users/              → UserViewSet
/api/users/{id}/suspend/ → UserViewSet.suspend (custom action)
/api/enquiries/          → EnquiryViewSet
/api/students/           → StudentViewSet
/api/admissions/         → AdmissionViewSet
/api/payments/           → PaymentViewSet
/api/login/              → login_view
/api/change-password/    → change_password_view
/api/seed-courses/       → seed_courses_view
... (+ 10 more standard CRUD endpoints)
```

---

### `ams_core/settings.py` — Django Configuration

Key settings:
- **Database:** PostgreSQL
- **Auth User Model:** `portal.User` (custom)
- **CORS:** Allowed for `localhost:3000` (Next.js dev server)
- **Installed Apps:** `rest_framework`, `corsheaders`, `portal`

> ⚠️ **Known Issue:** No `DEFAULT_AUTHENTICATION_CLASSES` or `DEFAULT_PERMISSION_CLASSES` configured in REST_FRAMEWORK settings. This means API endpoints are technically open without authentication tokens. For production, add JWT auth.

---

## 🔄 Admission Workflow

```
1. Employee/Branch Admin creates an ENQUIRY (student interest)
2. Employee/Branch Admin creates an ADMISSION (fills full form)
   → System auto-sets "Filled By" to the logged-in user
   → Status starts as "Documents Pending"
   → Form is in DRAFT mode (is_finalized=False)
3. Student reviews the form
   → Employee checks "All info is correct" + "I consent" checkboxes
   → Form becomes FINALIZED (is_finalized=True)
4. Once finalized:
   → Employees can only PRINT, not edit
   → Only Branch Admin can edit a finalized form
5. Student deletion requires typing "delete" in a confirmation box
   → Only Branch Admin and Super Admin can delete
```

---

## 🛠️ How to Run

```bash
cd ams-backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Server runs on: `http://localhost:8000`  
API base: `http://localhost:8000/api/`

---

## 📝 Change Log

| Date | What Changed | Files |
|------|-------------|-------|
| 11 Apr 2026 | Fixed permissions.py to prevent crashes on unauthenticated requests | `permissions.py` |
| 11 Apr 2026 | Added `manager_name` to AdmissionSerializer, `counselor_name` to EnquirySerializer | `serializers.py` |
| 11 Apr 2026 | Added branch-level filtering + auto-set "filled by" on create for Admissions & Enquiries | `views.py` |
| 11 Apr 2026 | Added `student_name` to AdmissionSerializer | `serializers.py` |
| 10 Apr 2026 | Added `is_finalized`, `info_verified`, `consent_given` fields to Admission model | `models.py` |
| 10 Apr 2026 | Added suspend action to UserViewSet | `views.py` |
| 10 Apr 2026 | Created all permission classes | `permissions.py` |
| 10 Apr 2026 | Added auto-generated password support for user creation | `views.py` |
| 08 Apr 2026 | Added BranchCourse model + nested branch creation | `models.py`, `views.py`, `serializers.py` |
| 08 Apr 2026 | Added must_change_password + change-password endpoint | `models.py`, `views.py` |
| 06 Apr 2026 | Created seed-courses endpoint for PCM/PCB streams | `views.py` |
