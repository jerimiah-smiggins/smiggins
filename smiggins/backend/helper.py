# Contains helper functions. These aren't for routing, instead doing something that can be used in other places in the code.

import hashlib
import json as json_f
import re
import time
from typing import Any, Callable, Literal

from django.core.mail import send_mail
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from posts.backups import backup_db
from posts.models import (Badge, Comment, MutedWord, Notification, Post,
                          Ratelimit, User)

from .api.schema import APIResponse
from .lang import get_lang
from .variables import (ALTERNATE_IPS, DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME,
                        DISCORD, ENABLE_ACCOUNT_SWITCHER, ENABLE_BADGES,
                        ENABLE_CONTACT_PAGE, ENABLE_CONTENT_WARNINGS,
                        ENABLE_CREDITS_PAGE, ENABLE_DYNAMIC_FAVICON,
                        ENABLE_EMAIL, ENABLE_GRADIENT_BANNERS, ENABLE_HASHTAGS,
                        ENABLE_NEW_ACCOUNTS, ENABLE_PINNED_POSTS, ENABLE_POLLS,
                        ENABLE_POST_DELETION, ENABLE_PRIVATE_MESSAGES,
                        ENABLE_PRONOUNS, ENABLE_QUOTES, ENABLE_RATELIMIT,
                        ENABLE_USER_BIOS, GOOGLE_VERIFICATION_TAG,
                        MAX_BIO_LENGTH, MAX_CONTENT_WARNING_LENGTH,
                        MAX_DISPL_NAME_LENGTH, MAX_NOTIFICATIONS,
                        MAX_POLL_OPTION_LENGTH, MAX_POLL_OPTIONS,
                        MAX_POST_LENGTH, MAX_USERNAME_LENGTH,
                        PRIVATE_AUTHENTICATOR_KEY, RATELIMITS, SITE_NAME,
                        SOURCE_CODE, THEMES, VERSION, error)

StringReturn = tuple[str | None, str | None, str | None, int]

def sha(string: str | bytes) -> str:
    # Returns the sha256 hash of a string. (hex)

    if isinstance(string, str):
        string = str.encode(string)

    return hashlib.sha256(string).hexdigest()

def sha_to_bytes(string: str | bytes) -> bytes:
    # Returns the sha256 hash of a string. (bytes)

    if isinstance(string, str):
        string = str.encode(string)

    return hashlib.sha256(string).digest()

