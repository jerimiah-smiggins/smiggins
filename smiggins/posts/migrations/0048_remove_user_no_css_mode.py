# Generated by Django 5.0.7 on 2024-09-27 15:21

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0047_adminlog'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='no_css_mode',
        ),
    ]
