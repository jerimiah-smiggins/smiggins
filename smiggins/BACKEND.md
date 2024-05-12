# Backend Docs
Docs for the backend. This contains descriptions of every function defined in
any of the files in the backend.

## ./manage.py
This file is auto-created when making a django project. To see what this file
does, you can read the django docs or run the file like you would a normal
python file (`python3 manage.py`). The most useful commands are:
- `python3 manage.py runserver` - Starts a web server locally for you to test
  your code
- `python3 manage.py migrate` - Migrates the database from one version to
  another. If you make changes to the models, you will need to run the next
  command.
- `python3 manage.py makemigrations` - Takes any changes to the models and turns
  them into files in the migrations folder that can be used to upgrade the data
  in the database.
- `python3 manage.py addsuperuser` - Adds a username/password that can be used
  to access the `/django-admin` page. This is stored in the database, so if you
  ever reset that, you will need to re-add any of these you have added.
- `python3 manage.py collectstatic` - Collects any static files into another
  folder. This should be used when creating a production server, and shouldn't
  ever need to be used in normal debugging.

## ./backend/_api_keys.py
This file holds any information that shouldn't be public. Currently, the only
thing this is being used for is the extra string that is added to hashed
passwords in order to make them harder to crack.

```py
auth_key: bytes
```
This is the string that is added to password hashes to make them harder to
reverse engineer.

## ./backend/_settings.py
This file is for any settings that the server runner should be able to change.
This shouldn't be anything that is overridden by the server when it is ran, nor
should it contain variables that are meant to just exist as a global and aren't
meant to be configured. Everything in the file is commented and should be easy
enough to understand.

```py
VERSION: str
```
The version that's displayed on the frontend.

```py
SITE_NAME: str
```
The name of the site that is displayed on the frontend.

```py
OWNER_USER_ID: int
```
The user id of the instance owner. Defaults to one. This can be found on the
`/django-admin` page, assuming you have a superuser account (see `./manage.py`)

```py
DEBUG: bool
```
Whether or not to automatically reload the server when the backend files change.
This should be `False` on development servers.

```py
ADMIN_LOG_PATH: str
```
The path of the admin log file. Set to `None` to not log any admin activity

```py
MAX_ADMIN_LOG_LINES: int
```
The maximum of lines of logs to store in the admin file at once. Minimum is one

```py
MAX_USERNAME_LENGTH: int
```
The maximum length for a username. Must be between 1 and 200.

```py
MAX_DISPL_NAME_LENGTH: int
```
The maximum length for a display name. Must be between 1 and 200.

```py
MAX_POST_LENGTH: int
```
The maximum length for a post. Must be between 1 and 65,536

```py
MAX_BIO_LENGTH: int
```
The maximum length for a user bio. Must be between 1 and 65,536

```py
DEFAULT_BANNER_COLOR; str
```
The default color for banners. This should be a hex code with the format
`#XXXXXX` where an X is a number 0-9 or a letter a-f, case insensitive.

```py
POSTS_PER_REQUEST: int
```
The amount of posts to send at a time when the client requests the list. A
larger number would result in more CPU usage and bandwidth, however may
positively affect the user experience.

```py
MESSAGES_PER_REQUEST: int
```
The maximum amount of private messages to send per request.

```py
MAX_NOTIFICATIONS: int
```
The maximum notifications to store for a single user at a time. Whenever this
number is exceeded, it will remove the oldest notifications for that user until
the amount of notifications goes below the threshold.

```py
CONTACT_INFO: list[list[str]]
```
A list containing contact information that would be put on the contact page.
It is a list of lists, where the inside list has two strings. The first string
is the type, which can be `email`, `url`, or `text`. `email` is for emails,
`url` for links, and `text` for other text that wouldn't fit with either of the
other options.

```py
SOURCE_CODE: bool
```
Whether or not to include links to the github page.

```py
RATELIMIT: bool
```
Whether or not to enforce the rate limits.

