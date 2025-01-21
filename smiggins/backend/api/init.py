from posts.models import MutedWord, User

from ..helper import check_ratelimit, get_badge_data, get_lang, get_strings
from ..variables import DISCORD, SOURCE_CODE
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

    if url == "/signup" or url == "/signup/":
        return gc("signup") if user is None else home

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
