# For getting pages, not api.

from ._settings import DEFAULT_BANNER_COLOR, MAX_BIO_LENGTH, OWNER_USER_ID, CONTACT_INFO, ENABLE_GRADIENT_BANNERS
from .variables import BADGE_DATA
from .packages  import User, Post, Comment, Hashtag, PrivateMessageContainer, HttpResponse, HttpResponseRedirect, json
from .helper    import validate_token, get_HTTP_response, get_post_json, get_badges, get_container_id

def settings(request) -> HttpResponse:
    try:
        token: str = request.COOKIES["token"].lower()
    except KeyError:
        return HttpResponseRedirect("/", status=307)

    try:
        user = User.objects.get(token=token)
    except User.DoesNotExist:
        return HttpResponseRedirect("/", status=307)

    return get_HTTP_response(
        request, "settings.html",

        DISPLAY_NAME        = user.display_name,
        BANNER_COLOR        = user.color or DEFAULT_BANNER_COLOR,
        BANNER_COLOR_TWO    = user.color_two or DEFAULT_BANNER_COLOR,
        CHECKED_IF_GRADIENT = "checked" if user.gradient else "",
        CHECKED_IF_PRIV     = "checked" if user.private  else "",

        PRONOUNS = user.pronouns,

        MAX_BIO_LENGTH = str(MAX_BIO_LENGTH),
        USER_BIO       = user.bio or "",

        SELECTED_IF_LIGHT = "selected" if user.theme == "light" else "",
        SELECTED_IF_GRAY  = "selected" if user.theme == "gray"  else "",
        SELECTED_IF_DARK  = "selected" if user.theme == "dark"  else "",
        SELECTED_IF_BLACK = "selected" if user.theme == "black" else "",
        SELECTED_IF_OLED  = "selected" if user.theme == "oled"  else "",

        ADMIN = str(user.user_id == OWNER_USER_ID or user.admin_level >= 1).lower()
    )

def user(request, username: str) -> HttpResponse:
    username = username.lower()

    try:
        self_object = User.objects.get(token=request.COOKIES["token"])
        self_id = self_object.user_id
        logged_in = True
    except:
        self_id = 0
        logged_in = False

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "404_user.html"
        )

    if user.private and self_id not in user.following:
        logged_in = False

    return get_HTTP_response(
        request, "user.html",

        IS_HIDDEN = "hidden" if not logged_in or username == self_object.username else "",
        LOGGED_IN = str(logged_in).lower(),

        USERNAME = user.username,
        DISPLAY_NAME = user.display_name,
        PRONOUNS = user.pronouns,

        BIO = user.bio,
        FOLLOWERS = len(user.followers),
        FOLLOWING = len(user.following) - 1,

        BADGES = "".join([f"<span class='user-badge' data-add-badge='{i}'></span> " for i in get_badges(user)]),

        GRADIENT = "gradient" if ENABLE_GRADIENT_BANNERS and user.gradient else "",
        BANNER_COLOR = user.color or DEFAULT_BANNER_COLOR,
        BANNER_COLOR_TWO = user.color_two or DEFAULT_BANNER_COLOR,

        IS_FOLLOWING = "false" if not logged_in else str(user.user_id in self_object.following).lower(),
        IS_BLOCKING = "false" if not logged_in else str(user.user_id in self_object.blocking).lower()
    )

