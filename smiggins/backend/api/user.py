import re

from django.http import HttpRequest, HttpResponse
from posts.models import OneTimePassword, User

from ..helper import generate_token, trim_whitespace
from ..variables import (DEFAULT_BANNER_COLOR, ENABLE_NEW_ACCOUNTS,
                         MAX_BIO_LENGTH, MAX_DISPL_NAME_LENGTH,
                         MAX_USERNAME_LENGTH)
from .builder import ErrorCodes, ResponseCodes, build_response
from .parser import _to_hex, parse_request
from .schema import Profile

COLOR_REGEX = re.compile("^#[a-f0-9]{6}$")

def signup(request: HttpRequest) -> HttpResponse:
    # if rl := check_ratelimit(request, "POST /api/user/signup"):
    #     return NEW_RL

    data = parse_request(request.body, ResponseCodes.SIGN_UP)
    print(data)

    if not ENABLE_NEW_ACCOUNTS:
        return build_response(ResponseCodes.SIGN_UP, ErrorCodes.BAD_REQUEST)

    username = data["username"].lower().replace(" ", "")
    password = data["password"].lower()

    if ENABLE_NEW_ACCOUNTS == "otp":
        try:
            otp = OneTimePassword.objects.get(code=data["otp"])
        except OneTimePassword.DoesNotExist:
            return build_response(ResponseCodes.SIGN_UP, ErrorCodes.INVALID_OTP)

    # e3b0c44... is the sha256 hash for an empty string
    if len(password) != 64 or password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return build_response(ResponseCodes.SIGN_UP, ErrorCodes.BAD_PASSWORD)

    for i in password:
        if i not in "abcdef0123456789":
            return build_response(ResponseCodes.SIGN_UP, ErrorCodes.BAD_PASSWORD)

    try:
        User.objects.get(username=username)
        return build_response(ResponseCodes.SIGN_UP, ErrorCodes.USERNAME_USED)
    except User.DoesNotExist:
        ...

    if len(username) > MAX_USERNAME_LENGTH or not username \
       or len([i for i in username if i.lower() in "abcdefghijklmnopqrstuvwxyz0123456789_-"]) != len(username):
        return build_response(ResponseCodes.SIGN_UP, ErrorCodes.BAD_USERNAME)

    if ENABLE_NEW_ACCOUNTS == "otp":
        otp.delete()

    token = generate_token(username, password)

    User.objects.create(
        username=username,
        token=token,
        display_name=trim_whitespace(data["username"], purge_newlines=True)[0][:MAX_DISPL_NAME_LENGTH],
        color=DEFAULT_BANNER_COLOR,
        color_two=DEFAULT_BANNER_COLOR
    )

    return build_response(ResponseCodes.SIGN_UP, [bytearray.fromhex(token)])

def login(request: HttpRequest) -> HttpResponse:
    # if rl := check_ratelimit(request, "POST /api/user/login"):
    #     return NEW_RL

    data = parse_request(request.body, ResponseCodes.LOG_IN)

    print(data)

    username = data["username"].lower().replace(" ", "")
    token = generate_token(username, data["password"])

    try:
        user = User.objects.get(username=username)

        if token == user.token:
            return build_response(ResponseCodes.LOG_IN, [bytearray.fromhex(token)])

        return build_response(ResponseCodes.LOG_IN, ErrorCodes.BAD_PASSWORD)

    except User.DoesNotExist:
        return build_response(ResponseCodes.LOG_IN, ErrorCodes.BAD_USERNAME)

def follow_add(request: HttpRequest) -> HttpResponse:
    return _follow(request, False)

def follow_remove(request: HttpRequest) -> HttpResponse:
    return _follow(request, True)

def _follow(request: HttpRequest, unfollow: bool) -> HttpResponse:
    # if rl := check_ratelimit(request, "POST /api/user/login"):
    #     return NEW_RL

    rc = ResponseCodes.UNFOLLOW if unfollow else ResponseCodes.FOLLOW

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(rc, ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=bytes.decode(request.body).lower())
    except User.DoesNotExist:
        return build_response(rc, ErrorCodes.BAD_USERNAME)

    if unfollow:
        if user.pending_followers.contains(self_user):
            user.pending_followers.remove(self_user)

        if self_user.following.contains(user):
            self_user.following.remove(user)

        return build_response(rc)

    if user.blocking.contains(self_user):
        return build_response(rc, ErrorCodes.CANT_INTERACT)
    elif self_user.blocking.contains(user):
        return build_response(rc, ErrorCodes.BLOCKING)

    if user.verify_followers:
        if not user.pending_followers.contains(self_user):
            user.pending_followers.add(self_user)
    elif not self_user.following.contains(user):
        self_user.following.add(user)

    return build_response(rc, [user.verify_followers])

