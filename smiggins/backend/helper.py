# Contains helper functions. These aren't for routing, instead doing something that can be used in other places in the code.

import hashlib
import json as json_f
import re
import threading
import time
from typing import Any, Callable, Literal

import json5 as json
from django.core.mail import send_mail
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from posts.models import Comment, Notification, Post, User

from .variables import (BADGE_DATA, BASE_DIR, CACHE_LANGUAGES,
                        DEFAULT_DARK_THEME, DEFAULT_LANGUAGE,
                        DEFAULT_LIGHT_THEME, DISCORD, ENABLE_ACCOUNT_SWITCHER,
                        ENABLE_BADGES, ENABLE_CHANGELOG_PAGE,
                        ENABLE_CONTACT_PAGE, ENABLE_CONTENT_WARNINGS,
                        ENABLE_CREDITS_PAGE, ENABLE_EDITING_POSTS,
                        ENABLE_EMAIL, ENABLE_GRADIENT_BANNERS, ENABLE_HASHTAGS,
                        ENABLE_NEW_ACCOUNTS, ENABLE_PINNED_POSTS, ENABLE_POLLS,
                        ENABLE_POST_DELETION, ENABLE_PRIVATE_MESSAGES,
                        ENABLE_PRONOUNS, ENABLE_QUOTES, ENABLE_USER_BIOS,
                        GOOGLE_VERIFICATION_TAG, MAX_BIO_LENGTH,
                        MAX_CONTENT_WARNING_LENGTH, MAX_DISPL_NAME_LENGTH,
                        MAX_NOTIFICATIONS, MAX_POLL_OPTION_LENGTH,
                        MAX_POLL_OPTIONS, MAX_POST_LENGTH, MAX_USERNAME_LENGTH,
                        OWNER_USER_ID, PRIVATE_AUTHENTICATOR_KEY, RATELIMIT,
                        SITE_NAME, SOURCE_CODE, THEMES, VALID_LANGUAGES,
                        VERSION, timeout_handler)


def sha(string: str | bytes) -> str:
    # Returns the sha256 hash of a string.

    if isinstance(string, str):
        return hashlib.sha256(str.encode(string)).hexdigest()
    elif isinstance(string, bytes):
        return hashlib.sha256(string).hexdigest()
    return ""

def set_timeout(callback: Callable, delay_ms: int | float) -> None:
    # Works like javascript's setTimeout function.
    # Callback is a callable which will be called after
    # delay_ms has passed.

    def wrapper():
        threading.Event().wait(delay_ms / 1000)
        callback()

    thread = threading.Thread(target=wrapper)
    thread.start()

def get_HTTP_response(
    request,
    file: str,
    lang_override: dict | None=None,
    raw: bool=False,
    status=200,
    user: User | None | Literal[False]=False,
    **kwargs: Any
) -> HttpResponse:
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
        "ENABLE_CHANGELOG_PAGE": str(ENABLE_CHANGELOG_PAGE).lower(),
        "ENABLE_CONTACT_PAGE": str(ENABLE_CONTACT_PAGE).lower(),
        "ENABLE_CREDITS_PAGE": str(ENABLE_CREDITS_PAGE).lower(),
        "ENABLE_PINNED_POSTS": str(ENABLE_PINNED_POSTS).lower(),
        "ENABLE_ACCOUNT_SWITCHER": str(ENABLE_ACCOUNT_SWITCHER).lower(),
        "ENABLE_CONTENT_WARNINGS": str(ENABLE_CONTENT_WARNINGS).lower(),
        "ENABLE_POLLS": str(ENABLE_POLLS).lower(),
        "ENABLE_NEW_ACCOUNTS": str(ENABLE_NEW_ACCOUNTS).lower(),
        "ENABLE_EMAIL": str(ENABLE_EMAIL).lower(),

        "DISCORD": DISCORD or "",

        "DEFAULT_PRIVATE": str(default_post_visibility).lower(),
        "DEFAULT_LIGHT_THEME": json_f.dumps(THEMES[DEFAULT_LIGHT_THEME]),
        "DEFAULT_DARK_THEME": json_f.dumps(THEMES[DEFAULT_DARK_THEME]),
        "lang": lang,
        "lang_str": json_f.dumps(lang),
        "theme_str": "{}" if theme == "auto" or theme not in THEMES else json_f.dumps(THEMES[theme]),
        "THEME": theme if theme in THEMES else "auto",
        "badges": BADGE_DATA,
        "badges_str": json_f.dumps(BADGE_DATA)
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

    for i in username:
        if i not in "abcdefghijklmnopqrstuvwxyz0123456789_-":
            return -2

    if existing:
        try:
            User.objects.get(username=username).username
            return 1
        except User.DoesNotExist:
            return 0
    else:
        try:
            User.objects.get(username=username).username
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
            return HttpResponseRedirect("/home/" if redirect_logged_in else "/", status=307)
        else:
            return HttpResponse(content_override, content_type=content_type) if content_override else get_HTTP_response(request, template_path)

    x.__name__ = template_path
    return x

