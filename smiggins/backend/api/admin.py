# For admin-related apis

import time

from posts.models import AdminLog, Badge, User

from ..helper import get_lang, trim_whitespace
from ..variables import BADGE_DATA, MAX_ADMIN_LOG_LINES, OWNER_USER_ID
from .schema import (AccountIdentifier, APIResponse, DeleteBadge, NewBadge,
                     SaveUser, UserBadge, UserLevel)


class BitMask:
    @staticmethod
    def can_use(user: User, identifier: int) -> bool:
        return user.user_id == OWNER_USER_ID or bool(user.admin_level >> identifier & 1)

    @staticmethod
    def can_use_direct(user_level: int, identifier: int) -> bool:
        return bool(user_level >> identifier & 1)

    DELETE_POST = 0
    DELETE_USER = 1
    CREATE_BADGE = 2
    DELETE_BADGE = 3
    GIVE_BADGE_TO_USER = 4
    MODIFY_ACCOUNT = 5
    ACC_SWITCHER = 6 # requires MODIFY_ACCOUNT
    ADMIN_LEVEL = 7
    READ_LOGS = 8

    MAX_LEVEL = 8

def log_admin_action(
    action_name: str,
    admin_user_object: User,
    for_user_object: User | None | str,
    log_info: str
) -> None:
    # Logs an administrative action

    if isinstance(for_user_object, str):
        AdminLog.objects.create(
            type=action_name,
            u_by=admin_user_object,
            uname_for=for_user_object,
            info=log_info,
            timestamp=round(time.time())
        )
    else:
        AdminLog.objects.create(
            type=action_name,
            u_by=admin_user_object,
            u_for=for_user_object,
            info=log_info,
            timestamp=round(time.time())
        )

    AdminLog.objects.filter(pk__in=AdminLog.objects.order_by("timestamp").reverse().values_list("pk", flat=True)[MAX_ADMIN_LOG_LINES:]).delete()

def user_delete(request, data: AccountIdentifier) -> APIResponse:
    # Deleting an account

    token = request.COOKIES.get('token')

    try:
        user = User.objects.get(token=token)
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    identifier = data.identifier
    use_id = data.use_id
    lang = get_lang(user)

    try:
        if use_id:
            account = User.objects.get(user_id=int(identifier))
        else:
            account = User.objects.get(username=identifier)
    except User.DoesNotExist:
        log_admin_action("Delete user", user, None, f"User {identifier} (use_id: {use_id}) not found")

        return 404, {
            "success": False,
            "message": lang["generic"]["user_not_found"]
        }

    if BitMask.can_use(user, BitMask.DELETE_USER):
        log_admin_action("Delete user", user, account.username, "Success")

        account.delete()

        return {
            "success": True,
            "message": lang["generic"]["success"]
        }

    log_admin_action("Delete user", user, account, "No permissions")

    return 400, {
        "success": False
    }

def badge_create(request, data: NewBadge) -> APIResponse:
    # Creating a badge

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.CREATE_BADGE):
        badge_name = data.badge_name.lower().replace(" ", "")
        badge_data = trim_whitespace(data.badge_data, True)

        if len(badge_name) > 64 or len(badge_name) <= 0:
            log_admin_action("Create badge", self_user, None, f"Invalid badge name {badge_name}")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "message": lang["admin"]["badge"]["invalid_name_size"]
            }

        for i in badge_name:
            if i not in "abcdefghijklmnopqrstuvwxyz0123456789_":
                log_admin_action("Create badge", self_user, None, f"Invalid badge name {badge_name}")
                lang = get_lang(self_user)
                return 400, {
                    "success": False,
                    "message": lang["admin"]["badge"]["invalid_name"]
                }

        if len(badge_data) > 65536 or len(badge_data) <= 0:
            log_admin_action("Create badge", self_user, None, f"Invalid badge data with length {len(badge_data)}")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "message": lang["admin"]["badge"]["create_invalid_data_size"]
            }

        try:
            badge = Badge.objects.get(
                name=badge_name
            )

            badge.svg_data = badge_data

        except Badge.DoesNotExist:
            badge = Badge.objects.create(
                name=badge_name,
                svg_data=badge_data
            )

        badge.save()

        BADGE_DATA[badge_name] = badge_data

        lang = get_lang(self_user)

        log_admin_action("Create badge", self_user, None, f"Created badge {badge_name}")
        return {
            "success": True,
            "message": f"{lang['generic']['success']} {lang['admin']['badge']['create_success']}"
        }

    log_admin_action("Create badge", self_user, None, "No permissions")
    return 400, {
        "success": False
    }

