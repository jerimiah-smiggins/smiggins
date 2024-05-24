# Used when upgrading from v0.3.8 to v0.4.0
# Run this file in the folder with the manage.py file

import os
import json
import django

if not os.path.exists("manage.py"):
    print("Make sure you are running this in the same folder as the manage.py file!")
    exit()

if not os.path.exists("db.sqlite3"):
    print("Make sure that the database has been created already! You can do this by running the manage.py file with the 'migrate' option (ex: `python3 manage.py migrate`)")
    exit()

print("By continuing, the current database will be completely cleared and all the old files from the save folder will be moved into the new database.")
x = input("Continue? y/N\n>>> ")
if x[:1:].lower() != "y":
    exit()

save_folder = input("Please enter the path to the old save folder (default: `../save`)\n>>> ") or "../save"
if not os.path.isdir(save_folder):
    print(f"Invalid path `{save_folder}`!")
    exit()

if save_folder[-1] == "/":
    save_folder = save_folder[:-1:]

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smiggins.settings')
django.setup()

from posts.models import User, Post, Comment # noqa: E402 # type: ignore

User.objects.all().delete()
Post.objects.all().delete()
Comment.objects.all().delete()

users = {}

for i in os.listdir(f"{save_folder}/users"):
    token = open(f"{save_folder}/users/{i}/token.txt", "r").read()
    user_json = json.loads(open(f"{save_folder}/users/{i}/settings.json", "r").read())
    posts = json.loads(open(f"{save_folder}/users/{i}/posts.json", "r").read())

    users[i] = User.objects.create(
        user_id=int(i),
        username=user_json["username"],
        token=token,
        display_name=user_json["display_name"],
        theme=user_json["theme"],
        color=user_json["color"] if "color" in user_json else "#3a1e93",
        private=user_json["private"] if "private" in user_json else False,
        following=user_json["following"],
        posts=posts,
        followers=[]
    )

for user in users:
    for follow in users[user].following:
        users[str(follow)].followers.append(int(user))

for user in users.values():
    user.save()

del users
posts = {}

for i in os.listdir(f"{save_folder}/posts"):
    if os.path.isdir(f"{save_folder}/posts/{i}"):
        continue

    i = i.split(".")[0]

    post_info = json.loads(open(f"{save_folder}/posts/{i}.json", "r").read())

    posts[i] = Post.objects.create(
        post_id=int(i),
        content=post_info["content"],
        creator=post_info["creator"]["id"],
        timestamp=post_info["timestamp"],
        likes=post_info["interactions"]["likes"] if "interactions" in post_info else [],
        comments=post_info["interactions"]["comments"] if "interactions" in post_info else [],
        reposts=[]
    )

for post in posts.values():
    post.save()

del posts
comments = {}

for i in os.listdir(f"{save_folder}/posts/comments"):
    i = i.split(".")[0]

    comment_info = json.loads(open(f"{save_folder}/posts/comments/{i}.json", "r").read())

    comments[i] = Comment.objects.create(
        comment_id=int(i),
        content=comment_info["content"],
        creator=comment_info["creator"]["id"],
        timestamp=comment_info["timestamp"],
        likes=comment_info["interactions"]["likes"] if "interactions" in post_info else [],
        comments=comment_info["interactions"]["comments"] if "interactions" in post_info else [],
        reposts=[]
    )

for comment in comments.values():
    comment.save()

del comment

print("Database successfully migrated..")

x = input("Would you like to delete the old save folder? (irreversible!) y/N\n>>> ")
if x[:1:].lower() == "y":
    import shutil
    shutil.rmtree(save_folder)
