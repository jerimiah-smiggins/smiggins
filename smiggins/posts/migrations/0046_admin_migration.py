# Written by trinkey on 2024-08-08 16:31

from django.db import migrations


def update_admin_vals(apps, schema_editor):
    users = apps.get_model("posts", "User")

    admin_levels = {
        0: 0,
        1: 0b000000001,
        2: 0b000000011,
        3: 0b000011111,
        4: 0b101111111,
        5: 0b111111111
    }

    for user in users.objects.all():
        if user.admin_level in admin_levels:
            user.admin_level = admin_levels[user.admin_level]
        elif user.admin_level > 5:
            user.admin_level = admin_levels[5]
        else:
            user.admin_level = admin_levels[0]

        user.save()

class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0045_user_no_css_mode")
    ]

    operations = [
        migrations.RunPython(update_admin_vals)
    ]
