import json
import random

from django.http import (HttpResponse, HttpResponseRedirect,
                         HttpResponseServerError)
from django.template import loader
from posts.backups import backup_db
from posts.models import User

from .helper import get_HTTP_response, get_strings
from .lang import get_lang
from .variables import (DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME,
                        ENABLE_ACCOUNT_SWITCHER, ENABLE_BADGES,
                        ENABLE_CONTENT_WARNINGS, ENABLE_DYNAMIC_FAVICON,
                        ENABLE_EMAIL, ENABLE_GRADIENT_BANNERS, ENABLE_HASHTAGS,
                        ENABLE_NEW_ACCOUNTS, ENABLE_PINNED_POSTS, ENABLE_POLLS,
                        ENABLE_POST_DELETION, ENABLE_PRIVATE_MESSAGES,
                        ENABLE_PRONOUNS, ENABLE_QUOTES, ENABLE_USER_BIOS,
                        FAVICON_DATA, GOOGLE_VERIFICATION_TAG, MAX_BIO_LENGTH,
                        MAX_CONTENT_WARNING_LENGTH, MAX_DISPL_NAME_LENGTH,
                        MAX_MUTED_WORD_LENGTH, MAX_MUTED_WORDS,
                        MAX_POLL_OPTION_LENGTH, MAX_POLL_OPTIONS,
                        MAX_POST_LENGTH, MAX_USERNAME_LENGTH, MESSAGE_POLLING,
                        NOTIF_POLLING, OWNER_USER_ID, SITE_NAME, THEMES,
                        TIMELINE_POLLING, VERSION, MOTDs, error)


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
        "version": lang["generic"]["version"].replace("%v", VERSION),
        "polling": {
            "notif": NOTIF_POLLING,
            "message": MESSAGE_POLLING,
            "timeline": TIMELINE_POLLING
        }
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
