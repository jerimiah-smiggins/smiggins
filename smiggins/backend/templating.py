import random
import re

import yaml
from django.http import HttpResponse
from django.template import loader
from posts.backups import backup_db
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest
from posts.models import Post, User

from .api.admin import AdminPermissions
from .variables import (BASE_DIR, ENABLE_ABOUT_PAGE, ENABLE_NEW_ACCOUNTS,
                        ENABLE_PRONOUNS, GOOGLE_VERIFICATION_TAG,
                        MAX_BIO_LENGTH, MAX_CONTENT_WARNING_LENGTH,
                        MAX_DISPL_NAME_LENGTH, MAX_POLL_OPTION_LENGTH,
                        MAX_POLL_OPTIONS, MAX_POST_LENGTH, MAX_USERNAME_LENGTH,
                        NOTIFICATION_POLLING_INTERVAL, SITE_DESCRIPTION,
                        SITE_NAME, TIMELINE_POLLING_INTERVAL, VERSION,
                        WEBSITE_URL, MOTDs)


def webapp(request: HttpRequest) -> HttpResponse:
    if request.method != "GET":
        return HttpResponse("400 Bad Request", status=400, content_type="text/plain")

    backup_db()

    user = request.s_user

    url = "/" + "/".join(filter(bool, request.path.split("?")[0].split("#")[0].split("/")))
    if not url.endswith("/"):
        url += "/"

    embed_data = {
        "canonical": (WEBSITE_URL or "") + url
    }

    if url == "/":
        embed_data["title"] = SITE_NAME
        embed_data["description"] = SITE_DESCRIPTION
    elif url == "/login/":
        embed_data["title"] = "Log In - " + SITE_NAME
        embed_data["description"] = SITE_DESCRIPTION
    elif url == "/signup/":
        embed_data["title"] = "Sign Up - " + SITE_NAME
        embed_data["description"] = SITE_DESCRIPTION
    elif url == "/logout/":
        embed_data["title"] = "Log Out - " + SITE_NAME
        embed_data["description"] = SITE_DESCRIPTION
    elif re.match(r"^\/u\/[a-zA-Z0-9_\-]+\/$", url): # /u/<username>/
        #          /u/uname/ -> ["", "u", "uname", ""] -> uname
        embed_username = url.split("/")[2].lower()
        try:
            embed_user = User.objects.get(username=embed_username)
        except User.DoesNotExist:
            embed_data["title"] = f"{embed_username} - {SITE_NAME}"
            embed_data["description"] = "This user doesn't exist."
        else:
            embed_data["title"] = f"{embed_user.display_name or embed_user.username} - {SITE_NAME}"
            embed_data["description"] = embed_user.bio or ""
    elif re.match(r"^\/p\/\d+\/$", url): # /p/<pid>/
        #          /p/123/ -> ["", "p", "123", ""] -> 123
        embed_pid = url.split("/")[2].lower()
        try:
            embed_post = Post.objects.filter(private=False).get(post_id=embed_pid)
        except Post.DoesNotExist:
            embed_data["title"] = f"{SITE_NAME}"
            embed_data["description"] = "This post doesn't exist."
        else:
            embed_data["title"] = f"{embed_post.creator.display_name or embed_post.creator.username} - {SITE_NAME}"
            embed_data["description"] = "CW: " + embed_post.content_warning if embed_post.content_warning else embed_post.content
    else:
        embed_data = False

    context = {
        "conf": {
            "site_name": SITE_NAME,
            "version": VERSION,
            "new_accounts": ENABLE_NEW_ACCOUNTS,
            "enable_about_page": ENABLE_ABOUT_PAGE,
            "enable_pronouns": ENABLE_PRONOUNS,

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

        "embed": embed_data,

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
        ),
        headers={
            "X-Frame-Options": "ALLOW",
            "Access-Control-Allow-Origin": "*"
        } if request.GET.get("iframe") is not None else None
    )

def _api_docs_map(data):
    data[1]["id_hex"] = hex(data[1]["id"])[2:].zfill(2)

    if "version" in data[1]:
        data[1]["version_hex"] = hex(data[1]["version"])[2:].zfill(2)

    if "params" in data[1]:
        data[1]["params"] = data[1]["params"].items()

    return data

def api_docs(request) -> HttpResponse:
    if request.method != "GET":
        return HttpResponse("400 Bad Request", status=400, content_type="text/plain")

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