def block_add(request: HttpRequest) -> HttpResponse:
    return _block(request, False)

def block_remove(request: HttpRequest) -> HttpResponse:
    return _block(request, True)

def _block(request: HttpRequest, unblock: bool) -> HttpResponse:
    # if rl := check_ratelimit(request, "POST /api/user/login"):
    #     return NEW_RL

    rc = ResponseCodes.UNBLOCK if unblock else ResponseCodes.BLOCK

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(rc, ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=bytes.decode(request.body).lower())
    except User.DoesNotExist:
        return build_response(rc, ErrorCodes.BAD_USERNAME)

    if unblock:
        if self_user.blocking.contains(user):
            self_user.blocking.remove(user)

    else:
        if self_user.following.contains(user):
            self_user.following.remove(user)

        if user.pending_followers.contains(self_user):
            user.pending_followers.remove(self_user)

        if not self_user.blocking.contains(user):
            self_user.blocking.add(user)

    return build_response(rc)

def get_profile(request: HttpRequest) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.GET_PROFILE, ErrorCodes.NOT_AUTHENTICATED)

    return build_response(ResponseCodes.GET_PROFILE, [
        (user.display_name, 8),
        (user.bio, 16),
        bytearray.fromhex(user.color[1:]),
        bytearray.fromhex(user.color_two[1:] or user.color[1:]),
        user.gradient,
        user.verify_followers
    ])

def save_profile(request: HttpRequest) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.SAVE_PROFILE, ErrorCodes.NOT_AUTHENTICATED)

    data = parse_request(request.body, ResponseCodes.SAVE_PROFILE)

    display_name = trim_whitespace(data["display_name"][:MAX_DISPL_NAME_LENGTH], True)
    bio = trim_whitespace(data["bio"][:MAX_BIO_LENGTH])

    if display_name[1]:
        user.display_name = display_name[0]

    user.bio = bio[0] if bio[1] else ""
    user.gradient = data["gradient"]

    if re.match(COLOR_REGEX, data["color_one"]):
        user.color = data["color_one"]

    if re.match(COLOR_REGEX, data["color_two"]):
        user.color_two = data["color_two"]

    user.save()

    return build_response(ResponseCodes.SAVE_PROFILE)

def set_post_visibility(request: HttpRequest) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.DEFAULT_VISIBILITY, ErrorCodes.NOT_AUTHENTICATED)

    user.default_post_private = bool(int(request.body[0]))
    user.save()

    return build_response(ResponseCodes.DEFAULT_VISIBILITY)

def set_verify_followers(request: HttpRequest) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.VERIFY_FOLLOWERS, ErrorCodes.NOT_AUTHENTICATED)

    user.verify_followers = bool(int(request.body[0]))
    user.save()

    return build_response(ResponseCodes.VERIFY_FOLLOWERS)

def change_password(request: HttpRequest) -> HttpResponse:
    # if rl := check_ratelimit(request, "PATCH /api/user/password"):
    #     return rl

    current_token = request.COOKIES.get("token")

    current_pw = _to_hex(request.body[:32])
    new_pw = _to_hex(request.body[32:64])

    try:
        user = User.objects.get(token=current_token)
    except User.DoesNotExist:
        return build_response(ResponseCodes.CHANGE_PASSWORD, ErrorCodes.NOT_AUTHENTICATED)

    if generate_token(user.username, current_pw) != current_token or len(new_pw) != 64 or new_pw == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return build_response(ResponseCodes.CHANGE_PASSWORD, ErrorCodes.BAD_PASSWORD)

    for i in new_pw:
        if i not in "abcdef0123456789":
            return build_response(ResponseCodes.CHANGE_PASSWORD, ErrorCodes.BAD_PASSWORD)

    new_token = generate_token(user.username, new_pw)

    user.token = new_token
    user.save()

    return build_response(ResponseCodes.CHANGE_PASSWORD, [bytearray.fromhex(new_token)])

def delete_account(request: HttpRequest) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.DELETE_ACCOUNT, ErrorCodes.NOT_AUTHENTICATED)

    if user.token == generate_token(user.username, _to_hex(request.body[:32])):
        user.delete()
        return build_response(ResponseCodes.DELETE_ACCOUNT)

    return build_response(ResponseCodes.DELETE_ACCOUNT, ErrorCodes.BAD_PASSWORD)
