# Generated by Django 5.0.1 on 2024-01-08 00:29

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0002_rename_user_users'),
    ]

    operations = [
        migrations.RenameField(
            model_name='comments',
            old_name='post_id',
            new_name='comment_id',
        ),
    ]
