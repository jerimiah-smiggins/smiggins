# -- NOTE --
# Only modify the other files if you know what you're doing.
# This file is meant to have settings that are easy to understand.

# Version displayed.
VERSION: str = "0.6.8"

# What to have the site name be.
SITE_NAME: str = "Jerimiah Smiggins"

# The user id of the instance owner. Can be found on the /django-admin page
OWNER_USER_ID: int = 1

# TURN THIS OFF for production servers!!!
# Whether or not to refresh the server when code changes
# Turning this off (and going into production) means you need a web server like
# Nginx or Apache to serve static files securely among other things
DEBUG: bool = True

# The path of the admin log file. Set to `None` to not log any admin activity
ADMIN_LOG_PATH: str = "./admin.log"

# The maximum of lines of logs to store in the admin file at once. Minimum one
MAX_ADMIN_LOG_LINES: int = 1000

# 1-200
MAX_USERNAME_LENGTH: int = 18
MAX_DISPL_NAME_LENGTH: int = 32

# 1-65,536
MAX_POST_LENGTH: int = 280
MAX_BIO_LENGTH: int = 280

DEFAULT_BANNER_COLOR: str = "#3a1e93"

# False = hide links to the github source code
SOURCE_CODE: bool = True

# Whether or not to enforce the ratelimit
RATELIMIT: bool = True

# DON'T CHANGE THE FIRST STRING
# timings are all in ms, where 1000ms = 1 second
# if RATELIMIT is false, this is ignored
API_TIMINGS: dict[str, int] = {
    "signup unsuccessful": 1000,
    "signup successful": 15000,
    "login unsuccessful": 1000,
    "login successful": 5000,
    "create comment": 3000,
    "create comment failure": 1000,
    "create post": 3000,
    "create post failure": 1000,
}

# This controls how many posts can be sent at a time from the
# server to the client. Increasing the number can increase bandwidth
# and cpu usage however it will likely improve the user experience
POSTS_PER_REQUEST: int = 20

# The maximum number of notifications to be stored per user. Whenever
# this limit is exceeded, it will remove the oldest notifications for
# that user.
MAX_NOTIFICATIONS: int = 2

# Contact information. Can be email, url, or text
CONTACT_INFO: list[list[str]] = [
    ["email", "trinkey@duck.com"],
    ["url",   "https://github.com/trinkey/social-media-thing/issues"],
    ["url",   "https://discord.gg/tH7QnHApwu"],
    ["text",  "DM me on discord (@trinkey_)"]
]

# Content of the robots.txt file
ROBOTS: str = """User-agent: *
Allow: *
Disallow: /settings
Disallow: /home
Disallow: /api
"""
