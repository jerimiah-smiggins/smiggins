# -- NOTE --
# Only modify the other files if you know what you're doing.
# This file is meant to have settings that are easy to understand.

# -- General Site Configuration --

# Version displayed.
VERSION: str = "0.10.0"

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

# The default language for any new user. Choose from one of the files in the
# lang/ folder, omitting the .json file extension.
DEFAULT_LANGUAGE: str = "en-US"

# Whether or not to cache languages. If this is on, then more ram will be used
# to store them, however in the long run it will take a bit less CPU usage and
# disk usage. If you are testing/creating a language, turn this OFF to make the
# language refresh automatically.
CACHE_LANGUAGES: bool = True

# Whether or not to legally allow other services to scrape your website. This
# does NOT affect indexing for search engines. This is done by setting the
# TDM-Reservation header to 0 if allowed, 1 if disallowed.
# Read more here: https://www.w3.org/community/reports/tdmrep/CG-FINAL-tdmrep-20240202/
ALLOW_SCRAPING: bool = False

# -- Frontend Configuration --

# 1-200
MAX_USERNAME_LENGTH: int = 18
MAX_DISPL_NAME_LENGTH: int = 32

# 1-65,536
MAX_POST_LENGTH: int = 280
MAX_BIO_LENGTH: int = 280

# 1+
MAX_POLL_OPTION_LENGTH: int = 64

# 2+
MAX_POLL_OPTIONS: int = 8 # Doesn't change existing polls

DEFAULT_BANNER_COLOR: str = "#3a1e93"

# This controls how many posts can be sent at a time from the
# server to the client. Increasing the number can increase bandwidth
# and cpu usage however it will likely improve the user experience
POSTS_PER_REQUEST: int = 20

# This controls how many messages are sent at a time when loading them.
MESSAGES_PER_REQUEST: int = POSTS_PER_REQUEST * 2

# The maximum number of notifications to be stored per user. Whenever
# this limit is exceeded, it will remove the oldest notifications for
# that user.
MAX_NOTIFICATIONS: int = 100

# Contact information. Can be email, url, or text
CONTACT_INFO: list[list[str]] = [
    ["email", "trinkey@duck.com"],
    ["url",   "https://github.com/trinkey/social-media-thing/issues"],
    ["url",   "https://discord.gg/tH7QnHApwu"],
    ["text",  "DM me on discord (@trinkey_)"]
]

# Automatically sends a request to the specified webhook when a user posts a
# post (comments aren't included). Format below. Type should be either "raw"
# (sends the data with a POST request with the data in the "content" json
# parameter) or "discord" (sends the data in a discord style embed). Webhooks
# may be subject to ratelimits by external servers depending on frequency
POST_WEBHOOKS: dict[str, list[str]] = {
#   "username": ["https://example.com/webhook", "type"]
}

# -- Feature Toggles --

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

# Changing any of the following settings won't modify any existing
# values in the database, instead ignoring them to meet the preferred
# setting. This means if you enable one in the future, anything set
# before it was disabled will persist.

ENABLE_USER_BIOS: bool = True
ENABLE_PRONOUNS: bool = True
ENABLE_GRADIENT_BANNERS: bool = True
ENABLE_PRIVATE_MESSAGES: bool = True
ENABLE_POST_DELETION: bool = True
ENABLE_HASHTAGS: bool = True
ENABLE_CHANGELOG_PAGE: bool = True
ENABLE_CONTACT_PAGE: bool = True
ENABLE_PINNED_POSTS: bool = True
ENABLE_ACCOUNT_SWITCHER: bool = True

# The private account icon is always shown
ENABLE_BADGES: bool = True

# Existing quotes will remain unchanged
ENABLE_QUOTES: bool = True

# Existing polls will remain unchanged
ENABLE_POLLS: bool = True

# If off, people who are logged out won't be able to see any user profiles,
# posts, or comments. This also affects causes embeds for sites like discord to
# not work.
ENABLE_LOGGED_OUT_CONTENT: bool = True

# If off, there will be an indication on the signup and index pages
# that says the instance isn't accepting any new members
ENABLE_NEW_ACCOUNTS: bool = False # TODO
