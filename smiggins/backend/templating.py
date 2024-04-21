# For getting pages, not api.

from ._settings import DEFAULT_BANNER_COLOR
from .helper import *
from .packages import *
from .variables import *

def settings(request) -> HttpResponse:
    try:
        token: str = request.COOKIES["token"].lower()
        if not validate_token(token):
            return HttpResponseRedirect("/", status=307)
    except KeyError:
        return HttpResponseRedirect("/", status=307)

    try:
        user = User.objects.get(token=token)
    except User.DoesNotExist:
        return HttpResponseRedirect("/", status=307)

    return get_HTTP_response(
        request, "posts/settings.html",

        DISPLAY_NAME        = user.display_name,
        BANNER_COLOR        = user.color or DEFAULT_BANNER_COLOR,
        BANNER_COLOR_TWO    = user.color_two or DEFAULT_BANNER_COLOR,
        CHECKED_IF_GRADIENT = "checked" if user.gradient else "",
        CHECKED_IF_PRIV     = "checked" if user.private  else "",

        MAX_BIO_LENGTH = str(MAX_BIO_LENGTH),
        USER_BIO       = user.bio or "",

        SELECTED_IF_LIGHT = "selected" if user.theme == "light" else "",
        SELECTED_IF_GRAY  = "selected" if user.theme == "gray"  else "",
        SELECTED_IF_DARK  = "selected" if user.theme == "dark"  else "",
        SELECTED_IF_BLACK = "selected" if user.theme == "black" else "",

        ADMIN = "<a href='/admin'>Admin page</a><br>" if user.user_id == OWNER_USER_ID or user.admin_level >= 1 else ""
    )

def user(request, username: str) -> HttpResponse:
    logged_in = True
    username = username.lower()

    try:
        if not validate_token(request.COOKIES["token"]):
            logged_in = False
    except KeyError:
        logged_in = False

    if logged_in:
        self_object = User.objects.get(token=request.COOKIES["token"])
        self_id = self_object.user_id
    else:
        self_id = 0

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404_user.html"
        )

    return get_HTTP_response(
        request, "posts/user.html",

        USERNAME     = user.username,
        DISPLAY_NAME = user.display_name,
        USER_BIO     = user.bio or "",

        GRADIENT     = "gradient" if user.gradient else "",
        BANNER_COLOR = user.color or DEFAULT_BANNER_COLOR,
        BANNER_COLOR_TWO = user.color_two or DEFAULT_BANNER_COLOR,

        IS_FOLLOWING = str(user.user_id in self_object.following).lower() if logged_in else "false", # type: ignore
        IS_HIDDEN    = "hidden" if user.user_id == self_id else "",

        LOGGED_IN = str(logged_in).lower()
    )

def post(request, post_id: int) -> HttpResponse:
    logged_in = True
    token = ""

    try:
        token = request.COOKIES["token"]
        if not validate_token(token):
            logged_in = False
    except KeyError:
        logged_in = False

    self_id = User.objects.get(token=token).user_id if logged_in else 0

    try:
        post = Post.objects.get(pk=post_id)
        creator = User.objects.get(pk=post.creator)
    except Post.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    if creator.private and self_id not in creator.following:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    return get_HTTP_response(
        request, "posts/post.html",

        DISPLAY_NAME = creator.display_name,
        LOGGED_IN = str(logged_in).lower(),
        POST_ID   = str(post_id),
        COMMENT   = "false",
        POST_JSON = json.dumps(get_post_json(post_id, User.objects.get(token=token).user_id if logged_in else 0)),
        CONTENT   = post.content
    )

def comment(request, comment_id: int) -> HttpResponse:
    logged_in = True
    token = ""

    try:
        token = request.COOKIES["token"]
        if not validate_token(token):
            logged_in = False
    except KeyError:
        logged_in = False

    self_id = User.objects.get(token=token).user_id if logged_in else 0

    try:
        comment = Comment.objects.get(pk=comment_id)
    except Comment.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    try:
        creator = User.objects.get(pk=comment.creator)
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    if creator.private and self_id not in creator.following:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    return get_HTTP_response(
        request, "posts/post.html",

        DISPLAY_NAME = creator.display_name,
        LOGGED_IN = str(logged_in).lower(),
        POST_ID   = str(comment_id),
        COMMENT   = "true",
        POST_JSON = json.dumps(get_post_json(comment_id, User.objects.get(token=token).user_id if logged_in else 0, True)),
        CONTENT   = comment.content
    )

def contact(request) -> HttpResponse:
    return get_HTTP_response(
        request, "posts/contact.html",

        CONTACT_LIST = "<li>" + "</li><li>".join([f'<a href="mailto:{i[1]}">{i[1]}</a>' if i[0] == "email" else f'<a href="{i[1]}">{i[1]}</a>' if i[0] == "url" else i[1] for i in CONTACT_INFO]) + "</li>"
    )

def admin(request) -> HttpResponse | HttpResponseRedirect:
    try:
        token: str = request.COOKIES["token"].lower()

        if not validate_token(token):
            return get_HTTP_response(
                request, "posts/404.html"
            )

        user = User.objects.get(token=token)

    except KeyError or User.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404.html"
        )

    if user.user_id != OWNER_USER_ID and user.admin_level < 1:
        return get_HTTP_response(
            request, "posts/404.html"
        )

    return get_HTTP_response(
        request, "posts/admin.html",

        LEVEL = 5 if user.user_id == OWNER_USER_ID else user.admin_level,
        BADGE_DATA = BADGE_DATA
    )

