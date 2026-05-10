import re
import string
import secrets
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.db import transaction
from .models import (
    Role, Permission, RolePermission,
    Organization, Branch,
    User, UserBranch,
    Enquiry,
    Student, Stream, Course, College, Admission, AdmissionPreference, AdmissionDocument, StatusHistory,
    BranchFeeConfig, BranchCourse, BranchCourseCounsellingFee, Payment, Receipt,
    WhatsappConfig, NotificationTemplate, NotificationLog
)
from .serializers import (
    RoleSerializer, PermissionSerializer, RolePermissionSerializer,
    OrganizationSerializer, BranchSerializer, BranchCreateSerializer, BranchCourseSerializer,
    BranchCourseCounsellingFeeSerializer,
    UserSerializer, UserBranchSerializer,
    EnquirySerializer, ChangePasswordSerializer,
    StudentSerializer, StreamSerializer, CourseSerializer, CollegeSerializer, AdmissionSerializer, AdmissionPreferenceSerializer, AdmissionDocumentSerializer, StatusHistorySerializer,
    AdmissionInitiateSerializer, RecordPaymentSerializer,
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
    permission_classes = [IsBranchAdminOrSuperAdmin]

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]

class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.prefetch_related('branch_courses__course__stream', 'branch_courses__counselling_fees').all()
    serializer_class = BranchSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(id=branch.branch_id)
        return qs.order_by('-created_at')

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
        3. Create BranchCourseCounsellingFee rows for engineering courses
        4. Assign manager role & UserBranch mapping if manager is set
        5. Return branch data
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
                    bc = BranchCourse.objects.create(
                        branch=branch,
                        course=course,
                        fee_amount=fee_amount,
                    )
                    # Create counselling fees if provided
                    counselling_fees = entry.get('counselling_fees', [])
                    for cf in counselling_fees:
                        BranchCourseCounsellingFee.objects.create(
                            branch_course=bc,
                            counselling_type=cf['counselling_type'],
                            fee_amount=cf['fee_amount'],
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
    queryset = BranchCourse.objects.select_related('course__stream').prefetch_related('counselling_fees').all()
    serializer_class = BranchCourseSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(branch_id=branch.branch_id)
                    
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs


class BranchCourseCounsellingFeeViewSet(viewsets.ModelViewSet):
    queryset = BranchCourseCounsellingFee.objects.select_related('branch_course__course__stream').all()
    serializer_class = BranchCourseCounsellingFeeSerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        branch_course_id = self.request.query_params.get('branch_course')
        if branch_course_id:
            qs = qs.filter(branch_course_id=branch_course_id)
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

        # Force new employees to change their auto-generated password on first login
        user.must_change_password = True
        user.save(update_fields=['must_change_password'])

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

    @action(detail=True, methods=['post'], url_path='reset-password', permission_classes=[IsBranchAdminOrSuperAdmin])
    def reset_password(self, request, pk=None):
        """Admin-initiated password reset. Generates a temp password and flags must_change_password."""
        target_user = self.get_object()
        actor = request.user
        is_super = actor.is_superuser
        is_branch_admin = not is_super and actor.role and actor.role.name.lower() == 'branch admin'

        # Super Admin can reset anyone (except other super admins handled by queryset)
        # Branch Admin can only reset users in their branch
        if is_branch_admin:
            actor_branch = actor.branch_mappings.first()
            target_branch = target_user.branch_mappings.first()
            if not actor_branch or not target_branch or actor_branch.branch_id != target_branch.branch_id:
                return Response({'detail': 'You can only reset passwords for users in your branch.'}, status=status.HTTP_403_FORBIDDEN)
            # Branch admin cannot reset another branch admin
            if target_user.role and target_user.role.name.lower() == 'branch admin':
                return Response({'detail': 'Branch Admins cannot reset another Branch Admin password.'}, status=status.HTTP_403_FORBIDDEN)
        elif not is_super:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        # Generate temp password
        temp_password = _generate_password(10)
        target_user.set_password(temp_password)
        target_user.must_change_password = True
        target_user.save(update_fields=['password', 'must_change_password'])

        return Response({
            'detail': f'Password reset for {target_user.email}.',
            'temporary_password': temp_password,
        })

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
                    
        branch_id = self.request.query_params.get('branch')
        if branch_id and (user.is_superuser or user.role.name == 'Super Admin'):
            qs = qs.filter(branch_id=branch_id)
            
        course_type = self.request.query_params.get('course_type')
        if course_type:
            qs = qs.filter(course_type__iexact=course_type)
            
        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(created_at__gte=f"{date_from}T00:00:00Z")
            
        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(created_at__lte=f"{date_to}T23:59:59Z")
            
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        """Auto-assign the logged-in user as the counselor (filled by)."""
        user = self.request.user
        if hasattr(user, 'id') and user.is_authenticated:
            serializer.save(counselor=user)
        else:
            serializer.save()

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('branch', 'counselor').all()
    serializer_class = StudentSerializer
    permission_classes = [CanDeleteStudent]

    def get_queryset(self):
        qs = Student.objects.select_related('branch', 'counselor').all()
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
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(branch_id=branch.branch_id)
                    
        branch_id = self.request.query_params.get('branch')
        if branch_id and (user.is_superuser or (hasattr(user, 'role') and user.role and user.role.name == 'Super Admin')):
            qs = qs.filter(branch_id=branch_id)
            
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
            
        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(created_at__gte=f"{date_from}T00:00:00Z")
            
        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(created_at__lte=f"{date_to}T23:59:59Z")
            
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

        parent_mobile = data.get('parent_mobile', '')
        if parent_mobile:
            demo = student.demographic_details or {}
            demo['alternate_mobile'] = parent_mobile
            student.demographic_details = demo
            student.save()

        # Generate admission number (CCP001, CCP002, ...)
        # Use select_for_update to prevent race conditions under concurrent requests
        last = Admission.objects.select_for_update().filter(
            admission_number__isnull=False
        ).order_by('-id').first()
        next_seq = 1
        if last and last.admission_number:
            import re as _re
            m = _re.search(r'(\d+)$', last.admission_number)
            if m:
                next_seq = int(m.group(1)) + 1
        admission_number = f'CCP{next_seq:03d}'

        # Determine if this is entrance-guidance-only
        is_entrance = 'entrance' in course.name.lower() and 'guidance' in course.name.lower()

        # Resolve counselling type
        counselling_type = data.get('counselling_type', '')

        # Create Admission
        admission = Admission.objects.create(
            admission_number=admission_number,
            student=student,
            branch=branch_obj,
            manager=user if user.is_authenticated else None,
            stream=course.stream,
            course=course,
            is_entrance_guidance_only=is_entrance,
            admission_status="Completed" if is_entrance else "Documents Pending",
            notes=data.get('notes', ''),
            counselling_type=counselling_type,
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

    @transaction.atomic
    @action(detail=True, methods=['post'], url_path='upgrade-counselling')
    def upgrade_counselling(self, request, pk=None):
        """Upgrade a single-type (JoSAA or CET) admission to Both.
        Calculates the fee difference and records it as a new payment."""
        admission = self.get_object()

        # Validate current counselling type
        current = (admission.counselling_type or '').strip()
        if not current or current.lower() == 'both' or 'both' in current.lower():
            return Response({'detail': 'Admission is already Both or has no counselling type.'}, status=status.HTTP_400_BAD_REQUEST)

        # Look up BranchCourse
        bc = BranchCourse.objects.filter(branch=admission.branch, course=admission.course).first()
        if not bc:
            return Response({'detail': 'No fee configuration found for this branch/course.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get "Both" fee
        both_fee_obj = BranchCourseCounsellingFee.objects.filter(branch_course=bc, counselling_type='Both').first()
        if not both_fee_obj:
            return Response({'detail': 'No "Both" fee configured for this branch/course.'}, status=status.HTTP_400_BAD_REQUEST)

        both_fee = float(both_fee_obj.fee_amount)

        # Get total already paid
        from django.db.models import Sum, Q
        total_paid = float(
            admission.payments.filter(status='Paid').aggregate(s=Sum('amount'))['s'] or 0
        )

        upgrade_amount = max(0, both_fee - total_paid)

        # Update counselling type
        admission.counselling_type = 'Both (JoSAA + MHT-CET)'
        admission.save(update_fields=['counselling_type', 'updated_at'])

        # Record upgrade payment if amount > 0
        payment_data = None
        if upgrade_amount > 0:
            payment_mode = request.data.get('payment_mode', 'Cash')
            reference_no = request.data.get('reference_no', '')
            payment = Payment.objects.create(
                admission=admission,
                amount=upgrade_amount,
                payment_mode=payment_mode,
                status='Paid',
                reference_no=reference_no,
                notes=f'Upgrade from {current} to Both',
                collected_by=request.user if request.user.is_authenticated else None,
            )
            payment_data = PaymentSerializer(payment).data

        return Response({
            'detail': f'Upgraded to Both. Difference: ₹{upgrade_amount}',
            'upgrade_amount': upgrade_amount,
            'both_fee': both_fee,
            'total_paid_before': total_paid,
            'payment': payment_data,
            'admission': AdmissionSerializer(admission).data,
        })

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
            if f in data:
                val = data[f]
                if val == "":
                    val = None
                setattr(student, f, val)

        # Pack academic_details JSON
        academic_keys = [
            # NEET fields
            'neet_roll_no', 'neet_application_no', 'neet_percentile_physics',
            'neet_percentile_chemistry', 'neet_percentile_biology', 'neet_total_percentile',
            'neet_air', 'neet_category_rank',
            # JEE fields
            'jee_roll_no', 'jee_application_no', 'jee_rank', 'jee_percentile',
            # SSC
            'ssc_board', 'ssc_year', 'ssc_language', 'ssc_state', 'ssc_district', 'ssc_taluka',
            'ssc_school_name', 'ssc_roll_no',
            # HSC
            'hsc_name', 'hsc_exam', 'hsc_passing_year', 'hsc_roll_no',
            'hsc_state', 'hsc_district', 'hsc_taluka', 'hsc_exam_session',
            # Subject marks
            'physics_obtained', 'physics_out_of',
            'chemistry_obtained', 'chemistry_out_of',
            'maths_obtained', 'maths_out_of',
            'biology_obtained', 'biology_out_of',
            'english_obtained', 'english_out_of',
            # Totals
            'pcb_obtained', 'pcb_out_of',
            'pcm_obtained', 'pcm_out_of',
            'pcbe_obtained', 'pcbe_out_of',
            'pcme_obtained', 'pcme_out_of',
            'pcb_percentage_obtained', 'pcb_percentage_out_of',
            'pcm_percentage_obtained', 'pcm_percentage_out_of',
            'pcbe_percentage_obtained', 'pcbe_percentage_out_of',
            'pcme_percentage_obtained', 'pcme_percentage_out_of',
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
            'selected_minority', 'selected_linguistic_minority',
            'claim_exception', 'specified_reservation',
            'quota_apply_for', 'documents_received',
        ]
        demo = student.demographic_details or {}
        for k in demo_keys:
            if k in data:
                # Don't overwrite existing value with empty string
                if data[k] or not demo.get(k):
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
            
            # Status depends on whether documents are uploaded
            has_docs = admission.admissiondocument_set.exists()
            if has_docs:
                admission.admission_status = 'Form Completed'
            else:
                admission.admission_status = 'Documents Pending'
        admission.save()

        return Response(AdmissionSerializer(admission).data)

    @action(detail=True, methods=['post'], url_path='upload-document')
    def upload_document(self, request, pk=None):
        admission = self.get_object()
        file_obj = request.FILES.get('file')
        doc_type = request.data.get('document_type')
        if not file_obj or not doc_type:
            return Response({'detail': 'File and document_type are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.core.files.storage import default_storage
        from django.utils.text import get_valid_filename
        import os
        
        # Security: Validate file extension
        ext = os.path.splitext(file_obj.name)[1].lower()
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
        if ext not in allowed_extensions:
            return Response({'detail': 'Unsupported file type.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Rename file to student_name_document_type
        student_name = admission.student.full_name if admission.student else "student"
        new_filename = f"{student_name}_{doc_type}{ext}"
        safe_filename = get_valid_filename(new_filename)
        
        # Save file to media directory
        path = default_storage.save(f"admissions/{admission.id}/{safe_filename}", file_obj)
        file_url = default_storage.url(path)
        
        doc = AdmissionDocument.objects.create(
            admission=admission,
            document_type=doc_type,
            file_url=file_url
        )
        
        # If the admission was finalized but stuck in 'Documents Pending', move it forward
        if admission.is_finalized and admission.admission_status == 'Documents Pending':
            admission.admission_status = 'Form Completed'
            admission.save(update_fields=['admission_status', 'updated_at'])
        return Response(AdmissionDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        admission = self.get_object()
        docs = AdmissionDocument.objects.filter(admission=admission)
        return Response(AdmissionDocumentSerializer(docs, many=True).data)

    @transaction.atomic
    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        """Record a follow-up payment for an existing admission."""
        admission = self.get_object()
        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        payment = Payment.objects.create(
            admission=admission,
            amount=data['amount'],
            payment_mode=data['payment_mode'],
            status='Paid',
            reference_no=data.get('reference_no', ''),
            notes=data.get('notes', ''),
            collected_by=request.user if request.user.is_authenticated else None,
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='payment-summary')
    def payment_summary(self, request):
        """Return per-admission payment summary with total_fee, total_paid, balance."""
        from django.db.models import Sum, F, Value, DecimalField, Q
        from django.db.models.functions import Coalesce

        qs = Admission.objects.select_related('student', 'course', 'branch', 'manager').all()

        # Branch filtering for non-superusers
        user = request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(branch_id=branch.branch_id)

        # Annotate with total paid
        qs = qs.annotate(
            total_paid=Coalesce(
                Sum('payments__amount', filter=Q(payments__status='Paid')),
                Value(0), output_field=DecimalField()
            )
        )

        # Prefetch ALL BranchCourse + counselling fees in bulk (eliminates N+1 queries)
        admissions_list = list(qs.order_by('-created_at'))
        branch_course_pairs = set(
            (adm.branch_id, adm.course_id) for adm in admissions_list
            if adm.branch_id and adm.course_id
        )
        bc_lookup = {}
        if branch_course_pairs:
            bcs = BranchCourse.objects.prefetch_related('counselling_fees').filter(
                *[Q(branch_id=bp[0], course_id=bp[1]) for bp in branch_course_pairs]
            ) if len(branch_course_pairs) == 1 else BranchCourse.objects.prefetch_related('counselling_fees').all()
            for bc in bcs:
                bc_lookup[(bc.branch_id, bc.course_id)] = bc

        # Build response
        results = []
        for adm in admissions_list:
            # Get course fee from prefetched BranchCourse
            course_fee = 0
            if adm.course_id and adm.branch_id:
                bc = bc_lookup.get((adm.branch_id, adm.course_id))
                if bc:
                    # Use counselling-type fee if applicable
                    ct = (adm.counselling_type or '').strip()
                    ct_key = None
                    if 'both' in ct.lower() or 'combo' in ct.lower():
                        # 'Both' is for engineering, 'Combo' is for medical
                        ct_key = 'Both' if 'both' in ct.lower() else 'Combo_Medical'
                    elif 'josaa' in ct.lower():
                        ct_key = 'JoSAA'
                    elif 'cet' in ct.lower():
                        ct_key = 'CET'
                    elif 'maharashtra' in ct.lower():
                        ct_key = 'MH_Medical'
                    elif 'other state' in ct.lower():
                        ct_key = 'Other_Medical'

                    if ct_key:
                        cf = next((f for f in bc.counselling_fees.all() if f.counselling_type == ct_key), None)
                        if cf:
                            course_fee = float(cf.fee_amount)
                        else:
                            course_fee = float(bc.fee_amount)
                    else:
                        course_fee = float(bc.fee_amount)

            total_paid = float(adm.total_paid or 0)
            balance = max(0, course_fee - total_paid)

            results.append({
                'admission_id': adm.id,
                'admission_number': adm.admission_number,
                'student_name': adm.student.full_name if adm.student else None,
                'student_mobile': adm.student.mobile if adm.student else None,
                'course_name': adm.course.name if adm.course else None,
                'branch_name': adm.branch.name if adm.branch else None,
                'branch_id': adm.branch_id,
                'manager_name': adm.manager.full_name if adm.manager else None,
                'course_fee': course_fee,
                'total_paid': total_paid,
                'balance': balance,
                'payment_status': 'Fully Paid' if balance == 0 and total_paid > 0 else 'Pending',
                'created_at': adm.created_at.isoformat(),
                'admission_status': adm.admission_status,
                'counselling_type': adm.counselling_type or '',
            })

        return Response(results)

class AdmissionPreferenceViewSet(viewsets.ModelViewSet):
    queryset = AdmissionPreference.objects.all()
    serializer_class = AdmissionPreferenceSerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(admission__branch_id=branch.branch_id)
        return qs

class AdmissionDocumentViewSet(viewsets.ModelViewSet):
    queryset = AdmissionDocument.objects.all()
    serializer_class = AdmissionDocumentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(admission__branch_id=branch.branch_id)
        return qs

class StatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = StatusHistory.objects.all()
    serializer_class = StatusHistorySerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(admission__branch_id=branch.branch_id)
        return qs

class BranchFeeConfigViewSet(viewsets.ModelViewSet):
    queryset = BranchFeeConfig.objects.all()
    serializer_class = BranchFeeConfigSerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(branch_id=branch.branch_id)
        return qs

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related(
        'admission__student', 'admission__course', 'admission__branch', 'collected_by'
    ).all()
    serializer_class = PaymentSerializer

    def get_permissions(self):
        """Allow any authenticated user to read; only admins can write."""
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsBranchAdminOrSuperAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(admission__branch_id=branch.branch_id)

        # Support filtering via query params (used by Reports)
        branch_id = self.request.query_params.get('branch')
        if branch_id and (user.is_superuser or (hasattr(user, 'role') and user.role and user.role.name == 'Super Admin')):
            qs = qs.filter(admission__branch_id=branch_id)

        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(admission__course_id=course_id)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(paid_at__gte=f"{date_from}T00:00:00Z")

        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(paid_at__lte=f"{date_to}T23:59:59Z")

        return qs.order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='export')
    def export_payments(self, request):
        from django.db.models import Q
        qs = self.get_queryset()
        
        branch_id = request.query_params.get('branch')
        user = request.user
        if branch_id and (user.is_superuser or (hasattr(user, 'role') and user.role and user.role.name == 'Super Admin')):
            qs = qs.filter(admission__branch_id=branch_id)
            
        course_id = request.query_params.get('course')
        if course_id:
            qs = qs.filter(admission__course_id=course_id)
            
        date_from = request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(paid_at__gte=f"{date_from}T00:00:00Z")
            
        date_to = request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(paid_at__lte=f"{date_to}T23:59:59Z")

        payments = list(qs)
        
        # Calculate total fee per admission (same approach as payment_summary)
        branch_course_pairs = set(
            (p.admission.branch_id, p.admission.course_id) for p in payments
            if p.admission and p.admission.branch_id and p.admission.course_id
        )
        bc_lookup = {}
        if branch_course_pairs:
            bcs = BranchCourse.objects.prefetch_related('counselling_fees').filter(
                *[Q(branch_id=bp[0], course_id=bp[1]) for bp in branch_course_pairs]
            ) if len(branch_course_pairs) == 1 else BranchCourse.objects.prefetch_related('counselling_fees').all()
            for bc in bcs:
                bc_lookup[(bc.branch_id, bc.course_id)] = bc

        results = []
        for p in payments:
            course_fee = 0
            if p.admission and p.admission.course_id and p.admission.branch_id:
                bc = bc_lookup.get((p.admission.branch_id, p.admission.course_id))
                if bc:
                    ct = (p.admission.counselling_type or '').strip()
                    ct_key = None
                    if 'both' in ct.lower() or 'combo' in ct.lower():
                        ct_key = 'Both' if 'both' in ct.lower() else 'Combo_Medical'
                    elif 'josaa' in ct.lower(): ct_key = 'JoSAA'
                    elif 'cet' in ct.lower(): ct_key = 'CET'
                    elif 'maharashtra' in ct.lower(): ct_key = 'MH_Medical'
                    elif 'other state' in ct.lower(): ct_key = 'Other_Medical'

                    if ct_key:
                        cf = next((f for f in bc.counselling_fees.all() if f.counselling_type == ct_key), None)
                        if cf:
                            course_fee = float(cf.fee_amount)
                        else:
                            course_fee = float(bc.fee_amount)
                    else:
                        course_fee = float(bc.fee_amount)
            
            parent_mobile = None
            if p.admission and p.admission.student and p.admission.student.demographic_details:
                parent_mobile = p.admission.student.demographic_details.get('alternate_mobile', None)
                if not parent_mobile:
                    parent_mobile = p.admission.student.demographic_details.get('father_mobile', None)

            results.append({
                'id': p.id,
                'admission_id': p.admission.id if p.admission else None,
                'admission_number': p.admission.admission_number if p.admission else None,
                'student_name': p.admission.student.full_name if p.admission and p.admission.student else None,
                'student_mobile': p.admission.student.mobile if p.admission and p.admission.student else None,
                'parent_mobile': parent_mobile,
                'course_name': p.admission.course.name if p.admission and p.admission.course else None,
                'branch_name': p.admission.branch.name if p.admission and p.admission.branch else None,
                'paid_at': p.paid_at.isoformat() if p.paid_at else None,
                'payment_mode': p.payment_mode,
                'status': p.status,
                'amount_paid': float(p.amount),
                'total_course_fee': course_fee,
                'collected_by': p.collected_by.full_name if p.collected_by else None,
                'reference_no': p.reference_no,
                'notes': p.notes,
            })
            
        return Response(results, status=status.HTTP_200_OK)

class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer

    def get_permissions(self):
        """Allow any authenticated user to read; only admins can write."""
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsBranchAdminOrSuperAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'is_superuser') and not user.is_superuser:
            branch_mapping = getattr(user, 'branch_mappings', None)
            if branch_mapping:
                branch = branch_mapping.first()
                if branch:
                    qs = qs.filter(payment__admission__branch_id=branch.branch_id)
        return qs

class WhatsappConfigViewSet(viewsets.ModelViewSet):
    queryset = WhatsappConfig.objects.all()
    serializer_class = WhatsappConfigSerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]

class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]

class NotificationLogViewSet(viewsets.ModelViewSet):
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer
    permission_classes = [IsBranchAdminOrSuperAdmin]


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
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Force-change password for users with must_change_password flag."""
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        user = User.objects.get(pk=serializer.validated_data['user_id'])
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    # Authorization check: self, superuser, or branch admin for same-branch users
    actor = request.user
    is_self = actor.id == user.id
    is_super = actor.is_superuser
    is_branch_admin = not is_super and actor.role and actor.role.name.lower() == 'branch admin'
    authorized = is_self or is_super
    if is_branch_admin and not is_self:
        actor_branch = actor.branch_mappings.first()
        target_branch = user.branch_mappings.first()
        if actor_branch and target_branch and actor_branch.branch_id == target_branch.branch_id:
            authorized = True
    if not authorized:
        return Response({'detail': 'Not authorized to change this user\'s password.'}, status=status.HTTP_403_FORBIDDEN)

    user.set_password(serializer.validated_data['new_password'])
    user.must_change_password = False
    user.save(update_fields=['password', 'must_change_password'])

    # Important: Changing the password invalidates the current session.
    # We must update the session hash so the user remains logged in.
    from django.contrib.auth import update_session_auth_hash
    if request.user.is_authenticated and request.user.id == user.id:
        update_session_auth_hash(request, user)

    return Response({'detail': 'Password changed successfully.'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_stats_view(request):
    """Return live server system stats (CPU, Memory, Disk, OS info). Super Admin only."""
    import platform
    import sys

    stats = {
        'os': platform.system() + ' ' + platform.release(),
        'python': platform.python_version(),
        'service_status': 'Operational',
    }

    try:
        import psutil
        # CPU
        stats['cpu_percent'] = psutil.cpu_percent(interval=0.5)
        stats['cpu_count'] = psutil.cpu_count(logical=True)

        # Memory
        mem = psutil.virtual_memory()
        stats['memory_total_gb'] = round(mem.total / (1024 ** 3), 2)
        stats['memory_used_gb'] = round(mem.used / (1024 ** 3), 2)
        stats['memory_percent'] = mem.percent

        # Disk
        disk = psutil.disk_usage('/')
        stats['disk_total_gb'] = round(disk.total / (1024 ** 3), 2)
        stats['disk_used_gb'] = round(disk.used / (1024 ** 3), 2)
        stats['disk_percent'] = disk.percent

        # Network Bandwidth
        net = psutil.net_io_counters()
        stats['net_sent_gb'] = round(net.bytes_sent / (1024 ** 3), 2)
        stats['net_recv_gb'] = round(net.bytes_recv / (1024 ** 3), 2)

    except ImportError:
        # psutil not installed — return basic info only
        stats['cpu_percent'] = None
        stats['cpu_count'] = None
        stats['memory_total_gb'] = None
        stats['memory_used_gb'] = None
        stats['memory_percent'] = None
        stats['disk_total_gb'] = None
        stats['disk_used_gb'] = None
        stats['disk_percent'] = None
        stats['note'] = 'Install psutil for live system metrics'

    # DB stats
    stats['total_admissions'] = Admission.objects.count()
    stats['total_students'] = Student.objects.count()
    stats['total_payments'] = Payment.objects.count()
    stats['total_enquiries'] = Enquiry.objects.count()

    return Response(stats)
