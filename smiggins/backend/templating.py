# For getting pages, not api.

import json

from django.http import (HttpResponse, HttpResponseRedirect,
                         HttpResponseServerError)
from posts.models import Comment, Hashtag, Post, PrivateMessageContainer, User

from .api.admin import BitMask
from .helper import (LANGS, can_view_post, get_badges, get_container_id,
                     get_HTTP_response, get_lang, get_post_json)
from .variables import (BADGE_DATA, CACHE_LANGUAGES, CONTACT_INFO, CREDITS,
                        DEFAULT_BANNER_COLOR, DEFAULT_LANGUAGE,
                        ENABLE_DYNAMIC_FAVICON, ENABLE_GRADIENT_BANNERS,
                        ENABLE_LOGGED_OUT_CONTENT, FAVICON_DATA,
                        MAX_CONTENT_WARNING_LENGTH, OWNER_USER_ID, SITE_NAME,
                        THEMES, VALID_LANGUAGES)


def settings(request) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return HttpResponseRedirect("/logout/?from=token", status=307)

    lang = get_lang(user)

    return get_HTTP_response(
        request, "settings.html", user=user, lang_override=lang,

        DISPLAY_NAME        = user.display_name,
        BANNER_COLOR        = user.color or DEFAULT_BANNER_COLOR,
        BANNER_COLOR_TWO    = user.color_two or DEFAULT_BANNER_COLOR,
        CHECKED_IF_GRADIENT = "checked" if user.gradient else "",

        PRONOUNS = user.pronouns,

        has_email = str(user.email is not None).lower(),
        email = user.email or "",
        email_valid = str(user.email_valid).lower(),

        USER_BIO = user.bio or "",

        SELECTED_IF_PUBLIC = "" if user.default_post_private else "selected",
        SELECTED_IF_PRIVATE = "selected" if user.default_post_private else "",

        FOLLOWERS_REQUIRE_APPROVAL = str(user.verify_followers).lower(),

        themes = [{"id": i, "name": lang["settings"]["cosmetic_themes"][i] if i in lang["settings"]["cosmetic_themes"] else THEMES[i]["name"][user.language if user.language in THEMES[i]["name"] else "default"]} for i in THEMES],
        user_theme_valid = user.theme in THEMES,

        LANGUAGE = user.language or DEFAULT_LANGUAGE,
        LANGUAGES = VALID_LANGUAGES,

        ADMIN = str(user.user_id == OWNER_USER_ID or user.admin_level >= 1).lower()
    )

def user(request, username: str) -> HttpResponse | HttpResponseRedirect:
    username = username.lower()

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))

    except User.DoesNotExist:
        if not ENABLE_LOGGED_OUT_CONTENT:
            return HttpResponseRedirect("/signup", status=307)

        self_user = None

    lang = get_lang(self_user)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "404-user.html", status=404
        )

    return get_HTTP_response(
        request, "user.html", lang, user=self_user,

        IS_HIDDEN = "hidden" if self_user is None or username == self_user.username else "",
        LOGGED_IN = str(self_user is not None).lower(),

        USERNAME = user.username,
        DISPLAY_NAME = user.display_name,
        PRONOUNS = user.pronouns,

        BIO = user.bio,

        FOLLOWER_COUNT = lang["user_page"]["followers"].replace("%s", str(user.followers.count())),
        FOLLOWING_COUNT = lang["user_page"]["following"].replace("%s", str(user.following.count())),

        EMBED_TITLE = lang["user_page"]["user_on_smiggins"].replace("%t", SITE_NAME).replace("%s", user.display_name),

        BADGES = "".join([f"<span aria-hidden='true' class='user-badge' data-add-badge='{i}'></span> " for i in get_badges(user)]),

        GRADIENT = "gradient" if ENABLE_GRADIENT_BANNERS and user.gradient else "",
        BANNER_COLOR = user.color or DEFAULT_BANNER_COLOR,
        BANNER_COLOR_TWO = user.color_two or DEFAULT_BANNER_COLOR,

        IS_BLOCKED   = "false" if self_user is None else str(user.blocking.contains(self_user)).lower(),
        IS_BLOCKING  = "false" if self_user is None else str(self_user.blocking.contains(user)).lower(),
        IS_FOLLOWING = "false" if self_user is None else str(self_user.following.contains(user)).lower(),
        IS_PENDING   = "false" if self_user is None else str(user.pending_followers.contains(self_user)).lower(),
        IS_FOLLOWED  = "false" if self_user is None else str(self_user.user_id != user.user_id and user.following.contains(self_user)).lower()
    )

