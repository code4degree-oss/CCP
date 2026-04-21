from django.db import migrations

def seed_roles(apps, schema_editor):
    Role = apps.get_model('portal', 'Role')

    from django.utils.text import slugify

    roles_to_create = [
        'Super Admin',
        'Branch Admin',
        'Employee',
        'Manager',
        'Telecaller',
    ]

    for role_name in roles_to_create:
        Role.objects.get_or_create(name=role_name, defaults={'slug': slugify(role_name)})

def reverse_seed(apps, schema_editor):
    pass  # Allow reverse migration without errors

class Migration(migrations.Migration):

    dependencies = [
        ('portal', '0010_seed_initial_courses'),
    ]

    operations = [
        migrations.RunPython(seed_roles, reverse_seed),
    ]
