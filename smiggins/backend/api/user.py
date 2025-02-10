# For API functions that are user-specific, like settings, following, etc.

import re
from typing import Literal

from django.db.models import Manager
from posts.models import (Comment, MutedWord, Notification, OneTimePassword,
                          Post, PrivateMessageContainer, User, UserPronouns)

from ..helper import (check_ratelimit, generate_token, trim_whitespace,
                      validate_username)
from ..lang import DEFAULT_LANG, get_lang
from ..timeline import get_timeline
from ..variables import (DEFAULT_BANNER_COLOR, DEFAULT_LANGUAGE,
                         ENABLE_GRADIENT_BANNERS, ENABLE_LOGGED_OUT_CONTENT,
                         ENABLE_NEW_ACCOUNTS, ENABLE_PRONOUNS,
                         ENABLE_USER_BIOS, MAX_BIO_LENGTH,
                         MAX_DISPL_NAME_LENGTH, MAX_MUTED_WORD_LENGTH,
                         MAX_MUTED_WORDS, MAX_USERNAME_LENGTH, THEMES,
                         VALID_LANGUAGES)
from .schema import (Account, APIResponse, ChangePassword, MutedWords,
                     Password, Settings, Theme, Username, _actions_user_tl)


def signup(request, data: Account) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/user/signup"):
        return rl

    username = data.username.lower().replace(" ", "")
    password = data.password.lower()

    if ENABLE_NEW_ACCOUNTS == "otp":
        try:
            otp = OneTimePassword.objects.get(code=data.otp)
        except OneTimePassword.DoesNotExist:
            return 400, {
                "success": False,
                "message": DEFAULT_LANG["account"]["invite_code_invalid"]
            }

    # e3b0c44... is the sha256 hash for an empty string
    if len(password) != 64 or password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return 400, {
            "success": False,
            "message": DEFAULT_LANG["account"]["bad_password"]
        }

    for i in password:
        if i not in "abcdef0123456789":
            return 400, {
                "success": False,
                "message": DEFAULT_LANG["account"]["bad_password"]
            }

    user_valid = validate_username(username, existing=False)
    if user_valid == 1:
        token = generate_token(username, password)
        User.objects.create(
            username=username,
            token=token,
            display_name=trim_whitespace(data.username, purge_newlines=True)[0][:MAX_DISPL_NAME_LENGTH],
            theme="auto",
            color=DEFAULT_BANNER_COLOR,
            color_two=DEFAULT_BANNER_COLOR,
            language=DEFAULT_LANGUAGE
        )

        if ENABLE_NEW_ACCOUNTS == "otp":
            otp.delete()

        return {
            "success": True,
            "actions": [
                { "name": "set_auth", "token": token },
                { "name": "reload" }
            ]
        }

    if user_valid == -1:
        return {
            "success": False,
            "message": DEFAULT_LANG["account"]["username_taken"]
        }

    elif user_valid == -2:
        return {
            "success": False,
            "message": DEFAULT_LANG["account"]["invalid_username_chars"]
        }

    return {
        "success": False,
        "message": DEFAULT_LANG["account"]["invalid_username_length"].replace("%s", str(MAX_USERNAME_LENGTH))
    }

def login(request, data: Account) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/user/login"):
        return rl

    username = data.username.lower().replace(" ", "")
    token = generate_token(username, data.password)

    if validate_username(username) == 1:
        if token == User.objects.get(username=username).token:
            return {
                "success": True,
                "actions": [
                    { "name": "set_auth", "token": token },
                    { "name": "reload" }
                ]
            }

        return 400, {
            "success": False,
            "message": DEFAULT_LANG["account"]["bad_password"]
        }

    return 400, {
        "success": False,
        "message": DEFAULT_LANG["account"]["username_does_not_exist"].replace("%s", data.username)
    }