def generate_token(username: str, password: str) -> str:
    # Generates a User' token given their username and hashed password.

    return sha(sha(f"{username}:{password}") + PRIVATE_AUTHENTICATOR_KEY)

def create_api_ratelimit(api_id: str, time_ms: int | float, identifier: str | None) -> None:
    # Creates a ratelimit timeout for a specific user via the identifier.
    # The identifier should be the request.META.REMOTE_ADDR ip address
    # api_id is the identifier for the api, for example "api_account_signup". You
    # can generally use the name of that api's function for this.

    if not RATELIMIT:
        return

    identifier = str(identifier)

    if api_id not in timeout_handler:
        timeout_handler[api_id] = {}
    timeout_handler[api_id][identifier] = None

    def x():
        timeout_handler[api_id].pop(identifier)

    x.__name__ = f"{api_id}:{identifier}"
    set_timeout(x, time_ms)

def ensure_ratelimit(api_id: str, identifier: str | None) -> bool:
    # Returns whether or not a certain api is ratelimited for the specified
    # identifier. True = not ratelimited, False = ratelimited

    return (not RATELIMIT) or not (api_id in timeout_handler and str(identifier) in timeout_handler[api_id])

def get_badges(user: User) -> list[str]:
    # Returns the list of badges for the specified user

    return list(user.badges.all().values_list("name", flat=True)) + (["administrator"] if user.admin_level != 0 or user.user_id == OWNER_USER_ID else []) if ENABLE_BADGES else []

def can_view_post(self_user: User | None, creator: User | None, post: Post | Comment) -> tuple[Literal[True]] | tuple[Literal[False], Literal["blocked", "private", "blocking"]]:
    if self_user is None:
        return True,

    creator = post.creator

    if creator.user_id == self_user.user_id:
        return True,

    if creator.blocking.contains(self_user):
        return False, "blocked"

    if post.private and not creator.followers.contains(self_user):
        return False, "private"

    if self_user.blocking.contains(creator):
        return False, "blocking"

    return True,

