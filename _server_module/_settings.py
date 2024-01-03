# -- NOTE --
# Only modify the other files if you know what you're doing.
# This file is meant to have settings that are easy to understand.

# Version displayed.
VERSION: str = "0.3.2"

# What to have the site name be.
# Official name wip // Trinktter? trinkr? Jerimiah Smiggins? idk...
SITE_NAME: str = "Jerimiah Smiggins"

# Whether or not to enable flask debug mode. This makes it
# so that the server restarts if you save the file.
DEBUG: bool = True

ABSOLUTE_CONTENT_PATH: str = "./public/" # Where html/css/js is served from
ABSOLUTE_SAVING_PATH: str  = "./save/"   # Where user information, posts, etc. are saved

# Whether or not to enforce the ratelimit
RATELIMIT: bool = True

# False = hide links to the github source code
SOURCE_CODE: bool = True
