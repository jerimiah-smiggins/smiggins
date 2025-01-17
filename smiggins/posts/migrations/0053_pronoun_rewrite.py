# Generated by Django 5.0.7 on 2024-11-28 00:48

import django.db.models.deletion
from django.db import migrations, models


def migrate_pronouns(apps, schema_editor):
    User = apps.get_model("posts", "User")
    UserPronouns = apps.get_model("posts", "UserPronouns")

    primary_map = {
        "_": "none",
        "a": "ask",
        "v": "avoid",
        "o": "other"
    }

    for user in User.objects.all():
        pronouns = user.pronouns

        if pronouns[0] == "_":
            primary = primary_map[pronouns[1]]
            secondary = None

        else:
            primary = pronouns[0]
            secondary = pronouns[1]

            if secondary == "i":
                secondary = primary

        UserPronouns.objects.create(
            language=user.language,
            user=user,
            primary=primary,
            secondary=secondary
        )

class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0052_onetimepassword")
    ]

    operations = [
        migrations.CreateModel(
            name="UserPronouns",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("language", models.CharField(max_length=5)),
                ("primary", models.TextField()),
                ("secondary", models.TextField(null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="_pronouns", to="posts.user"))
            ],
            options={
                "unique_together": {("user", "language")}
            }
        ),
        migrations.RunPython(migrate_pronouns),
        migrations.RemoveField(
            model_name="user",
            name="pronouns"
        ),
        migrations.AlterField(
            model_name="userpronouns",
            name="user",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="pronouns", to="posts.user"),
        )
    ]
