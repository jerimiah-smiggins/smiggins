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

from posts.models import Post, Comment

ALL_POSTS = Post.objects.all()
ALL_COMMENTS = Comment.objects.all()

for post in ALL_POSTS:
    post_id = post.post_id
    invalid_comments = []

    for comment in post.comments:
        try:
            comment_object = Comment.objects.get(comment_id=comment)
            comment_object.parent = post_id
            comment_object.parent_is_comment = False
            comment_object.save()

        except Comment.DoesNotExist:
            invalid_comments.append(comment)

    for comment in invalid_comments:
        try:
            post.comments.remove(comment)
        except ValueError:
            pass

    post.save()

for comment in ALL_COMMENTS:
    comment_id = comment.comment_id
    invalid_comments = []

    for subcomment in comment.comments:
        try:
            comment_object = Comment.objects.get(comment_id=subcomment)
            comment_object.parent = comment_id
            comment_object.parent_is_comment = True
            comment_object.save()

        except Comment.DoesNotExist:
            invalid_comments.append(comment)

    for comment in invalid_comments:
        try:
            comment.comments.remove(comment)
        except ValueError:
            pass

    comment.save()

f = open("lastest_scr", "w")
f.write("add_comment_parent")
f.close()
