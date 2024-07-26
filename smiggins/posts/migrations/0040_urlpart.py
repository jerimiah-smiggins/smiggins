# Generated by Django 5.0.7 on 2024-07-26 19:39

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0039_user_email'),
    ]

    operations = [
        migrations.CreateModel(
            name='URLPart',
            fields=[
                ('url', models.TextField(max_length=128, primary_key=True, serialize=False, unique=True)),
                ('reason', models.TextField(max_length=6)),
                ('expire', models.IntegerField()),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='posts.user')),
            ],
        ),
    ]
