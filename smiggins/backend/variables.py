# This file has variables used by the server.
# This isn't for any settings. You can ignore
# this file if you want.

from ._api_keys import auth_key
from ._settings import MAX_POST_LENGTH
from .packages  import Badge, hashlib
from django.db.utils import OperationalError

try:
    f = open("latest_scr", "r").read()
    if f != "add_comment_parent":
        print("The script 'add_comment_parent' doesn't seem to have been ran! If it has, you can ignore this message.")
    del f
except FileNotFoundError:
    print("Couldn't determine the latest ran script! Try running the most recent one in the scripts folder.")

# Headers set at the top of every html file.
HTML_HEADERS: str = f"""
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/static/css/base.css">
<link rel="icon" href="/static/img/favicon.ico" type="image/x-icon">
<script src="/static/js/linkify-4.1.3.min.js"></script>
<script src="/static/js/linkify-html-4.1.3.min.js"></script>
<script src="/static/js/linkify-mentions-4.1.3.min.js"></script>
<script src="/static/js/base.js"></script>
<script>
  const MAX_POST_LENGTH = {MAX_POST_LENGTH};
</script>
"""

# Headers set at the bottom of some html files.
HTML_FOOTERS: str = """
<script src="/static/js/base_footer.js"></script>
"""

# Used when hashing user tokens
PRIVATE_AUTHENTICATOR_KEY: str = hashlib.sha256(auth_key).hexdigest()

# Using nested dicts because indexing a dict is generally faster than
# for a list.
timeout_handler: dict[str, dict[str, None]] = {}

ROBOTS: str = """User-agent: *
Allow: *
Disallow: /settings
Disallow: /home
Disallow: /api
"""

BADGE_DATA = {}

try:
    Badge.objects.get(name="administrator")

    for i in Badge.objects.all():
        BADGE_DATA[i.name] = i.svg_data

except Badge.DoesNotExist:
    icons = {
        "verified": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M200.3 81.5C210.9 61.5 231.9 48 256 48s45.1 13.5 55.7 33.5c5.4 10.2 17.3 15.1 28.3 11.7 21.6-6.6 46.1-1.4 63.1 15.7s22.3 41.5 15.7 63.1c-3.4 11 1.5 22.9 11.7 28.2 20 10.6 33.5 31.6 33.5 55.7s-13.5 45.1-33.5 55.7c-10.2 5.4-15.1 17.2-11.7 28.2 6.6 21.6 1.4 46.1-15.7 63.1s-41.5 22.3-63.1 15.7c-11-3.4-22.9 1.5-28.2 11.7-10.6 20-31.6 33.5-55.7 33.5s-45.1-13.5-55.7-33.5c-5.4-10.2-17.2-15.1-28.2-11.7-21.6 6.6-46.1 1.4-63.1-15.7S86.6 361.6 93.2 340c3.4-11-1.5-22.9-11.7-28.2C61.5 301.1 48 280.1 48 256s13.5-45.1 33.5-55.7c10.2-5.4 15.1-17.3 11.7-28.3-6.6-21.6-1.4-46.1 15.7-63.1s41.5-22.3 63.1-15.7c11 3.4 22.9-1.5 28.2-11.7zM256 0c-35.9 0-67.8 17-88.1 43.4-33-4.3-67.6 6.2-93 31.6S39 135 43.3 168C17 188.2 0 220.1 0 256s17 67.8 43.4 88.1c-4.3 33 6.2 67.6 31.6 93s60 35.9 93 31.6c20.2 26.3 52.1 43.3 88 43.3s67.8-17 88.1-43.4c33 4.3 67.6-6.2 93-31.6s35.9-60 31.6-93c26.3-20.2 43.3-52.1 43.3-88s-17-67.8-43.4-88.1c4.3-33-6.2-67.6-31.6-93S377 39 344 43.3C323.8 17 291.9 0 256 0m113 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0z"/></svg>',
        "developer": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M80 112a32 32 0 1 0 0-64 32 32 0 1 0 0 64m80-32c0 35.8-23.5 66.1-56 76.3V192c0 22.1 17.9 40 40 40h160c22.1 0 40-17.9 40-40v-35.7c-32.5-10.2-56-40.5-56-76.3 0-44.2 35.8-80 80-80s80 35.8 80 80c0 35.8-23.5 66.1-56 76.3V192c0 48.6-39.4 88-88 88h-56v75.7c32.5 10.2 56 40.5 56 76.3 0 44.2-35.8 80-80 80s-80-35.8-80-80c0-35.8 23.5-66.1 56-76.3V280h-56c-48.6 0-88-39.4-88-88v-35.7C23.5 146.1 0 115.8 0 80 0 35.8 35.8 0 80 0s80 35.8 80 80m208 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64M256 432a32 32 0 1 0-64 0 32 32 0 1 0 64 0"/></svg>',
        "administrator": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M232 59.6v390.7C99.2 375.7 64.4 227.3 64 139.7c0-5 3.1-10.2 9-12.8zm48 390.8V59.6L439 127c5.9 2.5 9.1 7.8 9 12.8-.4 87.5-35.2 236-168 310.6M457.7 82.8 269.4 2.9C265.2 1 260.7 0 256 0s-9.2 1-13.4 2.9L54.3 82.8c-22 9.3-38.4 31-38.3 57.2.5 99.2 41.3 280.7 213.6 363.2 16.7 8 36.1 8 52.8 0C454.8 420.7 495.5 239.2 496 140c.1-26.2-16.3-47.9-38.3-57.2"/></svg>'
    }

    for i in icons:
        x = Badge.objects.create(
            name=i,
            svg_data=icons[i]
        )
        x.save()
        del x

    del icons

    for i in Badge.objects.all():
        BADGE_DATA[i.name] = i.svg_data

except OperationalError:
    print("You need to migrate your database! Do this by running 'manage.py migrate'. If you are already doing that, ignore this message.")