```py
API_TIMINGS: dict[str, int]
```
The timing amounts (in ms) for ratelimits. Required keys:
- `signup unsuccessful`
- `signup successful`
- `login unsuccessful`
- `login successful`
- `create comment`
- `create comment failure`
- `create post`
- `create post failure`

```py
ENABLE_USER_BIOS: bool
```
Whether or not to enable user bios. If this gets disabled, any previously set
bios will not be deleted and show up again if this is reenabled. (This applies
to the next few settings up to `ENABLE_QUOTES`)

```py
ENABLE_PRONOUNS: bool
```
Whether or not to enable pronouns.

```py
ENABLE_GRADIENT_BANNERS: bool
```
Whether or not to enable gradient banners.

```py
ENABLE_BADGES: bool
```
Whether or not to enable badges. When disabled, this basically makes admin level
three useless. Private account icons will still show up.

```py
ENABLE_PRIVATE_MESSAGES: bool
```
Whether or not to enable private messages.

```py
ENABLE_QUOTES: bool
```
Whether or not to allow quoting posts. If this gets disabled, any already quotes
that already exist will stay and still show up normally.

```py
ENABLE_POST_DELETION: bool
```
Whether or not to allow deleting posts. This applies to BOTH admins AND normal
users.

## ./backend/api_admin.py
This file contains all admin-related functions.

```py
class AccountIdentifier(Schema)
```
The schema for identifying accounts.

```py
class DeleteBadge(Schema)
```
The schema for badge deletion

```py
class NewBadge(DeleteBadge)
```
The schema for creating a badge

```py
class UserBadge(AccountIdentifier)
```
The schema for modifying the badges of a user

```py
class SaveUser(Schema)
```
The schema for saving the user info

```py
class UserLevel(AccountIdentifier)
```
The schema for setting the admin level of a user

```py
def user_delete(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: AccountIdentifier
) -> tuple | dict
```
Handles deleting a user (level 2+). Called from a DELETE request to
`/api/admin/user`

```py
def badge_create(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: NewBadge
) -> tuple | dict
```
Handles creating a new badge (level 3+). Called from a PUT request to
`/api/admin/badge`

```py
def badge_delete(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: NewBadge
) -> tuple | dict
```
Handles deleting a badge (level 3+). Called from a PATCH request to
`/api/admin/badge`

```py
def badge_add(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: NewBadge
) -> tuple | dict
```
Handles adding a badge to a user (level 3+). Called from a POST request to
`/api/admin/badge`

```py
def badge_remove(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: NewBadge
) -> tuple | dict
```
Handles removing a badge from a user (level 3+). Called from a PATCH request to
`/api/admin/badge`

```py
def account_info(
  request: django.core.handlers.wsgi.WSGIRequest,
  identifier: int | str,
  use_id: bool
) -> tuple | dict
```
Returns information about an account (level 4+). Called from a GET request to
`/api/admin/info`

```py
def set_level(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: UserLevel
) -> tuple | dict
```
Sets the admin level for the specified user (level 5+). Called from a PATCH
request to `/api/admin/level`

```py
def logs(
  request: django.core.handlers.wsgi.WSGIRequest
) -> tuple | dict
```
Returns the admin logs (level 4+). Called from a GET request to
`/api/admin/logs`

## ./backend/api_comment.py
This file contains functions for any api calls to comment-related things, like
creating them, getting a list of comments, or adding/removing a like from a
comment.

```py
class NewComment(Schema)
```
The schema for creating a new comment

```py
class CommentID(Schema)
```
The schema that contains just a comment id

```py
def comment_create(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: NewComment
) -> tuple | dict
```
Handles comment creation. Called from a PUT request to `/api/comment/create`.

```py
def comment_list(
  request: django.core.handlers.wsgi.WSGIRequest,
  id: int,
  comment: bool,
  offset: int = -1
) -> tuple | dict
```
Lists the comments on a post, up to `POSTS_PER_REQUESTS` comments at once.
Called from a GET request to `/api/comments`.

