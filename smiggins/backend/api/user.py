import re

from posts.models import OneTimePassword, User

from ..helper import generate_token, trim_whitespace
from ..variables import (DEFAULT_BANNER_COLOR, ENABLE_NEW_ACCOUNTS,
                         MAX_BIO_LENGTH, MAX_DISPL_NAME_LENGTH,
                         MAX_USERNAME_LENGTH)
from .schema import (Account, ChangePassword, Password, Private, Profile,
                     Username, Verify)

COLOR_REGEX = re.compile("^#[a-f0-9]{6}$")

def signup(request, data: Account) -> tuple[int, dict] | dict:
    # if rl := check_ratelimit(request, "POST /api/user/signup"):
    #     return NEW_RL

    username = data.username.lower().replace(" ", "")
    password = data.password.lower()

    if ENABLE_NEW_ACCOUNTS == "otp":
        try:
            otp = OneTimePassword.objects.get(code=data.otp)
        except OneTimePassword.DoesNotExist:
            return 400, { "success": False, "reason": "INVALID_OTP" }

    # e3b0c44... is the sha256 hash for an empty string
    if len(password) != 64 or password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return 400, { "success": False, "reason": "BAD_PASSWORD" }

    for i in password:
        if i not in "abcdef0123456789":
            return 400, { "success": False, "reason": "BAD_PASSWORD" }

    try:
        User.objects.get(username=username)
        return 400, { "success": False, "reason": "USERNAME_USED" }
    except User.DoesNotExist:
        ...

    if len(username) > MAX_USERNAME_LENGTH or not username \
       or len([i for i in username if i.lower() in "abcdefghijklmnopqrstuvwxyz0123456789_-"]) != len(username):
        return 400, { "success": False, "reason": "BAD_USERNAME" }


    if ENABLE_NEW_ACCOUNTS == "otp":
        otp.delete()

    token = generate_token(username, password)

    User.objects.create(
        username=username,
        token=token,
        display_name=trim_whitespace(data.username, purge_newlines=True)[0][:MAX_DISPL_NAME_LENGTH],
        theme="auto",
        color=DEFAULT_BANNER_COLOR,
        color_two=DEFAULT_BANNER_COLOR,
        language="en-US" # TODO: remove language
    )

    return { "success": True, "token": token }

def login(request, data: Account) -> tuple[int, dict] | dict:
    # if rl := check_ratelimit(request, "POST /api/user/login"):
    #     return NEW_RL

    username = data.username.lower().replace(" ", "")
    token = generate_token(username, data.password)

    try:
        user = User.objects.get(username=username)

        if token == user.token:
            return { "success": True, "token": token }

        return 400, { "success": False, "reason": "BAD_PASSWORD" }

    except User.DoesNotExist:
        return 400, { "success": False, "reason": "BAD_USERNAME" }

def follow_add(request, data: Username):
    return _follow(request, data, False)

def follow_remove(request, data: Username):
    return _follow(request, data, True)

def _follow(request, data: Username, unfollow: bool):
    # if rl := check_ratelimit(request, "POST /api/user/login"):
    #     return NEW_RL

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    try:
        user = User.objects.get(username=data.username.lower())
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "BAD_USERNAME" }

    if unfollow:
        if user.pending_followers.contains(self_user):
            user.pending_followers.remove(self_user)

        if self_user.following.contains(user):
            self_user.following.remove(user)

        return { "success": True }

    if user.blocking.contains(self_user):
        return 400, { "success": False, "reason": "CANT_INTERACT" }
    elif self_user.blocking.contains(user):
        return 400, { "success": False, "reason": "BLOCKING" }

    if user.verify_followers:
        if not user.pending_followers.contains(self_user):
            user.pending_followers.add(self_user)
    elif not self_user.following.contains(user):
        self_user.following.add(user)

    return { "success": True, "pending": user.verify_followers }

def block_add(request, data: Username):
    return _block(request, data, False)

def block_remove(request, data: Username):
    return _block(request, data, True)

def _block(request, data: Username, unblock: bool):
    # if rl := check_ratelimit(request, "POST /api/user/login"):
    #     return NEW_RL

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    try:
        user = User.objects.get(username=data.username.lower())
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "BAD_USERNAME" }

    if unblock:
        if self_user.blocking.contains(user):
            self_user.blocking.remove(user)

        return { "success": True }

    if self_user.following.contains(user):
        self_user.following.remove(user)

    if user.pending_followers.contains(self_user):
        user.pending_followers.remove(self_user)

    if not self_user.blocking.contains(user):
        self_user.blocking.add(user)

    return { "success": True }

def get_profile(request):
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    return {
        "success": True,
        "display_name": user.display_name,
        "bio": user.bio,
        "gradient": user.gradient,
        "color_one": user.color,
        "color_two": user.color_two,
        "verify_followers": user.verify_followers
    }

def save_profile(request, data: Profile):
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    display_name = trim_whitespace(data.display_name[:MAX_DISPL_NAME_LENGTH], True)
    bio = trim_whitespace(data.bio[:MAX_BIO_LENGTH])

    if display_name[1]:
        user.display_name = display_name[0]

    user.bio = bio[0] if bio[1] else ""
    user.gradient = data.gradient

    if re.match(COLOR_REGEX, data.color_one):
        user.color = data.color_one

    if re.match(COLOR_REGEX, data.color_two):
        user.color_two = data.color_two

    user.save()

    return { "success": True }

def set_post_visibility(request, data: Private):
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    user.default_post_private = data.private
    user.save()

    return { "success": True }

def set_verify_followers(request, data: Verify):
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    user.verify_followers = data.verify
    user.save()

    return { "success": True }

def change_password(request, data: ChangePassword) -> dict | tuple[int, dict]:
    # if rl := check_ratelimit(request, "PATCH /api/user/password"):
    #     return rl

    current_token = request.COOKIES.get("token")

    try:
        user = User.objects.get(token=current_token)
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    if generate_token(user.username, data.current_password) != current_token or len(data.new_password) != 64 or data.new_password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return 400, { "success": False, "reason": "BAD_PASSWORD" }

    for i in data.new_password:
        if i not in "abcdef0123456789":
            return 400, { "success": False, "reason": "BAD_PASSWORD" }

    new_token = generate_token(user.username, data.new_password)

    user.token = new_token
    user.save()

    return { "success": True, "token": new_token }

def delete_account(request, data: Password) -> dict | tuple[int, dict]:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return { "success": False, "reason": "NOT_AUTHENTICATED" }

    if user.token == generate_token(user.username, data.password):
        user.delete()
        return { "success": True }

    return { "success": False, "reason": "BAD_PASSWORD" }
