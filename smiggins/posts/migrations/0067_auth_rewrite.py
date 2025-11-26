# Written by trinkey on 2025-11-26

import random

from django.db import migrations, models


def generate_tokens(apps, schema_editor):
    User = apps.get_model("posts", "User")

    for u in User.objects.all():
        key = ""
        for _ in range(64 // 8):
            key += hex(random.randint(0, 1 << 32 - 1))[2:].zfill(8)

        u.auth_key = key
        u.save()

class Migration(migrations.Migration):
    dependencies = [("posts", "0066_invitecode")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="auth_key",
            field=models.CharField(default="", max_length=64),
            preserve_default=False
        ),
        migrations.AddField(
            model_name="user",
            name="password_hash",
            field=models.TextField(null=True)
        ),
        migrations.RenameField(
            model_name="user",
            old_name="token",
            new_name="legacy_token"
        ),
        migrations.AlterField(
            model_name="user",
            name="legacy_token",
            field=models.CharField(max_length=64, null=True, unique=True)
        ),

        migrations.RunPython(generate_tokens),
        migrations.AlterField(
            model_name="user",
            name="auth_key",
            field=models.CharField(unique=True, max_length=64)
        )
    ]
