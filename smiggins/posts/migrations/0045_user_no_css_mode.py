# Generated by Django 5.0.7 on 2024-08-16 01:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0044_user_pending_followers'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='no_css_mode',
            field=models.BooleanField(default=False),
        ),
    ]