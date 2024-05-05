# For API functions that are user-specific, like settings, following, etc.

from ._settings import API_TIMINGS, DEFAULT_BANNER_COLOR, MAX_USERNAME_LENGTH, MAX_BIO_LENGTH, MAX_DISPL_NAME_LENGTH
from .packages  import User, Post, Comment, Notification, Schema
from .helper    import validate_username, trim_whitespace, create_api_ratelimit, ensure_ratelimit, generate_token, get_post_json

class Username(Schema):
    username: str

class Account(Username):
    password: str

class Theme(Schema):
    theme: str

class Settings(Schema):
    bio: str
    priv: bool
    color: str
    pronouns: str
    color_two: str
    displ_name : str
    is_gradient: bool

def signup(request, data: Account) -> tuple | dict:
    # Called when someone requests to follow another account.

    if not ensure_ratelimit("api_account_signup", request.META.get("REMOTE_ADDR")):
        return 429, {
            "valid": False,
            "reason": "Ratelimited"
        }

    username = data.username.lower().replace(" ", "")
    password = data.password.lower()

    # e3b0c44... is the sha256 hash for an empty string
    if len(password) != 64 or password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return {
            "valid": False,
            "reason": "Invalid Password"
        }

    for i in password:
        if i not in "abcdef0123456789":
            return {
                "valid": False,
                "reason": "Invalid Password"
            }

    user_valid = validate_username(username, existing=False)
    if user_valid == 1:
        create_api_ratelimit("api_account_signup", API_TIMINGS["signup successful"], request.META.get('REMOTE_ADDR'))

        token = generate_token(username, password)
        user = User(
            username=username,
            token=token,
            display_name=username,
            theme="dark",
            color=DEFAULT_BANNER_COLOR,
            private=False,
            following=[],
            followers=[],
            posts=[],
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
            "reason": "Username taken."
        }

    elif user_valid == -2:
        return {
            "valid": False,
            "reason": "Username can only use A-Z, 0-9, underscores, and hyphens."
        }

    return {
        "valid": False,
        "reason": f"Username must be between 1 and {MAX_USERNAME_LENGTH} characters in length."
    }

def login(request, data: Account) -> tuple | dict:
    # Called when someone attempts to log in.

    if not ensure_ratelimit("api_account_login", request.META.get("REMOTE_ADDR")):
        return 429, {
            "valid": False,
            "reason": "Ratelimited"
        }

    username = data.username.lower()
    password = data.password
    token = generate_token(username, password)

    if validate_username(username) == 1:
        if token == User.objects.get(username=username).token:
            create_api_ratelimit("api_account_login", API_TIMINGS["login successful"], request.META.get('REMOTE_ADDR'))
            return {
                "valid": True,
                "token": token
            }

        else:
            create_api_ratelimit("api_account_login", API_TIMINGS["login unsuccessful"], request.META.get('REMOTE_ADDR'))
            return {
                "valid": False,
                "reason": "Invalid password."
            }

    else:
        create_api_ratelimit("api_account_login", API_TIMINGS["login unsuccessful"], request.META.get('REMOTE_ADDR'))
        return {
            "valid": False,
            "reason": f"Account with username {username} doesn't exist."
        }

def settings_theme(request, data: Theme) -> tuple | dict:
    # Called when the user changes their theme.

    token = request.COOKIES.get('token')
    theme = data.theme.lower()

    if theme.lower() not in ["light", "gray", "dark", "black", "oled"]:
        return 400, {
            "success": False,
            "reason": "That's not a vailid theme, idiot.",
        }

    user = User.objects.get(token=token)
    user.theme = theme
    user.save()

    return {
        "success": True
    }

def settings(request, data: Settings) -> tuple | dict:
    # Called when someone saves their settings

    token = request.COOKIES.get('token')

    color = data.color.lower()
    color_two = data.color_two.lower()
    displ_name = trim_whitespace(data.displ_name, True)
    bio = trim_whitespace(data.bio, True)
    pronouns = data.pronouns.lower()

    if len(pronouns) != 2 or pronouns not in ["__", "_a", "_o", "_v", "aa", "af", "ai", "am", "an", "ao", "ax", "fa", "ff", "fi", "fm", "fn", "fo", "fx", "ma", "mf", "mi", "mm", "mn", "mo", "mx", "na", "nf", "ni", "nm", "nn", "no", "nx", "oa", "of", "oi", "om", "on", "oo", "ox"]:
        return 400, {
            "success": False,
            "reason": f"Invalid pronoun string '{pronouns}'. If this is a bug, please report this."
        }

    if (len(displ_name) > MAX_DISPL_NAME_LENGTH or len(displ_name) < 1) or (len(bio) > MAX_BIO_LENGTH):
        return 400, {
            "success": False,
            "reason": f"Invalid name length. Must be between 1 and {MAX_DISPL_NAME_LENGTH} characters after minifying whitespace."
        }

    if color[0] != "#" or len(color) != 7 or color_two[0] != "#" or len(color_two) != 7:
        return 400, {
        "success": False,
        "reason": "Color very no tasty"
    }

    for i in color[1::]:
        if i not in "abcdef0123456789":
            return 400, {
                "success": False,
                "reason": "Color no tasty"
            }

    for i in color_two[1::]:
        if i not in "abcdef0123456789":
            return 400, {
                "success": False,
                "reason": "Color no yummy"
            }

    user = User.objects.get(token=token)

    user.color = color
    user.color_two = color_two
    user.gradient = data.is_gradient
    user.private = data.priv
    user.display_name = displ_name
    user.pronouns = pronouns
    user.bio = bio

    user.save()

    return {
        "success": True
    }

