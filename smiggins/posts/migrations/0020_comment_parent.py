# Generated by Django 5.0.2 on 2024-04-21 16:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0019_alter_comment_comments_alter_comment_likes_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='parent',
            field=models.IntegerField(default=0),
        ),
    ]
