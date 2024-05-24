# Used when upgrading from v0.5.1 to any future version
# Run this file in the folder with the manage.py file

import django
import os

if not os.path.exists("manage.py"):
    print("Make sure you are running this in the same folder as the manage.py file!")
    exit()

if not os.path.exists("db.sqlite3"):
    print("Make sure that the database has been created already! You can do this by running the manage.py file with the 'migrate' option (ex: `python3 manage.py migrate`)")
    exit()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smiggins.settings')
django.setup()

from posts.models import User, Post, Comment # noqa: E402 # type: ignore

for user in User.objects.all():
    user.likes = []
    user.save()

ALL_POSTS = Post.objects.all()
for post in ALL_POSTS:
    post_id = post.post_id
    parent_object = Post.objects.get(post_id=post_id)
    invalid_comments = []

    x = [i for i in parent_object.likes or []]
    for like in x:
        try:
            user = User.objects.get(user_id=like)
            user.likes.append([post_id, False])
            user.save()
        except User.DoesNotExist:
            parent_object.likes.remove(like)

    for comment in (parent_object.comments or []):
        try:
            comment_object = Comment.objects.get(comment_id=comment)
            comment_object.parent = post_id
            comment_object.parent_is_comment = False
            comment_object.save()

        except Comment.DoesNotExist:
            invalid_comments.append(comment)

    for comment in invalid_comments:
        try:
            parent_object.comments.remove(comment) # type: ignore
        except ValueError:
            pass

    parent_object.save()

ALL_COMMENTS = Comment.objects.all()
for comment in ALL_COMMENTS:
    comment_id = comment.comment_id
    parent_object = Comment.objects.get(comment_id=comment_id)
    invalid_comments = []

    x = [i for i in parent_object.likes or []]
    for like in x:
        try:
            user = User.objects.get(user_id=like)
            user.likes.append([comment_id, True])
            user.save()
        except User.DoesNotExist:
            parent_object.likes.remove(like)

    try:
        creator = User.objects.get(user_id=comment.creator)
        if comment_id not in creator.comments:
            creator.comments.append(comment_id)
            creator.save()
    except User.DoesNotExist:
        pass

    for subcomment in (comment.comments or []):
        try:
            comment_object = Comment.objects.get(comment_id=subcomment)
            comment_object.parent = comment_id
            comment_object.parent_is_comment = True
            comment_object.save()

        except Comment.DoesNotExist:
            invalid_comments.append(subcomment)

    for subcomment in invalid_comments:
        try:
            parent_object.comments.remove(subcomment) # type: ignore
        except ValueError:
            pass

    parent_object.save()
