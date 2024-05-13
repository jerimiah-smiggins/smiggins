# Generated by Django 5.0.6 on 2024-05-13 02:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0034_remove_user_read_messages_user_unread_messages'),
    ]

    operations = [
        migrations.CreateModel(
            name='Hashtag',
            fields=[
                ('tag', models.CharField(max_length=64, unique=True, primary_key=True)),
                ('posts', models.JSONField(blank=True, default=list)),
            ],
        ),
    ]
