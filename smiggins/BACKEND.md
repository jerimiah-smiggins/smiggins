# Backend Docs
Docs for the backend. This contains descriptions of every function defined in
any of the files in the backend.

<!--
  Functions to add:
  None
-->

<style>
  pre {
    display: inline-block;
  }
</style>

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
  to access the `/admin` page. This is stored in the database, so if you ever
  reset that, you will need to re-add any of these you have added.
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
DEBUG: bool
```
Whether or not to automatically reload the server when the backend files change.
This should be `False` on development servers.

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
DEFAULT_BANNER_COLOR; str
```
The default color for banners. This should be a hex code with the format
`#XXXXXX` where an X is a number 0-9 or a letter a-f, case insensitive.

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
POSTS_PER_REQUEST: int
```
The amount of posts to send at a time when the client requests the list. A
larger number would result in more CPU usage and bandwidth, however may
positively affect the user experience.

```py
CONTACT_INFO: list[list[str]]
```
A list containing contact information that would be put on the contact page.
It is a list of lists, where the inside list has two strings. The first string
is the type, which can be `email`, `url`, or `text`. `email` is for emails,
`url` for links, and `text` for other text that wouldn't fit with either of the
other options.

```py
ROBOTS: str
```
The context of the robots.txt file. That file is what tells web crawlers if they
are allowed to view certain pages or the entire website in general.

## ./backend/api_comment.py
This file contains functions for any api calls to comment-related things, like
creating them, getting a list of comments, or adding/removing a like from a
comment.

```py
def api_comment_create(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.commentSchema
) -> tuple[int, dict] | dict
```
Handles comment creation. Called from a PUT request to `/api/comment/create`.

```py
def api_comment_list(
  request: django.core.handlers.wsgi.WSGIRequest,
  id: int,
  comment: bool,
  offset: int = -1
) -> tuple[int, dict] | dict
```
Lists the comments on a post, up to `POSTS_PER_REQUESTS` comments at once.
Called from a GET request to `/api/comments`.

```py
def api_comment_like_add(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.likeSchema
) -> tuple[int, dict] | dict
```
Handles adding a like to a comment. Called to a POST request to
`/api/comment/like`.

```py
def api_comment_like_remove(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.likeSchema
) -> tuple[int, dict] | dict
```
Handles removing a like from a comment. Called to a DELETE request to
`/api/comment/like`.

## ./backend/api_info.py
This file is for any api calls that retrieve information for the client, for
example getting a username from their token.

```py
def api_info_username(
  request: django.core.handlers.wsgi.WSGIRequest
) -> tuple[int, dict] | dict
```
Returns the username of the user from the token cookie. Called from a GET
request to `/api/info/username`.

## ./backend/api_post.py
This file is for anything related to posts, including liking, creating, and
getting lists of posts. Comment related things should go in
`./backend/api_comment.py`.

```py
def api_post_create(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.postSchema
) -> tuple[int, dict] | dict
```
This handles creating a post. Called from a PUT request to `/api/post/create`.

```py
def api_quote_create(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.quoteSchema
) -> tuple[int, dict] | dict
```
This handles creating a post. Called from a PUT request to `/api/quote/create`.

```py
def api_post_list_following(
  request: django.core.handlers.wsgi.WSGIRequest,
  offset: int = -1
) -> tuple[int, dict] | dict
```
This gets a list of recent posts for the following timeline. Called from a GET
request to `/api/post/following`.

```py
def api_post_list_recent(
  request: django.core.handlers.wsgi.WSGIRequest,
  offset: int = -1
) -> tuple[int, dict] | dict
```
This gets a list of recent posts for the recent timeline. Called from a GET
request to `/api/post/recent`.

```py
def api_post_list_user(
  request: django.core.handlers.wsgi.WSGIRequest,
  username: str,
  offset: int = -1
) -> tuple[int, dict] | dict
```
This gets a list of recent posts for a specific user with a username of
`username`. Called from a GET request to `/api/post/user/{str: username}`.

```py
def api_post_like_add(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.likeSchema
) -> tuple[int, dict] | dict
```
Handles adding a like to a post. Called to a POST request to `/api/post/like`.

```py
def api_post_like_remove(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.likeSchema
) -> tuple[int, dict] | dict
```
Handles removing a like from a post. Called to a DELETE request to
`/api/post/like`.

## ./backend/api_user.py
This file is for api functions that are related to user profiles and account
management. This doesn't include any post-related things, as those would go into
`./backend/api_post.py`.

```py
def api_account_signup(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.accountSchema
) -> tuple[int, dict] | dict
```
This handles creating a new user on when signing up. Called on a POST request to
`/api/user/signup`.

```py
def api_account_login(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.accountSchema
) -> tuple[int, dict] | dict
```
This handles sending auth information when logging in. Called on a POST request
to `/api/user/login`.

```py
def api_user_settings_theme(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.themeSchema
) -> tuple[int, dict] | dict
```
This handles changing the theme setting. Called on a POST request to
`/api/user/settings/theme`.

```py
def api_user_settings_color(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.colorSchema
) -> tuple[int, dict] | dict
```
This handles changing the banner colors. Called on a POST request to
`/api/user/settings/color`.

```py
def api_user_settings_private(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.privSchema
) -> tuple[int, dict] | dict
```
This handles changing the private account setting. Called on a POST request to
`/api/user/settings/priv`.

```py
def api_user_settings_display_name(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.displNameSchema
) -> tuple[int, dict] | dict
```
This handles you change your display name. Called on a POST request to
`/api/user/settings/display-name`.

```py
def api_user_follower_add(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.followerSchema
) -> tuple[int, dict] | dict
```
This handles following someone. Called on a POST request to
`/api/user/follower`.

```py
def api_user_follower_remove(
  request: django.core.handlers.wsgi.WSGIRequest,
  data: backend.schema.followerSchema
) -> tuple[int, dict] | dict
```
This handles unfollowing someone. Called on a DELETE request to
`/api/user/follower`.

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
  **kwargs: str
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
  *,
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
def get_post_json(
  post_id: int,
  current_user_id: int = 0,
  comment: bool = False
) -> dict[str, Any]
```
Returns the post information in a JSON format for the specified post id.
`current_user_id` is used for validating private accounts, and `comment`
determines if it should be treated as a comment or a post.

