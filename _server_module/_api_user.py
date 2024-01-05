# For API functions that are user-specific, like settings, following, etc.

from ._packages import *
from ._settings import *
from ._helper import *

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
        return return_dynamic_content_type(json.dumps({
            "valid": False,
            "reason": f"Account with username {x['username']} doesn't exist."
        }), "application/json"), 404

    current_id = token_to_id(request.cookies["token"])
    follow_id = username_to_id(x["username"])
    current_json = load_user_json(current_id)
    if follow_id not in current_json["following"]:
        current_json["following"].append(follow_id)
        save_user_json(current_id, current_json)
        user_json = load_user_json(follow_id)
        user_json["followers"] += 1
        save_user_json(follow_id, user_json)

    return return_dynamic_content_type(json.dumps({
        "success": True
    }), "application/json"), 201

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
        return return_dynamic_content_type(json.dumps({
            "valid": False,
            "reason": f"Account with username {x['username']} doesn't exist."
        }), "application/json"), 404

    current_id = token_to_id(request.cookies["token"])
    follow_id = username_to_id(x["username"])
    current_json = load_user_json(current_id)
    if current_id != follow_id and follow_id in current_json["following"]:
        current_json["following"].remove(follow_id)
        save_user_json(current_id, current_json)
        user_json = load_user_json(follow_id)
        user_json["followers"] -= 1
        save_user_json(follow_id, user_json)

    return return_dynamic_content_type(json.dumps({
        "success": True
    }), "application/json"), 201

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
    return return_dynamic_content_type(json.dumps({
        "success": True
    }))

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
    return return_dynamic_content_type(json.dumps({
        "success": True
    }))

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
    return return_dynamic_content_type(json.dumps({
        "success": True
    }))

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

    if (len(displ_name) > MAX_USERNAME_LENGTH or len(displ_name) < 1):
        return return_dynamic_content_type(json.dumps({
            "success": False,
            "reason": f"Invalid name length. Must be between 1 and {MAX_USERNAME_LENGTH} characters after minifying whitespace."
        }), "application/json"), 400

    user_id = token_to_id(request.cookies["token"])
    user_info = load_user_json(user_id)

    if "username" not in user_info:
        user_info["username"] = user_info["display_name"]

    user_info["display_name"] = x["displ_name"]
    save_user_json(user_id, user_info)

    return return_dynamic_content_type(json.dumps({
        "success": True
    }))