```py
def comment_like_add(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: CommentID
) -> tuple | dict
```
Handles adding a like to a comment. Called to a POST request to
`/api/comment/like`.

```py
def comment_like_remove(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: CommentID
) -> tuple | dict
```
Handles removing a like from a comment. Called to a DELETE request to
`/api/comment/like`.

```py
def comment_delete(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: CommentID
) -> tuple[int | dict] | dict
```
Handles deleting comments. Called from a DELETE request to `/api/comment`

## ./backend/api_info.py
This file is for any api calls that retrieve information for the client, for
example getting a username from their token.

```py
def username(
  request: django.core.handlers.wsgi.WSGIRequest
) -> tuple | dict
```
Returns the username of the user from the token cookie. Called from a GET
request to `/api/info/username`.

```py
def notifications(
  request: django.core.handlers.wsgi.WSGIRequest
) -> tuple | dict
```
Returns whether or not you have unread notifications and private messages.
Called from a GET request to `/api/info/notifications`.

## ./backend/api_messages.py
For api functions related to private messages.

```py
class NewContainer(Schema)
```
The schema for creating a new message container between yourself and another
user

```py
class NewMessage(Schema)
```
The schema for sending a message to someone

```py
def container_create(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: NewContainer
) -> tuple | dict
```
Creates a new message container between yourself and another user. Called from a
POST request to `/api/messages/new`.

```py
def send_message(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: NewMessage
) -> tuple | dict
```
Creates a new message object between yourself and the specified user. Called
from a POST request to `/api/messages`.

```py
def messages_list(
  request: django.core.handlers.wsgi.WSGIRequest,
  username: str,
  forward: bool = True,
  offset: int = -1
) -> tuple | dict
```
Returns a list of the messages between yourself and the specified user. It isn't
easy to explain how it works, but it does, and that's all that matters. Called
from a GET request to `/api/messages/list`.

```py
def recent_messages(
  request: django.core.handlers.wsgi.WSGIRequest,
  offset: int = -1
) -> tuple | dict
```
Returns the list of the most recent messages between yourself and others. Offset
is essentially what page you're looking for. Called from a GET request to
`/api/messages`.

## ./backend/api_post.py
This file is for anything related to posts, including liking, creating, and
getting lists of posts. Comment related things should go in
`./backend/api_comment.py`.

```py
class NewPost(Schema)
```
The schema for creating a new post

```py
class NewQuote(NewPost)
```
The schema for creating a new quote

```py
class PostID(Schema)
```
The schema that contains just a post ID

```py
def post_create(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: NewPost
) -> tuple | dict
```
This handles creating a post. Called from a PUT request to `/api/post/create`.

```py
def quote_create(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: NewQuote
) -> tuple | dict
```
This handles creating a post. Called from a PUT request to `/api/quote/create`.

```py
def post_list_following(
  request: django.core.handlers.wsgi.WSGIRequest,
  offset: int = -1
) -> tuple | dict
```
This gets a list of recent posts for the following timeline. Called from a GET
request to `/api/post/following`.

```py
def post_list_recent(
  request: django.core.handlers.wsgi.WSGIRequest,
  offset: int = -1
) -> tuple | dict
```
This gets a list of recent posts for the recent timeline. Called from a GET
request to `/api/post/recent`.

```py
def post_list_user(
  request: django.core.handlers.wsgi.WSGIRequest,
  username: str,
  offset: int = -1
) -> tuple | dict
```
This gets a list of recent posts for a specific user with a username of
`username`. Called from a GET request to `/api/post/user/{str: username}`.

```py
def post_like_add(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: PostID
) -> tuple | dict
```
Handles adding a like to a post. Called from a POST request to `/api/post/like`.

```py
def post_like_remove(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: PostID
) -> tuple | dict
```
Handles removing a like from a post. Called from a DELETE request to
`/api/post/like`.