## ./backend/packages.py
This file is just for importing packages and libraries to be used across the
program. That's literally all this file is used for. Not much explaining needed.

## ./backend/schema.py
This contains the definitions for schemas used for POST, PUT, and DELETE
requests that have a specific data structure that needs to be met.

```py
class accountSchema
```
For logging in and signing up

```py
class postSchema
```
For creating a post

```py
class quoteSchema
```
For quoting a post

```py
class commentSchema
```
For creating a comment

```py
class likeSchema
```
For liking a post

```py
class followerSchema
```
For adding/removing followers

```py
class themeSchema
```
For changing your theme

```py
class colorSchema
```
For changing your banner color

```py
class privSchema
```
For toggling the private account setting

```py
class displNameSchema
```
For changing your display name

## ./backend/templating.py
This is for creating request objects that need templating beyond what
`create_simple_return` can do.

```py
def settings(
  request: django.core.handlers.wsgi.WSGIRequest
) -> HttpResponse
```
For the settings page

```py
def user(
  request: django.core.handlers.wsgi.WSGIRequest,
  username: str
) -> HttpResponse
```
For user pages

```py
def post(
  request: django.core.handlers.wsgi.WSGIRequest,
  post_id: int
) -> HttpResponse
```
For post pages

```py
def comment(
  request: django.core.handlers.wsgi.WSGIRequest
  comment_id: str
) -> HttpResponse
```
For comment pages

```py
def contact(
  request: django.core.handlers.wsgi.WSGIRequest
) -> HttpResponse
```
For the contact page

## ./backend/variables.py
For global variables that shouldn't normally need to be modified by the server
host.

```py
HTML_HEADERS: str
```
The headers applied to every HTML document served. Contains global imports for
scripts and styles along with some meta tags for compatibility and whatnot.

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

## ./posts/admin.py
This file shouldn't need to be modified unless a new database object is added.
This registers all of the database entries into the admin page.

## ./posts/api.py
This contains all of the api routes and the method used on those routes.

```py
response_schema: dict[int, type]
```
The schema used for all responses. The number is the response code and the type
is the type of the object returned.

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

## ./posts/tests.py
This file doesn't need to ever be modified.

## ./posts/urls.py
This file contains the non-API routes for the website. Here is where the
functions in `./backend/templating` are being used.

```py
urlpatterns: list[django.urls.URLPattern]
```
The list of all non-API urls for the website.

## ./posts/views.py
Contains the functions that serve the 404 and 500 pages.

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

## ./posts/tests.py
This file doesn't need to ever be modified.

## ./posts/migrations/*
These files don't need to ever be modified. These are auto-generated by
`makemigrations` from manage.py and shouldn't ever be touched.

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
