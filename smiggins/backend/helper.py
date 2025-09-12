# Contains helper functions. These aren't for routing, instead doing something that can be used in other places in the code.

import hashlib
import re
import time
from typing import Callable

from django.core.mail import send_mail
from django.http import HttpResponse, HttpResponseRedirect
from posts.models import MutedWord, Notification, Ratelimit, User

from .api.schema import APIResponse
from .variables import (ALTERNATE_IPS, MAX_NOTIFICATIONS, MAX_USERNAME_LENGTH,
                        PRIVATE_AUTHENTICATOR_KEY, error)

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

def create_simple_return(
    content: str,
    redirect_logged_out: bool=False,
    redirect_logged_in: bool=False,
    content_type: str="text/html", # Only works with content_override
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
            return HttpResponse(content, content_type=content_type)

    x.__name__ = content
    return x

def generate_token(username: str, password: str) -> str:
    # Generates a User' token given their username and hashed password.

    return sha(sha(f"{username}:{password}") + PRIVATE_AUTHENTICATOR_KEY)

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

def create_notification( # TODO: rewrite
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

# Used only once
def get_ip_addr(request) -> str:
    if isinstance(ALTERNATE_IPS, str):
        return request.headers.get(ALTERNATE_IPS)

    if ALTERNATE_IPS:
        return request.headers.get("X-Real-IP")

    return request.META.get("REMOTE_ADDR")