def user_lists(request, username: str) -> HttpResponse:
    username = username.lower()

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "404-user.html", status=404
        )

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))

    except User.DoesNotExist:
        if not ENABLE_LOGGED_OUT_CONTENT:
            return HttpResponseRedirect("/signup", status=307)
        self_user = None

    lang = get_lang(self_user)

    followers = []
    for i in user.followers.all():
        if i.user_id != user.user_id:
            followers.append({
                "username": i.username,
                "display_name": i.display_name,
                "bio": i.bio or "\n\n\n",
                "badges": get_badges(i),
                "color_one": i.color,
                "color_two": i.color_two,
                "is_gradient": str(ENABLE_GRADIENT_BANNERS and i.gradient).lower()
            })

    following = []
    for i in user.following.all():
        if i.user_id != user.user_id:
            following.append({
                "username": i.username,
                "display_name": i.display_name,
                "bio": i.bio or "\n\n\n",
                "badges": get_badges(i),
                "color_one": i.color,
                "color_two": i.color_two,
                "is_gradient": str(ENABLE_GRADIENT_BANNERS and i.gradient).lower()
            })

    blocking = []
    if self_user is not None and username == self_user.username:
        for i in user.blocking.all():
            try:
                if i.user_id != user.user_id:
                    blocking.append({
                        "username": i.username,
                        "display_name": i.display_name,
                        "bio": i.bio or "\n\n\n",
                        "badges": get_badges(i),
                        "color_one": i.color,
                        "color_two": i.color_two,
                        "is_gradient": str(ENABLE_GRADIENT_BANNERS and i.gradient).lower()
                    })

            except User.DoesNotExist:
                continue

    return get_HTTP_response(
        request, "user_lists.html", lang, user=self_user,

        USERNAME = user.username,
        DISPLAY_NAME = user.display_name,
        PRONOUNS = user.pronouns,
        USER_BIO = user.bio or "",

        EMPTY = "\n\n\n",

        FOLLOWING = following,
        FOLLOWERS = followers,
        BLOCKS = blocking,

        FOLLOWER_COUNT = lang["user_page"]["followers"].replace("%s", str(user.followers.count())),
        FOLLOWING_COUNT = lang["user_page"]["following"].replace("%s", str(user.following.count())),

        BADGES = "".join([f"<span aria-hidden='true' class='user-badge' data-add-badge='{i}'></span> " for i in get_badges(user)]),

        GRADIENT = "gradient" if ENABLE_GRADIENT_BANNERS and user.gradient else "",
        BANNER_COLOR = user.color or DEFAULT_BANNER_COLOR,
        BANNER_COLOR_TWO = user.color_two or DEFAULT_BANNER_COLOR,

        IS_BLOCKED   = "false" if self_user is None else str(user.blocking.contains(self_user)).lower(),
        IS_BLOCKING  = "false" if self_user is None else str(self_user.blocking.contains(user)).lower(),
        IS_FOLLOWING = "false" if self_user is None else str(self_user.following.contains(user)).lower(),
        IS_PENDING   = "false" if self_user is None else str(user.pending_followers.contains(self_user)).lower(),
        IS_FOLLOWED  = "false" if self_user is None else str(self_user.user_id != user.user_id and user.following.contains(self_user)).lower(),

        INCLUDE_BLOCKS = str(self_user is not None and username == self_user.username).lower(),
        LOGGED_IN = str(self_user is not None).lower()
    )