def user_lists(request, username: str) -> HttpResponse | HttpResponseRedirect:
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
            request, "404_user.html"
        )

    followers = []
    for i in user.followers:
        if i != user.user_id:
            f_user = User.objects.get(user_id=i)
            followers.append({
                "user_id": i,
                "username": f_user.username,
                "display_name": f_user.display_name,
                "bio": f_user.bio or "\n\n\n",
                "private": str(f_user.private).lower(),
                "badges": get_badges(f_user)
            })

    following = []
    for i in user.following:
        if i != user.user_id:
            f_user = User.objects.get(user_id=i)
            following.append({
                "user_id": i,
                "username": f_user.username,
                "display_name": f_user.display_name,
                "bio": f_user.bio or "\n\n\n",
                "private": str(f_user.private).lower(),
                "badges": get_badges(f_user)
            })

    blocking = []
    removed_deleted_accounts = []
    if logged_in and username == self_object.username:
        for i in user.blocking:
            try:
                if i != user.user_id:
                    f_user = User.objects.get(user_id=i)
                    removed_deleted_accounts.append(i)
                    blocking.append({
                        "user_id": i,
                        "username": f_user.username,
                        "display_name": f_user.display_name,
                        "bio": f_user.bio or "\n\n\n",
                        "private": str(f_user.private).lower(),
                        "badges": get_badges(f_user)
                    })

            except User.DoesNotExist:
                continue

        if removed_deleted_accounts != user.blocking:
            user.blocking = removed_deleted_accounts
            user.save()

    return get_HTTP_response(
        request, "user_lists.html",

        USERNAME = user.username,
        DISPLAY_NAME = user.display_name,
        PRONOUNS = user.pronouns,
        USER_BIO = user.bio or "",

        EMPTY = "\n\n\n",

        FOLLOWING = following,
        FOLLOWERS = followers,
        BLOCKS = blocking,

        FOLLOWER_COUNT = len(user.followers),
        FOLLOWING_COUNT = len(user.following) - 1,

        BADGES = "".join([f"<span class='user-badge' data-add-badge='{i}'></span> " for i in get_badges(user)]),

        GRADIENT = "gradient" if ENABLE_GRADIENT_BANNERS and user.gradient else "",
        BANNER_COLOR = user.color or DEFAULT_BANNER_COLOR,
        BANNER_COLOR_TWO = user.color_two or DEFAULT_BANNER_COLOR,

        IS_FOLLOWING = str(user.user_id in self_object.following).lower() if logged_in else "false",
        IS_HIDDEN = "hidden" if user.user_id == self_id else "",

        INCLUDE_BLOCKS = str(logged_in and username == self_object.username).lower(),
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
            request, "404_post.html"
        )

    if creator.private and self_id not in creator.following:
        return get_HTTP_response(
            request, "404_post.html"
        )

    post_json = get_post_json(post_id, User.objects.get(token=token).user_id if logged_in else 0)

    return get_HTTP_response(
        request, "post.html",

        DISPLAY_NAME = creator.display_name,
        LOGGED_IN = str(logged_in).lower(),
        POST_ID   = str(post_id),
        COMMENT   = "false",
        POST_JSON = json.dumps(post_json),
        CONTENT   = post.content,

        LIKES = post_json["likes"],
        COMMENTS = post_json["comments"],
        QUOTES = post_json["quotes"]
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
            request, "404_post.html"
        )

    try:
        creator = User.objects.get(pk=comment.creator)
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "404_post.html"
        )

    if creator.private and self_id not in creator.following:
        return get_HTTP_response(
            request, "404_post.html"
        )

    comment_json = get_post_json(comment_id, User.objects.get(token=token).user_id if logged_in else 0, True)

    return get_HTTP_response(
        request, "post.html",

        DISPLAY_NAME = creator.display_name,
        LOGGED_IN = str(logged_in).lower(),
        POST_ID   = str(comment_id),
        COMMENT   = "true",
        POST_JSON = json.dumps(comment_json),
        CONTENT   = comment.content,

        LIKES = comment_json["likes"],
        COMMENTS = comment_json["comments"],
        QUOTES = comment_json["quotes"]
    )

def contact(request) -> HttpResponse:
    return get_HTTP_response(
        request, "contact.html",

        CONTACT_LIST = "<li>" + "</li><li>".join([f'<a href="mailto:{i[1]}">{i[1]}</a>' if i[0] == "email" else f'<a href="{i[1]}">{i[1]}</a>' if i[0] == "url" else i[1] for i in CONTACT_INFO]) + "</li>"
    )

def admin(request) -> HttpResponse | HttpResponseRedirect:
    try:
        token: str = request.COOKIES["token"].lower()

        if not validate_token(token):
            return get_HTTP_response(
                request, "404.html"
            )

        user = User.objects.get(token=token)

    except KeyError or User.DoesNotExist:
        return get_HTTP_response(
            request, "404.html"
        )

    if user.user_id != OWNER_USER_ID and user.admin_level < 1:
        return get_HTTP_response(
            request, "404.html"
        )

    return get_HTTP_response(
        request, "admin.html",

        LEVEL = 5 if user.user_id == OWNER_USER_ID else user.admin_level,
        BADGE_DATA = BADGE_DATA
    )

def badges(request) -> HttpResponse:
    return HttpResponse(
        "const badges={" + (",".join(["\"" + i.replace("\\", "\\\\").replace("\"", "\\\"") + "\":'" + BADGE_DATA[i].replace("'", "\"") + "'" for i in BADGE_DATA])) + "}",
        content_type="text/javascript"
    )

def notifications(request) -> HttpResponse | HttpResponseRedirect:
    try:
        token: str = request.COOKIES["token"].lower()
        if not validate_token(token):
            return HttpResponseRedirect("/", status=307)
    except KeyError:
        return HttpResponseRedirect("/", status=307)

    return get_HTTP_response(
        request, "notifications.html",
    )

def message(request, username: str) -> HttpResponse | HttpResponseRedirect:
    try:
        self_user = User.objects.get(
            token = request.COOKIES.get("token")
        )
    except User.DoesNotExist:
        return HttpResponseRedirect("/", status=307)

    try:
        PrivateMessageContainer.objects.get(
            container_id = get_container_id(username, self_user.username)
        )
    except PrivateMessageContainer.DoesNotExist:
        return HttpResponseRedirect(f"/u/{username}/", status=307)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return get_HTTP_response(request, "404_user.html")

    return get_HTTP_response(
        request, "message.html",

        USERNAME = username,
        DISPLAY_NAME = user.display_name,
        PRIVATE = str(user.private).lower(),
        BADGES = "".join([f"<span class='user-badge' data-add-badge='{i}'></span> " for i in get_badges(user)])
    )

def hashtag(request, hashtag: str) -> HttpResponse:
    try:
        num_posts = len(Hashtag.objects.get(tag=hashtag.lower()).posts)
    except Hashtag.DoesNotExist:
        num_posts = 0

    return get_HTTP_response(
        request, "hashtag.html",

        HASHTAG = hashtag.lower(),
        NUM_POSTS = num_posts
    )

# These two functions are referenced in smiggins/urls.py
def _404(request, exception) -> HttpResponse:
    response = get_HTTP_response(request, "404.html")
    response.status_code = 404
    return response

def _500(request) -> HttpResponse:
    response = get_HTTP_response(request, "500.html")
    response.status_code = 500
    return response