def badge_delete(request, data: DeleteBadge) -> APIResponse:
    # Deleting a badge

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.DELETE_BADGE):
        badge_name = data.badge_name.lower().replace(" ", "")
        lang = get_lang(self_user)

        if len(badge_name) > 64 or len(badge_name) <= 0:
            log_admin_action("Delete badge", self_user, None, f"Invalid badge name {badge_name}")
            return 400, {
                "success": False,
                "message": lang["admin"]["badge"]["invalid_name_size"]
            }

        for i in badge_name:
            if i not in "abcdefghijklmnopqrstuvwxyz0123456789_":
                log_admin_action("Delete badge", self_user, None, f"Invalid badge name {badge_name}")
                return 400, {
                    "success": False,
                    "message": lang["admin"]["badge"]["invalid_name"]
                }

        if badge_name in ["administrator"]:
            log_admin_action("Delete badge", self_user, None, f"Badge {badge_name} can't be deleted")
            return 400, {
                "success": False,
                "message": lang["admin"]["badge"]["delete_protected"]
            }

        try:
            badge = Badge.objects.get(
                name=badge_name
            )
        except Badge.DoesNotExist:
            log_admin_action("Delete badge", self_user, None, f"Badge {badge_name} doesn't exist")
            return 400, {
                "success": False,
                "message": lang["admin"]["badge"]["not_found"].replace("%s", badge_name)
            }

        badge.delete()

        del BADGE_DATA[badge_name]

        log_admin_action("Delete badge", self_user, None, f"Badge {badge_name} successfully deleted")
        return {
            "success": True,
            "message": f"{lang['generic']['success']} {lang['admin']['badge']['create_success']}"
        }

    log_admin_action("Delete badge", self_user, None, "No permissions")
    return 400, {
        "success": False
    }

def badge_add(request, data: UserBadge) -> APIResponse:
    # Adding a badge to a user

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.GIVE_BADGE_TO_USER):
        lang = get_lang(self_user)
        try:
            if data.use_id:
                user = User.objects.get(user_id=int(data.identifier))
            else:
                user = User.objects.get(username=data.identifier)
        except User.DoesNotExist:
            return 404, {
                "success": False,
                "message": lang["generic"]["user_not_found"]
            }

        if data.badge_name.lower() in ["administrator"]:
            log_admin_action("Add badge", self_user, user, f"Couldn't add badge {data.badge_name}")
            return 400, {
                "success": False,
                "message": lang["admin"]["badge"]["manage_add_protected"]
            }

        if data.badge_name.lower() in BADGE_DATA:
            if not user.badges.contains(badge := Badge.objects.get(name=data.badge_name.lower())):
                badge.users.add(user)

            log_admin_action("Add badge", self_user, user, f"Added badge {data.badge_name}")
            return {
                "success": True,
                "message": lang["generic"]["success"]
            }

        log_admin_action("Add badge", self_user, user, f"Tried to add badge {data.badge_name}, but badge doesn't exist")
        return 404, {
            "success": False,
            "message": lang["admin"]["badge"]["not_found"].replace("%s", data.badge_name)
        }

    log_admin_action("Add badge", self_user, None, "No permissions")
    return 400, {
        "success": False
    }

def badge_remove(request, data: UserBadge) -> APIResponse:
    # Removing a badge from a user

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.GIVE_BADGE_TO_USER):
        lang = get_lang(self_user)
        try:
            if data.use_id:
                user = User.objects.get(user_id=int(data.identifier))
            else:
                user = User.objects.get(username=data.identifier)
        except User.DoesNotExist:
            return 404, {
                "success": False,
                "message": lang["generic"]["user_not_found"]
            }

        if data.badge_name.lower() in ["administrator"]:
            log_admin_action("Remove badge", self_user, user, f"Couldn't remove badge {data.badge_name}")
            return 400, {
                "success": False,
                "message": lang["admin"]["badge"]["manage_remove_protected"]
            }

        if data.badge_name.lower() in BADGE_DATA:
            badge = Badge.objects.get(name=data.badge_name.lower())
            badge.users.remove(user)

            log_admin_action("Remove badge", self_user, user, f"Removed badge {data.badge_name}")
            return {
                "success": True,
                "message": lang["generic"]["success"]
            }

        log_admin_action("Remove badge", self_user, user, f"Tried to remove badge {data.badge_name}, but badge doesn't exist")
        return 404, {
            "success": False,
            "message": lang["admin"]["badge"]["not_found"].replace("%s", data.badge_name)
        }

    log_admin_action("Remove badge", self_user, None, "No permissions")
    return 400, {
        "success": False
    }

