# Generated by Django 5.0.2 on 2024-04-09 23:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0009_alter_comment_content_alter_post_content'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='color_two',
            field=models.CharField(max_length=7, null=True),
        ),
    ]