```py
def post_delete(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: PostID
) -> tuple[int | dict] | dict
```
Handles deleting comments. Called from a DELETE request to `/api/post`

```py
def pin_post(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: postID
) -> tuple | int
```
Handles pinning a post. Called from a PATCH request to `/api/user/pin`

```py
def unpin_post(
  request: django.core.handlers.wsgi.WSGIRequest
) -> tuple | int
```
Handles unpinning a post. Called from a DELETE request to `/api/user/pin`

## ./backend/api_user.py
This file is for api functions that are related to user profiles and account
management. This doesn't include any post-related things, as those would go into
`./backend/api_post.py`.

```py
class Username(Schema)
```
The schema that contains just a username

```py
class Account(Username)
```
The schema that has both a username and a password

```py
class ChangePassword(Schema)
```
The schema used for changing passwords

```py
class Theme(Schema)
```
The schema for changing themes

```py
class Settings(Schema)
```
The schema that contains all of the settings

```py
def signup(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: Account
) -> tuple | dict
```
This handles creating a new user on when signing up. Called on a POST request to
`/api/user/signup`.

```py
def login(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: Account
) -> tuple | dict
```
This handles sending auth information when logging in. Called on a POST request
to `/api/user/login`.

```py
def settings_theme(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: Theme
) -> tuple | dict
```
This handles changing the theme setting. Called on a POST request to
`/api/user/settings/theme`.

```py
def settings(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: Settings
) -> tuple | dict
```
This handles changing and saving (almost) all of the settings in the settings
page. Called on a PATCH request to `/api/user/settings/text`.

```py
def follower_add(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: Username
) -> tuple | dict
```
This handles following someone. Called on a POST request to
`/api/user/follower`.

```py
def follower_remove(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: Username
) -> tuple | dict
```
This handles unfollowing someone. Called on a DELETE request to
`/api/user/follower`.

```py
def block_add(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: Username
) -> tuple | dict
```
This handles blocking someone. Called on a POST request to
`/api/user/block`.

```py
def block_remove(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: Username
) -> tuple | dict
```
This handles unblocking someone. Called on a DELETE request to
`/api/user/block`.

```py
def change_password(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: ChangePassword
) -> tuple | dict
```
This handles changing your password. Called on a PATCH request to
`/api/user/password`

```py
def read_notifs(
  request: django.core.handlers.wsgi.WSGIRequest
) -> tuple | dict
```
This marks all of your notifications as read. Called on a DELETE request to
`/api/user/notifications`.

```py
def notifications_list(
  request: django.core.handlers.wsgi.WSGIRequest
) -> tuple | dict
```
This returns a list of all of your notifications. Called on a GET request to
`/api/user/notifications`.

## ./backend/collect_api.py
This file collects all of the api functions and turns them into sorted classes.

```py
class ApiAdmin
```
All the api functions from `./backend/api_admin.py`

```py
class ApiComment
```
All the api functions from `./backend/api_comment.py`

```py
class ApiInfo
```
All the api functions from `./backend/api_info.py`

```py
class ApiPost
```
All the api functions from `./backend/api_post.py`

```py
class ApiUser
```
All the api functions from `./backend/api_user.py`

## ./backend/helper.py
This is for any helper function that could be used across the backend. This is
for utility functions, things that make an action easier, and other stuff like
that.

```py
def sha(
  string: str | bytes
) -> str
```
Returns the sha256 hash of the byte array/string.

```py
def set_timeout(
  callback: Callable,
  delay_ms: int | float
) -> NoReturn
```
A recreation of JavaScript's `setTimeout()` function. Runs the function
`callable` after `delay_ms` milliseconds have passed. This runs on a separate
thread so it shouldn't affect any code that's running at the same time.

```py
def get_HTTP_response(
  request: django.core.handlers.wsgi.WSGIRequest,
  file: str,
  **kwargs: Any
) -> django.http.HttpResponse
```
Returns an http response object that returns the formatted template `file`. Any
values in `kwargs` will be template keys that will be used when rendering the
template.

