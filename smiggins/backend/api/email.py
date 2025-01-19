import json
import random
import re
import time
from typing import Any

from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from posts.models import URLPart, User, GenericData

from ..helper import (check_ratelimit, generate_token, get_HTTP_response,
                      get_lang, send_email, sha)
from ..variables import DEFAULT_DARK_THEME, THEMES, WEBSITE_URL
from .schema import APIResponse, Email, Username


def _get_url(user: User, intent: str, extra_data: dict | None=None) -> str:
    if extra_data is None:
        extra_data = {}

    remove_extra_urlparts()

    url = sha(user.username + intent) + sha(f"{random.random()}{time.time()}")
    if "email" not in extra_data:
        extra_data["email"] = user.email

    URLPart.objects.create(
        url=url,
        user=user,
        intent=intent,
        expire=round(time.time()) + (60 * 45),
        extra_data=extra_data
    )

    return f"{WEBSITE_URL}/email/{url}/?i={intent}"

def _format_block(
    block: str,
    lang: dict,
    theme: dict,
    username: str="",
    url: str="",
    email: str=""
) -> tuple[str, str]:
    return (
        block \
            .replace("%u", username) \
            .replace("%r", f"<strong style='color: {theme['colors']['accent']['red']}'>") \
            .replace("%R", "</strong>") \
            .replace("%e", email) \
            .replace("%l", f"<a style='color: {theme['colors']['accent']['mauve']}' href=\"{url}\">{lang['email']['generic']['link']}</a>") \
            .replace("%L", url) \
            .replace("%h", "") \
            .replace("%H", ""),
        re.sub(r"%h.*?%H", "", block \
            .replace("%u", username) \
            .replace("%r", "**") \
            .replace("%R", "**") \
            .replace("%e", email) \
            .replace("%l", url) \
            .replace("%L", url))
    )

def _get_email_html(
    request,
    template: str,
    lang: dict,
    user: User,
    **kwargs: Any
) -> str:
    return get_HTTP_response( # type: ignore
        request, template, lang, True,

        theme=THEMES[user.theme] if user.theme in THEMES else THEMES[DEFAULT_DARK_THEME],
        **kwargs
    )

def change_email(request, user: User) -> APIResponse:
    if user.email is None or not user.email_valid:
        return 400, {
            "success": False
        }

    lang = get_lang(user)
    username = user.username
    theme = THEMES[user.theme] if user.theme in THEMES else THEMES[DEFAULT_DARK_THEME]

    TITLE = _format_block(lang["email"]["change"]["title"], lang=lang, theme=theme, username=username)
    B1 = _format_block(lang["email"]["change"]["block_1"], lang=lang, theme=theme, username=username)
    B2 = _format_block(lang["email"]["change"]["block_2"], lang=lang, theme=theme, username=username, url=_get_url(user, "remove"))
    B3 = _format_block(lang["email"]["change"]["block_3"], lang=lang, theme=theme, username=username, url=f"{WEBSITE_URL}/login/reset")

    response = send_email(
        subject=TITLE[1],
        recipients=[user.email],
        raw_message=f"{TITLE[1]}\n\n{lang['email']['generic']['greeting']}\n{B1[1]}\n{B2[1]}\n{B3[1]}\n{lang['email']['generic']['expire']}",
        html_message=_get_email_html(
            request, "email/change.html", lang, user,

            TITLE=TITLE[0],
            B1=B1[0],
            B2=B2[0],
            B3=B3[0]
        )
    )

    return {
        "success": response > 0,
        "actions": [
            { "name": "update_element", "query": "#email-output", "text": lang["settings"]["account_email_check"] }
        ]
    }

def verify_email(request, user: User, data: Email) -> APIResponse:
    user.email = data.email
    user.email_valid = False
    user.save()

    lang = get_lang(user)
    username = user.username
    theme = THEMES[user.theme] if user.theme in THEMES else THEMES[DEFAULT_DARK_THEME]

    TITLE = _format_block(lang["email"]["verify"]["title"], lang=lang, theme=theme, username=username)
    B1 = _format_block(lang["email"]["verify"]["block_1"], lang=lang, theme=theme, username=username)
    B2 = _format_block(lang["email"]["verify"]["block_2"], lang=lang, theme=theme, username=username, url=_get_url(user, "verify"))
    B3 = _format_block(lang["email"]["verify"]["block_3"], lang=lang, theme=theme, username=username, url=_get_url(user, "remove"))

    response = send_email(
        subject=TITLE[1],
        recipients=[user.email], # type: ignore
        raw_message=f"{TITLE[1]}\n\n{lang['email']['generic']['greeting']}\n{B1[1]}\n{B2[1]}\n{B3[1]}\n{lang['email']['generic']['expire']}",
        html_message=_get_email_html(
            request, "email/change.html", lang, user,

            TITLE=TITLE[0],
            B1=B1[0],
            B2=B2[0],
            B3=B3[0]
        )
    )

    return {
        "success": response > 0,
        "actions": [
            { "name": "update_element", "query": "#email-output", "text": lang["settings"]["account_email_verify"] }
        ]
    }

