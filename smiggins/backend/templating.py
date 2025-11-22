import random

import yaml
from django.http import HttpResponse
from django.template import loader
from posts.backups import backup_db
from posts.models import User

from .api.admin import AdminPermissions
from .variables import (BASE_DIR, ENABLE_NEW_ACCOUNTS, GOOGLE_VERIFICATION_TAG,
                        MAX_BIO_LENGTH, MAX_CONTENT_WARNING_LENGTH,
                        MAX_DISPL_NAME_LENGTH, MAX_POLL_OPTION_LENGTH,
                        MAX_POLL_OPTIONS, MAX_POST_LENGTH, MAX_USERNAME_LENGTH,
                        NOTIFICATION_POLLING_INTERVAL, SITE_NAME,
                        TIMELINE_POLLING_INTERVAL, VERSION, MOTDs)


def webapp(request) -> HttpResponse:
    backup_db()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        user = None

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
                "cw": MAX_CONTENT_WARNING_LENGTH,
                "poll_count": MAX_POLL_OPTIONS,
                "poll_item": MAX_POLL_OPTION_LENGTH
            },

            "polling": {
                "timeline": TIMELINE_POLLING_INTERVAL,
                "notifications": NOTIFICATION_POLLING_INTERVAL
            },
        },

        "admin": dict([(key, AdminPermissions.can_use(user, val)) for key, val in AdminPermissions.ALL.items()]) if user else {},

        "logged_in": user is not None,
        "username": user and user.username,
        "is_admin": user is not None and AdminPermissions.has_any(user),
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

    if "version" in data[1]:
        data[1]["version_hex"] = hex(data[1]["version"])[2:].zfill(2)

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