def account_info(request, identifier: int | str, use_id: bool) -> APIResponse:
    # Get account information

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.MODIFY_ACCOUNT):
        try:
            if use_id:
                user = User.objects.get(user_id=int(identifier))
            else:
                user = User.objects.get(username=identifier)
        except User.DoesNotExist:
            lang = get_lang(self_user)
            return 404, {
                "success": False,
                "message": lang["generic"]["user_not_found"]
            }

        log_admin_action("Get account info", self_user, user, "Fetched info successfully")

        return {
            "success": True,
            "actions": [
                {
                    "name": "admin_info",
                    "username": user.username,
                    "user_id": user.user_id,
                    "bio": user.bio,
                    "displ_name": user.display_name,
                    "token": user.token if BitMask.can_use(self_user, BitMask.ACC_SWITCHER) else None
                }
            ]
        }

    log_admin_action("Get account info", self_user, None, "No permissions")
    return 400, {
        "success": False
    }

def account_save(request, data: SaveUser) -> APIResponse:
    # Save account information

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.MODIFY_ACCOUNT):
        lang = get_lang(self_user)

        try:
            user = User.objects.get(user_id=data.id)
        except User.DoesNotExist:
            return 404, {
                "success": False,
                "message": lang["generic"]["user_not_found"]
            }

        if len(data.bio) > 65536:
            log_admin_action("Save account info", self_user, user, f"Tried to save info, but bio (length {len(data.bio)}) is invalid")
            return 400, {
                "success": False,
                "message": lang["admin"]["modify"]["invalid_bio_size"]
            }

        if len(data.displ_name) == 0 or len(data.displ_name) > 300:
            log_admin_action("Save account info", self_user, user, f"Tried to save info, but display name {data.displ_name} is invalid")
            return 400, {
                "success": False,
                "message": lang["admin"]["modify"]["invalid_display_name"]
            }

        old_bio = user.bio
        old_display_name = user.display_name
        new_bio = trim_whitespace(data.bio, True)
        new_display_name = trim_whitespace(data.displ_name, True)

        user.bio = new_bio
        user.display_name = new_display_name
        user.save()

        if old_bio == new_bio and old_display_name == new_display_name:
            log_admin_action("Save account info", self_user, user, "Nothing changed")
        elif old_display_name == new_display_name:
            log_admin_action("Save account info", self_user, user, "Saved bio")
        elif old_bio == new_bio:
            log_admin_action("Save account info", self_user, user, "Saved display name")
        else:
            log_admin_action("Save account info", self_user, user, "Save bio and display name")

        return {
            "success": True,
            "message": lang["generic"]["success"]
        }

    log_admin_action("Save account info", self_user, None, "No permissions")
    return 400, {
        "success": False
    }

def set_level(request, data: UserLevel) -> APIResponse:
    # Set the admin level for a different person

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    use_id = data.use_id
    identifier = data.identifier
    level = data.level

    if BitMask.can_use(self_user, BitMask.ADMIN_LEVEL):
        lang = get_lang(self_user)
        try:
            if use_id:
                user = User.objects.get(user_id=int(identifier))
            else:
                user = User.objects.get(username=identifier)
        except User.DoesNotExist:
            return 404, {
                "success": False,
                "message": lang["generic"]["user_not_found"]
            }

        user.admin_level = level
        user.save()

        log_admin_action("Set admin permissions", self_user, user, f"Gave perms {data.level}")
        return {
            "success": True,
            "message": lang["generic"]["success"]
        }

    log_admin_action("Set admin permissions", self_user, None, "No permissions")
    return 400, {
        "success": False
    }

def load_level(request, identifier: int | str, use_id: bool) -> APIResponse:
    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.ADMIN_LEVEL):
        try:
            if use_id:
                user = User.objects.get(user_id=int(identifier))
            else:
                user = User.objects.get(username=identifier)

            return {
                "success": True,
                "actions": [
                    { "name": "update_element", "query": f"input#level-{i}", "checked": BitMask.can_use_direct(user.admin_level, i) }
                    for i in range(BitMask.MAX_LEVEL + 1)
                ]
            }

        except User.DoesNotExist:
            lang = get_lang(self_user)
            return 404, {
                "success": False,
                "message": lang["generic"]["user_not_found"]
            }

    return 400, {
        "success": False
    }

def logs(request) -> APIResponse:
    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.READ_LOGS):
        return {
            "success": True,
            "actions": [
                {
                    "name": "admin_log",
                    "content": [{
                        "type": i.type,
                        "by": i.u_by.username,
                        "target": i.u_for.username if i.u_for else i.uname_for,
                        "info": i.info,
                        "timestamp": i.timestamp
                    } for i in AdminLog.objects.all()[::-1]]
                }
            ]
        }

    return 400, {
        "success": False
    }
