# Contains helper functions. These aren't for routing, instead doing something that can be used in other places in the code.

import threading
import hashlib
import json
import time
import re

from typing import Callable, Any
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader

from posts.models import User, Comment, Post, Notification

from .variables import (
    SITE_NAME,
    VERSION,
    SOURCE_CODE,
    MAX_DISPL_NAME_LENGTH,
    MAX_POST_LENGTH,
    MAX_USERNAME_LENGTH,
    RATELIMIT,
    OWNER_USER_ID,
    ADMIN_LOG_PATH,
    MAX_ADMIN_LOG_LINES,
    MAX_NOTIFICATIONS,
    MAX_BIO_LENGTH,
    ENABLE_USER_BIOS,
    ENABLE_PRONOUNS,
    ENABLE_GRADIENT_BANNERS,
    ENABLE_BADGES,
    ENABLE_PRIVATE_MESSAGES,
    ENABLE_QUOTES,
    ENABLE_POST_DELETION,
    DEFAULT_LANGUAGE,
    CACHE_LANGUAGES,
    ENABLE_HASHTAGS,
    MAX_POLL_OPTION_LENGTH,
    MAX_POLL_OPTIONS,
    ENABLE_CHANGELOG_PAGE,
    ENABLE_CONTACT_PAGE,
    ENABLE_PINNED_POSTS,
    ENABLE_ACCOUNT_SWITCHER,
    ENABLE_POLLS,
    ENABLE_NEW_ACCOUNTS,
    ENABLE_CREDITS_PAGE,
    DEFAULT_THEME,
    MAX_CONTENT_WARNING_LENGTH,
    ENABLE_CONTENT_WARNINGS,
    PRIVATE_AUTHENTICATOR_KEY,
    timeout_handler,
    BASE_DIR,
    VALID_LANGUAGES,
    COMMENT_REGEX
)

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

def get_HTTP_response(request, file: str, lang_override: dict | None=None, **kwargs: Any) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
        theme = user.theme
    except User.DoesNotExist:
        user = None
        theme = DEFAULT_THEME.lower() if DEFAULT_THEME.lower() in ["dawn", "dusk", "dark", "midnight", "black"] else "dark"

    lang = get_lang(user) if lang_override is None else lang_override

    context = {
        "SITE_NAME": SITE_NAME,
        "VERSION": VERSION,
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

        "THEME": theme,
        "lang": lang
    }

    for key, value in kwargs.items():
        context[key] = value

    return HttpResponse(
        loader.get_template(file).render(
            context,
            request
        )
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

    return user.badges + (["administrator"] if user.admin_level >= 1 or user.user_id == OWNER_USER_ID else []) if ENABLE_BADGES else []

def get_post_json(post_id: int, current_user_id: int=0, comment: bool=False, cache: dict[int, User] | None=None) -> dict[str, str | int | dict]:
    # Returns a dict object that includes information about the specified post

    if cache is None:
        cache = {}

    if comment:
        post = Comment.objects.get(comment_id=post_id)
    else:
        post = Post.objects.get(post_id=post_id)

    if post.creator in cache:
        creator = cache[post.creator]
    else:
        creator = User.objects.get(user_id=post.creator)
        cache[post.creator] = creator

    try:
        if current_user_id in cache:
            user = cache[current_user_id]
        else:
            user = User.objects.get(user_id=current_user_id)
            cache[current_user_id] = user
        logged_in = True
    except User.DoesNotExist:
        logged_in = False

    can_delete_all = current_user_id != 0 and (current_user_id == OWNER_USER_ID or User.objects.get(pk=current_user_id).admin_level >= 1)

    if creator.private and current_user_id not in creator.following:
        return {
            "private_acc": True,
            "can_view": False,
            "blocked": False
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
            "private": creator.private,
            "pronouns": creator.pronouns if ENABLE_PRONOUNS else "__",
            "color_one": creator.color,
            "color_two": creator.color_two,
            "gradient_banner": creator.gradient
        },
        "post_id": post_id,
        "content": post.content,
        "timestamp": post.timestamp,
        "liked": current_user_id in (post.likes),
        "likes": len(post.likes),
        "comments": len(post.comments),
        "quotes": len(post.quotes),
        "c_warning": post.content_warning,
        "can_delete": can_delete_all or creator.user_id == current_user_id,
        "can_pin": not comment and creator.user_id == current_user_id,
        "can_view": True,
        "parent": post.parent if isinstance(post, Comment) else -1,
        "parent_is_comment": post.parent_is_comment if isinstance(post, Comment) else False,
        "poll": poll,
        "logged_in": logged_in
    }

    if isinstance(post, Post) and post.quote != 0:
        try:
            if post.quote_is_comment:
                quote = Comment.objects.get(comment_id=post.quote)
            else:
                quote = Post.objects.get(post_id=post.quote)

            if quote.creator in cache:
                quote_creator = cache[quote.creator]
            else:
                quote_creator = User.objects.get(user_id=quote.creator)
                cache[quote.creator] = quote_creator

            if logged_in and quote_creator.user_id in user.blocking:
                quote_info = {
                    "deleted": False,
                    "blocked": True
                }

            elif quote_creator.private and current_user_id not in quote_creator.following:
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
                        "private": quote_creator.private,
                        "pronouns": quote_creator.pronouns if ENABLE_PRONOUNS else "__",
                        "color_one": quote_creator.color,
                        "color_two": quote_creator.color_two,
                        "gradient_banner": quote_creator.gradient
                    },
                    "deleted": False,
                    "comment": post.quote_is_comment,
                    "post_id": quote.post_id if isinstance(quote, Post) else quote.comment_id,
                    "content": quote.content,
                    "timestamp": quote.timestamp,
                    "liked": current_user_id in (quote.likes),
                    "likes": len(quote.likes),
                    "comments": len(quote.comments),
                    "quotes": len(quote.quotes),
                    "c_warning": quote.content_warning,
                    "can_view": True,
                    "blocked": False,
                    "has_quote": isinstance(quote, Post) and quote.quote,
                    "poll": bool(quote.poll) if isinstance(quote, Post) else False
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