def get_post_json(post_id: int | Post | Comment, current_user_id: int=0, comment: bool=False) -> dict[str, str | int | dict]:
    # Returns a dict object that includes information about the specified post
    # When editing the json content response of this function, make sure you also
    # correct the schema in static/ts/globals.d.ts

    if comment:
        post = Comment.objects.get(comment_id=post_id) if isinstance(post_id, int) else post_id
    else:
        post = Post.objects.get(post_id=post_id) if isinstance(post_id, int) else post_id

    post_id = post.post_id if isinstance(post, Post) else post.comment_id

    creator = post.creator

    try:
        user = User.objects.get(user_id=current_user_id)
    except User.DoesNotExist:
        user = None

    can_delete_all = current_user_id != 0 and (current_user_id == OWNER_USER_ID or User.objects.get(pk=current_user_id).admin_level >= 1)

    can_view = can_view_post(user, creator, post)

    if can_view[0] is False:
        if can_view[1] == "private":
            return {
                "private_acc": True,
                "can_view": False,
                "blocked": False
            }

        if can_view[1] == "blocked":
            return {
                "deleted": False,
                "blocked": True,
                "blocked_by_self": False
            }

    if isinstance(post, Post) and isinstance(post.poll, dict):
        tmp_poll: dict[str, Any] = post.poll

        poll = {
            "votes": len(tmp_poll["votes"]),
            "voted": current_user_id in tmp_poll["votes"],
            "content": [{
                "value": i["value"],
                "votes": len(i["votes"]),
                "voted": current_user_id in i["votes"]
            } for i in tmp_poll["content"]], # type: ignore
        }

    else:
        poll = None

    post_json = {
        "creator": {
            "display_name": creator.display_name,
            "username": creator.username,
            "badges": get_badges(creator),
            "pronouns": creator.pronouns if ENABLE_PRONOUNS else "__",
            "color_one": creator.color,
            "color_two": creator.color_two,
            "gradient_banner": creator.gradient
        },
        "private": post.private,
        "post_id": post_id,
        "content": post.content,
        "timestamp": post.timestamp,
        "liked": post.likes.filter(user_id=user.user_id).exists() if user else False,
        "likes": post.likes.count(),
        "comments": len(post.comments),
        "quotes": len(post.quotes),
        "c_warning": post.content_warning,
        "can_delete": can_delete_all or creator.user_id == current_user_id,
        "can_pin": not comment and creator.user_id == current_user_id,
        "can_edit": creator.user_id == current_user_id and ENABLE_EDITING_POSTS,
        "can_view": True,
        "parent": post.parent if isinstance(post, Comment) else -1,
        "parent_is_comment": post.parent_is_comment if isinstance(post, Comment) else False,
        "poll": poll,
        "logged_in": user is not None,
        "edited": post.edited,
        "edited_at": post.edited_at
    }

    if isinstance(post, Post) and post.quote != 0:
        try:
            if post.quote_is_comment:
                quote = Comment.objects.get(comment_id=post.quote)
            else:
                quote = Post.objects.get(post_id=post.quote)

            quote_creator = quote.creator
            can_view_quote = can_view_post(user, quote_creator, quote)

            if can_view_quote[0] is False:
                if can_view_quote[1] == "blocking":
                    quote_info = {
                        "deleted": False,
                        "blocked": True,
                        "blocked_by_self": True
                    }

                if can_view_quote[1] == "blocked":
                    quote_info = {
                        "deleted": False,
                        "blocked": True,
                        "blocked_by_self": False
                    }

                if can_view_quote[1] == "private":
                    quote_info = {
                        "deleted": False,
                        "private_acc": True,
                        "can_view": False,
                        "blocked": False
                    }

            else:
                quote_info = {
                    "creator": {
                        "display_name": quote_creator.display_name,
                        "username": quote_creator.username,
                        "badges": get_badges(quote_creator),
                        "pronouns": quote_creator.pronouns if ENABLE_PRONOUNS else "__",
                        "color_one": quote_creator.color,
                        "color_two": quote_creator.color_two,
                        "gradient_banner": quote_creator.gradient
                    },
                    "private": quote.private,
                    "deleted": False,
                    "comment": post.quote_is_comment,
                    "post_id": quote.post_id if isinstance(quote, Post) else quote.comment_id,
                    "content": quote.content,
                    "timestamp": quote.timestamp,
                    "liked": quote.likes.filter(user_id=user.user_id).exists() if user else False,
                    "likes": quote.likes.count(),
                    "comments": len(quote.comments),
                    "quotes": len(quote.quotes),
                    "c_warning": quote.content_warning,
                    "can_view": True,
                    "blocked": False,
                    "has_quote": isinstance(quote, Post) and quote.quote,
                    "poll": bool(quote.poll) if isinstance(quote, Post) else False,
                    "edited": quote.edited,
                    "edited_at": quote.edited_at
                }

        except Comment.DoesNotExist:
            quote_info = {
                "deleted": True
            }
        except Post.DoesNotExist:
            quote_info = {
                "deleted": True
            }

        post_json["quote"] = quote_info

    return post_json

