# Generated by Django 5.1.4 on 2025-01-19 18:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0058_remove_user_read_notifs_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='GenericData',
            fields=[
                ('id', models.CharField(max_length=50, primary_key=True, serialize=False, unique=True)),
                ('value', models.TextField(blank=True)),
            ],
        ),
    ]