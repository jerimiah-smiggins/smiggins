# Generated by Django 5.1.4 on 2025-01-11 03:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0055_add_blank'),
    ]

    operations = [
        migrations.AddField(
            model_name='mutedword',
            name='hard_mute',
            field=models.BooleanField(default=False),
        ),
    ]