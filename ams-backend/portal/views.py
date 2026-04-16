import re
import string
import secrets
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.db import transaction
from .models import (
    Role, Permission, RolePermission,
    Organization, Branch,
    User, UserBranch,
    Enquiry,
    Student, Stream, Course, College, Admission, AdmissionPreference, AdmissionDocument, StatusHistory,
    BranchFeeConfig, BranchCourse, Payment, Receipt,
    WhatsappConfig, NotificationTemplate, NotificationLog
)
from .serializers import (
    RoleSerializer, PermissionSerializer, RolePermissionSerializer,
    OrganizationSerializer, BranchSerializer, BranchCreateSerializer, BranchCourseSerializer,
    UserSerializer, UserBranchSerializer,
    EnquirySerializer, ChangePasswordSerializer,
    StudentSerializer, StreamSerializer, CourseSerializer, CollegeSerializer, AdmissionSerializer, AdmissionPreferenceSerializer, AdmissionDocumentSerializer, StatusHistorySerializer,
    AdmissionInitiateSerializer,
    BranchFeeConfigSerializer, PaymentSerializer, ReceiptSerializer,
    WhatsappConfigSerializer, NotificationTemplateSerializer, NotificationLogSerializer
)
from .permissions import IsBranchAdminOrSuperAdmin, CanCreateAdmission, CanDeleteStudent, CanEditFinalizedAdmission, CanCreateEnquiry


# ── HELPERS ──────────────────────────────────────────────

def _slugify_branch_name(name: str) -> str:
    """Convert branch name to a clean email-safe slug: 'Latur Main Branch' → 'laturmainbranch'"""
    slug = re.sub(r'[^a-zA-Z0-9]', '', name).lower()
    return slug or 'branch'