```py
def create_simple_return(
  template_path: str,
  redirect_logged_out: bool=False,
  redirect_logged_in: bool=False,
  content_type: str="text/html",
  content_override: str | None=None
) -> Callable[Any, HttpResponse | HttpResponseRedirect]
```
Returns a simple lambda function that, when called, acts like a normal request
function. Normally, it will render and return the file at `template_path`.
However, if `redirect_logged_out` or `redirect_logged_in` are true, it may
return a redirect object. If `redirect_logged_out` is true and the user who
made the request is not logged in, then it will return a redirect object to the
index page of the site. If `redirect_logged_in` is true, then it will return a
response object that redirects to the home page. If `content_override` has
content, then it will override any template that would normally be rendered and
instead return a response object with the content being the literal value of
`content_override` with no templating done to it, and with the content type of
`content_type`. `content_type` is otherwise ignored.

```py
def validate_token(
  token: str
) -> bool
```
Returns `True` if a token is valid and `False` if it isn't.

```py
def generate_token(
  username: str,
  password: str
) -> str
```
Returns the token associated with a specific username and password hash.

```py
def validate_username(
  username: str,
  existing: bool = False
) -> int
```
Makes sure a specific username is valid. If `existing` is true, it checks if all
the characters in the username are valid, and if they are it will check if the
username exists, and if it does, returns `1`, and `0` if it doesn't. If
`existing` is false, however, it does the same checks as above, returning `-1`
instead of `1`, and instead of instantly returning `0` if the username doesn't
exist, it checks to make sure the username has the correct amount of characters,
between 1 and `MAX_USERNAME_LENGTH`.

```py
def create_api_ratelimit(
  api_id: str,
  time_ms: int | float,
  identifier: str | None
) -> NoReturn
```
Starts a ratelimit timing for the api id `api_id`, which is often just the name
of the function that calls this. The `identifier` is a further identification,
usually the user's IP address or token. The `time_ms` is how long the ratelimit
should last.

```py
def ensure_ratelimit(
  api_id: str,
  identifier: str | None
) -> bool
```
This checks to see if a certain `identifier` for the specified `api_id` is
currently being ratelimited. `True` means that there is no ratelimit, and
`False` means that it is being ratelimited.

```py
def get_badges(
  user: posts.models.User
) -> list[str]
```
Returns a list of badges for the specified user object.

```py
def get_post_json(
  post_id: int,
  current_user_id: int = 0,
  comment: bool = False
) -> dict[str, Any]
```
Returns the post information in a JSON format for the specified post id.
`current_user_id` is used for validating private accounts, and `comment`
determines if it should be treated as a comment or a post.

```py
def trim_whitespace(
  string: str,
  purge_newlines: bool = False
) -> str
```
Trims whitespace and replaces invisible characters with normal spaces. Used when
creating posts of any kind, or when changing display names. If `purge_newlines`
is true, then all newlines will be replaced with spaces.

```py
def log_admin_action(
    action_name: str,
    admin_user_object: posts.models.User,
    log_info: str
) -> NoReturn
```
Logs an administrative action.

```py
def find_mentions(
  message: str,
  exclude_users: list[str] = []
) -> str
```
Returns a list of users mentioned in the string `message`, excluding any of the
users listed in `exclude_users`. For example, the string `"hi @trinkey"` would
return `["trinkey"]`, assuming `"trinkey"` isn't in `exclude_users`.

```py
def create_notification(
    is_for: User,
    event_type: str,
    event_id: int
) -> NoReturn
```
Creates a new Notification object using the specified parameters.

## ./backend/packages.py
This file is just for importing packages and libraries to be used across the
program. That's all this file is used for.

## ./backend/templating.py
This is for creating request objects that need templating beyond what
`create_simple_return` can do.

