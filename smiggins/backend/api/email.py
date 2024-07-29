import random
import time
import re

from typing import Any
from django.db.utils import OperationalError
from django.http import HttpResponse, HttpResponseRedirect

from ..tasks import remove_extra_urlparts
from posts.models import User, URLPart
from ..helper import get_HTTP_response, get_lang, send_email, sha, generate_token
from ..variables import WEBSITE_URL, ENABLE_EMAIL

COLORS = {
    "oled": {
        "accent": "#cba6f7",
        "accent_50": "#cba6f780",
        "red": "#f38ba8",
        "green": "#a6e3a1",
        "text": "#cdd6f4",
        "subtext0": "#a6adc8",
        "surface0": "#313244",
        "base": "#000000",
        "mantle": "#080810",
        "crust": "#11111b"
    },
    "black": {
        "accent": "#cba6f7",
        "accent_50": "#cba6f780",
        "red": "#f38ba8",
        "green": "#a6e3a1",
        "text": "#cdd6f4",
        "subtext0": "#a6adc8",
        "surface0": "#313244",
        "base": "#1e1e2e",
        "mantle": "#181825",
        "crust": "#11111b"
    },
    "dark": {
        "accent": "#c6a0f6",
        "accent_50": "#c6a0f680",
        "red": "#ed8796",
        "green": "#a6da95",
        "text": "#cad3f5",
        "subtext0": "#a5adcb",
        "surface0": "#363a4f",
        "base": "#24273a",
        "mantle": "#1e2030",
        "crust": "#181926"
    },
    "gray": {
        "accent": "#ca9ee6",
        "accent_50": "#ca9ee680",
        "red": "#e78284",
        "green": "#a6d189",
        "text": "#c6d0f5",
        "subtext0": "#a5adce",
        "surface0": "#414559",
        "base": "#303446",
        "mantle": "#292c3c",
        "crust": "#232634"
    },
    "light": {
        "accent": "#8839ef",
        "accent_50": "#8839ef80",
        "red": "#d20f39",
        "green": "#40a02b",
        "text": "#4c4f69",
        "subtext0": "#6c6f85",
        "surface0": "#ccd0da",
        "base": "#eff1f5",
        "mantle": "#e6e9ef",
        "crust": "#dce0e8"
    }
}

def _get_url(user: User, intent: str, extra_data: dict={}) -> str:
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
    theme: dict[str, str],
    username: str="",
    url: str="",
    email: str=""
) -> tuple[str, str]:
    return (
        block \
            .replace("%u", username) \
            .replace("%r", f"<strong style='color: {theme['red']}'>") \
            .replace("%R", "</strong>") \
            .replace("%e", email) \
            .replace("%l", f"<a style='color: {theme['accent']}' href=\"{url}\">{lang['email']['generic']['link']}</a>") \
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

        COLOR=COLORS[user.theme],
        **kwargs
    )

def password_reset(request) -> dict | tuple:
    user = User.objects.get(token=request.COOKIES.get("token"))

    if not isinstance(user.email, str):
        return 400, {
            "success": False
        }

    lang = get_lang(user)
    username = user.username

    TITLE = _format_block(block=lang["email"]["reset"]["title"], lang=lang, theme=COLORS[user.theme], username=username)
    B1 = _format_block(block=lang["email"]["reset"]["block_1"], lang=lang, theme=COLORS[user.theme], username=username, url=_get_url(user, "reset"))
    B2 = _format_block(block=lang["email"]["reset"]["block_2"], lang=lang, theme=COLORS[user.theme], username=username)
    B3 = _format_block(block=lang["email"]["reset"]["block_3"], lang=lang, theme=COLORS[user.theme], username=username, url=_get_url(user, "remove"))

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
        "success": response > 0
    }

def link_manager(request, key: str) -> HttpResponse:
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
            theme=COLORS[user.theme],
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
            theme=COLORS[user.theme],
            username=user.username,
            email=str(user.email)
        )[0]

    elif intent == "pwd_fm":
        lang = get_lang(user)
        if user.email == part.extra_data["email"]:
            password = request.POST.get("passhash")

            if password is None:
                return HttpResponse(f"{{\"valid\":false,\"reason\":\"{lang['account']['bad_password']}\"}}")

            if len(password) != 64 or password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
                return HttpResponse(f"{{\"valid\":false,\"reason\":\"{lang['account']['bad_password']}\"}}")

            for i in password:
                if i not in "abcdef0123456789":
                    return HttpResponse(f"{{\"valid\":false,\"reason\":\"{lang['account']['bad_password']}\"}}")

            token = generate_token(user.username, password)
            user.token = token
            user.save()

            return HttpResponse(f"{{\"valid\":true,\"token\":{token}}}")
        return HttpResponse(f"{{\"valid\":false,\"reason\":\"{lang['email']['pwd_fm']['email_changed']}\"}}", status=400)

    part.delete()

    return get_HTTP_response(
        request, f"email/conf/{intent}.html",

        user=user.username,
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

if ENABLE_EMAIL:
    try:
        remove_extra_urlparts()
    except OperationalError:
        print("\x1b[91mYou need to migrate your database! Do this by running 'manage.py migrate'. If you are already doing that, ignore this message.\x1b[0m")
