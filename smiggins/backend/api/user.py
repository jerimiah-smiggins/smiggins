# For API functions that are user-specific, like settings, following, etc.

from posts.models import (Comment, OneTimePassword, Post,
                          PrivateMessageContainer, User, UserPronouns)

from ..helper import (DEFAULT_LANG, create_api_ratelimit, ensure_ratelimit,
                      generate_token, get_badges, get_ip_addr, get_lang,
                      get_post_json, trim_whitespace, validate_username)
from ..variables import (API_TIMINGS, DEFAULT_BANNER_COLOR, DEFAULT_LANGUAGE,
                         ENABLE_GRADIENT_BANNERS, ENABLE_NEW_ACCOUNTS,
                         ENABLE_PRONOUNS, ENABLE_USER_BIOS, MAX_BIO_LENGTH,
                         MAX_DISPL_NAME_LENGTH, MAX_USERNAME_LENGTH,
                         POSTS_PER_REQUEST, THEMES, VALID_LANGUAGES)
from .schema import (Account, APIResponse, ChangePassword, Password, Settings,
                     Theme, Username)


def signup(request, data: Account) -> APIResponse:
    # Called when someone requests to follow another account.

    if not ensure_ratelimit("api_account_signup", get_ip_addr(request)):
        return 429, {
            "success": False,
            "message": DEFAULT_LANG["generic"]["ratelimit"]
        }

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
        create_api_ratelimit("api_account_signup", API_TIMINGS["signup successful"], get_ip_addr(request))

        token = generate_token(username, password)
        User.objects.create(
            username=username,
            token=token,
            display_name=trim_whitespace(data.username, purge_newlines=True),
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
                { "name": "redirect", "to": "home" }
            ]
        }

    create_api_ratelimit("api_account_signup", API_TIMINGS["signup unsuccessful"], get_ip_addr(request))

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
    # Called when someone attempts to log in.

    if not ensure_ratelimit("api_account_login", get_ip_addr(request)):
        return 429, {
            "success": False,
            "message": DEFAULT_LANG["generic"]["ratelimit"]
        }

    username = data.username.lower()
    token = generate_token(username, data.password)

    if validate_username(username) == 1:
        if token == User.objects.get(username=username).token:
            create_api_ratelimit("api_account_login", API_TIMINGS["login successful"], get_ip_addr(request))
            return {
                "success": True,
                "actions": [
                    { "name": "set_auth", "token": token },
                    { "name": "redirect", "to": "home" }
                ]
            }

        create_api_ratelimit("api_account_login", API_TIMINGS["login unsuccessful"], get_ip_addr(request))
        return 400, {
            "success": False,
            "message": DEFAULT_LANG["account"]["bad_password"]
        }

    create_api_ratelimit("api_account_login", API_TIMINGS["login unsuccessful"], get_ip_addr(request))
    return 400, {
        "success": False,
        "message": DEFAULT_LANG["account"]["username_does_not_exist"].replace("%s", data.username)
    }

def settings_theme(request, data: Theme) -> APIResponse:
    # Called when the user changes their theme.

    token = request.COOKIES.get('token')
    theme = data.theme.lower()

    user = User.objects.get(token=token)

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
    # Called when someone saves their settings

    user = User.objects.get(token=request.COOKIES.get('token'))
    lang = get_lang(user)

    reload = False

    color = data.color.lower()
    color_two = data.color_two.lower()
    displ_name = trim_whitespace(data.displ_name, True)
    bio = trim_whitespace(data.bio, True)
    pronouns = data.pronouns
    language = data.lang

    if language != user.language:
        reload = True

    if (len(displ_name) > MAX_DISPL_NAME_LENGTH or len(displ_name) < 1) or (ENABLE_USER_BIOS and len(bio) > MAX_BIO_LENGTH):
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

    if language not in [i["code"] for i in VALID_LANGUAGES]:
        return 400, {
            "success": False,
            "message": lang["settings"]["invalid_language"].replace("%s", language)
        }

    user.color = color

    if ENABLE_GRADIENT_BANNERS:
        user.color_two = color_two
        user.gradient = data.is_gradient

    user.display_name = displ_name

    user.verify_followers = data.approve_followers
    if not data.approve_followers:
        pending = user.pending_followers.all()
        for f in pending:
            f.following.add(user)
            user.pending_followers.remove(f)

    user.default_post_private = data.default_post_visibility == "followers"

    if ENABLE_USER_BIOS:
        user.bio = bio

    if ENABLE_PRONOUNS:
        _p = user.pronouns.filter(language=user.language)
        if _p.exists():
            p = _p[0]
            p.primary = pronouns["primary"]
            p.secondary = pronouns["secondary"]

        else:
            UserPronouns.objects.create(
                user=user,
                language=user.language,
                primary=pronouns["primary"],
                secondary=pronouns["secondary"]
            )

    user.language = language

    user.save()

    return {
        "success": True,
        "message": lang["generic"]["success"],
        "actions": [
            { "name": "reload" }
        ] if reload else []
    }

def follower_add(request, data: Username) -> APIResponse:
    # Called when someone requests to follow another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()
    user = User.objects.get(token=token)
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
    # Called when someone requests to unfollow another account.

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
    # Called when someone requests to block another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()
    user = User.objects.get(token=token)

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
    # Called when someone requests to unblock another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()
    user = User.objects.get(token=token)

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
    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    self_user.read_notifs = True
    self_user.save()

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
            ]}
        ]
    }

def clear_read_notifs(request) -> APIResponse:
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
            { "name": "refresh_timeline", "special": "notifications" }
        ]
    }

def notifications_list(request) -> APIResponse:
    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    notifs_list = []

    all_notifs = self_user.notifications.all().order_by("-notif_id")

    for notification in all_notifs:
        try:
            x = get_post_json(notification.event_id, self_user, notification.event_type in ["comment", "ping_c"])

            if "content" in x:
                notifs_list.append({
                    "event_type": notification.event_type,
                    "read": notification.read,
                    "data": x
                })

        except Post.DoesNotExist:
            notification.delete()
        except Comment.DoesNotExist:
            notification.delete()

    return {
        "success": True,
        "actions": [
            { "name": "notification_list", "notifications": notifs_list }
        ]
    }

def list_pending(request, offset: int=-1) -> APIResponse:
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

    pending_json = []

    for other_user in user.pending_followers.all()[POSTS_PER_REQUEST * offset::]:
        pending_json.append({
            "username": other_user.username,
            "display_name": other_user.display_name,
            "badges": get_badges(other_user),
            "color_one": other_user.color,
            "color_two": other_user.color_two,
            "gradient_banner": other_user.gradient,
            "bio": other_user.bio
        })

        if len(pending_json) >= POSTS_PER_REQUEST:
            break

    return {
        "success": True,
        "actions": [
            { "name": "user_timeline", "users": pending_json, "more": user.pending_followers.count() > POSTS_PER_REQUEST * (offset + 1), "special": "pending" }
        ]
    }

def accept_pending(request, data: Username) -> APIResponse:
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
            { "name": "refresh_timeline", "special": "pending" }
        ]
    }

def remove_pending(request, data: Username) -> APIResponse:
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
            { "name": "refresh_timeline", "special": "pending" }
        ]
    }

def user_delete(request, data: Password) -> APIResponse:
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
