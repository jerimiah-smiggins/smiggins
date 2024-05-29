# Used when upgrading from <=v0.8.3 to >=v0.8.4
# Adds hashtags to any old post that has hashtags
# that was created before hashtags were added. Also
# verified the integrity of hashtags if something breaks.
# Run this in the folder with the manage.py file in it.

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

from posts.models import Hashtag, Post # noqa: E402 # type: ignore
from backend.helper import find_hashtags # noqa: E402 # type: ignore

Hashtag.objects.all().delete()
all_posts = Post.objects.all()

for post in all_posts:
    for tag in find_hashtags(post.content):
        try:
            tag_object = Hashtag.objects.get(tag=tag)
            tag_object.posts.append(post.post_id)
            tag_object.save()

        except Hashtag.DoesNotExist:
            Hashtag.objects.create(
                tag=tag,
                posts=[
                    post.post_id
                ]
            )