def get_strings(request, lang: dict, user: User | None, url_override: str | None=None) -> StringReturn:
    # returns (title, scraper text, meta description, status)
    path = url_override or request.path

    simple_titles = [
        { "path": "", "return": None, "condition": True },
        { "path": "/home", "return": None, "condition": user is not None },
        { "path": "/login", "return": lang["account"]["log_in_title"], "condition": user is None },
        { "path": "/signup", "return": lang["account"]["sign_up_title"], "condition": user is None },
        { "path": "/logout", "return": lang["account"]["log_out_title"], "condition": user is None },
        { "path": "/reset-password", "return": lang["email"]["reset"]["html_title"], "condition": user is None and ENABLE_EMAIL },
        { "path": "/settings", "return": lang["settings"]["title"], "condition": user is not None },
        { "path": "/contact", "return": lang["contact"]["title"], "condition": ENABLE_CONTACT_PAGE },
        { "path": "/notifications", "return": lang["notifications"]["title"], "condition": user is not None },
        { "path": "/credits", "return": lang["credits"]["title"], "condition": ENABLE_CREDITS_PAGE },
        { "path": "/messages", "return": lang["messages"]["list_title"], "condition": user is not None and ENABLE_PRIVATE_MESSAGES },
        { "path": "/pending", "return": lang["user_page"]["pending_title"], "condition": user is not None and user.verify_followers },
        { "path": "/admin", "return": lang["admin"]["title"], "condition": user is not None and user.admin_level },
    ]

    for title in simple_titles:
        if title["condition"] and (path == title["path"] or path == (title["path"] + "/")):
            return title["return"], None, None, 200

    def _get_user_title(x: str) -> StringReturn:
        try:
            u = User.objects.get(username=x)
        except User.DoesNotExist:
            return lang["http"]["404"]["user_title"], f"{lang['http']['404']['user_title']}\n{lang['http']['404']['user_description']}", None, 404

        followers = lang["user_page"]["followers"].replace("%s", str(u.followers.count()))
        following = lang["user_page"]["following"].replace("%s", str(u.following.count()))

        bio = (f"{u.bio}\n\n" if ENABLE_USER_BIOS else "") + f"{followers} - {following}"

        return u.display_name, f"{u.display_name}\n{bio}", bio, 200

    def _get_post_title(x: str) -> StringReturn:
        try:
            p = Post.objects.get(post_id=int(x))
        except Post.DoesNotExist:
            return lang["http"]["404"]["post_title"], f"{lang['http']['404']['post_title']}\n{lang['http']['404']['post_description']}", None, 404

        likes = lang["post_page"]["likes"].replace("%s", str(p.likes.count()))
        comments = lang["post_page"]["comments"].replace("%s", str(len(p.comments)))
        quotes = lang["post_page"]["quotes"].replace("%s", str(len(p.quotes)))
        display_name = p.creator.display_name

        content = f"{p.content}\n\n{likes}{f' - {quotes}' if ENABLE_QUOTES else ''} - {comments}"

        return display_name, f"{display_name}\n{content}", content, 200

    def _get_comment_title(x: str) -> StringReturn:
        try:
            c = Comment.objects.get(comment_id=int(x))
        except Comment.DoesNotExist:
            return lang["http"]["404"]["post_title"], f"{lang['http']['404']['post_title']}\n{lang['http']['404']['post_description']}", None, 404

        likes = lang["post_page"]["likes"].replace("%s", str(c.likes.count()))
        comments = lang["post_page"]["comments"].replace("%s", str(len(c.comments)))
        quotes = lang["post_page"]["quotes"].replace("%s", str(len(c.quotes)))
        display_name = c.creator.display_name

        content = f"{c.content}\n\n{likes}{f' - {quotes}' if ENABLE_QUOTES else ''} - {comments}"

        return display_name, f"{display_name}\n{content}", content, 200

    def _get_message_title(x: str) -> StringReturn:
        try:
            u = User.objects.get(username=x)
        except User.DoesNotExist:
            return None, None, None, 200

        return lang["messages"]["title"].replace("%s", u.display_name), None, None, 200

    complex_titles = [
        { "path": r"^/hashtag/([a-z0-9_]+)/?$", "return": lambda x: (f"#{x}", None, f"#{x}", None), "condition": ENABLE_HASHTAGS },
        { "path": r"^/u/([a-z0-9_\-]+)(?:/lists)?/?$", "return": _get_user_title, "condition": True },
        { "path": r"^/p/([0-9]+)/?$", "return": _get_post_title, "condition": True },
        { "path": r"^/c/([0-9]+)/?$", "return": _get_comment_title, "condition": True },
        { "path": r"^/m/([a-z0-9_\-]+)/?$", "return": _get_message_title, "condition": user is not None and ENABLE_PRIVATE_MESSAGES },
    ]

    for title in complex_titles:
        if not title["condition"]:
            continue

        match = re.match(re.compile(title["path"]), path)
        if match:
            return title["return"](match.group(1))

    print(path)

    return lang["http"]["404"]["standard_title"], f"{lang['http']['404']['standard_title']}\n{lang['http']['404']['standard_description']}", None, 404

def get_badge_data() -> dict[str, str]:
    badges = {}
    data = Badge.objects.all().values_list("name", "svg_data")

    for badge in data:
        badges[badge[0]] = badge[1]

    return badges

