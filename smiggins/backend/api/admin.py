# For admin-related apis

import random
import re
import time
from base64 import urlsafe_b64encode as b64encode

from django.db.utils import OperationalError
from posts.models import (AdminLog, Badge, MutedWord, OneTimePassword,
                          PrivateMessageContainer, User)

from ..helper import check_ratelimit, get_lang, sha_to_bytes, trim_whitespace
from ..variables import (MAX_ADMIN_LOG_LINES,
                         MAX_MUTED_WORD_LENGTH, MAX_MUTED_WORDS, OWNER_USER_ID,
                         PRIVATE_AUTHENTICATOR_KEY)
from .schema import (AccountIdentifier, APIResponse, DeleteBadge,
                     MutedWordsAdmin, NewBadge, OTPName, SaveUser, UserBadge,
                     UserLevel)


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
    GENERATE_OTP = 9
    CHANGE_MUTED_WORDS = 10

    MAX_LEVEL = 10

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
    if rl := check_ratelimit(request, "DELETE /api/admin/user"):
        return rl

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    lang = get_lang(user)

    try:
        if data.use_id:
            account = User.objects.get(user_id=int(data.identifier))
        else:
            account = User.objects.get(username=data.identifier.lower())
    except User.DoesNotExist:
        log_admin_action("Delete user", user, None, f"User {data.identifier} (use_id: {data.use_id}) not found")

        return 404, {
            "success": False,
            "message": lang["generic"]["user_not_found"]
        }

    if BitMask.can_use(user, BitMask.DELETE_USER):
        log_admin_action("Delete user", user, account.username, "Success")

        for mid in account.messages:
            try:
                pmc = PrivateMessageContainer.objects.get(container_id=mid)
            except PrivateMessageContainer.DoesNotExist:
                continue

            u1 = pmc.user_one
            u2 = pmc.user_two

            if u1.user_id == account.user_id:
                u2.messages.remove(mid)
                if mid in u2.unread_messages:
                    u2.unread_messages.remove(mid)

                u2.save()
            else:
                u1.messages.remove(mid)
                if mid in u1.unread_messages:
                    u1.unread_messages.remove(mid)

                u1.save()

        account.delete()

        return {
            "success": True,
            "message": lang["generic"]["success"]
        }


    return 400, {
        "success": False
    }

def badge_create(request, data: NewBadge) -> APIResponse:
    if rl := check_ratelimit(request, "PUT /api/admin/badge"):
        return rl

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.CREATE_BADGE):
        badge_name = data.badge_name.lower().replace(" ", "")
        badge_data = trim_whitespace(data.badge_data, True)[0]

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

        lang = get_lang(self_user)

        log_admin_action("Create badge", self_user, None, f"Created badge {badge_name}")
        return {
            "success": True,
            "message": f"{lang['generic']['success']} {lang['admin']['badge']['create_success']}"
        }

    return 400, {
        "success": False
    }

def badge_delete(request, data: DeleteBadge) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/admin/badge"):
        return rl

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))

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

        log_admin_action("Delete badge", self_user, None, f"Badge {badge_name} successfully deleted")
        return {
            "success": True,
            "message": f"{lang['generic']['success']} {lang['admin']['badge']['create_success']}"
        }

    return 400, {
        "success": False
    }

def badge_add(request, data: UserBadge) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/admin/badge"):
        return rl

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))

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
                user = User.objects.get(username=data.identifier.lower())
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

        try:
            badge = Badge.objects.get(name=data.badge_name.lower())
        except Badge.DoesNotExist:
            log_admin_action("Add badge", self_user, user, f"Tried to add badge {data.badge_name}, but badge doesn't exist")
            return 404, {
                "success": False,
                "message": lang["admin"]["badge"]["not_found"].replace("%s", data.badge_name)
            }

        if not user.badges.contains(badge):
            badge.users.add(user)

        log_admin_action("Add badge", self_user, user, f"Added badge {data.badge_name}")
        return {
            "success": True,
            "message": lang["generic"]["success"]
        }

    return 400, {
        "success": False
    }

def badge_remove(request, data: UserBadge) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/admin/badge"):
        return rl

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))

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
                user = User.objects.get(username=data.identifier.lower())
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

        try:
            badge = Badge.objects.get(name=data.badge_name.lower())
        except Badge.DoesNotExist:
            log_admin_action("Remove badge", self_user, user, f"Tried to remove badge {data.badge_name}, but badge doesn't exist")
            return 404, {
                "success": False,
                "message": lang["admin"]["badge"]["not_found"].replace("%s", data.badge_name)
            }

        badge.users.remove(user)

        log_admin_action("Remove badge", self_user, user, f"Removed badge {data.badge_name}")
        return {
            "success": True,
            "message": lang["generic"]["success"]
        }

    return 400, {
        "success": False
    }

def account_info(request, identifier: str, use_id: bool) -> APIResponse:
    if rl := check_ratelimit(request, "GET /api/admin/info"):
        return rl

    identifier = identifier.lower()

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))

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

    return 400, {
        "success": False
    }