def settings_theme(request, data: Theme) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/user/settings/theme"):
        return rl

    theme = data.theme.lower()

    user = User.objects.get(token=request.COOKIES.get("token"))

    lang = get_lang(user)

    if theme != "auto" and theme not in THEMES:
        return 400, {
            "success": False,
            "message": lang["settings"]["cosmetic_theme_invalid"],
        }

    user.theme = theme
    user.save()

    return {
        "success": True,
        "actions": [
            { "name": "set_theme", "auto": theme == "auto", "theme": THEMES[theme] if theme in THEMES else None }
        ]
    }

def settings(request, data: Settings) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/user/settings"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))
    lang = get_lang(user)

    reload = False

    color = data.color.lower()
    color_two = data.color_two.lower()
    displ_name = trim_whitespace(data.displ_name, True)
    bio = trim_whitespace(data.bio)

    if data.lang != user.language:
        reload = True

    if len(displ_name[0]) > MAX_DISPL_NAME_LENGTH or not displ_name[1] or (ENABLE_USER_BIOS and len(bio[0]) > MAX_BIO_LENGTH):
        return 400, {
            "success": False,
            "message": lang["settings"]["profile_display_name_invalid_length"].replace("%s", str(MAX_DISPL_NAME_LENGTH))
        }

    if color[0] != "#" or len(color) != 7 or (ENABLE_GRADIENT_BANNERS and (color_two[0] != "#" or len(color_two) != 7)):
        return 400, {
        "success": False,
        "message": lang["settings"]["profile_color_invalid"]
    }

    for i in color[1::]:
        if i not in "abcdef0123456789":
            return 400, {
                "success": False,
                "message": lang["settings"]["profile_color_invalid"]
            }

    if ENABLE_GRADIENT_BANNERS:
        for i in color_two[1::]:
            if i not in "abcdef0123456789":
                return 400, {
                    "success": False,
                    "message": lang["settings"]["profile_color_invalid"]
                }

    if data.lang not in VALID_LANGUAGES:
        return 400, {
            "success": False,
            "message": lang["settings"]["invalid_language"].replace("%s", data.lang)
        }

    user.color = color

    if ENABLE_GRADIENT_BANNERS:
        user.color_two = color_two
        user.gradient = data.is_gradient

    user.display_name = displ_name[0]

    user.verify_followers = data.approve_followers
    if not data.approve_followers:
        pending = user.pending_followers.all()
        for f in pending:
            f.following.add(user)
            user.pending_followers.remove(f)

    user.default_post_private = data.default_post_visibility == "followers"

    if ENABLE_USER_BIOS:
        user.bio = bio[0]

    if ENABLE_PRONOUNS:
        _p = user.pronouns.filter(language=user.language)
        if _p.exists():
            p = _p[0]
            p.primary = data.pronouns["primary"]
            p.secondary = data.pronouns["secondary"]
            p.save()

        else:
            UserPronouns.objects.create(
                user=user,
                language=user.language,
                primary=data.pronouns["primary"],
                secondary=data.pronouns["secondary"]
            )

    user.language = data.lang

    user.save()

    return {
        "success": True,
        "message": lang["generic"]["success"],
        "actions": [
            { "name": "reload" }
        ] if reload else []
    }

def follower_add(request, data: Username) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/user/follow"):
        return rl

    username = data.username.lower()
    user = User.objects.get(token=request.COOKIES.get("token"))
    lang = get_lang(user)

    try:
        followed = User.objects.get(username=username)
    except User.DoesNotExist:
        return 400, {
            "success": False,
            "message": lang["account"]["username_does_not_exist"].replace("%s", data.username)
        }

    if user.blocking.contains(followed):
        return 400, {
            "success": False,
            "message": lang["account"]["follow_blocking"]
        }

    if followed.blocking.contains(user):
        return 400, {
            "success": False,
            "message": lang["account"]["follow_blocked"]
        }

    if not user.following.contains(followed):
        if followed.verify_followers:
            followed.pending_followers.add(user)
        else:
            user.following.add(followed)

    return {
        "success": True,
        "actions": [
            {
                "name": "update_element",
                "query": "#toggle",
                "text": lang["user_page"]["pending" if followed.verify_followers else "unfollow"],
                "attribute": [{ "name": "data-followed", "value": "1"}]
            }
        ]
    }

