# For API functions linked specifically to modifying accounts.
# For changing account settings, use _api_user.py

from ._packages import *
from ._settings import *
from ._helper import *

def api_account_signup() -> flask.Response:
    # Called when someone requests to follow another account.
    # Login required: false
    # Ratelimit: 1s for unsuccessful, 15s for successful
    # Parameters:
    # - "username": the username of the account that is trying to be created
    # - "password": the sha256 hashed password of the account that is trying to be created

    x = std_checks(
        ratelimit=True,
        ratelimit_api_id="api_account_signup",
        ratelimit_identifier=request.remote_addr,

        parameters=True,
        required_params=["username", "password"]
    )

    x["username"] = x["username"].lower()

    # e3b0c44... is the sha256 hash for an empty string
    if len(x["password"]) != 64 or x["password"] == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return return_dynamic_content_type(json.dumps({
            "valid": False,
            "reason": "Invalid password."
        }), "application/json")

    for i in x["password"]:
        if i not in "abcdef0123456789":
            return return_dynamic_content_type(json.dumps({
                "valid": False,
                "reason": "Invalid password."
            }), "application/json")

    user_valid = validate_username(x["username"], existing=False)
    if user_valid == 1:
        create_api_ratelimit("api_account_signup", 15000, request.remote_addr)
        user_id = generate_user_id()
        preferences = {
            "following": [user_id],
            "user_id": user_id,
            "display_name": x["username"],
            "username": x["username"],
            "theme": "dark",
            "profile_picture": "default",
            "color": "#3a1e93",
            "private": False
        }

        token = generate_token(x["username"], x["password"])

        ensure_file(f"{ABSOLUTE_SAVING_PATH}usernames/{x['username']}.txt", default_value=str(user_id))
        ensure_file(f"{ABSOLUTE_SAVING_PATH}tokens/{token}.txt", default_value=str(user_id))
        ensure_file(f"{ABSOLUTE_SAVING_PATH}users/{user_id}", folder=True)
        ensure_file(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/token.txt", default_value=token)
        ensure_file(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", default_value="[]")
        ensure_file(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/settings.json", default_value=json.dumps(preferences))

        return return_dynamic_content_type(json.dumps({
            "valid": True,
            "token": token
        }), "application/json")

    create_api_ratelimit("api_account_signup", 1000, request.remote_addr)

    if user_valid == -1:
        return return_dynamic_content_type(json.dumps({
            "valid": False,
            "reason": "Username taken."
        }), "application/json")

    elif user_valid == -2:
        return return_dynamic_content_type(json.dumps({
            "valid": False,
            "reason": "Username can only use A-Z, 0-9, underscores, and hyphens."
        }), "application/json")

    return return_dynamic_content_type(json.dumps({
        "valid": False,
        "reason": "Username must be between 1 and 18 characters in length."
    }), "application/json")

def api_account_login() -> flask.Response:
    # Called when someone attempts to log in.
    # Login required: false
    # Ratelimit: 1s for unsuccessful, 5s for successful
    # Parameters:
    # - "username": the username of the account that is trying to be logged into
    # - "password": the sha256 hashed password of the account that is trying to be logged into

    x = std_checks(
        ratelimit=True,
        ratelimit_api_id="api_account_login",
        ratelimit_identifier=request.remote_addr,

        parameters=True,
        required_params=["username", "password"]
    )

    x["username"] = x["username"].lower()
    token = generate_token(x["username"], x["password"])

    if validate_username(x["username"]) == 1:
        if token == open(f"{ABSOLUTE_SAVING_PATH}users/{username_to_id(x['username'])}/token.txt", "r").read():
            create_api_ratelimit("api_account_login", 5000, request.remote_addr)
            return return_dynamic_content_type(json.dumps({
                "valid": True,
                "token": token
            }), "application/json")
        else:
            create_api_ratelimit("api_account_login", 1000, request.remote_addr)
            return return_dynamic_content_type(json.dumps({
                "valid": False,
                "reason": "Invalid password."
            }), "application/json")

    else:
        create_api_ratelimit("api_account_login", 1000, request.remote_addr)
        return return_dynamic_content_type(json.dumps({
            "valid": False,
            "reason": f"Account with username {x['username']} doesn't exist."
        }), "application/json")
