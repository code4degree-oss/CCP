from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

# ── M1: ROLES & PERMISSIONS ──────────────────────────────
class Role(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Permission(models.Model):
    name = models.CharField(max_length=80)
    module = models.CharField(max_length=40)
    action = models.CharField(max_length=40)

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    granted_at = models.DateTimeField(auto_now_add=True)

# ── M2: BRANCH MANAGEMENT ────────────────────────────────
class Organization(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=80, unique=True)
    contact_mobile = models.CharField(max_length=15)
    email = models.EmailField(max_length=150, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Branch(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=120)
    email = models.EmailField(max_length=150, blank=True, null=True)
    address = models.TextField(blank=True, null=True, help_text='Full branch address for receipts')
    manager = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_branches')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# ── M3: USER MANAGEMENT ──────────────────────────────────
class UserManager(BaseUserManager):
    def create_user(self, email, mobile, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        user = self.model(email=self.normalize_email(email), mobile=mobile, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, mobile, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, mobile, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    full_name = models.CharField(max_length=120)
    mobile = models.CharField(max_length=15, unique=True)
    email = models.EmailField(max_length=150, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['mobile', 'full_name']

class UserBranch(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='branch_mappings')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

# ── ENQUIRY MODULE ───────────────────────────────────────
class Enquiry(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    counselor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='enquiries')
    full_name = models.CharField(max_length=150)
    mother_name = models.CharField(max_length=120, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    mobile = models.CharField(max_length=15)
    parent_mobile = models.CharField(max_length=15, blank=True, null=True)
    category = models.CharField(max_length=40, blank=True, null=True)
    candidate_type = models.CharField(max_length=20, blank=True, null=True)
    hsc_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    neet_application_no = models.CharField(max_length=30, blank=True, null=True)
    neet_roll_no = models.CharField(max_length=30, blank=True, null=True)
    neet_expected_marks = models.SmallIntegerField(blank=True, null=True)
    course_interest = models.CharField(max_length=120, blank=True, null=True)
    tuition_name = models.CharField(max_length=120, blank=True, null=True)
    reference_name = models.CharField(max_length=120, blank=True, null=True)
    source = models.CharField(max_length=50, blank=True, null=True)
    interested_other_states = models.BooleanField(default=False)
    interested_overseas = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# ── M4: ADMISSION WORKFLOW ───────────────────────────────
class Student(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    counselor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    full_name = models.CharField(max_length=150)
    mobile = models.CharField(max_length=15, unique=True)
    enrollment_no = models.CharField(max_length=30, unique=True, null=True, blank=True)
    father_name = models.CharField(max_length=120, null=True, blank=True)
    email = models.EmailField(max_length=150, null=True, blank=True)
    aadhaar_no = models.CharField(max_length=12, unique=True, null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    category = models.CharField(max_length=40, null=True, blank=True)
    neet_rank = models.IntegerField(null=True, blank=True)
    neet_marks = models.SmallIntegerField(null=True, blank=True)
    academic_details = models.JSONField(default=dict, blank=True)
    demographic_details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Stream(models.Model):
    name = models.CharField(max_length=40)
    type = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

class Course(models.Model):
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)


class BranchCourse(models.Model):
    """Links a course to a branch with branch-specific fee amount."""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='branch_courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='branch_offerings')
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('branch', 'course')
        ordering = ['course__stream__name', 'course__name']

    def __str__(self):
        return f"{self.branch.name} — {self.course.name} (₹{self.fee_amount})"

class College(models.Model):
    name = models.CharField(max_length=150)
    state = models.CharField(max_length=80)
    district = models.CharField(max_length=80)
    is_active = models.BooleanField(default=True)

class Admission(models.Model):
    admission_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='admissions')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_admissions')
    stream = models.ForeignKey(Stream, on_delete=models.SET_NULL, null=True)
    admission_status = models.CharField(max_length=30, default="Documents Pending")
    application_scope = models.CharField(max_length=30, null=True, blank=True)
    govt_submission_done = models.BooleanField(default=False)
    govt_submission_notes = models.TextField(blank=True, null=True)
    is_entrance_guidance_only = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    is_finalized = models.BooleanField(default=False)
    info_verified = models.BooleanField(default=False)
    consent_given = models.BooleanField(default=False)
    admitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class AdmissionPreference(models.Model):
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, related_name='preferences')
    college = models.ForeignKey(College, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    preference_order = models.SmallIntegerField()
    quota_type = models.CharField(max_length=30)
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

class AdmissionDocument(models.Model):
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE)
    document_type = models.CharField(max_length=60)
    file_url = models.TextField()
    verification_status = models.CharField(max_length=20, default="Pending")
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)

class StatusHistory(models.Model):
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE)
    from_status = models.CharField(max_length=30, null=True, blank=True)
    to_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    remarks = models.TextField(blank=True, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

# ── M5: FEES & RECEIPT MANAGEMENT ───────────────────────
class BranchFeeConfig(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    stream_type = models.CharField(max_length=40)
    sub_category = models.CharField(max_length=40)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    label = models.CharField(max_length=30)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

class Payment(models.Model):
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, related_name='payments')
    fee_config = models.ForeignKey(BranchFeeConfig, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=20)
    status = models.CharField(max_length=20)
    reference_no = models.CharField(max_length=80, blank=True, null=True)
    collected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    paid_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Receipt(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)
    receipt_no = models.CharField(max_length=30, unique=True)
    pdf_url = models.TextField(blank=True, null=True)
    whatsapp_sent = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now_add=True)

# ── M6: API INTEGRATIONS ─────────────────────────────────
class WhatsappConfig(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    phone_number_id = models.CharField(max_length=120)
    access_token_enc = models.CharField(max_length=255)
    waba_id = models.CharField(max_length=80)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

class NotificationTemplate(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=80, unique=True)
    channel = models.CharField(max_length=20)
    body_template = models.TextField()
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

class NotificationLog(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, null=True, blank=True)
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    channel = models.CharField(max_length=20)
    template_name = models.CharField(max_length=80)
    payload = models.JSONField()
    delivery_status = models.CharField(max_length=20)
    external_message_id = models.CharField(max_length=80, blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)
