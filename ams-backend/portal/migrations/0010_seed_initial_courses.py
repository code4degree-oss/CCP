from django.db import migrations

def seed_courses(apps, schema_editor):
    Stream = apps.get_model('portal', 'Stream')
    Course = apps.get_model('portal', 'Course')

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

    for stream_name, courses in data.items():
        stream, _ = Stream.objects.get_or_create(name=stream_name, defaults={'type': stream_name.split()[0]})
        for course_name in courses:
            Course.objects.get_or_create(stream=stream, name=course_name)

def reverse_seed(apps, schema_editor):
    pass  # Allow reverse migration without errors

class Migration(migrations.Migration):

    dependencies = [
        ('portal', '0009_add_payment_notes'),
    ]

    operations = [
        migrations.RunPython(seed_courses, reverse_seed),
    ]