def follower_remove(request, data: Username) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/user/follow"):
        return rl

    username = data.username.lower()
    user = User.objects.get(token=request.COOKIES.get("token"))

    if not validate_username(username):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["account"]["username_does_not_exist"].replace("%s", data.username)
        }

    followed = User.objects.get(username=username)
    if user.user_id != followed.user_id:
        if user.following.contains(followed):
            user.following.remove(followed)

        elif followed.pending_followers.contains(user):
            followed.pending_followers.remove(user)

    else:
        return 400, {
            "success": False
        }

    lang = get_lang(user)

    return {
        "success": True,
        "actions": [
            {
                "name": "update_element",
                "query": "#toggle",
                "text": lang["user_page"]["follow"],
                "attribute": [{ "name": "data-followed", "value": "0"}]
            }
        ]
    }

def block_add(request, data: Username) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/user/block"):
        return rl

    username = data.username.lower()
    user = User.objects.get(token=request.COOKIES.get("token"))

    if not validate_username(username):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["account"]["username_does_not_exist"].replace("%s", data.username)
        }

    if user.username == username:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["account"]["block_self"]
        }

    blocked = User.objects.get(username=username)

    if not user.blocking.contains(blocked):
        if user.following.contains(blocked):
            user.following.remove(blocked)

        if user.pending_followers.contains(blocked):
            user.pending_followers.remove(blocked)

        if blocked.following.contains(user):
            blocked.following.remove(user)

        if blocked.pending_followers.contains(user):
            blocked.pending_followers.remove(user)

        user.blocking.add(blocked)

    lang = get_lang(user)

    return {
        "success": True,
        "actions": [
            {
                "name": "update_element",
                "query": "#block",
                "text": lang["user_page"]["unblock"],
                "attribute": [{ "name": "data-blocked", "value": "1"}]
            }
        ]
    }

def block_remove(request, data: Username) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/user/block"):
        return rl

    username = data.username.lower()
    user = User.objects.get(token=request.COOKIES.get("token"))

    if not validate_username(username):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["account"]["username_does_not_exist"].replace("%s", data.username)
        }

    if user.username == username:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["account"]["block_self"]
        }

    blocked = User.objects.get(username=username)
    if user.blocking.contains(blocked):
        user.blocking.remove(blocked)

    else:
        return 400, {
            "success": False
        }

    lang = get_lang(user)

    return {
        "success": True,
        "actions": [
            {
                "name": "update_element",
                "query": "#block",
                "text": lang["user_page"]["block"],
                "attribute": [{ "name": "data-blocked", "value": "0"}]
            }
        ]
    }

def change_password(request, data: ChangePassword) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/user/password"):
        return rl

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if len(data.password) != 64:
        return 400, {
            "success": False
        }

    for i in data.password:
        if i not in "abcdef0123456789":
            return 400, {
                "success": False
            }

    lang = get_lang(user)

    if data.password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return 400, {
            "success": False,
            "message": lang["account"]["password_empty"]
        }

    if generate_token(user.username, data.password) != request.COOKIES.get("token"):
        return 400, {
            "success": False,
            "message": lang["account"]["password_match_failure"]
        }

    new_token = generate_token(user.username, data.new_password)

    user.token = new_token
    user.save()

    return {
        "success": True,
        "message": lang["settings"]["account_password_success"],
        "actions": [
            { "name": "set_auth", "token": new_token }
        ]
    }