def account_save(request, data: SaveUser) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/admin/info"):
        return rl

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

        new_bio = trim_whitespace(data.bio, True)
        if len(new_bio[0]) > 65536:
            log_admin_action("Save account info", self_user, user, f"Tried to save info, but bio (length {len(data.bio)}) is invalid")
            return 400, {
                "success": False,
                "message": lang["admin"]["modify"]["invalid_bio_size"]
            }

        new_display_name = trim_whitespace(data.displ_name, True)
        if not new_display_name[1] or len(new_display_name[0]) > 300:
            log_admin_action("Save account info", self_user, user, f"Tried to save info, but display name {data.displ_name} is invalid")
            return 400, {
                "success": False,
                "message": lang["admin"]["modify"]["invalid_display_name"]
            }

        old_bio = user.bio
        old_display_name = user.display_name

        user.bio = new_bio[0]
        user.display_name = new_display_name[0]
        user.save()

        if old_bio == new_bio[0] and old_display_name == new_display_name[0]:
            log_admin_action("Save account info", self_user, user, "Nothing changed")
        elif old_display_name == new_display_name[0]:
            log_admin_action("Save account info", self_user, user, "Saved bio")
        elif old_bio == new_bio[0]:
            log_admin_action("Save account info", self_user, user, "Saved display name")
        else:
            log_admin_action("Save account info", self_user, user, "Save bio and display name")

        return {
            "success": True,
            "message": lang["generic"]["success"]
        }

    return 400, {
        "success": False
    }

def set_level(request, data: UserLevel) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/admin/level"):
        return rl

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }


    if BitMask.can_use(self_user, BitMask.ADMIN_LEVEL):
        lang = get_lang(self_user)
        try:
            if data.use_id:
                user = User.objects.get(user_id=int(data.identifier))
            else:
                user = User.objects.get(username=data.identifier.lower())
        except User.DoesNotExist:
            return 404, {
                "success": False,
                "message": lang["generic"]["user_not_found"]
            }

        user.admin_level = data.level
        user.save()

        log_admin_action("Set admin permissions", self_user, user, f"Gave perms {data.level}")
        return {
            "success": True,
            "message": lang["generic"]["success"]
        }

    return 400, {
        "success": False
    }

def load_level(request, identifier: str, use_id: bool) -> APIResponse:
    if rl := check_ratelimit(request, "GET /api/admin/level"):
        return rl

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    identifier = identifier.lower()

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
    if rl := check_ratelimit(request, "GET /api/admin/logs"):
        return rl

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

def otp_generate(request) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/admin/otp"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if BitMask.can_use(user, BitMask.READ_LOGS):
        code = bytes.decode(b64encode(sha_to_bytes(f"{time.time()}-{random.random()}-{PRIVATE_AUTHENTICATOR_KEY}")))[:32]
        OneTimePassword.objects.create(
            code=code
        )

        log_admin_action("Create OTP", user, None, code)

        return {
            "success": True,
            "actions": [
                { "name": "update_element", "query": "#otp-generated", "html": f"<code>{code}</code>" }
            ]
        }

    return 400, {
        "success": False
    }

def otp_delete(request, data: OTPName) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/admin/otp"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if BitMask.can_use(user, BitMask.READ_LOGS):
        try:
            OneTimePassword.objects.get(
                code=data.otp
            ).delete()
            log_admin_action("Delete OTP", user, None, data.otp)

        except OneTimePassword.DoesNotExist:
            pass


        return {
            "success": True,
            "actions": [
                {
                    "name": "update_element",
                    "query": f".otp-list[data-code=\"{data.otp}\"]",
                    "set_class": [{ "class_name": "hidden", "enable": True }]
                }
            ]
        }

    return 400, {
        "success": False
    }