def get_HTTP_response(
    request,
    file: str,
    lang_override: dict | None=None,
    raw: bool=False,
    status=200,
    user: User | None | Literal[False]=False,
    **kwargs: Any
) -> HttpResponse:
    backup_db()

    try:
        if user is False:
            user = User.objects.get(token=request.COOKIES.get("token"))

        if user is None:
            raise User.DoesNotExist

        default_post_visibility = user.default_post_private
        theme = user.theme
    except User.DoesNotExist:
        user = None
        theme = "auto"
        default_post_visibility = False

    lang = lang_override or get_lang(user)

    muted: list[tuple[str, int, bool]] = []
    if user:
        for i in MutedWord.objects.filter(user__user_id=user.user_id).values_list("string", "is_regex", "hard_mute"):
            if i[1]:
                muted.append((f"/{i[0].split(')', 1)[-1]}/{i[0].split(')')[0].split('(?')[-1]}", 1, i[2]))
            else:
                muted.append((f"{i[0]}", 0, i[2]))

    badges = get_badge_data()

    context = {
        "SITE_NAME": SITE_NAME,
        "VERSION": lang["generic"]["version"].replace("%v", VERSION),
        "SOURCE": str(SOURCE_CODE).lower(),

        "NOSCRIPT_CHROME": lang["noscript"]["tutorial_chrome"].replace("%u", "chrome://settings/content/javascript"),
        "NOSCRIPT_FF": lang["noscript"]["tutorial_ff"].replace("%u", "about:config").replace("%k", "javascript.enabled").replace("%v", "true"),

        "MAX_USERNAME_LENGTH": MAX_USERNAME_LENGTH,
        "MAX_POST_LENGTH": MAX_POST_LENGTH,
        "MAX_CONTENT_WARNING_LENGTH": MAX_CONTENT_WARNING_LENGTH,
        "MAX_DISPL_NAME_LENGTH": MAX_DISPL_NAME_LENGTH,
        "MAX_BIO_LENGTH": MAX_BIO_LENGTH,
        "MAX_POLL_OPTION_LENGTH": MAX_POLL_OPTION_LENGTH,
        "MAX_POLL_OPTIONS": MAX_POLL_OPTIONS,

        "GOOGLE_VERIFICATION_TAG": GOOGLE_VERIFICATION_TAG,

        "ENABLE_USER_BIOS": str(ENABLE_USER_BIOS).lower(),
        "ENABLE_PRONOUNS": str(ENABLE_PRONOUNS).lower(),
        "ENABLE_GRADIENT_BANNERS": str(ENABLE_GRADIENT_BANNERS).lower(),
        "ENABLE_BADGES": str(ENABLE_BADGES).lower(),
        "ENABLE_PRIVATE_MESSAGES": str(ENABLE_PRIVATE_MESSAGES).lower(),
        "ENABLE_QUOTES": str(ENABLE_QUOTES).lower(),
        "ENABLE_POST_DELETION": str(ENABLE_POST_DELETION).lower(),
        "ENABLE_HASHTAGS": str(ENABLE_HASHTAGS).lower(),
        "ENABLE_CONTACT_PAGE": str(ENABLE_CONTACT_PAGE).lower(),
        "ENABLE_CREDITS_PAGE": str(ENABLE_CREDITS_PAGE).lower(),
        "ENABLE_PINNED_POSTS": str(ENABLE_PINNED_POSTS).lower(),
        "ENABLE_ACCOUNT_SWITCHER": str(ENABLE_ACCOUNT_SWITCHER).lower(),
        "ENABLE_CONTENT_WARNINGS": str(ENABLE_CONTENT_WARNINGS).lower(),
        "ENABLE_POLLS": str(ENABLE_POLLS).lower(),
        "ENABLE_NEW_ACCOUNTS": str(ENABLE_NEW_ACCOUNTS).lower(),
        "ENABLE_EMAIL": str(ENABLE_EMAIL).lower(),
        "ENABLE_DYNAMIC_FAVICON": str(ENABLE_DYNAMIC_FAVICON).lower(),

        "DISCORD": DISCORD or "",

        "DEFAULT_PRIVATE": str(default_post_visibility).lower(),
        "DEFAULT_LIGHT_THEME": json_f.dumps(THEMES[DEFAULT_LIGHT_THEME]),
        "DEFAULT_DARK_THEME": json_f.dumps(THEMES[DEFAULT_DARK_THEME]),
        "username": user.username if user else None,
        "lang": lang,
        "lang_str": json_f.dumps(lang),
        "theme_str": "{}" if theme == "auto" or theme not in THEMES else json_f.dumps(THEMES[theme]),
        "THEME": theme if theme in THEMES else "auto",
        "badges": badges,
        "badges_str": json_f.dumps(badges),
        "is_admin": bool(user and user.admin_level),
        "muted": json_f.dumps(muted) if muted else "null",
        "muted_str_soft": "\n".join([i[0] for i in muted if not i[2]]),
        "muted_str_hard": "\n".join([i[0] for i in muted if i[2]]),
        "self_username": user.username if user else ""
    }

    for key, value in kwargs.items():
        context[key] = value

    return ((lambda content, status: content) if raw else HttpResponse)(
        loader.get_template(file).render(
            context,
            request
        ), status=status
    )

def validate_username(username: str, existing: bool=True) -> int:
    # Ensures the specified username is valid. If existing is true, then it checks
    # if the specified username exists, and if it is false, then it checks to make
    # sure it doesn't already exist and that it is valid.
    #  1 - valid
    #  0 - invalid
    # -1 - taken
    # -2 - invalid characters
    # -3 - invalid length

    username = username.lower()

    for i in username:
        if i not in "abcdefghijklmnopqrstuvwxyz0123456789_-":
            return -2

    if existing:
        try:
            User.objects.get(username=username)
            return 1
        except User.DoesNotExist:
            return 0
    else:
        try:
            User.objects.get(username=username)
            return -1
        except User.DoesNotExist:
            pass

        if (len(username) > MAX_USERNAME_LENGTH or len(username) < 1):
            return -3

        return 1

def create_simple_return(
    template_path: str,
    redirect_logged_out: bool=False,
    redirect_logged_in: bool=False,
    content_type: str="text/html", # Only works with content_override
    content_override: str | None=None
) -> Callable[..., HttpResponse | HttpResponseRedirect]:
    # This creates a response object. This was made so that its standardized
    # and creates less repeated code.

    def logged_in(request) -> bool:
        try:
            User.objects.get(token=request.COOKIES.get("token"))
            return True
        except User.DoesNotExist:
            return False

    def x(request) -> HttpResponse | HttpResponseRedirect:
        if (redirect_logged_in and logged_in(request)) or (redirect_logged_out and not logged_in(request)):
            return HttpResponseRedirect("/" if redirect_logged_in else "/", status=307)
        else:
            return HttpResponse(content_override, content_type=content_type) if content_override else get_HTTP_response(request, template_path)

    x.__name__ = template_path
    return x

