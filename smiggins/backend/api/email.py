import re

from typing import Any

from posts.models import User
from ..helper import get_HTTP_response, get_lang, send_email
from ..variables import WEBSITE_URL

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

def _format_block(
    block: str,
    lang: dict,
    theme: dict[str, str],
    username: str="",
    url: str=""
) -> tuple[str, str]:
    return (
        block \
            .replace("%u", username) \
            .replace("%r", f"<strong style='color: {theme['red']}'>") \
            .replace("%R", "</strong>") \
            .replace("%l", f"<a style='color: {theme['accent']}' href=\"{url}\">{lang['email']['password']['link']}</a>") \
            .replace("%L", url) \
            .replace("%h", "") \
            .replace("%H", ""),
        re.sub(r"%h.*?%H", "", block \
            .replace("%u", username) \
            .replace("%r", "**") \
            .replace("%R", "**") \
            .replace("%l", url) \
            .replace("%L", url))
    )

def get_email_html(
    request,
    template: str,
    lang: dict,
    user: User,
    **kwargs: Any
) -> str:
    return get_HTTP_response( # type: ignore
        request, template, lang, True,

        COLORS=COLORS[user.theme],
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

    TITLE = _format_block(block=lang["email"]["password"]["title"], lang=lang, theme=COLORS[user.theme], username=username)
    B1 = _format_block(block=lang["email"]["password"]["block_1"], lang=lang, theme=COLORS[user.theme], username=username, url=f"{WEBSITE_URL}/home")
    B2 = _format_block(block=lang["email"]["password"]["block_2"], lang=lang, theme=COLORS[user.theme], username=username)
    B3 = _format_block(block=lang["email"]["password"]["block_3"], lang=lang, theme=COLORS[user.theme], username=username, url=f"{WEBSITE_URL}/home")
    B4 = _format_block(block=lang["email"]["password"]["block_4"], lang=lang, theme=COLORS[user.theme])

    response = send_email(
        subject=TITLE[1],
        recipients=[user.email],
        raw_message=f"{TITLE[1]}\n\n{lang['email']['password']['greeting']}\n{B1[1]}\n{B2[1]}\n{B3[1]}\n{B4[1]}",
        html_message=get_email_html(
            request, "email/password.html", lang, user,

            TITLE=TITLE[0],
            B1=B1[0],
            B2=B2[0],
            B3=B3[0],
            B4=B4[0]
        )
    )

    return {
        "success": response > 0
    }
