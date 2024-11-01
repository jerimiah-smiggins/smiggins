# Written by trinkey on 2024-10-29

import django.db.models.deletion
from django.db import migrations, models
from django.db.utils import IntegrityError


def migrate_likes(apps, schema_editor):
    Post = apps.get_model("posts", "Post")
    Comment = apps.get_model("posts", "Comment")
    User = apps.get_model("posts", "User")

    M2MLike = apps.get_model("posts", "M2MLike")
    M2MLikeC = apps.get_model("posts", "M2MLikeC")

    unique = []
    for post in Post.objects.all():
        for uid in post.likes1:
            if [post.post_id, uid] in unique:
                continue
            unique.append([post.post_id, uid])
            try:
                M2MLike.objects.create(
                    user=User.objects.get(user_id=uid),
                    post=post
                )
            except User.DoesNotExist:
                ...
            except IntegrityError:
                ...

    unique = []
    for comment in Comment.objects.all():
        for uid in comment.likes1:
            if [post.post_id, uid] in unique:
                continue
            unique.append([post.post_id, uid])
            try:
                M2MLikeC.objects.create(
                    user=User.objects.get(user_id=uid),
                    post=comment
                )
            except User.DoesNotExist:
                ...
            except IntegrityError:
                ...

def migrate_relationships(apps, schema_editor):
    User = apps.get_model("posts", "User")

    M2MFollow = apps.get_model("posts", "M2MFollow")
    M2MBlock = apps.get_model("posts", "M2MBlock")

    for user in User.objects.all():
        unique = {
            "block": [],
            "follow": []
        }

        for uid in user.following1:
            if uid in unique["follow"] or uid == user.user_id:
                continue

            unique["follow"].append(uid)

            try:
                M2MFollow.objects.create(
                    user=user,
                    following=User.objects.get(user_id=uid)
                )
            except User.DoesNotExist:
                ...
            except IntegrityError:
                ...

        for uid in user.blocking1:
            if uid in unique["block"] or uid == user.user_id:
                continue

            unique["block"].append(uid)

            try:
                M2MBlock.objects.create(
                    user=user,
                    blocking=User.objects.get(user_id=uid)
                )
            except User.DoesNotExist:
                ...
            except IntegrityError:
                ...

def migrate_pinned(apps, schema_editor):
    Post = apps.get_model("posts", "Post")
    User = apps.get_model("posts", "User")

    for user in User.objects.all():
        try:
            user.pinned = Post.objects.get(post_id=user.pinned1)
        except Post.DoesNotExist:
            user.pinned = None
        user.save()

class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0050_comment_edited_at_post_edited_at"),
    ]

    operations = [
        # Make models
        migrations.CreateModel(
            name="M2MLike",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.post")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.user"))
            ],
            options={ "unique_together": {("user", "post")} }
        ),
        migrations.CreateModel(
            name="M2MLikeC",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.comment")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.user"))
            ],
            options={ "unique_together": {("user", "post")} }
        ),
        migrations.CreateModel(
            name="M2MBlock",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("blocking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="blocked_obj", to="posts.user")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="blocking_obj", to="posts.user"))
            ],
            options={ "unique_together": {("user", "blocking")} }
        ),
        migrations.CreateModel(
            name="M2MFollow",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("following", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="followers_obj", to="posts.user")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="following_obj", to="posts.user"))
            ],
            options={ "unique_together": {("user", "following")} }
        ),

        # Misc.
        migrations.RenameField(model_name="comment", old_name="private_comment", new_name="private"),
        migrations.RenameField(model_name="post", old_name="private_post", new_name="private"),
        migrations.RemoveField(model_name="user", name="comments"),
        migrations.RemoveField(model_name="user", name="likes"),
        migrations.RemoveField(model_name="user", name="notifications"),
        migrations.RemoveField(model_name="user", name="posts"),
        migrations.AlterField(model_name="comment", name="creator", field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="posts.user")),
        migrations.AlterField(model_name="post", name="creator", field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="posts", to="posts.user")),
        migrations.AlterField(model_name="adminlog", name="u_for", field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, null=True, related_name="admin_log_for", to="posts.user")),
        migrations.AlterField(model_name="notification", name="is_for", field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notifications", to="posts.user")),

        # Likes
        migrations.RenameField(model_name="post", old_name="likes", new_name="likes1"),
        migrations.RenameField(model_name="comment", old_name="likes", new_name="likes1"),
        migrations.AddField(model_name="post", name="likes", field=models.ManyToManyField(blank=True, related_name="liked_posts", through="posts.M2MLike", to="posts.user")),
        migrations.AddField(model_name="comment", name="likes", field=models.ManyToManyField(blank=True, related_name="liked_comments", through="posts.M2MLikeC", to="posts.user")),
        migrations.RunPython(migrate_likes),
        migrations.RemoveField(model_name="post", name="likes1"),
        migrations.RemoveField(model_name="comment", name="likes1"),

        # Pinned posts
        migrations.RenameField(model_name="user", old_name="pinned", new_name="pinned1"),
        migrations.AddField(model_name="user", name="pinned", field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, to="posts.post", null=True)),
        migrations.RunPython(migrate_pinned),
        migrations.RemoveField(model_name="user", name="pinned1"),

        # Messages
        migrations.RemoveField(model_name="privatemessagecontainer", name="messages"),
        migrations.AlterField(model_name="privatemessage", name="message_container", field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="posts.privatemessagecontainer")),

        # Following/blocking nonsense
        migrations.RemoveField(model_name="user", name="followers"),
        migrations.RenameField(model_name="user", old_name="following", new_name="following1"),
        migrations.RenameField(model_name="user", old_name="blocking", new_name="blocking1"),
        migrations.AddField(model_name="user", name="blocking", field=models.ManyToManyField(blank=True, related_name="blockers", through="posts.M2MBlock", to="posts.user")),
        migrations.AddField(model_name="user", name="following", field=models.ManyToManyField(blank=True, related_name="followers", through="posts.M2MFollow", to="posts.user")),
        migrations.RunPython(migrate_relationships),
        migrations.RemoveField(model_name="user", name="following1"),
        migrations.RemoveField(model_name="user", name="blocking1")
    ]
