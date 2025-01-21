from posts.models import MutedWord, User

from ..helper import check_ratelimit, get_badge_data, get_lang, get_strings
from ..variables import (DEFAULT_BANNER_COLOR, DEFAULT_LANGUAGE, DISCORD,
                         ENABLE_CONTACT_PAGE, ENABLE_CREDITS_PAGE, SOURCE_CODE,
                         THEMES, VALID_LANGUAGES)
from .schema import APIResponse


def context(request) -> tuple[int, dict] | dict | APIResponse:
    # add artifial delay to simulate ping
    # import time
    # time.sleep(0.2)

    if rl := check_ratelimit(request, "GET /api/init/context"):
        return rl

    def gc(page: str, new_url: str | None=None, success: bool=True, **context) -> dict:
        # *g*enerate *c*ontext
        c = {
            "page": page,
            "strings": get_strings(request, get_lang(user), user, new_url or url)
        }

        for key, val in context.items():
            c[key] = val

        out = {
            "success": success,
            "context": c
        }

        if new_url:
            out["set_url"] = new_url
        elif not url.endswith("/"):
            out["set_url"] = url + "/"

        return out

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        user = None

    index = gc(
        "index", "/",
        discord=DISCORD,
        source=SOURCE_CODE
    )

    home = gc("home", "/")

    url: str = request.GET.get("url")

    if url == "/":
        return index if user is None else home

    if url == "/home" or url == "/home/":
        return index if user is None else home

    if url == "/login" or url == "/login/":
        return gc("login") if user is None else home

    if url == "/logout" or url == "/logout/":
        return gc("logout")

    if url == "/signup" or url == "/signup/":
        return gc("signup") if user is None else home

    if url == "/settings" or url == "/settings/":
        if user is None:
            return index

        _p = user.pronouns.filter(language=user.language)
        if _p.exists():
            pronouns = {
                "primary": _p[0].primary,
                "secondary": _p[0].secondary
            }
        else:
            pronouns = {}

        lang = get_lang(user)

        return gc(
            "settings",
            display_name=user.display_name,
            bio=user.bio,
            pronouns=pronouns,
            verify_followers=user.verify_followers,

            themes=[{"id": i, "name": lang["settings"]["cosmetic_themes"][i] if i in lang["settings"]["cosmetic_themes"] else THEMES[i]["name"][user.language if user.language in THEMES[i]["name"] else "default"]} for i in THEMES],
            theme=user.theme if user.theme in THEMES else "auto",

            language=user.language or DEFAULT_LANGUAGE,
            languages=VALID_LANGUAGES,

            banner_color_one=user.color or DEFAULT_BANNER_COLOR,
            banner_color_two=user.color_two or DEFAULT_BANNER_COLOR,
            gradient=user.gradient,

            has_email=user.email is not None,
            email=user.email or "",
            email_valid=user.email_valid,

            discord=DISCORD,
            source=SOURCE_CODE,

            contact=ENABLE_CONTACT_PAGE,
            credits=ENABLE_CREDITS_PAGE
        )

    return gc("404")

def badges(request) -> dict | APIResponse:
    if rl := check_ratelimit(request, "GET /api/init/badges"):
        return rl

    return {
        "success": True,
        "badges": get_badge_data()
    }

def lang(request) -> dict | APIResponse:
    if rl := check_ratelimit(request, "GET /api/init/lang"):
        return rl

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        user = None

    return {
        "success": True,
        "lang": get_lang(user)
    }

def muted(request) -> dict | APIResponse:
    if rl := check_ratelimit(request, "GET /api/init/muted"):
        return rl

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        user = None

    muted: list[tuple[str, int, bool]] | None = None
    if user:
        muted = []

        for i in MutedWord.objects.filter(user__user_id=user.user_id).values_list("string", "is_regex", "hard_mute"):
            if i[1]:
                muted.append((f"/{i[0].split(')', 1)[-1]}/{i[0].split(')')[0].split('(?')[-1]}", 1, i[2]))
            else:
                muted.append((f"{i[0]}", 0, i[2]))

    return {
        "success": True,
        "muted": muted
    }
