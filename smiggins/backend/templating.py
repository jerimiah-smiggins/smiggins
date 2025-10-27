import random

import yaml
from django.http import HttpResponse
from django.template import loader
from posts.backups import backup_db
from posts.models import User

from .variables import (BASE_DIR, ENABLE_NEW_ACCOUNTS, GOOGLE_VERIFICATION_TAG,
                        MAX_BIO_LENGTH, MAX_CONTENT_WARNING_LENGTH,
                        MAX_DISPL_NAME_LENGTH, MAX_POST_LENGTH,
                        MAX_USERNAME_LENGTH, SITE_NAME, VERSION, MOTDs)


def webapp(request) -> HttpResponse:
    backup_db()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        user = None

    # conf = {
    #     "max_post_length": MAX_POST_LENGTH,
    #     "max_poll_option_length": MAX_POLL_OPTION_LENGTH,
    #     "max_poll_options": MAX_POLL_OPTIONS,
    #     "max_content_warning_length": MAX_CONTENT_WARNING_LENGTH,
    #     "max_bio_length": MAX_BIO_LENGTH,
    #     "max_username_length": MAX_USERNAME_LENGTH,
    #     "max_muted_words": MAX_MUTED_WORDS,
    #     "max_muted_word_length": MAX_MUTED_WORD_LENGTH,
    #     "max_display_name_length": MAX_DISPL_NAME_LENGTH,
    #     "user_bios": ENABLE_USER_BIOS,
    #     "pronouns": ENABLE_PRONOUNS,
    #     "gradient_banners": ENABLE_GRADIENT_BANNERS,
    #     "badges": ENABLE_BADGES,
    #     "private_messages": ENABLE_PRIVATE_MESSAGES,
    #     "quotes": ENABLE_QUOTES,
    #     "post_deletion": ENABLE_POST_DELETION,
    #     "pinned_posts": ENABLE_PINNED_POSTS,
    #     "account_switcher": ENABLE_ACCOUNT_SWITCHER,
    #     "polls": ENABLE_POLLS,
    #     "content_warnings": ENABLE_CONTENT_WARNINGS,
    #     "email": ENABLE_EMAIL,
    #     "dynamic_favicon": ENABLE_DYNAMIC_FAVICON,
    #     "new_accounts": ENABLE_NEW_ACCOUNTS,
    #     "hashtags": ENABLE_HASHTAGS,
    #     "site_name": SITE_NAME,
    #     "version": lang["generic"]["version"].replace("%v", VERSION)
    # }

    # context = {
    #     "title": strings[0],
    #     "loading": random.choice(MOTDs) if MOTDs else lang["generic"]["loading"],
    #     "something_went_wrong": lang["generic"]["something_went_wrong"],
    #     "logged_in": user is not None,
    #     "username": user and user.username,
    #     "is_admin": user is not None and (user.admin_level != 0 or user.user_id == OWNER_USER_ID),
    #     "default_post_private": user.default_post_private if user else False,
    #     "theme": theme if theme in THEMES else "auto",
    #     "theme_str": "{}" if theme == "auto" or theme not in THEMES else json.dumps(THEMES[theme]),
    #     "theme_default_light": json.dumps(THEMES[DEFAULT_LIGHT_THEME]),
    #     "theme_default_dark": json.dumps(THEMES[DEFAULT_DARK_THEME]),
    #     "scraper_text": strings[1],
    #     "meta_description": strings[2],
    #     "google_verification_tag": GOOGLE_VERIFICATION_TAG,
    #     "conf": conf,
    #     "conf_str": json.dumps(conf)
    # }

    context = {
        "conf": {
            "site_name": SITE_NAME,
            "version": VERSION,
            "new_accounts": ENABLE_NEW_ACCOUNTS,

            "max_length": {
                "username": MAX_USERNAME_LENGTH,
                "display_name": MAX_DISPL_NAME_LENGTH,
                "bio": MAX_BIO_LENGTH,
                "post": MAX_POST_LENGTH,
                "cw": MAX_CONTENT_WARNING_LENGTH
            }
        },

        "logged_in": user is not None,
        "username": user and user.username,
        "is_admin": user and user.admin_level != 0,
        "default_post_private": user and user.default_post_private,
        "loading": random.choice(MOTDs) if MOTDs else "Loading...",
        "google_verification_tag": GOOGLE_VERIFICATION_TAG
    }

    return HttpResponse(
        loader.get_template("app.html").render(
            context, request
        )
    )

def _api_docs_map(data):
    data[1]["id_hex"] = hex(data[1]["id"])[2:].zfill(2)
    if "params" in data[1]:
        data[1]["params"] = data[1]["params"].items()

    return data

def api_docs(request) -> HttpResponse:
    context = {
        "conf": {
            "site_name": SITE_NAME,
            "version": VERSION
        },

        "api": map(_api_docs_map, yaml.safe_load(open(BASE_DIR / "backend/api/docs/docs.yaml")).items())
    }

    return HttpResponse(
        loader.get_template("api.html").render(
            context, request
        )
    )

def manifest_json(request):
    return HttpResponse(
        loader.get_template("manifest.json").render({
            "site_name": SITE_NAME,
            "version": VERSION
        }, request),
        content_type="application/manifest+json"
    )