def password_reset(request, data: Username) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/email/password"):
        return rl

    user = User.objects.get(username=data.username.lower())
    lang = get_lang(user)

    if user.email is None or not user.email_valid:
        return 400, {
            "success": False,
            "message": lang["email"]["reset"]["no_email"]
        }

    theme = THEMES[user.theme] if user.theme in THEMES else THEMES[DEFAULT_DARK_THEME]
    username = data.username.lower()

    TITLE = _format_block(lang["email"]["reset"]["title"], lang=lang, theme=theme, username=username)
    B1 = _format_block(lang["email"]["reset"]["block_1"], lang=lang, theme=theme, username=username, url=_get_url(user, "reset"))
    B2 = _format_block(lang["email"]["reset"]["block_2"], lang=lang, theme=theme, username=username)
    B3 = _format_block(lang["email"]["reset"]["block_3"], lang=lang, theme=theme, username=username, url=_get_url(user, "remove"))

    response = send_email(
        subject=TITLE[1],
        recipients=[user.email],
        raw_message=f"{TITLE[1]}\n\n{lang['email']['generic']['greeting']}\n{B1[1]}\n{B2[1]}\n{B3[1]}\n{lang['email']['generic']['expire']}",
        html_message=_get_email_html(
            request, "email/password.html", lang, user,

            TITLE=TITLE[0],
            B1=B1[0],
            B2=B2[0],
            B3=B3[0]
        )
    )

    return {
        "success": response > 0,
        "message": lang["settings"]["account_email_check"]
    }

@csrf_exempt
def link_manager(request: WSGIRequest, key: str) -> HttpResponse:
    try:
        part = URLPart.objects.get(url=key)
    except URLPart.DoesNotExist:
        return get_HTTP_response(request, "404.html", status=404)

    user = part.user
    intent = part.intent

    if request.GET.get("i") != intent:
        return get_HTTP_response(request, "404.html", status=404)

    context = {}

    if intent == "reset":
        context["form_url"] = _get_url(user, "pwd_fm")

    elif intent == "remove":
        old_email: str | None = part.extra_data["email"]

        if user.email == old_email:
            user.email = None
            user.email_valid = False
            user.save()

        lang = get_lang(user)
        context["confirmation"] = _format_block(
            block=lang["email"]["remove"]["confirmation"],
            lang=lang,
            theme=THEMES[user.theme] if user.theme in THEMES else THEMES[DEFAULT_DARK_THEME],
            username=user.username,
            email=str(old_email)
        )[0]

    elif intent == "verify":
        if user.email != part.extra_data["email"]:
            return get_HTTP_response(request, "404.html", status=404)

        user.email_valid = True
        user.save()

        lang = get_lang(user)
        context["confirmation"] = _format_block(
            block=lang["email"]["verify"]["confirmation"],
            lang=lang,
            theme=THEMES[user.theme] if user.theme in THEMES else THEMES[DEFAULT_DARK_THEME],
            username=user.username,
            email=str(user.email)
        )[0]

    elif intent == "pwd_fm":
        lang = get_lang(user)
        if user.email != part.extra_data["email"]:
            part.delete()
            return HttpResponse(json.dumps({
                "success": False,
                "message": lang['email']['pwd_fm']['email_changed']
            }), status=400)

        password = json.loads(request.body)["passhash"]

        if password is None:
            return HttpResponse(json.dumps({
                "success": False,
                "message": lang['account']['bad_password']
            }), status=400)

        if len(password) != 64 or password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
            return HttpResponse(json.dumps({
                "success": False,
                "message": lang['account']['bad_password']
            }), status=400)

        for i in password:
            if i not in "abcdef0123456789":
                return HttpResponse(json.dumps({
                    "success": False,
                    "message": lang['account']['bad_password']
                }), status=400)

        token = generate_token(user.username, password)
        user.token = token
        user.save()
        part.delete()

        return HttpResponse(json.dumps({
            "success": True,
            "actions": [
                { "name": "set_auth", "token": token },
                { "name": "redirect", "to": "home" }
            ]
        }))

    part.delete()

    return get_HTTP_response(
        request, f"email/conf/{intent}.html", user=user,

        username=user.username,
        **context
    )

def test_link(request, intent=True) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return HttpResponseRedirect("/", status=307)

    if intent not in ["reset", "remove", "verify", "pwd_fm"]:
        return HttpResponseRedirect("/home/", status=307)

    key = "test-key"

    URLPart.objects.create(
        url=key,
        user=user,
        intent=intent,
        expire=round(time.time()) + 60 * 5,
        extra_data={"email": user.email}
    )

    return HttpResponse(f"/email/test-key/?i={intent}")

def set_email(request, data: Email) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/email/save"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if generate_token(user.username, data.password) != user.token:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["account"]["bad_password"]
        }

    if user.email and user.email_valid:
        return change_email(request, user)
    return verify_email(request, user, data)

def remove_extra_urlparts():
    lUObj = None
    try:
        lUObj = GenericData.objects.get(id="email_url_trim")
        lastUpdate = int(lUObj.value)
    except GenericData.DoesNotExist:
        lastUpdate = 0
    except TypeError:
        lastUpdate = 0

    if lastUpdate + 60 * 60 * 2 > time.time():
        return

    for i in URLPart.objects.all():
        if i.expire <= current_time:
            i.delete()

    now = str(int(time.time()))

    if lUObj:
        lUObj.value = now
        lUObj.save()    
    else:
        GenericData.objects.create(
            id="email_url_trim",
            value=now
        )