def _generate_password(length: int = 10) -> str:
    """Generate a strong random password with letters + digits."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# ── VIEWSETS ─────────────────────────────────────────────

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer

class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.prefetch_related('branch_courses__course__stream').all()
    serializer_class = BranchSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only super users can modify branches
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'create':
            return BranchCreateSerializer
        return BranchSerializer

    def _sync_branch_admin(self, branch, manager):
        """
        When a manager is assigned to a branch:
        1. Set user's role to 'Branch Admin'
        2. Create a UserBranch mapping (primary) for this user ↔ branch
        """
        if not manager:
            return

        # Set role to Branch Admin
        branch_admin_role = Role.objects.filter(slug='branch-admin').first()
        if branch_admin_role and manager.role_id != branch_admin_role.id:
            manager.role = branch_admin_role
            manager.save(update_fields=['role'])

        # Ensure a UserBranch mapping exists
        mapping, created = UserBranch.objects.get_or_create(
            user=manager, branch=branch,
            defaults={'is_primary': True}
        )
        if not created and not mapping.is_primary:
            mapping.is_primary = True
            mapping.save(update_fields=['is_primary'])

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Atomic branch creation:
        1. Create the branch
        2. Create BranchCourse rows for each course + fee
        3. Assign manager role & UserBranch mapping if manager is set
        4. Return branch data
        """
        courses_data = request.data.pop('courses', []) if isinstance(request.data, dict) else []

        serializer = BranchCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        branch = serializer.save()

        # ── Create BranchCourse rows ──
        for entry in courses_data:
            course_id = entry.get('course_id')
            fee_amount = entry.get('fee_amount', 0)
            if course_id:
                try:
                    course = Course.objects.get(pk=course_id)
                    BranchCourse.objects.create(
                        branch=branch,
                        course=course,
                        fee_amount=fee_amount,
                    )
                except Course.DoesNotExist:
                    pass  # silently skip invalid course IDs

        # ── Sync Branch Admin role & mapping ──
        self._sync_branch_admin(branch, branch.manager)

        # ── Return response ──
        branch_data = BranchSerializer(branch).data
        return Response(branch_data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Override update to sync Branch Admin role & mapping when manager changes."""
        old_manager_id = self.get_object().manager_id
        response = super().update(request, *args, **kwargs)

        branch = self.get_object()

        # If manager changed, clean up old mapping and sync new one
        if branch.manager_id != old_manager_id:
            # Remove old manager's mapping to this branch
            if old_manager_id:
                UserBranch.objects.filter(user_id=old_manager_id, branch=branch).delete()
            # Sync new manager
            self._sync_branch_admin(branch, branch.manager)

        return response



class BranchCourseViewSet(viewsets.ModelViewSet):
    queryset = BranchCourse.objects.select_related('course__stream').all()
    serializer_class = BranchCourseSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        # Don't show super admins in the user/employee list
        qs = User.objects.filter(is_superuser=False).prefetch_related('branch_mappings__branch', 'manager')
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(branch_mappings__branch_id=branch.branch_id)
        else:
            branch_id = self.request.query_params.get('branch_id')
            if branch_id:
                qs = qs.filter(branch_mappings__branch_id=branch_id)
        return qs.distinct()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        branch_id = data.pop('branch_id', None) if 'branch_id' in data else None
        
        generated_password = None
        if 'password' not in data or not data['password']:
            generated_password = _generate_password(10)
            data['password'] = generated_password
        else:
            generated_password = data['password']
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        if branch_id:
            try:
                branch = Branch.objects.get(pk=branch_id)
                UserBranch.objects.create(user=user, branch=branch, is_primary=True)
            except Branch.DoesNotExist:
                pass

        headers = self.get_success_headers(serializer.data)
        response_data = serializer.data.copy()
        response_data['generated_password'] = generated_password
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        is_super = request.user.is_superuser or (request.user.role and request.user.role.name.lower() == 'super admin')
        if not is_super:
            return Response({"detail": "Only Super Admin can delete users. Use suspend instead."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsBranchAdminOrSuperAdmin])
    def suspend(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({"status": "suspended", "detail": f"{user.email} has been suspended."})

class UserBranchViewSet(viewsets.ModelViewSet):
    queryset = UserBranch.objects.all()
    serializer_class = UserBranchSerializer

class EnquiryViewSet(viewsets.ModelViewSet):
    queryset = Enquiry.objects.select_related('counselor').all()
    serializer_class = EnquirySerializer
    permission_classes = [CanCreateEnquiry]

    def get_queryset(self):
        qs = Enquiry.objects.select_related('counselor').all()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(branch_id=branch.branch_id)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        """Auto-assign the logged-in user as the counselor (filled by)."""
        user = self.request.user
        if hasattr(user, 'id') and user.is_authenticated:
            serializer.save(counselor=user)
        else:
            serializer.save()

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [CanDeleteStudent]

    def get_queryset(self):
        qs = Student.objects.all()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(branch_id=branch.branch_id)
        return qs.order_by('-created_at')

class StreamViewSet(viewsets.ModelViewSet):
    queryset = Stream.objects.all()
    serializer_class = StreamSerializer

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('stream').all()
    serializer_class = CourseSerializer

class CollegeViewSet(viewsets.ModelViewSet):
    queryset = College.objects.all()
    serializer_class = CollegeSerializer

class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.select_related('manager', 'student').all()
    serializer_class = AdmissionSerializer
    permission_classes = [CanCreateAdmission, CanEditFinalizedAdmission]
    
    def get_queryset(self):
        qs = Admission.objects.select_related('manager', 'student').all()
        # Branch-level filtering for non-superusers
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(branch_id=branch.branch_id)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        """Auto-assign the logged-in user as the manager (filled by)."""
        user = self.request.user
        if hasattr(user, 'id') and user.is_authenticated:
            serializer.save(manager=user)
        else:
            serializer.save()

    @transaction.atomic
    @action(detail=False, methods=['post'], permission_classes=[CanCreateAdmission])
    def initiate(self, request):
        serializer = AdmissionInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        branch_id = data.get('branch_id')
        
        # Resolve branch
        if not hasattr(user, 'is_superuser') or not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if not branch_mapping or not branch_mapping.first():
                return Response({'detail': 'User has no assigned branch.'}, status=status.HTTP_400_BAD_REQUEST)
            branch_obj = branch_mapping.first().branch
        else:
            if not branch_id:
                return Response({'detail': 'Super Admins must specify a branch.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                branch_obj = Branch.objects.get(pk=branch_id)
            except Branch.DoesNotExist:
                return Response({'detail': 'Invalid branch ID.'}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve stream from course
        try:
            course = Course.objects.select_related('stream').get(pk=data['course_id'])
        except Course.DoesNotExist:
            return Response({'detail': 'Invalid course ID.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or Create Student
        student, created = Student.objects.get_or_create(
            mobile=data['student_mobile'],
            defaults={
                'full_name': data['student_name'],
                'branch': branch_obj,
                'counselor': user if user.is_authenticated else None
            }
        )

        # Generate admission number (CCP001, CCP002, ...)
        last = Admission.objects.filter(admission_number__isnull=False).order_by('-id').first()
        next_seq = 1
        if last and last.admission_number:
            import re as _re
            m = _re.search(r'(\d+)$', last.admission_number)
            if m:
                next_seq = int(m.group(1)) + 1
        admission_number = f'CCP{next_seq:03d}'

        # Create Admission
        admission = Admission.objects.create(
            admission_number=admission_number,
            student=student,
            branch=branch_obj,
            manager=user if user.is_authenticated else None,
            stream=course.stream,
            admission_status="Documents Pending",
            notes=data.get('notes', ''),
        )

        # Create Initial Payment
        Payment.objects.create(
            admission=admission,
            amount=data['amount'],
            payment_mode=data['payment_mode'],
            status='Paid' if data['amount'] > 0 else 'Pending',
            reference_no=data.get('transaction_id', ''),
            collected_by=user if user.is_authenticated else None
        )

        # Return the new admission serialized
        return Response(AdmissionSerializer(admission).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='complete-profile')
    def complete_profile(self, request, pk=None):
        """Phase 2: Save detailed student profile data into the Student's model fields & JSONFields."""
        admission = self.get_object()
        student = admission.student
        data = request.data

        # Direct Student model fields
        direct_fields = ['full_name', 'father_name', 'email', 'aadhaar_no', 'dob', 'gender', 'category',
                         'neet_rank', 'neet_marks', 'mobile']
        for f in direct_fields:
            if f in data and data[f]:
                setattr(student, f, data[f])

        # Pack academic_details JSON
        academic_keys = [
            'neet_roll_no', 'neet_application_no', 'neet_percentile_physics',
            'neet_percentile_chemistry', 'neet_percentile_biology', 'neet_total_percentile',
            'neet_air', 'neet_category_rank',
            'ssc_year', 'ssc_language', 'ssc_state', 'ssc_district', 'ssc_taluka',
            'ssc_school_name', 'ssc_roll_no',
            'hsc_name', 'hsc_exam', 'hsc_passing_year', 'hsc_roll_no',
            'hsc_state', 'hsc_district', 'hsc_taluka', 'hsc_exam_session',
            'physics_obtained', 'physics_out_of',
            'chemistry_obtained', 'chemistry_out_of',
            'biology_obtained', 'biology_out_of',
            'english_obtained', 'english_out_of',
            'pcb_obtained', 'pcb_out_of',
            'pcbe_obtained', 'pcbe_out_of',
            'pcb_percentage_obtained', 'pcb_percentage_out_of',
            'pcbe_percentage_obtained', 'pcbe_percentage_out_of',
        ]
        academic = student.academic_details or {}
        for k in academic_keys:
            if k in data:
                academic[k] = data[k]
        student.academic_details = academic

        # Pack demographic_details JSON
        demo_keys = [
            'mother_name', 'name_changed', 'religion', 'alternate_mobile',
            'address_line1', 'address_line2', 'address_line3', 'city',
            'state', 'district', 'taluka', 'pincode',
            'apply_nri', 'oci_pio', 'nationality', 'domicile_maharashtra',
            'is_orphan', 'annual_income', 'region_of_residence', 'is_pwd',
            'category_of_candidate', 'sub_category',
            'claim_minority_quota', 'claim_linguistic_minority',
            'claim_exception', 'specified_reservation',
            'quota_apply_for', 'documents_received',
        ]
        demo = student.demographic_details or {}
        for k in demo_keys:
            if k in data:
                demo[k] = data[k]
        student.demographic_details = demo

        student.save()

        # Optionally update admission-level fields
        if 'quota_apply_for' in data:
            admission.application_scope = data['quota_apply_for']
        if data.get('finalize'):
            admission.is_finalized = True
            admission.info_verified = True
            admission.consent_given = True
            admission.admission_status = 'Under Review'
        admission.save()

        return Response(AdmissionSerializer(admission).data)

class AdmissionPreferenceViewSet(viewsets.ModelViewSet):
    queryset = AdmissionPreference.objects.all()
    serializer_class = AdmissionPreferenceSerializer

class AdmissionDocumentViewSet(viewsets.ModelViewSet):
    queryset = AdmissionDocument.objects.all()
    serializer_class = AdmissionDocumentSerializer

class StatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = StatusHistory.objects.all()
    serializer_class = StatusHistorySerializer

class BranchFeeConfigViewSet(viewsets.ModelViewSet):
    queryset = BranchFeeConfig.objects.all()
    serializer_class = BranchFeeConfigSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer

class WhatsappConfigViewSet(viewsets.ModelViewSet):
    queryset = WhatsappConfig.objects.all()
    serializer_class = WhatsappConfigSerializer

class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer

class NotificationLogViewSet(viewsets.ModelViewSet):
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer


# ── AUTH ENDPOINTS ───────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email', '')
    password = request.data.get('password', '')
    if not email or not password:
        return Response({'detail': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(request, email=email, password=password)
    if user is None:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    # Actually log the user in to set the session cookie
    from django.contrib.auth import login
    login(request, user)

    # Get branch info if user is a branch admin
    branch_mapping = user.branch_mappings.select_related('branch').first()

    return Response({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'mobile': user.mobile,
        'role': user.role.name if user.role else None,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'must_change_password': user.must_change_password,
        'branch_id': branch_mapping.branch.id if branch_mapping else None,
        'branch_name': branch_mapping.branch.name if branch_mapping else None,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    """Return the current user's info if they have a valid session, else 401."""
    if not request.user or not request.user.is_authenticated:
        return Response({'detail': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user
    branch_mapping = user.branch_mappings.select_related('branch').first()

    return Response({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'mobile': user.mobile,
        'role': user.role.name if user.role else None,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'must_change_password': user.must_change_password,
        'branch_id': branch_mapping.branch.id if branch_mapping else None,
        'branch_name': branch_mapping.branch.name if branch_mapping else None,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """Clear the session cookie."""
    from django.contrib.auth import logout
    logout(request)
    return Response({'detail': 'Logged out'})


@api_view(['POST'])
@permission_classes([AllowAny])
def change_password_view(request):
    """Force-change password for users with must_change_password flag."""
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        user = User.objects.get(pk=serializer.validated_data['user_id'])
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(serializer.validated_data['new_password'])
    user.must_change_password = False
    user.save(update_fields=['password', 'must_change_password'])

    return Response({'detail': 'Password changed successfully.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def seed_courses_view(request):
    """One-time seeder: creates the PCM/PCB streams and their courses."""
    data = {
        'PCM Group': [
            'Engineering Admission Guidance',
            'Engineering Entrance Guidance',
        ],
        'PCB Group': [
            'Medical Admission Guidance',
            'Pharmacy Admission Guidance',
            'Nursing Admission Guidance',
        ],
    }
    created = []
    for stream_name, courses in data.items():
        stream, _ = Stream.objects.get_or_create(name=stream_name, defaults={'type': stream_name.split()[0]})
        for course_name in courses:
            course, was_created = Course.objects.get_or_create(stream=stream, name=course_name)
            if was_created:
                created.append(f"{stream_name} → {course_name}")

    return Response({
        'detail': f'Seeded {len(created)} new courses.',
        'created': created,
    })