def read_notifs(request) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/user/notifications"):
        return rl

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    for notif in self_user.notifications.filter(read=False):
        notif.read = True
        notif.save()

    return {
        "success": True,
        "actions": [
            { "name": "update_element", "query": ".post[data-notif-unread]", "all": True, "attribute": [
                { "name": "data-notif-unread", "value": None },
                { "name": "data-color", "value": "gray" }
            ]},
            { "name": "update_element", "query": "hr[data-notif-hr]", "attribute": [
                { "name": "hidden", "value": "" }
            ]},
            { "name": "update_element", "query": "[data-add-notification-dot]", "set_class": [
                { "class_name": "dot", "enable": False }
            ]},
            { "name": "refresh_notifications" }
        ]
    }

def clear_read_notifs(request) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/user/notifications"):
        return rl

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    self_user.notifications.filter(read=True).delete()

    return {
        "success": True,
        "actions": [
            { "name": "refresh_timeline" }
        ]
    }

def notifications_list(request, offset: int | None=None, forwards: bool=False) -> APIResponse:
    if rl := check_ratelimit(request, "GET /api/user/notifications"):
        return rl

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    def notif_visible(notification: Notification) -> bool:
        try:
            if notification.event_type in ["comment", "ping_c"]:
                post = Comment.objects.get(comment_id=notification.event_id)
            else:
                post = Post.objects.get(post_id=notification.event_id)

            return post.can_view(user)[0]

        except Post.DoesNotExist:
            notification.delete()
        except Comment.DoesNotExist:
            notification.delete()

        return False

    def notif_to_json(notification: Notification) -> dict:
        if notification.event_type in ["comment", "ping_c"]:
            post = Comment.objects.get(comment_id=notification.event_id)
        else:
            post = Post.objects.get(post_id=notification.event_id)

        return {
            "event_type": notification.event_type,
            "read": notification.read,
            "data": post.json(user),
            "id": notification.notif_id
        }

    tl = get_timeline(
        user.notifications.order_by("-notif_id"),
        offset,
        user,
        forwards=forwards,
        condition=notif_visible,
        to_json=notif_to_json
    )

    return {
        "success": True,
        "actions": [
            { "name": "populate_forwards_cache", "posts": tl[0] if tl[1] else [], "its_a_lost_cause_just_refresh_at_this_point": not tl[1] }
            if forwards else
            { "name": "notification_list", "notifications": tl[0], "end": tl[1], "forwards": False }
        ]
    }

