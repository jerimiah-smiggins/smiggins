# -- NOTE --
# Only modify this file unless you
# know what you're doing.

# Version displayed.
VERSION: str = "0.3.0"

# What to have the site name be.
# Official name wip // Trinktter? trinkr? Jerimiah Smiggins? idk...
SITE_NAME: str = "Jerimiah Smiggins"

# Whether or not to enable flask debug mode. This makes it
# so that the server restarts if you save the file.
DEBUG: bool = True

ABSOLUTE_CONTENT_PATH: str = "./public/" # Where html/css/js is served from
ABSOLUTE_SAVING_PATH: str  = "./save/"   # Where user information, posts, etc. are saved
