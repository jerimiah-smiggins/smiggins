# Written by trinkey on 2024-08-08 16:31

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0041_rename_reason_urlpart_intent_urlpart_extra_data")
    ]

    operations = [
        migrations.RenameField("user", "private", "default_post_private"),
        migrations.AddField("user", "verify_followers", models.BooleanField(default=False)),
        migrations.AddField("post", "private_post", models.BooleanField(null=True)),
        migrations.AddField("comment", "private_comment", models.BooleanField(null=True)),
        migrations.AlterField("user", "default_post_private", models.BooleanField(default=False))
    ]
