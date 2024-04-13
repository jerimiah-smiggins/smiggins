# -- NOTE --
# Only modify the other files if you know what you're doing.
# This file is meant to have settings that are easy to understand.

# Version displayed.
VERSION: str = "0.4.3"

# What to have the site name be.
SITE_NAME: str = "Jerimiah Smiggins"

# TURN THIS OFF for development servers!!!
# Whether or not to refresh the server when code changes
DEBUG = True

# 1-200
MAX_USERNAME_LENGTH: int = 18
MAX_DISPL_NAME_LENGTH: int = 32

# 1-65,536
MAX_POST_LENGTH: int = 280

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

# Contact information. Can be email, url, or text
CONTACT_INFO = [
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
