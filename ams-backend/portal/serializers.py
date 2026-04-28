from rest_framework import serializers
from .models import (
    Role, Permission, RolePermission,
    Organization, Branch,
    User, UserBranch,
    Enquiry,
    Student, Stream, Course, College, Admission, AdmissionPreference, AdmissionDocument, StatusHistory,
    BranchFeeConfig, BranchCourse, BranchCourseCounsellingFee, Payment, Receipt,
    WhatsappConfig, NotificationTemplate, NotificationLog
)


# ── CORE SERIALIZERS ─────────────────────────────────────

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = '__all__'

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'


# ── STREAM / COURSE ──────────────────────────────────────

class StreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    stream_name = serializers.CharField(source='stream.name', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'stream', 'stream_name', 'name', 'is_active']


# ── BRANCH COURSE (per-branch fee) ───────────────────────

class BranchCourseCounsellingFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchCourseCounsellingFee
        fields = ['id', 'branch_course', 'counselling_type', 'fee_amount']
        extra_kwargs = {'branch_course': {'required': False}}


class BranchCourseSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    stream_name = serializers.CharField(source='course.stream.name', read_only=True)
    counselling_fees = BranchCourseCounsellingFeeSerializer(many=True, read_only=True)

    class Meta:
        model = BranchCourse
        fields = ['id', 'branch', 'course', 'course_name', 'stream_name', 'fee_amount', 'is_active', 'counselling_fees', 'created_at', 'updated_at']


# ── BRANCH ───────────────────────────────────────────────

class BranchSerializer(serializers.ModelSerializer):
    branch_courses = BranchCourseSerializer(many=True, read_only=True)
    course_count = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()

    def get_manager_name(self, obj):
        admin_mapping = obj.userbranch_set.filter(user__role__name__iexact='Branch Admin').first()
        if admin_mapping:
            return admin_mapping.user.full_name
        return getattr(obj.manager, 'full_name', None)

    class Meta:
        model = Branch
        fields = '__all__'

    def get_course_count(self, obj):
        return obj.branch_courses.filter(is_active=True).count()


class CounsellingFeeInputSerializer(serializers.Serializer):
    """Nested inside BranchCourseInputSerializer for counselling-type fees."""
    counselling_type = serializers.ChoiceField(choices=['JoSAA', 'CET', 'Both'])
    fee_amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class BranchCourseInputSerializer(serializers.Serializer):
    """Used inside BranchCreateSerializer to accept course + fee pairs."""
    course_id = serializers.IntegerField()
    fee_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    counselling_fees = CounsellingFeeInputSerializer(many=True, required=False)


class BranchCreateSerializer(serializers.ModelSerializer):
    """Accepts branch fields + nested courses array for atomic creation."""
    courses = BranchCourseInputSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Branch
        fields = '__all__'
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True, 'allow_null': True},
            'manager': {'required': False, 'allow_null': True},
        }

    def validate_email(self, value):
        if value == '':
            return None
        return value


# ── USER ─────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True, default=None)
    assigned_by_name = serializers.CharField(source='manager.full_name', read_only=True, default=None)
    branch_id = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'mobile', 'full_name', 'role', 'role_name', 'manager', 'assigned_by_name',
            'branch_id', 'branch_name',
            'is_active', 'is_staff', 'must_change_password',
            'last_login_at', 'created_at', 'updated_at', 'password',
        ]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def get_branch_id(self, obj):
        mapping = obj.branch_mappings.first()
        return mapping.branch.id if mapping else None

    def get_branch_name(self, obj):
        mapping = obj.branch_mappings.first()
        return mapping.branch.name if mapping else None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    new_password = serializers.CharField(min_length=6, max_length=128)
    confirm_password = serializers.CharField(min_length=6, max_length=128)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


class UserBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBranch
        fields = '__all__'


# ── ENQUIRY ──────────────────────────────────────────────

class EnquirySerializer(serializers.ModelSerializer):
    counselor_name = serializers.CharField(source='counselor.full_name', read_only=True, default=None)

    class Meta:
        model = Enquiry
        fields = '__all__'


# ── FEES / PAYMENTS (declared early so AdmissionSerializer can reference) ──

class BranchFeeConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchFeeConfig
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    admission_number = serializers.CharField(source='admission.admission_number', read_only=True, default=None)
    student_name = serializers.CharField(source='admission.student.full_name', read_only=True, default=None)
    student_mobile = serializers.CharField(source='admission.student.mobile', read_only=True, default=None)
    course_name = serializers.CharField(source='admission.course.name', read_only=True, default=None)
    branch_name = serializers.CharField(source='admission.branch.name', read_only=True, default=None)
    branch_id = serializers.IntegerField(source='admission.branch.id', read_only=True, default=None)
    collected_by_name = serializers.CharField(source='collected_by.full_name', read_only=True, default=None)

    class Meta:
        model = Payment
        fields = '__all__'

class RecordPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = serializers.CharField(max_length=20)
    reference_no = serializers.CharField(max_length=80, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = '__all__'


# ── STUDENT / ADMISSION ─────────────────────────────────

class StudentSerializer(serializers.ModelSerializer):
    is_entrance_only = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'

    def get_is_entrance_only(self, obj):
        admissions = obj.admissions.all()
        if not admissions:
            return False
        for a in admissions:
            if a.is_entrance_guidance_only:
                continue
            if a.course and 'entrance' in a.course.name.lower() and 'guidance' in a.course.name.lower():
                continue
            return False
        return True

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = '__all__'

class AdmissionSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.full_name', read_only=True, default=None)
    student_name = serializers.CharField(source='student.full_name', read_only=True, default=None)
    student_mobile = serializers.CharField(source='student.mobile', read_only=True, default=None)
    student_detail = StudentSerializer(source='student', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    branch_address = serializers.CharField(source='branch.address', read_only=True, default=None)
    branch_name = serializers.CharField(source='branch.name', read_only=True, default=None)
    course_name = serializers.CharField(source='course.name', read_only=True, default=None)

    class Meta:
        model = Admission
        fields = '__all__'

class AdmissionInitiateSerializer(serializers.Serializer):
    student_name = serializers.CharField(max_length=150)
    student_mobile = serializers.CharField(max_length=15)
    branch_id = serializers.IntegerField(required=False, allow_null=True)
    course_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = serializers.CharField(max_length=20)
    transaction_id = serializers.CharField(max_length=80, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    counselling_type = serializers.CharField(max_length=60, required=False, allow_blank=True)

class AdmissionPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionPreference
        fields = '__all__'

class AdmissionDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionDocument
        fields = '__all__'

class StatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusHistory
        fields = '__all__'




# ── NOTIFICATIONS ────────────────────────────────────────

class WhatsappConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsappConfig
        fields = '__all__'

class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = '__all__'

class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = '__all__'