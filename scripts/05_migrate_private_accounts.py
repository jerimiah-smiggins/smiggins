# Used when upgrading from v0.11.0 or below to v0.11.1+

import django
import os

if not os.path.exists("manage.py"):
    print("Make sure you are running this in the same folder as the manage.py file!")
    exit()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smiggins.settings')
django.setup()

from posts.models import User, Post, Comment # noqa: E402 # type: ignore

for user in User.objects.filter(private=True).all():
    for post_id in user.posts:
        try:
            post = Post.objects.get(post_id=post_id)
            post.private_post = True
            post.save()

        except Post.DoesNotExist:
            ...

    for comment_id in user.comments:
        try:
            comment = Comment.objects.get(comment_id=comment_id)
            comment.private_comment = True
            comment.save()

        except Comment.DoesNotExist:
            ...