def otp_load(request) -> APIResponse:
    if rl := check_ratelimit(request, "GET /api/admin/otp"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if BitMask.can_use(user, BitMask.READ_LOGS):
        lang = get_lang(user)

        return {
            "success": True,
            "actions": [
                {
                    "name": "update_element",
                    "query": "#otp-all",
                    "html": "".join([
                        f"<div class=\"otp-list\" data-code=\"{i}\"><code>{i}</code> - <button onclick=\"deleteOTP(&quot;{i}&quot;)\">{lang['post']['delete']}</button></div>"
                        for i in OneTimePassword.objects.all().order_by("code").values_list("code", flat=True)
                    ]) or f"<i>{lang['generic']['none']}</i>" }
            ]
        }

    return 400, {
        "success": False
    }

def muted(request, data: MutedWordsAdmin) -> APIResponse:
    # You may need to also edit the muted function in backend.api.user to match functionality
    if rl := check_ratelimit(request, "POST /api/admin/muted"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if BitMask.can_use(user, BitMask.READ_LOGS):
        lang = get_lang(user)
        objs = []

        for word in data.muted.split("\n"):
            word, valid = trim_whitespace(word, True)

            if not valid:
                continue

            if len(word) > MAX_MUTED_WORD_LENGTH:
                return 400, {
                    "success": False,
                    "message": lang["settings"]["mute"]["long"].replace("%m", str(MAX_MUTED_WORD_LENGTH)).replace("%s", str(len(word))).replace("%v", word)
                }

            regex = word[0] == "/" and re.match(r"^/.*/[ims]+$", word)

            if regex:
                word = f"(?{''.join(list(set([i for i in word.split('/')[-1]])))}){'/'.join(word[1::].split('/')[:-1])}"

            objs.append(MutedWord(
                user=None,
                is_regex=bool(regex),
                string=word
            ))

        if len(objs) > MAX_MUTED_WORDS:
            return 400, {
                "success": False,
                "message": lang["settings"]["mute"]["too_many"].replace("%m", str(MAX_MUTED_WORDS)).replace("%s", str(len(objs)))
            }

        MutedWord.objects.filter(user=None).delete()
        MutedWord.objects.bulk_create(objs)

        return {
            "success": True,
            "message": lang["generic"]["success"]
        }

    return 400, {
        "success": False
    }

# Set default badges
try:
    Badge.objects.get(name="administrator")
except Badge.DoesNotExist:
    icons = {
        "verified": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Verified</title><path d="M200.3 81.5C210.9 61.5 231.9 48 256 48s45.1 13.5 55.7 33.5c5.4 10.2 17.3 15.1 28.3 11.7 21.6-6.6 46.1-1.4 63.1 15.7s22.3 41.5 15.7 63.1c-3.4 11 1.5 22.9 11.7 28.2 20 10.6 33.5 31.6 33.5 55.7s-13.5 45.1-33.5 55.7c-10.2 5.4-15.1 17.2-11.7 28.2 6.6 21.6 1.4 46.1-15.7 63.1s-41.5 22.3-63.1 15.7c-11-3.4-22.9 1.5-28.2 11.7-10.6 20-31.6 33.5-55.7 33.5s-45.1-13.5-55.7-33.5c-5.4-10.2-17.2-15.1-28.2-11.7-21.6 6.6-46.1 1.4-63.1-15.7S86.6 361.6 93.2 340c3.4-11-1.5-22.9-11.7-28.2C61.5 301.1 48 280.1 48 256s13.5-45.1 33.5-55.7c10.2-5.4 15.1-17.3 11.7-28.3-6.6-21.6-1.4-46.1 15.7-63.1s41.5-22.3 63.1-15.7c11 3.4 22.9-1.5 28.2-11.7zM256 0c-35.9 0-67.8 17-88.1 43.4-33-4.3-67.6 6.2-93 31.6S39 135 43.3 168C17 188.2 0 220.1 0 256s17 67.8 43.4 88.1c-4.3 33 6.2 67.6 31.6 93s60 35.9 93 31.6c20.2 26.3 52.1 43.3 88 43.3s67.8-17 88.1-43.4c33 4.3 67.6-6.2 93-31.6s35.9-60 31.6-93c26.3-20.2 43.3-52.1 43.3-88s-17-67.8-43.4-88.1c4.3-33-6.2-67.6-31.6-93S377 39 344 43.3C323.8 17 291.9 0 256 0m113 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0z"/></svg>',
        "developer": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><title>Developer</title><path d="M80 112a32 32 0 1 0 0-64 32 32 0 1 0 0 64m80-32c0 35.8-23.5 66.1-56 76.3V192c0 22.1 17.9 40 40 40h160c22.1 0 40-17.9 40-40v-35.7c-32.5-10.2-56-40.5-56-76.3 0-44.2 35.8-80 80-80s80 35.8 80 80c0 35.8-23.5 66.1-56 76.3V192c0 48.6-39.4 88-88 88h-56v75.7c32.5 10.2 56 40.5 56 76.3 0 44.2-35.8 80-80 80s-80-35.8-80-80c0-35.8 23.5-66.1 56-76.3V280h-56c-48.6 0-88-39.4-88-88v-35.7C23.5 146.1 0 115.8 0 80 0 35.8 35.8 0 80 0s80 35.8 80 80m208 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64M256 432a32 32 0 1 0-64 0 32 32 0 1 0 64 0"/></svg>',
        "administrator": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Administrator</title><path d="M232 59.6v390.7C99.2 375.7 64.4 227.3 64 139.7c0-5 3.1-10.2 9-12.8zm48 390.8V59.6L439 127c5.9 2.5 9.1 7.8 9 12.8-.4 87.5-35.2 236-168 310.6M457.7 82.8 269.4 2.9C265.2 1 260.7 0 256 0s-9.2 1-13.4 2.9L54.3 82.8c-22 9.3-38.4 31-38.3 57.2.5 99.2 41.3 280.7 213.6 363.2 16.7 8 36.1 8 52.8 0C454.8 420.7 495.5 239.2 496 140c.1-26.2-16.3-47.9-38.3-57.2"/></svg>'
    }

    for i in icons:
        x = Badge.objects.create(
            name=i,
            svg_data=icons[i]
        )
        x.save()
        del x

    del icons

except OperationalError:
    ...