def generate_token(username: str, password: str) -> str:
    # Generates a User' token given their username and hashed password.

    return sha(sha(f"{username}:{password}") + PRIVATE_AUTHENTICATOR_KEY)

def check_ratelimit(request, route_id: str) -> None | APIResponse:
    if not ENABLE_RATELIMIT:
        return None

    if route_id not in RATELIMITS:
        error(f"[RATELIMIT] Unknown route id {route_id}")
        return None

    rl_info = RATELIMITS[route_id]
    route_id = route_id[:100]

    if not rl_info:
        return None

    now: int = int(time.time())
    user_id: str = (request.COOKIES.get("token") or get_ip_addr(request))[:64] # cap max length to not fuck up databsae calls if something goes wrong
    Ratelimit.objects.filter(route_id=route_id, expires__lt=now).delete()

    if Ratelimit.objects.filter(route_id=route_id, user_id=user_id).count() >= rl_info[0]:
        try:
            user = User.objects.get(token=request.COOKIES.get("token"))
        except User.DoesNotExist:
            user = None

        lang = get_lang(user)

        return 429, {
            "success": False,
            "message": lang["generic"]["ratelimit"]
        }

    Ratelimit.objects.create(route_id=route_id, user_id=user_id, expires=now + rl_info[1])

    return None

def trim_whitespace(string: str, purge_newlines: bool=False) -> tuple[str, bool]:
    # Trims whitespace from strings
    # reutrn: new_string, has_content

    string = string.replace("\x0d", "").strip()

    if purge_newlines:
        string = string.replace("\x0a", " ").replace("\x85", "")

    for i in ["\x09", "\x0b", "\x0c", "\xa0", "\u1680", "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200a", "\u200b", "\u2028", "\u2029", "\u202f", "\u205f", "\u3000", "\ufeff"]:
        string = string.replace(i, " ")

    while "\n\n\n" in string:
        string = string.replace("\n\n\n", "\n\n")

    return string, len(string.replace("\u2800", "").strip()) != 0

def find_mentions(message: str, exclude_users: list[str]=[]) -> list[str]:
    # Returns a list of all mentioned users in a string. Used for notifications

    return list(set([i for i in re.findall(r"@([a-z0-9\-_]{1," + str(MAX_USERNAME_LENGTH) + r"})", message.lower()) if i not in exclude_users]))

def find_hashtags(message: str) -> list[str]:
    # Returns a list of all hashtags in a string.

    return list(set(re.findall(r"#([a-z0-9_]{1,64})(?:\b|[^a-z0-9_])", message.lower())))

def delete_notification(
    notif: Notification
) -> None:
    notif.delete()

def create_notification(
    is_for: User,
    event_type: str, # "comment", "quote", "ping_p", or "ping_c"
    event_id: int # comment id or post id
) -> None:
    # Creates a new notification for the specified user

    timestamp = round(time.time())

    Notification.objects.create(
        is_for=is_for,
        event_type=event_type,
        event_id=event_id,
        timestamp=timestamp
    )

    c = is_for.notifications.count() - MAX_NOTIFICATIONS
    modified = False
    for i in range(max(c, 0)):
        modified = True
        f = is_for.notifications.first()
        if f:
            f.delete()

    if modified:
        is_for.save()

def get_container_id(user_one: str, user_two: str) -> str:
    return f"{user_one}:{user_two}" if user_two > user_one else f"{user_two}:{user_one}"

def send_email(subject: str, recipients: list[str], raw_message: str, html_message: str | None=None) -> int:
    return send_mail(
        subject=subject,
        message=raw_message,
        html_message=html_message,
        from_email=None,
        recipient_list=recipients
    )

# Used only once
def get_ip_addr(request) -> str:
    if isinstance(ALTERNATE_IPS, str):
        return request.headers.get(ALTERNATE_IPS)

    if ALTERNATE_IPS:
        return request.headers.get("X-Real-IP")

    return request.META.get("REMOTE_ADDR")

def check_muted_words(*content: str) -> bool:
    # True - IS muted
    # False - is NOT muted

    for mw in MutedWord.objects.filter(user=None):
        if mw.is_regex:
            word = re.compile(mw.string)
        else:
            word = re.compile("\\b" + mw.string.replace(" ", "\\b.+\\b") + "\\b", re.DOTALL | re.IGNORECASE)

        for val in content:
            if word.match(val):
                return True

    return False
