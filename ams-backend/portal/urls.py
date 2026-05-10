from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, PermissionViewSet, RolePermissionViewSet,
    OrganizationViewSet, BranchViewSet, BranchCourseViewSet, BranchCourseCounsellingFeeViewSet,
    UserViewSet, UserBranchViewSet,
    EnquiryViewSet,
    StudentViewSet, StreamViewSet, CourseViewSet, CollegeViewSet, AdmissionViewSet, AdmissionPreferenceViewSet, AdmissionDocumentViewSet, StatusHistoryViewSet,
    BranchFeeConfigViewSet, PaymentViewSet, ReceiptViewSet,
    WhatsappConfigViewSet, NotificationTemplateViewSet, NotificationLogViewSet,
    login_view, me_view, logout_view, change_password_view, seed_courses_view, system_stats_view
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'role-permissions', RolePermissionViewSet)
router.register(r'organizations', OrganizationViewSet)
router.register(r'branches', BranchViewSet)
router.register(r'branch-courses', BranchCourseViewSet)
router.register(r'branch-course-counselling-fees', BranchCourseCounsellingFeeViewSet)
router.register(r'users', UserViewSet)
router.register(r'user-branches', UserBranchViewSet)
router.register(r'enquiries', EnquiryViewSet)
router.register(r'students', StudentViewSet)
router.register(r'streams', StreamViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'colleges', CollegeViewSet)
router.register(r'admissions', AdmissionViewSet)
router.register(r'admission-preferences', AdmissionPreferenceViewSet)
router.register(r'admission-documents', AdmissionDocumentViewSet)
router.register(r'status-histories', StatusHistoryViewSet)
router.register(r'branch-fee-configs', BranchFeeConfigViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'receipts', ReceiptViewSet)
router.register(r'whatsapp-configs', WhatsappConfigViewSet)
router.register(r'notification-templates', NotificationTemplateViewSet)
router.register(r'notification-logs', NotificationLogViewSet)

urlpatterns = [
    path('login/', login_view, name='login'),
    path('me/', me_view, name='me'),
    path('logout/', logout_view, name='logout'),
    path('change-password/', change_password_view, name='change-password'),
    path('seed-courses/', seed_courses_view, name='seed-courses'),
    path('system-stats/', system_stats_view, name='system-stats'),
    path('', include(router.urls)),
]