```py
def settings(
  request: django.core.handlers.wsgi.WSGIRequest
) -> HttpResponse
```
For the `/settings` page

```py
def user(
  request: django.core.handlers.wsgi.WSGIRequest,
  username: str
) -> HttpResponse
```
For `/u/...` pages

```py
def user_lists(
  request: django.core.handlers.wsgi.WSGIRequest,
  username: str
) -> HttpResponse
```
For `/u/.../lists` pages

```py
def post(
  request: django.core.handlers.wsgi.WSGIRequest,
  post_id: int
) -> HttpResponse
```
For `/p/...` pages

```py
def comment(
  request: django.core.handlers.wsgi.WSGIRequest
  comment_id: str
) -> HttpResponse
```
For `/c/...` pages

```py
def contact(
  request: django.core.handlers.wsgi.WSGIRequest
) -> HttpResponse
```
For the `/contact` page

```py
def admin(
  request: django.core.handlers.wsgi.WSGIRequest
) -> HttpResponse | HttpResponseRedirect
```
For the `/admin` page

```py
def badges(
  request: django.core.handlers.wsgi.WSGIRequest
) -> HttpResponse
```
Returns the javascript file for the badges list.

```py
def notifications(
  request: django.core.handlers.wsgi.WSGIRequest
) -> HttpResponse
```
For the `/notifications` page

```py
def _404(
  request: django.core.handlers.wsgi.WSGIRequest,
  exception: django.urls.exceptions.Resolver404
) -> HttpResponse
```
The function called when you receive a 404 page. 404 pages only show up on
production servers, and on development servers you instead see the django
traceback 404 page.

```py
def _500(
  request: django.core.handlers.wsgi.WSGIRequest
) -> HttpResponse
```
The function called when an internal server error happens. Just like 404 pages,
500s only show up on production servers, and on development servers you instead
see the django error traceback page.

## ./backend/variables.py
For global variables that shouldn't normally need to be modified by the server
host.

```py
HTML_HEADERS: str
```
The headers applied to every HTML document served. Contains global imports for
scripts and styles along with some meta tags for compatibility and whatnot.

```py
HTML_FOOTERS: str
```
The footers applied to most HTML documents served. Contains linked script files
and whatnot.

```py
PRIVATE_AUTHENTICATOR_KEY: str
```
The hashed version of `auth_key` from `./backend/_api_keys.py`.

```py
timeout_handler: dict[str, dict[str, None]]
```
This is the variable that keeps track of all active rate limits This should
never manually be modified, instead the helper functions `create_api_ratelimit`
and `ensure_ratelimit` from `./backend/helper.py` should be used.

```py
ROBOTS: str
```
The context of the robots.txt file. That file is what tells web crawlers if they
are allowed to view certain pages or the entire website in general.

```py
BADGE_DATA: dict[str, str]
```
This holds the data for all of the badges. This is auto-generated by the backend
on server startup, so it should never need to be changed

## ./posts/apps.py
This file doesn't need to ever be modified.

## ./posts/models.py
This defines the database structure. If you make any modifications to the
structure, you will need to run manage.py with the `makemigrations` option.

```py
class User
```
The user object

```py
class Post
```
The post object

```py
class Comment
```
The comment object

```py
class Badge
```
The badge object

## ./posts/migrations/*
These files don't need to ever be modified. These are auto-generated by
`makemigrations` from manage.py and shouldn't ever be touched.

## ./smiggins/api.py
This contains all of the api routes and the method used on those routes.

```py
response_schema: dict[int, type]
```
The schema used for all responses. The number is the response code and the type
is the type of the object returned.

## ./smiggins/asgi.py
This file doesn't need to ever be modified.

## ./smiggins/settings.py
The super cool django settings file. Only change this if you know what you're
doing.

## ./smiggins/urls.py
The file that offloads the url handling to other files. This shouldn't ever need
to be changed unless drastic changes are made to the url structure.

## ./smiggins/wsgi.py
This file doesn't need to ever be modified.
