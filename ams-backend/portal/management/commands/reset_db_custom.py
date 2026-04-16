import sys
from django.core.management.base import BaseCommand
from portal.models import (
    Organization, Branch, User, UserBranch,
    Enquiry, Student, Admission, AdmissionPreference, AdmissionDocument, StatusHistory,
    BranchFeeConfig, BranchCourse, Payment, Receipt,
    WhatsappConfig, NotificationTemplate, NotificationLog
)

class Command(BaseCommand):
    help = 'Wipes the database operational data but preserves Superadmins and configuration mappings (Roles, Streams, Courses, Permissions).'

    def handle(self, *args, **options):
        self.stdout.write("Starting gentle database wipe...")

        # Delete operations in reverse order of foreign key dependencies
        NotificationLog.objects.all().delete()
        Receipt.objects.all().delete()
        Payment.objects.all().delete()
        
        StatusHistory.objects.all().delete()
        AdmissionDocument.objects.all().delete()
        AdmissionPreference.objects.all().delete()
        Admission.objects.all().delete()
        
        Student.objects.all().delete()
        Enquiry.objects.all().delete()
        
        BranchFeeConfig.objects.all().delete()
        BranchCourse.objects.all().delete()
        UserBranch.objects.all().delete()
        
        # Delete non-superadmin users
        deleted_users_count, _ = User.objects.filter(is_superuser=False).delete()
        self.stdout.write(f"Deleted {deleted_users_count} non-superadmin users.")
        
        Branch.objects.all().delete()
        Organization.objects.all().delete()
        
        # Optionally cleanup config data that might be linked to deleted branches or orgs
        WhatsappConfig.objects.all().delete()
        NotificationTemplate.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS("Database operational data successfully wiped. Superadmins, Roles, Streams, and Courses remain intact!"))
