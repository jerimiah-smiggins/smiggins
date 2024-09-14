# Used when upgrading from v0.11.0 or below to v0.11.1+

import os

import django

if not os.path.exists("manage.py"):
    print("Make sure you are running this in the same folder as the manage.py file!")
    exit()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smiggins.settings')
django.setup()

from posts.models import Comment, Post, User  # noqa: E402 # type: ignore

for user in User.objects.all():
    private = user.default_post_private

    for post_id in user.posts:
        try:
            post = Post.objects.get(post_id=post_id)

            if post.private_post is not None:
                continue

            print(f"Marking post {post_id} as {'private' if private else 'public'}")

            post.private_post = private
            post.save()

        except Post.DoesNotExist:
            ...

    for comment_id in user.comments:
        try:
            comment = Comment.objects.get(comment_id=comment_id)

            if comment.private_comment is not None:
                continue

            print(f"Marking comment {comment_id} as {'private' if private else 'public'}")

            comment.private_comment = private
            comment.save()

        except Comment.DoesNotExist:
            ...
