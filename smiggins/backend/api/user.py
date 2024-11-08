# For API functions that are user-specific, like settings, following, etc.

from posts.models import Comment, Post, User

from ..helper import (DEFAULT_LANG, create_api_ratelimit, ensure_ratelimit,
                      generate_token, get_badges, get_lang, get_post_json,
                      trim_whitespace, validate_username)
from ..variables import (API_TIMINGS, DEFAULT_BANNER_COLOR,
                         ENABLE_GRADIENT_BANNERS, ENABLE_PRONOUNS,
                         ENABLE_USER_BIOS, MAX_BIO_LENGTH,
                         MAX_DISPL_NAME_LENGTH, MAX_USERNAME_LENGTH,
                         POSTS_PER_REQUEST, THEMES, VALID_LANGUAGES)
from .schema import Account, ChangePassword, Settings, Theme, Username


def signup(request, data: Account) -> tuple | dict:
    # Called when someone requests to follow another account.

    if not ensure_ratelimit("api_account_signup", request.META.get("REMOTE_ADDR")):
        return 429, {
            "valid": False,
            "reason": DEFAULT_LANG["generic"]["ratelimit"]
        }

    username = data.username.lower().replace(" ", "")
    password = data.password.lower()

    # e3b0c44... is the sha256 hash for an empty string
    if len(password) != 64 or password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return 400, {
            "valid": False,
            "reason": DEFAULT_LANG["account"]["bad_password"]
        }

    for i in password:
        if i not in "abcdef0123456789":
            return 400, {
                "valid": False,
                "reason": DEFAULT_LANG["account"]["bad_password"]
            }

    user_valid = validate_username(username, existing=False)
    if user_valid == 1:
        create_api_ratelimit("api_account_signup", API_TIMINGS["signup successful"], request.META.get('REMOTE_ADDR'))

        token = generate_token(username, password)
        user = User(
            username=username,
            token=token,
            display_name=username,
            theme="auto",
            color=DEFAULT_BANNER_COLOR,
            color_two=DEFAULT_BANNER_COLOR,
            following=[],
            followers=[]
        )
        user.save()

        user = User.objects.get(username=username)

        user.following = [user.user_id]
        user.save()

        return {
            "valid": True,
            "token": token
        }

    create_api_ratelimit("api_account_signup", API_TIMINGS["signup unsuccessful"], request.META.get('REMOTE_ADDR'))

    if user_valid == -1:
        return {
            "valid": False,
            "reason": DEFAULT_LANG["account"]["username_taken"]
        }

    elif user_valid == -2:
        return {
            "valid": False,
            "reason": DEFAULT_LANG["account"]["invalid_username_chars"]
        }

    return {
        "valid": False,
        "reason": DEFAULT_LANG["account"]["invalid_username_length"].replace("%s", str(MAX_USERNAME_LENGTH))
    }

def login(request, data: Account) -> tuple | dict:
    # Called when someone attempts to log in.

    if not ensure_ratelimit("api_account_login", request.META.get("REMOTE_ADDR")):
        return 429, {
            "valid": False,
            "reason": DEFAULT_LANG["generic"]["ratelimit"]
        }

    username = data.username.lower()
    token = generate_token(username, data.password)

    def blow_up_phone():
        phone = "boom"
        return phone

    if username == "breaadyboy":
        blow_up_phone()

    if validate_username(username) == 1:
        if token == User.objects.get(username=username).token:
            create_api_ratelimit("api_account_login", API_TIMINGS["login successful"], request.META.get('REMOTE_ADDR'))
            return {
                "valid": True,
                "token": token
            }

        else:
            create_api_ratelimit("api_account_login", API_TIMINGS["login unsuccessful"], request.META.get('REMOTE_ADDR'))
            return 400, {
                "valid": False,
                "reason": DEFAULT_LANG["account"]["bad_password"]
            }

    else:
        create_api_ratelimit("api_account_login", API_TIMINGS["login unsuccessful"], request.META.get('REMOTE_ADDR'))
        return 400, {
            "valid": False,
            "reason": DEFAULT_LANG["account"]["username_does_not_exist"].replace("%s", data.username)
        }