def post(request, post_id: int) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        if not ENABLE_LOGGED_OUT_CONTENT:
            return HttpResponseRedirect("/signup", status=307)

        user = None

    try:
        post = Post.objects.get(pk=post_id)
        creator = post.creator
    except Post.DoesNotExist:
        return get_HTTP_response(
            request, "404-post.html", status=404
        )
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "404-post.html", status=404
        )

    can_view = can_view_post(user, creator, post)

    if can_view[0] is False and can_view[1] in ["private", "blocked"]:
        return get_HTTP_response(
            request, "404-post.html", status=404
        )

    post_json = get_post_json(post_id, user.user_id if user is not None else 0)
    lang = get_lang(user)

    return get_HTTP_response(
        request, "post.html", lang, user=user,

        DISPLAY_NAME = creator.display_name,
        LOGGED_IN = str(user is not None).lower(),
        POST_ID   = str(post_id),
        COMMENT   = "false",
        POST_JSON = json.dumps(post_json),
        CONTENT   = (post.content_warning or post.content) + ("\n" + lang["home"]["quote_poll"] if post.poll else "\n" + lang["home"]["quote_recursive"] if post.quote else ""),
        C_WARNING = (post.content_warning or "")[:MAX_CONTENT_WARNING_LENGTH - 4:],
        EMBED_TITLE = lang["user_page"]["user_on_smiggins"].replace("%t", SITE_NAME).replace("%s", creator.display_name),

        LIKES = lang["post_page"]["likes"].replace("%s", str(post_json["likes"])),
        COMMENTS = lang["post_page"]["comments"].replace("%s", str(post_json["comments"])),
        QUOTES = lang["post_page"]["quotes"].replace("%s", str(post_json["quotes"]))
    )

def comment(request, comment_id: int) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        if not ENABLE_LOGGED_OUT_CONTENT:
            return HttpResponseRedirect("/signup", status=307)
        user = None

    try:
        comment = Comment.objects.get(pk=comment_id)
        creator = comment.creator
    except Comment.DoesNotExist:
        return get_HTTP_response(
            request, "404-post.html", status=404
        )
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "404-post.html", status=404
        )

    can_view = can_view_post(user, creator, comment)

    if can_view[0] is False and can_view[1] in ["private", "blocked"]:
        return get_HTTP_response(
            request, "404-post.html", status=404
        )

    comment_json = get_post_json(comment_id, user.user_id if user is not None else 0, True)
    lang = get_lang(user if user is not None else None)

    return get_HTTP_response(
        request, "post.html", lang, user=user,

        DISPLAY_NAME = creator.display_name,
        LOGGED_IN = str(user is not None).lower(),
        POST_ID   = str(comment_id),
        COMMENT   = "true",
        POST_JSON = json.dumps(comment_json),
        CONTENT   = comment.content_warning or comment.content,
        C_WARNING = (comment.content_warning or "")[:MAX_CONTENT_WARNING_LENGTH - 4:],
        EMBED_TITLE = lang["user_page"]["user_on_smiggins"].replace("%t", SITE_NAME).replace("%s", creator.display_name),

        LIKES = lang["post_page"]["likes"].replace("%s", str(comment_json["likes"])),
        COMMENTS = lang["post_page"]["comments"].replace("%s", str(comment_json["comments"])),
        QUOTES = lang["post_page"]["quotes"].replace("%s", str(comment_json["quotes"]))
    )

def contact(request) -> HttpResponse:
    return get_HTTP_response(
        request, "contact.html",

        CONTACT_INFO = CONTACT_INFO
    )

