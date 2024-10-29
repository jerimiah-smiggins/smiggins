# Written by trinkey on 2024-10-29

import django.db.models.deletion
from django.db import migrations, models


def migrate_likes(apps, schema_editor):
    Post = apps.get_model("posts", "Post")
    Comment = apps.get_model("posts", "Comment")
    Like = apps.get_model("posts", "Like")
    LikeC = apps.get_model("posts", "LikeC")
    User = apps.get_model("posts", "User")

    for post in Post.objects.all():
        for uid in post.likes1:
            try:
                Like.objects.create(
                    user=User.objects.get(user_id=uid),
                    post=post
                )
            except User.DoesNotExist:
                ...

    for comment in Comment.objects.all():
        for uid in comment.likes1:
            try:
                LikeC.objects.create(
                    user=User.objects.get(user_id=uid),
                    post=comment
                )
            except User.DoesNotExist:
                ...

class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0050_comment_edited_at_post_edited_at"),
    ]

    operations = [
        migrations.RenameField(model_name="comment", old_name="private_comment", new_name="private"),
        migrations.RenameField(model_name="post", old_name="private_post", new_name="private"),
        migrations.RemoveField(model_name="user", name="comments"),
        migrations.RemoveField(model_name="user", name="likes"),
        migrations.RemoveField(model_name="user", name="posts"),
        migrations.AlterField(model_name="comment", name="creator", field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.user")),
        migrations.AlterField(model_name="post", name="creator", field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="posts", to="posts.user")),

        # Likes
        migrations.CreateModel(
            name="Like",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.post")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.user"))
            ],
            options={ "unique_together": {("user", "post")} }
        ),
        migrations.CreateModel(
            name="LikeC",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.comment")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.user"))
            ],
            options={ "unique_together": {("user", "post")} }
        ),
        migrations.RenameField(model_name="post", old_name="likes", new_name="likes1"),
        migrations.RenameField(model_name="comment", old_name="likes", new_name="likes1"),
        migrations.AddField(model_name="post", name="likes", field=models.ManyToManyField(blank=True, related_name="liked_posts", through="posts.Like", to="posts.user")),
        migrations.AddField(model_name="comment", name="likes", field=models.ManyToManyField(blank=True, related_name="liked_comments", through="posts.LikeC", to="posts.user")),
        migrations.RunPython(migrate_likes),
        migrations.RemoveField(model_name="post", name="likes1"),
        migrations.RemoveField(model_name="comment", name="likes1"),
    ]