def settings_theme(request, data: Theme) -> tuple | dict:
    # Called when the user changes their theme.

    token = request.COOKIES.get('token')
    theme = data.theme.lower()

    user = User.objects.get(token=token)

    lang = get_lang(user)

    if theme != "auto" and theme not in THEMES:
        return 400, {
            "success": False,
            "reason": lang["settings"]["cosmetic_theme_invalid"],
        }

    user.theme = theme
    user.save()

    return {
        "success": True,
        "auto": theme == "auto",
        "themeJSON": THEMES[theme] if theme in THEMES else None
    }

def settings(request, data: Settings) -> tuple | dict:
    # Called when someone saves their settings

    token = request.COOKIES.get('token')

    color = data.color.lower()
    color_two = data.color_two.lower()
    displ_name = trim_whitespace(data.displ_name, True)
    bio = trim_whitespace(data.bio, True)
    pronouns = data.pronouns.lower()
    language = data.lang

    user = User.objects.get(token=token)
    lang = get_lang(user)

    if ENABLE_PRONOUNS and (len(pronouns) != 2 or pronouns not in ["__", "_a", "_o", "_v", "aa", "af", "ai", "am", "an", "ao", "ax", "fa", "ff", "fi", "fm", "fn", "fo", "fx", "ma", "mf", "mi", "mm", "mn", "mo", "mx", "na", "nf", "ni", "nm", "nn", "no", "nx", "oa", "of", "oi", "om", "on", "oo", "ox"]):
        return 400, {
            "success": False,
            "reason": lang["settings"]["profile_pronouns_invalid"].replace("%s", pronouns)
        }

    if (len(displ_name) > MAX_DISPL_NAME_LENGTH or len(displ_name) < 1) or (ENABLE_USER_BIOS and len(bio) > MAX_BIO_LENGTH):
        return 400, {
            "success": False,
            "reason": lang["settings"]["profile_display_name_invalid_length"].replace("%s", str(MAX_DISPL_NAME_LENGTH))
        }

    if color[0] != "#" or len(color) != 7 or (ENABLE_GRADIENT_BANNERS and (color_two[0] != "#" or len(color_two) != 7)):
        return 400, {
        "success": False,
        "reason": lang["settings"]["profile_color_invalid"]
    }

    for i in color[1::]:
        if i not in "abcdef0123456789":
            return 400, {
                "success": False,
                "reason": lang["settings"]["profile_color_invalid"]
            }

    if ENABLE_GRADIENT_BANNERS:
        for i in color_two[1::]:
            if i not in "abcdef0123456789":
                return 400, {
                    "success": False,
                    "reason": lang["settings"]["profile_color_invalid"]
                }

    if language not in [i["code"] for i in VALID_LANGUAGES]:
        return 400, {
            "success": False,
            "reason": lang["settings"]["invalid_language"].replace("%s", language)
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
        user.pronouns = pronouns

    user.language = language

    user.save()

    return {
        "success": True
    }

def follower_add(request, data: Username) -> tuple | dict:
    # Called when someone requests to follow another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()
    user = User.objects.get(token=token)

    try:
        followed = User.objects.get(username=username)
    except User.DoesNotExist:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["account"]["username_does_not_exist"].replace("%s", data.username)
        }

    if user.blocking.contains(followed):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["account"]["follow_blocking"]
        }

    if followed.blocking.contains(user):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["account"]["follow_blocked"]
        }

    if not user.following.contains(followed):
        if followed.verify_followers:
            followed.pending_followers.add(user)
        else:
            user.following.add(followed)

    return {
        "success": True,
        "pending": followed.verify_followers
    }

def follower_remove(request, data: Username) -> tuple | dict:
    # Called when someone requests to unfollow another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()
    user = User.objects.get(token=token)

    if not validate_username(username):
        lang = get_lang(user)
        return 400, {
            "valid": False,
            "reason": lang["account"]["username_does_not_exist"].replace("%s", data.username)
        }

    followed = User.objects.get(username=username)
    if user.user_id != followed.user_id:
        if user.following.contains(followed):
            user.following.remove(followed)
            followed.save()

        elif followed.pending_followers.contains(user):
            followed.pending_followers.remove(user)
            followed.save()

    else:
        return 400, {
            "success": False
        }

    return {
        "success": True
    }

