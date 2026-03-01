# Made for v1.4.7, however likely works on other versions

import json
import os

import django

IMPORT_USERS = ["user-1"]
IMPORT_COMMENTS = ["user-2"]

if not os.path.exists("manage.py"):
    print("Make sure you are running this in the same folder as the manage.py file!")
    exit()

if not os.path.exists("db.sqlite3"):
    print("Make sure that the database has been created already! You can do this by running the manage.py file with the 'migrate' option (ex: `python3 manage.py migrate`)")
    exit()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smiggins.settings')
django.setup()

from posts.models import Post, User  # noqa: E402

post_data = json.load(open("posts.json"))
user_data = json.load(open("users.json"))

post_dict = {}
for i in post_data:
    post_dict[i["id"]] = i

user_dict = {}
for i in user_data:
    user_dict[i["username"]] = i

def recursive_check_parent_validity(post_id: int) -> bool:
    try:
        data = post_dict[post_id]
    except KeyError:
        return False

    if data["username"] not in (IMPORT_USERS + IMPORT_COMMENTS) or (data["username"] in IMPORT_COMMENTS and not data["comment_parent"]):
        return False

    if data["comment_parent"] and not recursive_check_parent_validity(data["comment_parent"]):
        return False

    if data["quoted_post"] and not recursive_check_parent_validity(data["quoted_post"]):
        return False

    return True

user_cache = {}
for i in IMPORT_USERS + IMPORT_COMMENTS:
    data = user_dict[i]
    print(i, data)
    try:
        u = User.objects.get(username=i)
    except User.DoesNotExist:
        User.objects.create(
            username=i,
            password_hash=data["pw_hash"],
            auth_key=data["auth_key"],
            legacy_token=data["legacy_token"],
            display_name=data["display_name"],
            bio=data["bio"],
            color=data["color_one"],
            color_two=data["color_two"],
            gradient=data["gradient"],
            pronouns=data["pronouns"],
            default_post_private=data["default_post_private"],
            verify_followers=data["verify_followers"],
        )
        u = User.objects.get(username=i)

    user_cache[i] = u

for i in post_data:
    if not recursive_check_parent_validity(i["id"]):
        continue

    comment_parent = None
    if i["comment_parent"]:
        comment_parent = Post.objects.get(
            timestamp=post_dict[i["comment_parent"]]["timestamp"],
            creator__username=post_dict[i["comment_parent"]]["username"],
            content=post_dict[i["comment_parent"]]["content"]
        )

    quoted_post = None
    if i["quoted_post"]:
        quoted_post = Post.objects.get(
            timestamp=post_dict[i["quoted_post"]]["timestamp"],
            creator__username=post_dict[i["quoted_post"]]["username"],
            content=post_dict[i["quoted_post"]]["content"]
        )

    print(i["id"])
    Post.objects.create(
        creator=user_cache[i["username"]],
        content=i["content"],
        content_warning=i["cw"],
        timestamp=i["timestamp"],
        edited=bool(i["edited"]),
        edited_at=i["edited"],
        comment_parent=comment_parent,
        quoted_post=quoted_post,
        private=i["private"]
    )
