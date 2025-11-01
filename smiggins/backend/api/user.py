import re

from django.http import HttpRequest, HttpResponse
from posts.models import InviteCode, User

from ..helper import generate_token, trim_whitespace
from ..variables import (DEFAULT_BANNER_COLOR, ENABLE_NEW_ACCOUNTS,
                         MAX_BIO_LENGTH, MAX_DISPL_NAME_LENGTH,
                         MAX_USERNAME_LENGTH)
from .format import (ErrorCodes, api_AcceptFolreq, api_Block,
                     api_ChangePassword, api_DeleteAccount, api_DenyFolreq,
                     api_Follow, api_GetProfile, api_LogIn, api_SaveProfile,
                     api_SetDefaultVisibility, api_SignUp, api_Unblock,
                     api_Unfollow)

COLOR_REGEX = re.compile(r"^#[a-f0-9]{6}$")

def signup(request: HttpRequest) -> HttpResponse:
    api = api_SignUp()
    data = api.parse_request(request.body)

    if not ENABLE_NEW_ACCOUNTS:
        return api.error(ErrorCodes.BAD_REQUEST)

    username = data["username"].lower().replace(" ", "")
    password = data["password"].lower()

    if ENABLE_NEW_ACCOUNTS == "otp":
        try:
            otp = InviteCode.objects.get(id=data["otp"])
        except InviteCode.DoesNotExist:
            return api.error(ErrorCodes.INVALID_OTP)

    # e3b0c44... is the sha256 hash for an empty string
    if len(password) != 64 or password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return api.error(ErrorCodes.BAD_PASSWORD)

    for i in password:
        if i not in "abcdef0123456789":
            return api.error(ErrorCodes.BAD_PASSWORD)

    try:
        User.objects.get(username=username)
        return api.error(ErrorCodes.USERNAME_USED)
    except User.DoesNotExist:
        ...

    if len(username) > MAX_USERNAME_LENGTH or not username \
       or len([i for i in username if i.lower() in "abcdefghijklmnopqrstuvwxyz0123456789_-"]) != len(username):
        return api.error(ErrorCodes.BAD_USERNAME)

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

    return api.response(token=token)

def login(request: HttpRequest) -> HttpResponse:
    api = api_LogIn()
    data = api.parse_request(request.body)

    username = data["username"].lower().replace(" ", "")
    token = generate_token(username, data["password"])

    try:
        user = User.objects.get(username=username)

        if token == user.token:
            return api.response(token=token)

        return api.error(ErrorCodes.BAD_PASSWORD)

    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

def follow_add(request: HttpRequest) -> HttpResponse:
    return _follow(request, False)

def follow_remove(request: HttpRequest) -> HttpResponse:
    return _follow(request, True)

def _follow(request: HttpRequest, unfollow: bool) -> HttpResponse:
    api = (api_Unfollow if unfollow else api_Follow)()

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=api.parse_request(request.body))
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    if isinstance(api, api_Follow):
        if user.blocking.contains(self_user):
            return api.error(ErrorCodes.CANT_INTERACT)
        elif self_user.blocking.contains(user):
            return api.error(ErrorCodes.BLOCKING)

        if user.verify_followers:
            if not user.pending_followers.contains(self_user):
                user.pending_followers.add(self_user)
        elif not self_user.following.contains(user):
            self_user.following.add(user)

        api.set_response(is_pending=user.verify_followers)

    else:
        if user.pending_followers.contains(self_user):
            user.pending_followers.remove(self_user)

        if self_user.following.contains(user):
            self_user.following.remove(user)

        api.set_response()

    return api.get_response()

def block_add(request: HttpRequest) -> HttpResponse:
    return _block(request, False)

def block_remove(request: HttpRequest) -> HttpResponse:
    return _block(request, True)

def _block(request: HttpRequest, unblock: bool) -> HttpResponse:
    api = (api_Unblock if unblock else api_Block)()

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=api.parse_request(request.body))
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    if unblock:
        if self_user.blocking.contains(user):
            self_user.blocking.remove(user)

    else:
        if self_user.following.contains(user):
            self_user.following.remove(user)

        if user.pending_followers.contains(self_user):
            user.pending_followers.remove(self_user)

        if self_user.pending_followers.contains(user):
            self_user.pending_followers.remove(user)

        if not self_user.blocking.contains(user):
            self_user.blocking.add(user)

    return api.response()

def folreq_accept(request: HttpRequest) -> HttpResponse:
    return _folreq(request, True)

def folreq_deny(request: HttpRequest) -> HttpResponse:
    return _folreq(request, False)

def _folreq(request: HttpRequest, accepted: bool) -> HttpResponse:
    api = (api_AcceptFolreq if accepted else api_DenyFolreq)()

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    if not self_user.verify_followers:
        return api.error(ErrorCodes.BAD_REQUEST)

    try:
        user = User.objects.get(username=api.parse_request(request.body))
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    if user.user_id not in self_user.pending_followers.values_list("user_id", flat=True):
        return api.response()

    if accepted:
        user.following.add(self_user)

    self_user.pending_followers.remove(user)
    return api.response()

def get_profile(request: HttpRequest) -> HttpResponse:
    api = api_GetProfile()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    return api.response(user=user)

def save_profile(request: HttpRequest) -> HttpResponse:
    api = api_SaveProfile()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    data = api.parse_request(request.body)

    display_name = trim_whitespace(data["display_name"][:MAX_DISPL_NAME_LENGTH], True)
    bio = trim_whitespace(data["bio"][:MAX_BIO_LENGTH])

    if display_name[1]:
        user.display_name = display_name[0]

    user.bio = bio[0] if bio[1] else ""
    user.gradient = data["gradient"]

    user.color = data["color_one"]
    user.color_two = data["color_two"]

    pronouns = trim_whitespace(data["pronouns"], True)
    user.pronouns = pronouns[0] if pronouns[1] else ""

    user.save()

    return api.response()

def set_post_visibility(request: HttpRequest) -> HttpResponse:
    api = api_SetDefaultVisibility()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    user.default_post_private = api.parse_request(request.body)
    user.save()

    return api.response()

def set_verify_followers(request: HttpRequest) -> HttpResponse:
    api = api_SetDefaultVisibility()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    user.verify_followers = api.parse_request(request.body)
    user.save()

    if not user.verify_followers:
        pending = user.pending_followers.all()
        for f in pending:
            f.following.add(user)

        user.pending_followers.clear()

    return api.response()

def change_password(request: HttpRequest) -> HttpResponse:
    current_token = request.COOKIES.get("token")
    api = api_ChangePassword()

    data = api.parse_request(request.body)

    try:
        user = User.objects.get(token=current_token)
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    if generate_token(user.username, data["current_password"]) != current_token or len(data["new_password"]) != 64 or data["new_password"] == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return api.error(ErrorCodes.BAD_PASSWORD)

    for i in data["new_password"]:
        if i not in "abcdef0123456789":
            return api.error(ErrorCodes.BAD_PASSWORD)

    new_token = generate_token(user.username, data["new_password"])

    user.token = new_token
    user.save()

    return api.response(token=new_token)

def delete_account(request: HttpRequest) -> HttpResponse:
    api = api_DeleteAccount()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    data = api.parse_request(request.body)

    if user.token == generate_token(user.username, data["password"]):
        user.delete()
        return api.response()

    return api.error(ErrorCodes.BAD_PASSWORD)