def list_pending(request, offset: int | None=None) -> APIResponse:
    if rl := check_ratelimit(request, "GET /api/user/pending"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if offset == -1:
        offset = 0

    if not user.verify_followers:
        return {
            "success": True,
            "actions": [
                { "name": "user_timeline", "users": [], "more": False, "special": "pending" }
            ]
        }

    tl = get_timeline(
        user.pending_followers.all(),
        offset,
        user,
        use_pages=True
    )

    return {
        "success": True,
        "actions": [
            { "name": "user_timeline", "users": tl[0], "more": not tl[1], "special": "pending" }
        ]
    }

def accept_pending(request, data: Username) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/user/pending"):
        return rl

    self_user = User.objects.get(token=request.COOKIES.get("token"))
    user = User.objects.get(username=data.username.lower())

    if not self_user.verify_followers:
        return 400, {
            "success": False
        }

    if self_user.pending_followers.contains(user):
        self_user.pending_followers.remove(user)
        user.following.add(self_user)

    return {
        "success": True,
        "actions": [
            { "name": "refresh_timeline", "special": "pending" },
            { "name": "refresh_notifications" }
        ]
    }

def remove_pending(request, data: Username) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/user/pending"):
        return rl

    self_user = User.objects.get(token=request.COOKIES.get("token"))
    user = User.objects.get(username=data.username.lower())

    if not self_user.verify_followers:
        return 400, {
            "success": False
        }

    if self_user.pending_followers.contains(user):
        self_user.pending_followers.remove(user)

    return {
        "success": True,
        "actions": [
            { "name": "refresh_timeline", "special": "pending" },
            { "name": "refresh_notifications" }
        ]
    }

def user_delete(request, data: Password) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/user"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if user.token == generate_token(user.username, data.password):
        for mid in user.messages:
            try:
                pmc = PrivateMessageContainer.objects.get(container_id=mid)
            except PrivateMessageContainer.DoesNotExist:
                continue

            u1 = pmc.user_one
            u2 = pmc.user_two

            if u1.user_id == user.user_id:
                u2.messages.remove(mid)
                if mid in u2.unread_messages:
                    u2.unread_messages.remove(mid)

                u2.save()
            else:
                u1.messages.remove(mid)
                if mid in u1.unread_messages:
                    u1.unread_messages.remove(mid)

                u1.save()

        user.delete()

        return {
            "success": True,
            "actions": [
                { "name": "redirect", "to": "logout" }
            ]
        }

    lang = get_lang(user)

    return 400, {
        "success": False,
        "message": lang["account"]["bad_password"]
    }

def muted(request, data: MutedWords) -> APIResponse:
    # You may need to also edit the muted function in backend.api.admin to match functionality
    if rl := check_ratelimit(request, "POST /api/user/muted"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))
    lang = get_lang(user)
    objs = []

    words: list[tuple[str, bool]] = [(word.strip().replace("\n", ""), False) for word in data.soft.split("\n") if word.strip()] + [(word.strip().replace("\n", ""), True) for word in data.hard.split("\n") if word.strip()]

    if len(words) > MAX_MUTED_WORDS:
        return 400, {
            "success": False,
            "message": lang["settings"]["mute"]["too_many"].replace("%m", str(MAX_MUTED_WORDS)).replace("%s", str(len(objs)))
        }

    too_long = [word[0] for word in words if len(word[0]) > MAX_MUTED_WORD_LENGTH]
    if len(too_long):
        return 400, {
            "success": False,
            "message": lang["settings"]["mute"]["long"].replace("%m", str(MAX_MUTED_WORD_LENGTH)).replace("%s", str(len(too_long[0]))).replace("%v", too_long[0])
        }

    for word in words:
        regex = word[0] == "/" and re.match(r"^/.*/[ims]+$", word[0])

        if regex:
            word = f"(?{''.join(list(set([i for i in word[0].split('/')[-1]])))}){'/'.join(word[0][1::].split('/')[:-1])}"

        objs.append(MutedWord(
            user=user,
            is_regex=bool(regex),
            string=word[0].replace("\n", ""),
            hard_mute=word[1]
        ))

    MutedWord.objects.filter(user__user_id=user.user_id).delete()
    MutedWord.objects.bulk_create(objs)

    return {
        "success": True,
        "message": lang["generic"]["success"]
    }

def _lists_get_values(query: Manager[User], page: int, special: Literal["following", "followers", "blocking"]) -> _actions_user_tl:
    tl = get_timeline(
        query,
        page,
        use_pages=True
    )

    return {
        "name": "user_timeline",
        "users": tl[0],
        "more": not tl[1],
        "special": special
    }

def lists(request, username: str, column: str, page: int | None=None) -> APIResponse:
    if rl := check_ratelimit(request, "GET /api/user/lists"):
        return rl

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return 404, {
            "success": False
        }

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        if not ENABLE_LOGGED_OUT_CONTENT:
            return 400, {
                "success": False
            }
    else:
        if user.blocking.contains(self_user):
            return 400, {
                "success": False
            }

    is_self = user.token == request.COOKIES.get("token")

    if column == "all" or not page or page < 0:
        page = 0

    actions = []

    if column == "all" or column == "followers":
        actions.append(_lists_get_values(user.followers.all(), page, "followers"))

    if column == "all" or column == "following":
        actions.append(_lists_get_values(user.following.all(), page, "following"))

    if is_self and (column == "all" or column == "blocking"):
        actions.append(_lists_get_values(user.blocking.all(), page, "blocking"))

    return {
        "success": True,
        "actions": actions
    }