def block_add(request, data: Username) -> tuple | dict:
    # Called when someone requests to block another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()
    user = User.objects.get(token=token)

    if not validate_username(username):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["account"]["username_does_not_exist"].replace("%s", data.username)
        }

    if user.username == username:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["account"]["block_self"]
        }

    blocked = User.objects.get(username=username)

    if not user.blocking.contains(blocked):
        if user.following.contains(blocked):
            user.following.remove(blocked)

        elif user.pending_followers.contains(blocked):
            user.pending_followers.remove(blocked)

        if blocked.following.contains(user):
            blocked.following.remove(user)

        elif blocked.pending_followers.contains(user):
            blocked.pending_followers.remove(user)

        user.blocking.add(blocked)

    return {
        "success": True
    }

def block_remove(request, data: Username) -> tuple | dict:
    # Called when someone requests to unblock another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()
    user = User.objects.get(token=token)

    if not validate_username(username):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["account"]["username_does_not_exist"].replace("%s", data.username)
        }

    if user.username == username:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["account"]["block_self"]
        }

    blocked = User.objects.get(username=username)
    if user.blocking.contains(blocked):
        user.blocking.remove(blocked)

    else:
        return 400, {
            "success": False
        }

    return {
        "success": True
    }

def change_password(request, data: ChangePassword) -> tuple | dict:
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

    if data.password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["account"]["password_empty"]
        }

    if generate_token(user.username, data.password) != request.COOKIES.get("token"):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["account"]["password_match_failure"]
        }

    new_token = generate_token(user.username, data.new_password)

    user.token = new_token
    user.save()

    return {
        "success": True,
        "token": new_token
    }

def read_notifs(request) -> tuple | dict:
    try:
        token = request.COOKIES.get('token')
        self_user = User.objects.get(token=token)
    except KeyError:
        return 400, {
            "success": False
        }
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
        "success": True
    }

def notifications_list(request) -> tuple | dict:
    try:
        token = request.COOKIES.get('token')
        self_user = User.objects.get(token=token)
    except KeyError:
        return 400, {
            "success": False
        }
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    notifs_list = []
    self_id = self_user.user_id

    all_notifs = self_user.notifications.all().order_by("-notif_id")
    for notification in all_notifs:
        try:
            x = get_post_json(notification.event_id, self_id, notification.event_type in ["comment", "ping_c"])

            if "content" in x:
                notifs_list.append({
                    "event_type": notification.event_type,
                    "read": notification.read,
                    "timestamp": notification.timestamp,
                    "data": x
                })

        except Post.DoesNotExist:
            notification.delete()
        except Comment.DoesNotExist:
            notification.delete()

    return {
        "success": True,
        "notifications": notifs_list
    }

def list_pending(request, offset: int=-1) -> dict:
    user = User.objects.get(token=request.COOKIES.get("token"))

    if offset == -1:
        offset = 0

    if not user.verify_followers:
        return {
            "success": True,
            "end": True,
            "pending": []
        }

    pending_json = []

    for other_user in user.pending_followers.all():
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

    print({
"success": True,
"more": user.pending_followers.count() > POSTS_PER_REQUEST,
"pending": pending_json
})
    return {
        "success": True,
        "more": user.pending_followers.count() > POSTS_PER_REQUEST,
        "pending": pending_json
    }

def accept_pending(request, data: Username) -> tuple | dict:
    self_user = User.objects.get(token=request.COOKIES.get("token"))
    user = User.objects.get(username=data.username)

    if not self_user.verify_followers:
        return 400, {
            "success": False
        }

    if self_user.pending_followers.contains(user):
        self_user.pending_followers.remove(user)
        user.following.add(self_user)

    return {
        "success": True
    }

def remove_pending(request, data: Username) -> tuple | dict:
    self_user = User.objects.get(token=request.COOKIES.get("token"))
    user = User.objects.get(username=data.username)

    if not self_user.verify_followers:
        return 400, {
            "success": False
        }

    if self_user.pending_followers.contains(user):
        self_user.pending_followers.remove(user)

    return {
        "success": True
    }
