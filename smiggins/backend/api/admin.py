import random
import time

from django.http import HttpResponse
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest
from posts.models import InviteCode, User

from ..helper import sha
from ..variables import (ENABLE_NEW_ACCOUNTS, OWNER_USER_ID,
                         PRIVATE_AUTHENTICATOR_KEY)
from .format import (ErrorCodes, api_AdminDeleteUser, api_DeleteOTP,
                     api_GenerateOTP, api_GetAdminPermissions, api_ListOTPs,
                     api_SetAdminPermissions)


class AdminPermissions:
    DELETE_POST = 0
    DELETE_USER = 1
    SET_ADMIN_LVL = 7
    GENERATE_OTP = 9 if ENABLE_NEW_ACCOUNTS == "otp" else None

    ALL: dict[str, int | None] = {
        "DELETE_POST": DELETE_POST,
        "DELETE_USER": DELETE_USER,
        "SET_ADMIN_LVL": SET_ADMIN_LVL,
        "GENERATE_OTP": GENERATE_OTP
    }

    @staticmethod
    def can_use(user: User, permission: int | None) -> bool:
        return permission is not None and (user.user_id == OWNER_USER_ID or bool(user.admin_level >> permission & 1))

    @staticmethod
    def has_any(user: User) -> bool:
        for permission in AdminPermissions.ALL.values():
            if AdminPermissions.can_use(user, permission):
                return True

        return False

def admin_delete_user(request: HttpRequest) -> HttpResponse:
    api = api_AdminDeleteUser(request)

    if request.s_user is None or not AdminPermissions.can_use(request.s_user, AdminPermissions.DELETE_USER):
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=api.parse_data())
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    user.delete()

    return api.response()

def delete_otp(request: HttpRequest) -> HttpResponse:
    api = api_DeleteOTP(request)

    if request.s_user is None or not AdminPermissions.can_use(request.s_user, AdminPermissions.GENERATE_OTP):
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        otp = InviteCode.objects.get(id=api.parse_data())
    except InviteCode.DoesNotExist:
        ...
    else:
        otp.delete()

    return api.response()

def generate_otp(request: HttpRequest) -> HttpResponse:
    api = api_GenerateOTP(request)

    if request.s_user is None or not AdminPermissions.can_use(request.s_user, AdminPermissions.GENERATE_OTP):
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    code = sha(f"{time.time()}-{random.random()}-{PRIVATE_AUTHENTICATOR_KEY}")
    InviteCode.objects.create(id=code)
    return api.response(otp=code)

def list_otps(request: HttpRequest) -> HttpResponse:
    api = api_ListOTPs(request)

    if request.s_user is None or not AdminPermissions.can_use(request.s_user, AdminPermissions.GENERATE_OTP):
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    return api.response(otps=list(
        InviteCode.objects.order_by("id").values_list("id", flat=True)
    ))

def set_admin_lvl(request: HttpRequest) -> HttpResponse:
    api = api_SetAdminPermissions(request)

    if request.s_user is None or not AdminPermissions.can_use(request.s_user, AdminPermissions.SET_ADMIN_LVL):
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    data = api.parse_data()

    try:
        user = User.objects.get(username=data["username"])
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    user.admin_level = data["permissions"]
    user.save()

    return api.response()

def get_admin_lvl(request: HttpRequest, username: str) -> HttpResponse:
    api = api_GetAdminPermissions(request)

    if request.s_user is None or not AdminPermissions.can_use(request.s_user, AdminPermissions.SET_ADMIN_LVL):
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    return api.response(user=user)
