# DOES NOT EXPORT POSTS WITH POLLS!
# Made for v1.4.7, however likely works on other versions

import json
import os

import django

if not os.path.exists("manage.py"):
    print("Make sure you are running this in the same folder as the manage.py file!")
    exit()

if not os.path.exists("db.sqlite3"):
    print("Make sure that the database has been created already! You can do this by running the manage.py file with the 'migrate' option (ex: `python3 manage.py migrate`)")
    exit()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smiggins.settings')
django.setup()

from posts.models import Post, User  # noqa: E402

post_data = Post.objects.filter(poll=None).values_list("creator__username", "content", "content_warning", "timestamp", "edited", "edited_at", "comment_parent", "post_id", "quoted_post", "private")
user_data = User.objects.values_list("username", "password_hash", "auth_key", "legacy_token", "display_name", "bio", "color", "color_two", "gradient", "pronouns", "default_post_private", "verify_followers")

f = open("posts.json", "w")
json.dump(list(map(lambda a: {
    "username": a[0],
    "content": a[1],
    "cw": a[2],
    "timestamp": a[3],
    "edited": a[5] if a[4] else None,
    "comment_parent": a[6],
    "quoted_post": a[8],
    "id": a[7],
    "private": a[9]
}, post_data)), f)
f.close()

f = open("users.json", "w")
json.dump(list(map(lambda a: {
    "username": a[0],
    "pw_hash": a[1],
    "auth_key": a[2],
    "legacy_token": a[3],
    "display_name": a[4],
    "bio": a[5],
    "color_one": a[6],
    "color_two": a[7],
    "gradient": a[8],
    "pronouns": a[9],
    "default_post_private": a[10],
    "verify_followers": a[11]
}, user_data)), f)
f.close()