def follower_add(request, data: Username) -> tuple | dict:
    # Called when someone requests to follow another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()

    if not validate_username(username):
        return 400, {
            "valid": False,
            "reason": f"Account with username {username} doesn't exist."
        }

    user = User.objects.get(token=token)
    followed = User.objects.get(username=username)

    if followed.user_id in user.blocking:
        return 400, {
            "valid": False,
            "reason": "You can't follow an account you're blocking!"
        }

    if followed.user_id not in user.following:
        user.following.append(followed.user_id)
        user.save()

    if user.user_id not in followed.followers:
        followed.followers.append(user.user_id) # type: ignore
        followed.save()

    return 201, {
        "success": True
    }

def follower_remove(request, data: Username) -> tuple | dict:
    # Called when someone requests to unfollow another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()

    if not validate_username(username):
        return 400, {
            "valid": False,
            "reason": f"Account with username {username} doesn't exist."
        }

    user = User.objects.get(token=token)
    followed = User.objects.get(username=username)
    if user.user_id != followed.user_id:
        if followed.user_id in user.following :
            user.following.remove(followed.user_id)
            user.save()

        if user.user_id in followed.followers:
            followed.followers.remove(user.user_id)
            followed.save()
    else:
        return 400, {
            "success": False
        }

    return 201, {
        "success": True
    }

def block_add(request, data: Username) -> tuple | dict:
    # Called when someone requests to block another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()

    if not validate_username(username):
        return 400, {
            "success": False,
            "reason": f"Account with username {username} doesn't exist."
        }

    user = User.objects.get(token=token)

    if user.username == username:
        return 400, {
            "success": False,
            "reason": "Huh? Look, I get you hate yourself, but I can't let you do that."
        }

    blocked = User.objects.get(username=username)

    if blocked.user_id not in user.blocking:
        if blocked.user_id in user.following:
            user.following.remove(blocked.user_id)

        if user.user_id in blocked.followers:
            blocked.followers.remove(user.user_id)
            blocked.save()

        user.blocking.append(blocked.user_id) # type: ignore
        user.save()

    return 201, {
        "success": True
    }

def block_remove(request, data: Username) -> tuple | dict:
    # Called when someone requests to unblock another account.

    token = request.COOKIES.get('token')
    username = data.username.lower()

    if not validate_username(username):
        return 400, {
            "success": False,
            "reason": f"Account with username {username} doesn't exist."
        }

    user = User.objects.get(token=token)

    if user.username == username:
        return 400, {
            "success": False,
            "reason": "You cannot block youritdiot!!"
        }

    blocked = User.objects.get(username=username)
    if user.user_id != blocked.user_id:
        if blocked.user_id in user.blocking:
            user.blocking.remove(blocked.user_id)
            user.save()

    else:
        return 400, {
            "success": False
        }

    return 201, {
        "success": True
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

    for i in self_user.notifications[::-1]:
        try:
            notification = Notification.objects.get(pk=i)
        except Notification.DoesNotExist:
            continue

        if notification.read:
            break

        notification.read = True
        notification.save()

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

    cache = {
        self_user.user_id: self_user
    }

    notifs_list = []

    for i in self_user.notifications[::-1]:
        try:
            notification = Notification.objects.get(pk=i)
        except Notification.DoesNotExist:
            continue

        try:
            notifs_list.append({
                "event_type": notification.event_type,
                "read": notification.read,
                "timestamp": notification.timestamp,
                "data": get_post_json(notification.event_id, self_user.user_id, notification.event_type in ["comment", "ping_c"], cache)
            })
        except Post.DoesNotExist:
            continue
        except Comment.DoesNotExist:
            continue

    return {
        "success": True,
        "notifications": notifs_list
    }
