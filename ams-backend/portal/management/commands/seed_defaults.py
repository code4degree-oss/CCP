"""
Seed default data — Chanakya Career Point
Creates: Organization, Roles, Streams, Courses, and assigns Super Admin role to existing superusers.
Run: python manage.py seed_defaults
"""
from django.core.management.base import BaseCommand
from portal.models import Organization, Role, Stream, Course, User


class Command(BaseCommand):
    help = 'Seed default organization, roles, streams, and courses for Chanakya Career Point'

    def handle(self, *args, **options):
        self.stdout.write('\n═══ Seeding Chanakya Career Point Defaults ═══\n')

        # ── 1. Organization ──
        org, created = Organization.objects.get_or_create(
            slug='ccp',
            defaults={
                'name': 'Chanakya Career Point',
                'contact_mobile': '0000000000',
                'email': 'info@chanakyacareerpoint.com',
            }
        )
        self.stdout.write(f'  Organization: {org.name}  {"[CREATED]" if created else "[EXISTS]"}')

        # ── 2. Roles ──
        roles_data = [
            ('Super Admin', 'super-admin'),
            ('Branch Admin', 'branch-admin'),
            ('Employee', 'employee'),
        ]
        for name, slug in roles_data:
            role, created = Role.objects.get_or_create(name=name, slug=slug)
            self.stdout.write(f'  Role: {name}  {"[CREATED]" if created else "[EXISTS]"}')

        # ── 3. Streams & Courses ──
        streams_courses = {
            ('PCM Group', 'PCM'): [
                'Engineering Admission Guidance',
                'Engineering Entrance Guidance',
            ],
            ('PCB Group', 'PCB'): [
                'Medical Admission Guidance',
                'Pharmacy Admission Guidance',
                'Nursing Admission Guidance',
            ],
        }

        for (stream_name, stream_type), courses in streams_courses.items():
            stream, created = Stream.objects.get_or_create(
                name=stream_name,
                defaults={'type': stream_type, 'is_active': True}
            )
            self.stdout.write(f'  Stream: {stream_name}  {"[CREATED]" if created else "[EXISTS]"}')

            for course_name in courses:
                course, created = Course.objects.get_or_create(
                    stream=stream,
                    name=course_name,
                    defaults={'is_active': True}
                )
                self.stdout.write(f'    └─ Course: {course_name}  {"[CREATED]" if created else "[EXISTS]"}')

        # ── 4. Assign Super Admin role to all existing superusers ──
        super_admin_role = Role.objects.filter(slug='super-admin').first()
        if super_admin_role:
            updated = User.objects.filter(is_superuser=True, role__isnull=True).update(role=super_admin_role)
            if updated:
                self.stdout.write(f'\n  Assigned Super Admin role to {updated} superuser(s)')

        self.stdout.write(self.style.SUCCESS('\n✓ Seeding complete!\n'))