def admin(request) -> HttpResponse | HttpResponseRedirect:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "404.html", status=404
        )

    lv = (2 ** (BitMask.MAX_LEVEL + 1) - 1) if user.user_id == OWNER_USER_ID else user.admin_level

    if lv == 0:
        return get_HTTP_response(
            request, "404.html", status=404
        )

    return get_HTTP_response(
        request, "admin.html", user=user,

        LEVEL=lv,
        BADGE_DATA=BADGE_DATA,
        mask=BitMask,
        LEVEL_RANGE=[str(i) for i in range(BitMask.MAX_LEVEL + 1)],
        LEVEL_BINARY=f"{'0' * (BitMask.MAX_LEVEL - len(f'{lv:b}'))}{lv:b}"
    )

def message(request, username: str) -> HttpResponse | HttpResponseRedirect:
    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return HttpResponseRedirect("/logout/?from=token", status=307)

    try:
        PrivateMessageContainer.objects.get(
            container_id = get_container_id(username, self_user.username)
        )
    except PrivateMessageContainer.DoesNotExist:
        return HttpResponseRedirect(f"/u/{username}/", status=307)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return get_HTTP_response(request, "404-user.html")

    lang = get_lang(self_user)

    return get_HTTP_response(
        request, "message.html", lang, user=self_user,

        PLACEHOLDER = lang["messages"]["input_placeholder"].replace("%s", user.display_name),
        TITLE = lang["messages"]["title"].replace("%s", user.display_name),
        USERNAME = username,
        BADGES = "".join([f"<span aria-hidden='true' class='user-badge' data-add-badge='{i}'></span> " for i in get_badges(user)])
    )

def hashtag(request, hashtag: str) -> HttpResponse:
    try:
        num_posts = Hashtag.objects.get(tag=hashtag.lower()).posts.count()
    except Hashtag.DoesNotExist:
        num_posts = 0

    return get_HTTP_response(
        request, "hashtag.html",

        HASHTAG = hashtag.lower(),
        NUM_POSTS = num_posts
    )

def credit(request) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        user = None

    lang = get_lang(user)

    return get_HTTP_response(
        request, "credits.html", lang, user=user,

        credits=CREDITS,
        langs=[{
            "name": LANGS[i]["meta"]["name"],
            "maintainers": LANGS[i]["meta"]["maintainers"],
            "past_maintainers": LANGS[i]["meta"]["past_maintainers"],
            "num_past": len(LANGS[i]["meta"]["past_maintainers"])
        } for i in LANGS] if CACHE_LANGUAGES else [],
        cache_langs=CACHE_LANGUAGES,
        fa=lang["credits"]["fontawesome"].replace("%s", "<a href=\"https://fontawesome.com/\" target=\"_blank\">Font Awesome</a>")
    )

def pending(request) -> HttpResponse | HttpResponseRedirect:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "404.html", status=404
        )

    if not user.verify_followers:
        return HttpResponseRedirect("/home/", status=307)

    return get_HTTP_response(request, "pending.html", user=user)

if ENABLE_DYNAMIC_FAVICON:
    from cairosvg import svg2png

def generate_favicon(request, a) -> HttpResponse | HttpResponseServerError:
    colors: tuple[str, str, str] = a.split("-")

    png_data: bytes | None = svg2png(
        FAVICON_DATA.replace("@{background}", f"#{colors[0]}").replace("@{background_alt}", f"#{colors[1]}").replace("@{accent}", f"#{colors[2]}"),
        output_width=32,
        output_height=32
    )

    if not isinstance(png_data, bytes):
        return HttpResponseServerError("500 Internal Server Error")

    return HttpResponse(png_data, content_type="image/png")

# These two functions are referenced in smiggins/urls.py
def _404(request, exception) -> HttpResponse:
    return get_HTTP_response(request, "404.html", status=404)

def _500(request) -> HttpResponse:
    return get_HTTP_response(request, "500.html", status=500)