def trim_whitespace(string: str, purge_newlines: bool=False) -> str:
    # Trims whitespace from strings

    string = string.replace("\x0d", "")

    if purge_newlines:
        string = string.replace("\x0a", " ").replace("\x85", "")

    for i in ["\x09", "\x0b", "\x0c", "\xa0", "\u1680", "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200a", "\u200b", "\u2028", "\u2029", "\u202f", "\u205f", "\u2800", "\u3000", "\ufeff"]:
        string = string.replace(i, " ")

    while "\n " in string:
        string = string.replace("\n ", "\n")

    while "  " in string:
        string = string.replace("  ", " ")

    while "\n\n\n" in string:
        string = string.replace("\n\n\n", "\n\n")

    while len(string) and string[0] in " \n":
        string = string[1::]

    while len(string) and string[-1] in " \n":
        string = string[:-1:]

    return string

def find_mentions(message: str, exclude_users: list[str]=[]) -> list[str]:
    # Returns a list of all mentioned users in a string. Used for notifications

    return list(set([i for i in re.findall(r"@([a-z0-9\-_]{1," + str(MAX_USERNAME_LENGTH) + r"})", message.lower()) if i not in exclude_users]))

def find_hashtags(message: str) -> list[str]:
    # Returns a list of all hashtags in a string.

    return list(set(re.findall(r"#([a-z0-9_]{1,64})(?:\b|[^a-z0-9_])", message.lower())))

def delete_notification(
    notif: Notification
) -> None:
    user = notif.is_for

    try:
        last = user.notifications.last()
        if last and last.read:
            user.read_notifs = True
            user.save()

    except IndexError:
        ...

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

    is_for.read_notifs = False

    c = is_for.notifications.count() - MAX_NOTIFICATIONS
    for i in range(max(c, 0)):
        f = is_for.notifications.first()
        if f:
            f.delete()

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

def get_lang(lang: User | str | None=None, override_cache=False) -> dict[str, dict]:
    # Gets the language file for the specified user/language

    if isinstance(lang, User):
        lang = lang.language or DEFAULT_LANGUAGE
    elif not isinstance(lang, str):
        lang = DEFAULT_LANGUAGE

    if not override_cache and CACHE_LANGUAGES:
        return LANGS[lang]

    parsed = []

    def loop_through(found: dict, context: dict) -> dict:
        if isinstance(context, dict):
            for i in context:
                if isinstance(context[i], str):
                    if i not in found:
                        found[i] = context[i]
                else:
                    if i not in found:
                        found[i] = context[i]
                    else:
                        found[i] = loop_through(found[i], context[i])
        else:
            if len(found) == 0:
                found = context

        return found

    def resolve_dependencies(lang: str, context: dict | None=None) -> tuple[dict[str, dict], dict]:
        if context is None:
            context = {}

        f = json.load(open(BASE_DIR / f"lang/{lang}.json"))
        parsed.append(lang)

        context = loop_through(context, f["texts"])

        for i in f["meta"]["fallback"]:
            if i not in parsed:
                resolve_dependencies(i, context)

        return context, f

    x, full = resolve_dependencies(lang)

    x["meta"] = {
        "language": lang,
        "version": full["meta"]["version"],
        "maintainers": full["meta"]["maintainers"],
        "past_maintainers": full["meta"]["past_maintainers"],
        "name": full["meta"]["name"]
    }

    temp_lang = {}
    for i in sorted(x["changelog"]["changes"], reverse=True, key=lambda a: tuple(map(int, a[1::].split('.')))):
        temp_vals = {}
        for o in sorted(x["changelog"]["changes"][i], key=int):
            temp_vals[str(o)] = x["changelog"]["changes"][i][str(o)]
        temp_lang[i] = temp_vals

    x["changelog"]["changes"] = temp_lang

    return x

LANGS = {}
if CACHE_LANGUAGES:
    for i in VALID_LANGUAGES:
        LANGS[i["code"]] = get_lang(i["code"], True)

DEFAULT_LANG = get_lang()
