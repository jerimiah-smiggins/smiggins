import hashlib
import re
from typing import Callable

from django.http import HttpResponse, HttpResponseRedirect
from posts.models import User

from .variables import MAX_USERNAME_LENGTH, PRIVATE_AUTHENTICATOR_KEY


def sha(string: str | bytes) -> str:
    if isinstance(string, str):
        string = str.encode(string)

    return hashlib.sha256(string).hexdigest()

def sha_to_bytes(string: str | bytes) -> bytes:
    if isinstance(string, str):
        string = str.encode(string)

    return hashlib.sha256(string).digest()

def create_simple_return(
    content: str,
    redirect_logged_out: bool=False,
    redirect_logged_in: bool=False,
    content_type: str="text/html", # Only works with content_override
) -> Callable[..., HttpResponse | HttpResponseRedirect]:
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
    return sha(sha(f"{username}:{password}") + PRIVATE_AUTHENTICATOR_KEY)

def trim_whitespace(string: str, purge_newlines: bool=False) -> tuple[str, bool]:
    string = string.replace("\x0d", "").strip()

    if purge_newlines:
        string = string.replace("\x0a", " ").replace("\x85", "")

    for i in ["\x09", "\x0b", "\x0c", "\xa0", "\u1680", "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200a", "\u200b", "\u2028", "\u2029", "\u202f", "\u205f", "\u3000", "\ufeff"]:
        string = string.replace(i, " ")

    while "\n\n\n" in string:
        string = string.replace("\n\n\n", "\n\n")

    return string, len(string.replace("\u2800", "").strip()) != 0

def find_mentions(message: str, exclude_users: list[str]=[]) -> list[str]:
    return list(set([i for i in re.findall(r"@([a-z0-9\-_]{1," + str(MAX_USERNAME_LENGTH) + r"})\b", message.lower()) if i not in exclude_users]))

def find_hashtags(message: str) -> list[str]:
    return list(set(re.findall(r"#([a-z0-9_]{1,64})(?:\b|[^a-z0-9_])", message.lower())))

def get_container_id(user_one: str, user_two: str) -> str:
    return f"{user_one}:{user_two}" if user_two > user_one else f"{user_two}:{user_one}"
