import json
import random

from django.http import (HttpResponse, HttpResponseRedirect,
                         HttpResponseServerError)
from django.template import loader
from posts.backups import backup_db
from posts.models import User

from .helper import (get_badges, get_HTTP_response, get_lang, get_pronouns,
                     get_strings)
from .variables import (DEFAULT_BANNER_COLOR, DEFAULT_DARK_THEME,
                        DEFAULT_LIGHT_THEME, ENABLE_ACCOUNT_SWITCHER,
                        ENABLE_BADGES, ENABLE_CONTENT_WARNINGS,
                        ENABLE_DYNAMIC_FAVICON, ENABLE_EMAIL,
                        ENABLE_GRADIENT_BANNERS, ENABLE_HASHTAGS,
                        ENABLE_LOGGED_OUT_CONTENT, ENABLE_NEW_ACCOUNTS,
                        ENABLE_PINNED_POSTS, ENABLE_POLLS,
                        ENABLE_POST_DELETION, ENABLE_PRIVATE_MESSAGES,
                        ENABLE_PRONOUNS, ENABLE_QUOTES, ENABLE_USER_BIOS,
                        FAVICON_DATA, GOOGLE_VERIFICATION_TAG, MAX_BIO_LENGTH,
                        MAX_CONTENT_WARNING_LENGTH, MAX_DISPL_NAME_LENGTH,
                        MAX_MUTED_WORD_LENGTH, MAX_MUTED_WORDS,
                        MAX_POLL_OPTION_LENGTH, MAX_POLL_OPTIONS,
                        MAX_POST_LENGTH, MAX_USERNAME_LENGTH, OWNER_USER_ID,
                        SITE_NAME, THEMES, VERSION, MOTDs, error)


def webapp(request) -> HttpResponse:
    backup_db()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        user = None
        theme = "auto"

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
        theme = user.theme
    except User.DoesNotExist:
        user = None
        theme = "auto"

    lang = get_lang(user)
    strings = get_strings(request, lang, user)
    conf = {
        "max_post_length": MAX_POST_LENGTH,
        "max_poll_option_length": MAX_POLL_OPTION_LENGTH,
        "max_poll_options": MAX_POLL_OPTIONS,
        "max_content_warning_length": MAX_CONTENT_WARNING_LENGTH,
        "max_bio_length": MAX_BIO_LENGTH,
        "max_username_length": MAX_USERNAME_LENGTH,
        "max_muted_words": MAX_MUTED_WORDS,
        "max_muted_word_length": MAX_MUTED_WORD_LENGTH,
        "max_display_name_length": MAX_DISPL_NAME_LENGTH,
        "user_bios": ENABLE_USER_BIOS,
        "pronouns": ENABLE_PRONOUNS,
        "gradient_banners": ENABLE_GRADIENT_BANNERS,
        "badges": ENABLE_BADGES,
        "private_messages": ENABLE_PRIVATE_MESSAGES,
        "quotes": ENABLE_QUOTES,
        "post_deletion": ENABLE_POST_DELETION,
        "pinned_posts": ENABLE_PINNED_POSTS,
        "account_switcher": ENABLE_ACCOUNT_SWITCHER,
        "polls": ENABLE_POLLS,
        "content_warnings": ENABLE_CONTENT_WARNINGS,
        "email": ENABLE_EMAIL,
        "dynamic_favicon": ENABLE_DYNAMIC_FAVICON,
        "new_accounts": ENABLE_NEW_ACCOUNTS,
        "hashtags": ENABLE_HASHTAGS,
        "site_name": SITE_NAME,
        "version": lang["generic"]["version"].replace("%v", VERSION)
    }

    context = {
        "title": strings[0],
        "loading": random.choice(MOTDs) if MOTDs else lang["generic"]["loading"],
        "something_went_wrong": lang["generic"]["something_went_wrong"],
        "logged_in": user is not None,
        "username": user and user.username,
        "is_admin": user is not None and (user.admin_level != 0 or user.user_id == OWNER_USER_ID),
        "default_post_private": user.default_post_private if user else False,
        "theme": theme if theme in THEMES else "auto",
        "theme_str": "{}" if theme == "auto" or theme not in THEMES else json.dumps(THEMES[theme]),
        "theme_default_light": json.dumps(THEMES[DEFAULT_LIGHT_THEME]),
        "theme_default_dark": json.dumps(THEMES[DEFAULT_DARK_THEME]),
        "scraper_text": strings[1],
        "meta_description": strings[2],
        "google_verification_tag": GOOGLE_VERIFICATION_TAG,
        "conf": conf,
        "conf_str": json.dumps(conf)
    }

    return HttpResponse(
        loader.get_template("all.html").render(
            context, request
        ),
        status=strings[3]
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
        PRONOUNS = get_pronouns(user),
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

generate_favicon = lambda request, a: HttpResponseRedirect("/static/img/old_favicon.png", status=308) # noqa: E731

if ENABLE_DYNAMIC_FAVICON:
    try:
        from cairosvg import svg2png
    except BaseException:
        error("Something went wrong importing the cariosvg library!\n- Try turning 'enable_dynamic_favicon' off in settings?")

    else:
        del generate_favicon
        def generate_favicon(request, a) -> HttpResponse | HttpResponseServerError:
            colors: tuple[str, str, str] = a.split("-")

            size = 32
            if "large" in request.GET:
                size = 128

            png_data: bytes | None = svg2png(
                FAVICON_DATA.replace("@{background}", f"#{colors[0]}").replace("@{background_alt}", f"#{colors[1]}").replace("@{accent}", f"#{colors[2]}"),
                output_width=size,
                output_height=size
            )

            if not isinstance(png_data, bytes):
                return HttpResponseServerError("500 Internal Server Error")

            return HttpResponse(png_data, content_type="image/png")

# These two functions are referenced in smiggins/urls.py
def _404(request, exception) -> HttpResponse:
    return get_HTTP_response(request, "404.html", status=404)

def _500(request) -> HttpResponse:
    return get_HTTP_response(request, "500.html", status=500)