def log_admin_action(
    action_name: str,
    admin_user_object: User,
    log_info: str
) -> None:
    # Logs an administrative action

    if ADMIN_LOG_PATH is not None:
        old_log = b"\n".join(open(ADMIN_LOG_PATH, "rb").read().split(b"\n")[:MAX_ADMIN_LOG_LINES - 1:])

        NL = "\n"
        BS = "\\"

        f = open(ADMIN_LOG_PATH, "wb")
        f.write(str.encode(f"{round(time.time())} - {action_name}, done by {admin_user_object.username} (id: {admin_user_object.user_id}) - {log_info.replace(BS, BS * 2).replace(NL, f'{BS}n')}\n") + old_log)
        f.close()

def find_mentions(message: str, exclude_users: list[str]=[]) -> list[str]:
    # Returns a list of all mentioned users in a string. Used for notifications

    return list(set([i for i in re.findall(r"@([a-z0-9\-_]{1," + str(MAX_USERNAME_LENGTH) + r"})", message.lower()) if i not in exclude_users]))

def find_hashtags(message: str) -> list[str]:
    # Returns a list of all hashtags in a string.

    return list(set(re.findall(r"#([a-z0-9_]{1,64})(?:\b|[^a-z0-9_])", message.lower())))

def delete_notification(
    notif: Notification
) -> None:
    try:
        user = notif.is_for
        user.notifications.remove(notif.notif_id)

        try:
            if Notification.objects.get(notif_id=user.notifications[-1]).read:
                user.read_notifs = True
        except IndexError:
            ...

        user.save()

    except ValueError:
        ...

    notif.delete()

def create_notification(
    is_for: User,
    event_type: str, # "comment", "quote", "ping_p", or "ping_c"
    event_id: int # comment id or post id
) -> None:
    # Creates a new notification for the specified user

    timestamp = round(time.time())

    x = Notification.objects.create(
        is_for = is_for,
        event_type = event_type,
        event_id = event_id,
        timestamp = timestamp
    )

    x = Notification.objects.get(
        is_for = is_for,
        event_type = event_type,
        event_id = event_id,
        timestamp = timestamp
    )

    is_for.read_notifs = False
    is_for.notifications.append(x.notif_id)

    if len(is_for.notifications) >= MAX_NOTIFICATIONS:
        for i in is_for.notifications[:-MAX_NOTIFICATIONS:]:
            is_for.notifications.remove(i)
            Notification.objects.get(notif_id=i).delete()

    is_for.save()

def get_container_id(user_one: str, user_two: str) -> str:
    return f"{user_one}:{user_two}" if user_two > user_one else f"{user_two}:{user_one}"

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

    def resolve_dependencies(lang: str, context: dict | None=None) -> dict[str, dict]:
        if context is None:
            context = {}

        f = json.loads(re.sub(COMMENT_REGEX, "", open(BASE_DIR / f"lang/{lang}.json").read()))
        parsed.append(lang)

        context = loop_through(context, f["texts"])

        for i in f["meta"]["fallback"]:
            if i not in parsed:
                resolve_dependencies(i, context)

        return context

    x = resolve_dependencies(lang)
    x["meta"] = {
        "language": lang
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
