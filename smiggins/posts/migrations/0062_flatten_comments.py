# Written by trinkey on 2025-09-12

import django.db.models.deletion
from django.db import migrations, models
from django.db.models import Q


def migrate_comments(apps, schema_editor):
    Post = apps.get_model("posts", "Post")
    Comment = apps.get_model("posts", "Comment")
    M2MLike = apps.get_model("posts", "M2MLike")
    M2MLikeC = apps.get_model("posts", "M2MLikeC")

    try:
        reference_post_id = Post.objects.order_by("-post_id")[0].post_id
    except IndexError:
        reference_post_id = 0

    flattened = {}
    posts_with_quotes = Post.objects.filter(~Q(quote=0)).values_list("post_id", "quote", "quote_is_comment")
    comment_parents = Comment.objects.all().values_list("comment_id", "parent", "parent_is_comment")

    for comment in Comment.objects.all():
        flattened[comment.comment_id] = Post(
            post_id=comment.comment_id + reference_post_id,
            content=comment.content,
            content_warning=comment.content_warning,
            creator=comment.creator,
            timestamp=comment.timestamp,

            quote=0,
            quote_is_comment=False,

            edited=comment.edited,
            edited_at=comment.edited_at,

            private=comment.private
        )

    Post.objects.bulk_create(flattened.values())

    for post in posts_with_quotes:
        try:
            p = Post.objects.get(post_id=post[0])
        except Post.DoesNotExist:
            print(f"couldn't find post {post[0]} (this is really bad though something is truly messed up)")
            continue

        try:
            p.quoted_post = Post.objects.get(post_id=post[1] + (reference_post_id if post[2] else 0))
        except (KeyError, Post.DoesNotExist):
            print(f"couldn't find quote {post[1]} for post {post[0]}")
            continue

        p.save()

    for parent in comment_parents:
        try:
            p = Post.objects.get(post_id=parent[0] + reference_post_id)
        except Post.DoesNotExist:
            print(f"couldn't find comment {parent[0]} (this is really bad though something is truly messed up)")
            continue

        try:
            p.comment_parent = Post.objects.get(post_id=parent[1] + (reference_post_id if parent[2] else 0))
        except (KeyError, Post.DoesNotExist):
            print(f"couldn't find comment parent {parent[1]} for comment {parent[0]}")
            continue

        p.save()

    flattened_likes = []
    for liked_comment in M2MLikeC.objects.all():
        try:
            post = Post.objects.get(post_id=liked_comment.post.comment_id + reference_post_id)
        except Post.DoesNotExist:
            print(f"couldn't migrate like from user {liked_comment.user.username} for comment {liked_comment.post.comment_id}")
            continue

        flattened_likes.append(M2MLike(
            user=liked_comment.user,
            post=post
        ))

    M2MLike.objects.bulk_create(flattened_likes)

class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0061_fe_rewrite_debloat"),
    ]

    operations = [
        migrations.RemoveField("post", "comments"),
        migrations.RemoveField("post", "quotes"),

        migrations.AddField(
            model_name="post",
            name="comment_parent",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="posts.post", null=True, blank=True)
        ),

        migrations.AddField(
            model_name="post",
            name="quoted_post",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="quotes", to="posts.post", null=True, blank=True)
        ),

        migrations.RunPython(migrate_comments),
        migrations.DeleteModel("m2mlikec"),
        migrations.DeleteModel("comment"),
        migrations.RemoveField("post", "quote"),
        migrations.RemoveField("post", "quote_is_comment")
    ]
