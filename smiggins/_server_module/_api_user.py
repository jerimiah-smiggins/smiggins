# For API functions that are user-specific, like settings, following, etc.

from ._packages import *
from ._settings import *
from ._helper import *

def api_account_signup(request, data) -> dict:
    # Called when someone requests to follow another account.
    # Login required: false
    # Ratelimit: 1s for unsuccessful, 15s for successful
    # Parameters:
    # - "username": the username of the account that is trying to be created
    # - "password": the sha256 hashed password of the account that is trying to be created

    username = data.username.lower()
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

    username = username.replace(" ", "")

    user_valid = validate_username(username, existing=False)
    if user_valid == 1:
        create_api_ratelimit("api_account_signup", API_TIMINGS["signup successful"], request.META.get('REMOTE_ADDR'))

        token = generate_token(username, password)
        user = Users(
            username=username,
            token=token,
            display_name=username,
            theme="dark",
            color="#3a1e93",
            private=False,
            following=[],
            followers=[],
            posts=[],
        )
        user.save()

        user=Users.objects.get(username=username)

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

def api_account_login(request, data) -> dict:
    # Called when someone attempts to log in.
    # Login required: false
    # Ratelimit: 1s for unsuccessful, 5s for successful
    # Parameters:
    # - "username": the username of the account that is trying to be logged into
    # - "password": the sha256 hashed password of the account that is trying to be logged into

    username = data.username.lower()
    password = data.password
    token = generate_token(username, password)

    if validate_username(username) == 1:
        if token == Users.objects.get(token=token):
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

def api_user_follower_add() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when someone requests to follow another account.
    # Login required: true
    # Ratelimit: none
    # Parameters:
    # - "username": the username of the account to follow

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["username"]
    )

    if not validate_username(x["username"]):
        return {
            "valid": False,
            "reason": f"Account with username {x['username']} doesn't exist."
        }, 404

    current_id = token_to_id(request.cookies["token"])
    follow_id = username_to_id(x["username"])
    current_json = load_user_json(current_id)
    if follow_id not in current_json["following"]:
        current_json["following"].append(follow_id)
        save_user_json(current_id, current_json)
        user_json = load_user_json(follow_id)
        user_json["followers"] += 1
        save_user_json(follow_id, user_json)

    return {
        "success": True
    }, 201

def api_user_follower_remove() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when someone requests to unfollow another account.
    # Login required: true
    # Ratelimit: none
    # Parameters:
    # - "username": the username of the account to unfollow

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["username"]
    )

    if not validate_username(x["username"]):
        return {
            "valid": False,
            "reason": f"Account with username {x['username']} doesn't exist."
        }, 404

    current_id = token_to_id(request.cookies["token"])
    follow_id = username_to_id(x["username"])
    current_json = load_user_json(current_id)
    if current_id != follow_id and follow_id in current_json["following"]:
        current_json["following"].remove(follow_id)
        save_user_json(current_id, current_json)
        user_json = load_user_json(follow_id)
        user_json["followers"] -= 1
        save_user_json(follow_id, user_json)

    return {
        "success": True
    }, 201

def api_user_settings_theme() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when the user changes their theme.
    # Login required: true
    # Ratelimit: none

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["theme"]
    )

    if x["theme"].lower() not in ["light", "dark"]:
        flask.abort(400)

    user_id = token_to_id(request.cookies["token"])
    user_info = load_user_json(user_id)
    user_info["theme"] = x["theme"].lower()
    save_user_json(user_id, user_info)
    return {
        "success": True
    }

def api_user_settings_color() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when the user changes the banner color.
    # Login required: true
    # Ratelimit: none

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["color"]
    )

    if x["color"][0] != "#" or len(x["color"]) != 7:
        flask.abort(400)

    for i in x["color"][1::].lower():
        if i not in "abcdef0123456789":
            flask.abort(400)

    user_id = token_to_id(request.cookies["token"])
    user_info = load_user_json(user_id)
    user_info["color"] = x["color"].lower()
    save_user_json(user_id, user_info)
    return {
        "success": True
    }

def api_user_settings_private() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when the user toggles being private.
    # Login required: true
    # Ratelimit: none

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["priv"]
    )

    user_id = token_to_id(request.cookies["token"])
    user_info = load_user_json(user_id)
    user_info["private"] = str(x["priv"]).lower() == "true"
    save_user_json(user_id, user_info)
    return {
        "success": True
    }

def api_user_settings_display_name() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when trying to set display name.
    # login required: true
    # Ratelimit: none

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["displ_name"]
    )

    displ_name = x["displ_name"].replace("\r", "").replace("\t", " ").replace("\u200b", " ")

    for i in ["\t", "​", "​", " ", " ", " ", " ", " ", " ", " ", " ", " ", "⠀"]:
        displ_name = displ_name.replace(i, " ")

    while "\n "    in displ_name: displ_name = displ_name.replace("\n ", "\n")
    while "  "     in displ_name: displ_name = displ_name.replace("  ", " ")
    while "\n\n\n" in displ_name: displ_name = displ_name.replace("\n\n\n", "\n\n")

    try:
        if displ_name[0]  in "\n ": displ_name = displ_name[1::]
        if displ_name[-1] in "\n ": displ_name = displ_name[:-1:]
    except IndexError:
        displ_name = ""

    if (len(displ_name) > MAX_DISPL_NAME_LENGTH or len(displ_name) < 1):
        return {
            "success": False,
            "reason": f"Invalid name length. Must be between 1 and {MAX_DISPL_NAME_LENGTH} characters after minifying whitespace."
        }, 400

    user_id = token_to_id(request.cookies["token"])
    user_info = load_user_json(user_id)

    if "username" not in user_info:
        user_info["username"] = user_info["display_name"]

    user_info["display_name"] = x["displ_name"]
    save_user_json(user_id, user_info)

    return {
        "success": True
    }
