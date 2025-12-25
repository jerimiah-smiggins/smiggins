import random
import re
import time

from django.contrib.auth.hashers import check_password, make_password
from django.http import HttpResponse
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest
from posts.models import (InviteCode, M2MFollow, Notification,
                          PushNotification, User)

from ..helper import generate_legacy_token, trim_whitespace
from ..variables import (DEFAULT_BANNER_COLOR, ENABLE_NEW_ACCOUNTS,
                         ENABLE_PRONOUNS, MAX_BIO_LENGTH,
                         MAX_DISPL_NAME_LENGTH, MAX_USERNAME_LENGTH)
from .format import (ErrorCodes, api_AcceptFolreq, api_Block,
                     api_ChangePassword, api_DeleteAccount, api_DenyFolreq,
                     api_Follow, api_GetProfile, api_LogIn, api_SaveProfile,
                     api_SetDefaultVisibility, api_SetVerifyFollowers,
                     api_SignUp, api_Unblock, api_Unfollow)

COLOR_REGEX = re.compile(r"^#[a-f0-9]{6}$")

def generate_auth_key() -> str:
    KEY_LENGTH = 64
    SEGMENT_LENGTH = 8 # each segment is 4 bits (0-f), so 8 would be 32 bits

    key = ""
    for _ in range(KEY_LENGTH // SEGMENT_LENGTH):
        key += hex(random.randint(0, (1 << (SEGMENT_LENGTH * 4)) - 1))[2:].zfill(SEGMENT_LENGTH)

    return key

def signup(request: HttpRequest) -> HttpResponse:
    api = api_SignUp(request)
    data = api.parse_data()

    if not ENABLE_NEW_ACCOUNTS:
        return api.error(ErrorCodes.BAD_REQUEST)

    username = data["username"].lower().replace(" ", "")
    password = data["password"]

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

    auth_key = generate_auth_key()

    User.objects.create(
        username=username,
        password_hash=make_password(password),
        auth_key=auth_key,
        display_name=trim_whitespace(data["username"], purge_newlines=True)[0][:MAX_DISPL_NAME_LENGTH],
        color=DEFAULT_BANNER_COLOR,
        color_two=DEFAULT_BANNER_COLOR
    )

    return api.response(token=auth_key)

def login(request: HttpRequest) -> HttpResponse:
    api = api_LogIn(request)
    data = api.parse_data()

    username = data["username"].lower().replace(" ", "")

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    if user.password_hash and check_password(data["password"], user.password_hash):
        return api.response(token=user.auth_key)

    if user.legacy_token and user.legacy_token == generate_legacy_token(username, data["password"]):
        user.legacy_token = None
        user.auth_key = generate_auth_key()
        user.password_hash = make_password(data["password"])
        user.save()
        return api.response(token=user.auth_key)

    return api.error(ErrorCodes.BAD_PASSWORD)

def follow_add(request: HttpRequest) -> HttpResponse:
    return _follow(request, False)

def follow_remove(request: HttpRequest) -> HttpResponse:
    return _follow(request, True)

def _follow(request: HttpRequest, unfollow: bool) -> HttpResponse:
    api = (api_Unfollow if unfollow else api_Follow)(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=api.parse_data())
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    if isinstance(api, api_Follow):
        if user.blocking.contains(request.s_user):
            return api.error(ErrorCodes.CANT_INTERACT)
        elif request.s_user.blocking.contains(user):
            return api.error(ErrorCodes.BLOCKING)

        if user.verify_followers:
            if not user.pending_followers.contains(request.s_user):
                user.pending_followers.add(request.s_user)
                PushNotification.send_to(user, "follow_request", request.s_user)

        elif not request.s_user.following.contains(user):
            request.s_user.following.add(user)
            Notification.objects.create(
                timestamp=round(time.time()),
                event_type="follow",
                linked_follow=M2MFollow.objects.get(
                    user=request.s_user,
                    following=user
                ),
                is_for=user
            )

            PushNotification.send_to(user, "follow", request.s_user)

        api.set_response(is_pending=user.verify_followers)

    else:
        if user.pending_followers.contains(request.s_user):
            user.pending_followers.remove(request.s_user)

        if request.s_user.following.contains(user):
            request.s_user.following.remove(user)

        api.set_response()

    return api.get_response()

def block_add(request: HttpRequest) -> HttpResponse:
    return _block(request, False)

def block_remove(request: HttpRequest) -> HttpResponse:
    return _block(request, True)

def _block(request: HttpRequest, unblock: bool) -> HttpResponse:
    api = (api_Unblock if unblock else api_Block)(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=api.parse_data())
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    if unblock:
        if request.s_user.blocking.contains(user):
            request.s_user.blocking.remove(user)

    else:
        if request.s_user.following.contains(user):
            request.s_user.following.remove(user)

        if user.pending_followers.contains(request.s_user):
            user.pending_followers.remove(request.s_user)

        if request.s_user.pending_followers.contains(user):
            request.s_user.pending_followers.remove(user)

        if not request.s_user.blocking.contains(user):
            request.s_user.blocking.add(user)

    return api.response()

def folreq_accept(request: HttpRequest) -> HttpResponse:
    return _folreq(request, True)

def folreq_deny(request: HttpRequest) -> HttpResponse:
    return _folreq(request, False)

def _folreq(request: HttpRequest, accepted: bool) -> HttpResponse:
    api = (api_AcceptFolreq if accepted else api_DenyFolreq)(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    if not request.s_user.verify_followers:
        return api.error(ErrorCodes.BAD_REQUEST)

    try:
        user = User.objects.get(username=api.parse_data())
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    if user.user_id not in request.s_user.pending_followers.values_list("user_id", flat=True):
        return api.response()

    if accepted:
        user.following.add(request.s_user)
        Notification.objects.create(
            timestamp=round(time.time()),
            event_type="follow",
            linked_follow=M2MFollow.objects.get(
                user=user,
                following=request.s_user
            ),
            is_for=request.s_user
        )

    request.s_user.pending_followers.remove(user)
    return api.response()

def get_profile(request: HttpRequest) -> HttpResponse:
    api = api_GetProfile(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    return api.response(user=request.s_user)

def save_profile(request: HttpRequest) -> HttpResponse:
    api = api_SaveProfile(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    data = api.parse_data()
    user: User = request.s_user

    display_name = trim_whitespace(data["display_name"][:MAX_DISPL_NAME_LENGTH], True)
    bio = trim_whitespace(data["bio"][:MAX_BIO_LENGTH])

    if display_name[1]:
        user.display_name = display_name[0]

    user.bio = bio[0] if bio[1] else ""
    user.gradient = data["gradient"]

    user.color = data["color_one"]
    user.color_two = data["color_two"]

    pronouns = trim_whitespace(data["pronouns"], True)
    user.pronouns = (pronouns[0] if pronouns[1] else "") if ENABLE_PRONOUNS else user.pronouns

    user.save()

    return api.response()

def set_post_visibility(request: HttpRequest) -> HttpResponse:
    api = api_SetDefaultVisibility(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    request.s_user.default_post_private = api.parse_data()
    request.s_user.save()

    return api.response()

def set_verify_followers(request: HttpRequest) -> HttpResponse:
    api = api_SetVerifyFollowers(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    request.s_user.verify_followers = api.parse_data()
    request.s_user.save()

    if not request.s_user.verify_followers:
        pending = request.s_user.pending_followers.all()
        for f in pending:
            f.following.add(request.s_user)

        request.s_user.pending_followers.clear()

    return api.response()

def change_password(request: HttpRequest) -> HttpResponse:
    api = api_ChangePassword(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    data = api.parse_data()

    if not request.s_user.password_hash or not check_password(data["current_password"], request.s_user.password_hash) or data["new_password"] == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return api.error(ErrorCodes.BAD_PASSWORD)

    for i in data["new_password"]:
        if i not in "abcdef0123456789":
            return api.error(ErrorCodes.BAD_PASSWORD)

    new_auth_key = generate_auth_key()

    request.s_user.auth_key = new_auth_key
    request.s_user.password_hash = make_password(data["new_password"])
    request.s_user.save()

    return api.response(token=new_auth_key)

def delete_account(request: HttpRequest) -> HttpResponse:
    api = api_DeleteAccount(request)
    data = api.parse_data()

    if request.s_user is None or data["username"] != request.s_user.username:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    if not request.s_user.password_hash or not check_password(data["password"], request.s_user.password_hash):
        return api.error(ErrorCodes.BAD_PASSWORD)

    request.s_user.delete()
    return api.response()
