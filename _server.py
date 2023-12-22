# ----== SETTINGS ==----
# Change these as needed

# Version displayed.
VERSION: str = "0.0.10"

# What to have the site name be.
# Official name wip // Trinktter? trinkr? Jerimiah Smiggins? idk...
SITE_NAME: str = "Jerimiah Smiggins"

# Whether or not to enable flask debug mode. This makes it
# so that the server restarts if you save the file.
DEBUG: bool = True

ABSOLUTE_CONTENT_PATH: str = "./public/" # Where html/css/js is served from
ABSOLUTE_SAVING_PATH: str  = "./save/"   # Where user information, posts, etc. are saved

# List of valid `Host` header urls to accept API requests
HOST_URLS: list[str] = ["localhost", "127.0.0.1"]

# ----== OTHER CODE ==----
# Non-default library dependencies:
# - flask (pip install flask)
import threading
import hashlib
import shutil
import flask
import json
import time
import sys
import os

import _api_keys

# Union from typing allows multiple possible types for type annotations
from typing import Union, Callable
from flask import request

# Headers set at the top of every html file.
HTML_HEADERS: str = """
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/css/base.css">
<link rel="icon" href="/img/favicon.ico" type="image/x-icon">
<script src="/js/base.js"></script>
"""

HTML_FOOTERS: str = """
<script src="/js/base_footer.js"></script>
"""

# Used when hashing user tokens
PRIVATE_AUTHENTICATOR_KEY: str = hashlib.sha256(_api_keys.auth_key).hexdigest()

# Using nested dicts because indexing a dict is generally faster than
# for a list.
timeout_handler: dict[str, dict[str, None]] = {}

# General use functions
def sha(string: Union[str, bytes]) -> str:
    # Returns the sha256 hash of a string.

    if type(string) == str:
        return hashlib.sha256(str.encode(string)).hexdigest()
    elif type(string) == bytes:
        return hashlib.sha256(string).hexdigest()
    return ""

def format_html(html_content: str, *, custom_replace: dict[str, str]={}) -> str:
    # Formats the served html content. This is ran on all served HTML files,
    # so add something here if it should be used globally with the template given.

    html_content = html_content.replace("{{HTML_HEADERS}}", HTML_HEADERS)
    html_content = html_content.replace("{{HTML_FOOTERS}}", HTML_FOOTERS)

    html_content = html_content.replace("{{VERSION}}", VERSION)
    html_content = html_content.replace("{{SITE_NAME}}", SITE_NAME)

    if "token" in request.cookies and validate_token(request.cookies["token"]) and "theme" in (th := load_user_json(token_to_id(request.cookies["token"]))):
        th = load_user_json(token_to_id(request.cookies["token"]))["theme"]
        html_content = html_content.replace("{{THEME}}", th)
        html_content = html_content.replace("<body", f"<body data-theme='{th}'")
        html_content = html_content.replace("{{SELECTED_IF_DARK}}", "selected" if th == "dark" else "")
        html_content = html_content.replace("{{SELECTED_IF_LIGHT}}", "selected" if th == "light" else "")
    else:
        html_content = html_content.replace("{{THEME}}", "dark")
        html_content = html_content.replace("{{SELECTED_IF_DARK}}", "selected")
        html_content = html_content.replace("{{SELECTED_IF_LIGHT}}", "")

    for i in custom_replace:
        html_content = html_content.replace(i, custom_replace[i])

    return html_content

def return_dynamic_content_type(content: Union[str, bytes], content_type: str="text/html") -> flask.Response:
    # Returns a flask Response with the content type set to
    # the specified one, ex. `application/json` for json files.

    response = flask.make_response(content)
    response.headers["Content-Type"] = content_type
    return response

def ensure_file(path: str, *, default_value: str="", folder: bool=False) -> None:
    # Checks if a file exists and if it doesn't then creates it.
    # If folder is false and if the file doesn't exist the contents
    # of the file will be set to default_value. If folder is true and
    # the specified file doesn't exist, then a folder will be created.
    # If the file exists, then nothing is done.

    if os.path.exists(path):
        if folder and not os.path.isdir(path):
            os.remove(path)
            os.makedirs(path)
        elif not folder and os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
            f = open(path, "w")
            f.write(default_value)
            f.close()
    else:
        if folder:
            os.makedirs(path)
        else:
            f = open(path, "w")
            f.write(default_value)
            f.close()

def escape_html(string: str) -> str:
    # Returns escaped html that won't accidentally create any elements

    return string.replace("&", "&amp;").replace("<", "&lt;")

def set_timeout(callback: Callable, delay_ms: Union[int, float]) -> None:
    # Works like javascript's setTimeout function.
    # Callback is a callable which will be called after
    # delay_ms has passed.

    def wrapper():
        threading.Event().wait(delay_ms / 1000)
        callback()

    thread = threading.Thread(target=wrapper)
    thread.start()

# Website helper functions
def validate_token(token: str) -> bool:
    # Ensures that a specific token corresponds to an actual account.

    for i in token:
        if i not in "0123456789abcdef":
            return False

    try:
        open(f"{ABSOLUTE_SAVING_PATH}tokens/{token}.txt", "r")
        return True
    except FileNotFoundError:
        return False

def token_to_id(token: str) -> int:
    # Returns the user id based on the specified token.

    return int(open(f"{ABSOLUTE_SAVING_PATH}tokens/{token}.txt").read())

def username_to_id(username: str) -> int:
    # Returns the user id based on the specified username.

    return int(open(f"{ABSOLUTE_SAVING_PATH}usernames/{username}.txt").read())

def load_user_json(user_id: Union[int, str]) -> dict:
    # Returns the user settings.json file based on the specified user id.

    return json.loads(open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/settings.json").read())

def save_user_json(user_id: Union[int, str], user_json: dict[str, Union[str, int, bool]]) -> None:
    # Saves the user settings.json file based on the specified user id
    # with the specified content.

    f = open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/settings.json", "w")
    f.write(json.dumps(user_json))
    f.close()

def get_user_post_ids(user_id: Union[int, str]) -> list[int]:
    # Returns the list of post ids corresponding to a specified user id.

    return json.loads(open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", "r").read())

def generate_post_id(*, inc: bool=True) -> int:
    # This returns the next free post id. If `inc` is false,
    # then the next free will not be incremented.

    f = int(open(f"{ABSOLUTE_SAVING_PATH}next_post.txt", "r").read())

    if inc:
        g = open(f"{ABSOLUTE_SAVING_PATH}next_post.txt", "w")
        g.write(str(f + 1))
        g.close()

    return f

def generate_user_id(*, inc: bool=True) -> int:
    # This returns the next free user id. If `inc` is false,
    # then the next free will not be incremented.

    f = int(open(f"{ABSOLUTE_SAVING_PATH}next_user.txt", "r").read())

    if inc:
        g = open(f"{ABSOLUTE_SAVING_PATH}next_user.txt", "w")
        g.write(str(f + 1))
        g.close()

    return f

def generate_token(username: str, password: str) -> str:
    # Generates a users' token given their username and hashed password.

    return sha(sha(f"{username}:{password}") + PRIVATE_AUTHENTICATOR_KEY)

def validate_username(username: str, *, existing: bool=True) -> int:
    # Ensures the specified username is valid. If existing is true, then it checks
    # if the specified username exists, and if it is false, then it checks to make
    # sure it doesn't already exist and that it is valid.
    #  1 - valid
    #  0 - invalid
    # -1 - taken
    # -2 - invalid characters
    # -3 - invalid length

    for i in username:
        if i not in "abcdefghijklmnopqrstuvwxyz0123456789_-":
            return -2

    if existing:
        try:
            open(f"{ABSOLUTE_SAVING_PATH}usernames/{username}.txt", "r")
            return 1
        except FileNotFoundError:
            return 0
    else:
        try:
            open(f"{ABSOLUTE_SAVING_PATH}usernames/{username}.txt", "r")
            return -1
        except FileNotFoundError:
            pass

        if (len(username) > 18 or len(username) < 1):
            return -3

        return 1

def create_api_ratelimit(api_id: str, time_ms: Union[int, float], identifier: Union[str, None]) -> None:
    # Creates a ratelimit timeout for a specific user via the identifier.
    # The identifier should be the request.remote_addr ip address
    # api_id is the identifier for the api, for example "api_account_signup". You
    # can generally use the name of that api's funciton for this.

    identifier = str(identifier)

    if api_id not in timeout_handler:
        timeout_handler[api_id] = {}
    timeout_handler[api_id][identifier] = None

    x = lambda: timeout_handler[api_id].pop(identifier)
    x.__name__ = f"{api_id}:{identifier}"
    set_timeout(x, time_ms)

def ensure_ratelimit(api_id: str, identifier: Union[str, None]) -> bool:
    # Returns whether or not a certain api is ratelimited for the specified
    # identifier. True = not ratelimited, False = ratelimited

    return not (api_id in timeout_handler and str(identifier) in timeout_handler[api_id])

# Routing functions
def create_html_serve(path: str, *, logged_in_redir: bool=False, logged_out_redir: bool=False) -> Callable:
    # This returns a callable function that returns a formatted html file at the specified directory.

    x = lambda: return_dynamic_content_type(
        format_html(
            open(
                f"{ABSOLUTE_CONTENT_PATH}redirect_home.html" if logged_in_redir and "token" in request.cookies and validate_token(request.cookies["token"]) else \
                    f"{ABSOLUTE_CONTENT_PATH}redirect_index.html" if logged_out_redir and ("token" not in request.cookies or not validate_token(request.cookies["token"])) else \
                    f"{ABSOLUTE_CONTENT_PATH}{path}"
                , "r"
            ).read()
        ), 'text/html'
    )
    x.__name__ = path
    return x

def create_folder_serve(path: str) -> Callable:
    # This returns a callable function that returns files in the specified directory
    # in relation to the base cdn directory. Don't use this for HTML files as it assumes
    # there is an extension and it doesn't format any of the templating anyways.

    x = lambda filename: flask.send_file(f"{ABSOLUTE_CONTENT_PATH}{path}/{filename}")
    x.__name__ = path
    return x

def create_error_serve(err: int) -> Callable:
    # This returns a callable function that always returns the specified error.

    x = lambda: flask.abort(err)
    x.__name__ = str(err)
    return x

def get_user_page(user: str) -> Union[tuple[flask.Response, int], flask.Response]:
    # Returns the user page for a specific user
    # Login required: true
    # Parameters: none

    try:
        if not validate_token(request.cookies["token"]):
            return return_dynamic_content_type(format_html(
                open(f"{ABSOLUTE_CONTENT_PATH}/redirect_index.html", "r").read(),
            ), "text/html"), 403
    except KeyError:
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}/redirect_index.html", "r").read(),
        ), "text/html"), 401

    if validate_username(user):
        self_id = token_to_id(request.cookies["token"])
        user_id = username_to_id(user)
        user_json = load_user_json(user_id)
        is_following = user_id in load_user_json(self_id)["following"]
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}/user.html", "r").read(),
            custom_replace={
                "{{USERNAME}}": user,
                "{{DISPLAY_NAME}}": escape_html(user_json["display_name"]),
                "{{FOLLOW}}": "Unfollow" if is_following else "Follow",
                "{{IS_FOLLOWED}}": "1" if is_following else "0",
                "{{IS_HIDDEN}}": "hidden" if user_id == self_id else "",
                "{{BANNER_COLOR}}": "#3a1e93" if "color" not in user_json else user_json["color"]
            }
        ), "text/html")
    else:
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}/redirect_home.html", "r").read(),
        ), "text/html"), 404

def get_post_page(post_id: Union[str, int]) -> Union[tuple[flask.Response, int], flask.Response]:
    # Returns the user page for a specific user
    # Login required: true
    # Parameters: none

    try:
        if not validate_token(request.cookies["token"]):
            return return_dynamic_content_type(format_html(
                open(f"{ABSOLUTE_CONTENT_PATH}/redirect_index.html", "r").read(),
            ), "text/html"), 403
    except KeyError:
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}/redirect_index.html", "r").read(),
        ), "text/html"), 401

    if int(post_id) < generate_post_id(inc=False) and int(post_id) > 0:
        post_info = json.loads(open(f"{ABSOLUTE_SAVING_PATH}posts/{post_id}.json", "r").read())
        user_json = load_user_json(post_info["creator"]["id"])
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}post.html", "r").read(),
            custom_replace={
                "{{CREATOR_USERNAME}}": user_json["display_name"] if "username" not in user_json else user_json["username"],
                "{{DISPLAY_NAME}}": user_json["display_name"],
                "{{CONTENT}}": post_info["content"].replace("\"", "\\\"").replace("\n", "<br>"),
                "{{TIMESTAMP}}": str(post_info["timestamp"])
            }
        ))
    else:
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}/redirect_home.html", "r").read(),
        ), "text/html"), 404

def get_settings_page() -> flask.Response:
    # Handles serving the settings page

    if "token" in request.cookies and validate_token(request.cookies["token"]):
        x = load_user_json(token_to_id(request.cookies["token"]))
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}settings.html", "r").read(),
            custom_replace={
                "{{DISPLAY_NAME}}": x["display_name"],
                "{{BANNER_COLOR}}": "#3a1e93" if "color" not in x else x["color"]
            }
        ), 'text/html')

    return return_dynamic_content_type(format_html(
        open(f"{ABSOLUTE_CONTENT_PATH}redirect_index.html", "r").read()
    ), 'text/html')

# API functions
def api_account_signup() -> flask.Response:
    # This is what is called when someone requests to follow another account.
    # Login required: false
    # Ratelimit: 1s for unsuccessful, 15s for successful
    # Parameters:
    # - "username": the username of the account that is trying to be created
    # - "password": the sha256 hashed password of the account that is trying to be created

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    if not ensure_ratelimit("api_account_signup", request.remote_addr):
        flask.abort(429)

    x: dict[str, str] = json.loads(request.data)
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
            "color": "#3a1e93"
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
    # This is what is called when someone attempts to log in.
    # Login required: false
    # Ratelimit: 1s for unsuccessful, 5s for successful
    # Parameters:
    # - "username": the username of the account that is trying to be logged into
    # - "password": the sha256 hashed password of the account that is trying to be logged into

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    if not ensure_ratelimit("api_account_login", request.remote_addr):
        flask.abort(429)

    x: dict[str, str] = json.loads(request.data)
    token = generate_token(x["username"], x["password"])

    if validate_username(x["username"]) == 1:
        create_api_ratelimit("api_account_login", 5000, request.remote_addr)
        if token == open(f"{ABSOLUTE_SAVING_PATH}users/{username_to_id(x['username'])}/token.txt", "r").read():
            return return_dynamic_content_type(json.dumps({
                "valid": True,
                "token": token
            }), "application/json")
        else:
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

def api_user_follower_add() -> Union[tuple[flask.Response, int], flask.Response]:
    # This is what is called when someone requests to follow another account.
    # Login required: true
    # Ratelimit: none
    # Parameters:
    # - "username": the username of the account to follow

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except json.JSONDecodeError:
        flask.abort(400)

    for i in ["username"]:
        if i not in x:
            flask.abort(400)

    x = json.loads(request.data)
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

    return return_dynamic_content_type(json.dumps({
        "success": True
    }), "application/json"), 201

def api_user_follower_remove() -> Union[tuple[flask.Response, int], flask.Response]:
    # This is what is called when someone requests to unfollow another account.
    # Login required: true
    # Ratelimit: none
    # Parameters:
    # - "username": the username of the account to unfollow

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except json.JSONDecodeError:
        flask.abort(400)

    for i in ["username"]:
        if i not in x:
            flask.abort(400)

    x = json.loads(request.data)
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

    return return_dynamic_content_type(json.dumps({
        "success": True
    }), "application/json"), 201

def api_user_settings_theme() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when the user changes the theme.
    # Login required: true
    # Ratelimit: none

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except json.JSONDecodeError:
        flask.abort(400)

    if "theme" not in x and x["theme"].lower() not in ["light", "dark"]:
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

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except json.JSONDecodeError:
        flask.abort(400)

    if "color" not in x and x["color"][0] != "#" and len(x["color"]) == 7:
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

def api_user_settings_display_name() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when trying to set display name
    # login required: true
    # Ratelimit: none

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except json.JSONDecodeError:
        flask.abort(400)

    if "displ_name" not in x:
        flask.abort(400)

    displ_name = x["displ_name"].replace("\n", " ").replace("\r", "").replace("\t", " ")

    while "  " in displ_name: displ_name = displ_name.replace("  ", " ")

    try:
        if displ_name[0]  == " ": displ_name = displ_name[1::]
        if displ_name[-1] == " ": displ_name = displ_name[:-1:]
    except IndexError:
        displ_name = ""

    if (len(displ_name) > 20 or len(displ_name) < 1):
        return return_dynamic_content_type(json.dumps({
            "success": False,
            "reason": "Invalid name length. Must be between 1 and 20 characters after minifying whitespace."
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

def api_post_create() -> Union[tuple[flask.Response, int], flask.Response]:
    # This is what is called when a new post is created.
    # Login required: true
    # Ratelimit: 1s for unsuccessful, 3s for successful
    # Parameters:
    # - "content": the content of the post. must be between 1 >= x >= 280 characters

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    if not ensure_ratelimit("api_post_create", request.remote_addr):
        flask.abort(429)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except json.JSONDecodeError:
        flask.abort(400)

    if "content" not in x:
        flask.abort(400)

    post = x["content"].replace("\r", "").replace("\t", " ").replace("\u200b", " ")

    for i in ["\t", "​", "​", " ", " ", " ", " ", " ", " ", " ", " ", " ", "⠀"]:
        post = post.replace(i, " ")

    while "\n "    in post: post = post.replace("\n ", "\n")
    while "  "     in post: post = post.replace("  ", " ")
    while "\n\n\n" in post: post = post.replace("\n\n\n", "\n\n")

    try:
        if post[0]  in "\n ": post = post[1::]
        if post[-1] in "\n ": post = post[:-1:]
    except IndexError:
        post = ""

    if (len(post) > 280 or len(post) < 1):
        create_api_ratelimit("api_post_create", 1000, request.remote_addr)
        return return_dynamic_content_type(json.dumps({
            "success": False,
            "reason": "Invalid post length. Must be between 1 and 280 characters."
        }), "application/json"), 400

    create_api_ratelimit("api_post_create", 3000, request.remote_addr)

    timestamp = round(time.time())
    post_id = generate_post_id()
    user_id = token_to_id(request.cookies["token"])

    f = json.loads(open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", "r").read())
    f.append(post_id)

    g = open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", "w")
    g.write(json.dumps(f))
    g.close()

    g = open(f"{ABSOLUTE_SAVING_PATH}posts/{post_id}.json", "w")
    g.write(json.dumps({
        "content": post,
        "creator": { "id": user_id },
        "timestamp": timestamp,
        "interactions": {
            "likes": [],
            # below are not implemented, placeholders to be potentially created in the future
            "comments": [],
            "reposts": []
        }
    }))
    g.close()

    return return_dynamic_content_type(json.dumps({
        "success": True,
        "post_id": post_id
    }), "application/json"), 201

def api_post_following() -> Union[tuple[flask.Response, int], flask.Response]:
    # This is what is called when the following tab is refreshed.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    offset = sys.maxsize if request.args.get("offset") == None else int(request.args.get("offset")) # type: ignore // pylance likes to complain :3

    potential = []
    for i in load_user_json(token_to_id(request.cookies["token"]))["following"]:
        potential += get_user_post_ids(i)
    potential = sorted(potential, reverse=True)

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i
            break

    end = len(potential) > 20
    potential = potential[index:index + 20:]

    outputList = []
    for i in potential:
        post_info = json.loads(open(f"{ABSOLUTE_SAVING_PATH}posts/{i}.json", "r").read())
        user_json = load_user_json(post_info["creator"]["id"])
        outputList.append({
            "post_id": i,
            "creator_id": post_info["creator"]["id"],
            "display_name": user_json["display_name"],
            "creator_username": user_json["display_name"] if "username" not in user_json else user_json["username"],
            "content": post_info["content"],
            "timestamp": post_info["timestamp"]
        })

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": end
    }), "application/json")

def api_post_recent() -> Union[tuple[flask.Response, int], flask.Response]:
    # This is what is called when the recent posts tab is refreshed.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    if request.args.get("offset") == None:
        next_id = generate_post_id(inc=False) - 1
    else:
        next_id = int(str(request.args.get("offset")))

    outputList = []
    for i in range(next_id, next_id - 20 if next_id - 20 >= 0 else 0, -1):
        post_info = json.loads(open(f"{ABSOLUTE_SAVING_PATH}posts/{i}.json", "r").read())
        user_json = load_user_json(post_info["creator"]["id"])
        outputList.append({
            "post_id": i,
            "creator_id": post_info["creator"]["id"],
            "display_name": user_json["display_name"],
            "creator_username": user_json["display_name"] if "username" not in user_json else user_json["username"],
            "content": post_info["content"],
            "timestamp": post_info["timestamp"]
        })

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": len(outputList) < 20
    }), "application/json")

def api_post_like() -> Union[tuple[flask.Response, int], flask.Response]: # type: ignore // WIP
    # This is called when someone likes or unlikes a post.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - post id to like/unlike

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except json.JSONDecodeError:
        flask.abort(400)

    if "id" not in x:
        flask.abort(400)

    try:
        if generate_post_id(inc=False) >= int(x):
            return return_dynamic_content_type(json.dumps({
                "success": False
            }), "application/json"), 404

    except ValueError:
        return return_dynamic_content_type(json.dumps({
            "success": False
        }), "application/json"), 404

    post_json = json.loads(open(f"{ABSOLUTE_SAVING_PATH}posts/{x['id']}.json", "r").read())
    if post_json['likes']:
        pass # MAKE THIS WORK

def api_post_user_(user: str) -> Union[tuple[flask.Response, int], flask.Response]:
    # This is what is called when getting posts from a specific user.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
        flask.abort(400)

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except KeyError:
        flask.abort(401)

    if not validate_username(user):
        flask.abort(404)

    offset = sys.maxsize if request.args.get("offset") == None else int(request.args.get("offset")) # type: ignore // pylance likes to complain :3

    user_id = username_to_id(user)
    potential = get_user_post_ids(user_id)[::-1]

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i
            break

    user_json = load_user_json(user_id)
    potential = potential[index:index + 20:]

    outputList = []
    for i in potential:
        post_info = json.loads(open(f"{ABSOLUTE_SAVING_PATH}posts/{i}.json", "r").read())
        outputList.append({
            "post_id": i,
            "creator_id": user_id,
            "creator_username": user,
            "display_name": user_json["display_name"],
            "content": post_info["content"],
            "timestamp": post_info["timestamp"]
        })

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": len(outputList) < 20
    }), "application/json")

# Example function:
# If there is an option of returning a tuple (response and status code), then add the Union[]
# def example_func() -> Union[tuple[flask.Response, int], flask.Response]:
#     # This makes sure that the `Host` header is valid
#     if "Host" not in request.headers or request.headers["Host"] not in HOST_URLS:
#         flask.abort(400)
#
#     # This enforces the API ratelimit if needed
#     if not ensure_ratelimit("example_func", request.remote_addr):
#         flask.abort(429)
#
#     # This makes sure that the user is logged in. Remove if login isn't needed.
#     try:
#         if not validate_token(request.cookies["token"]): flask.abort(403)
#     except KeyError:
#         flask.abort(401)
#     # This parses the request data. Remove if not needed.
#     try:
#         x = json.loads(request.data)
#     except json.JSONDecodeError:
#         flask.abort(400)
#     # This makes sure all the required items are in the request data. Remove if not needed.
#     for i in ["username", "password"]:
#         if i not in x:
#             flask.abort(400)
#     # The rest of the code is here.
#     if x["username"] == "cat" and x["password"] == "dog":
#         return return_dynamic_content_type(json.dumps({
#             "success": True,
#             "message": "Cats > Dogs"
#         }))
#     else:
#         return return_dynamic_content_type(json.dumps({
#             "success": False,
#             "message": "Wrong username/password!"
#         })), 401

# Make sure all required files for saving exist
ensure_file(   ABSOLUTE_SAVING_PATH,            folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}users",     folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}posts",     folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}tokens",    folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}usernames", folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}next_post.txt", default_value="1")
ensure_file(f"{ABSOLUTE_SAVING_PATH}next_user.txt", default_value="1")

# Initialize flask app
app = flask.Flask(__name__)

# Create all routes
app.route("/", methods=["GET"])(create_html_serve("index.html", logged_in_redir=True))
app.route("/login", methods=["GET"])(create_html_serve("login.html", logged_in_redir=True))
app.route("/signup", methods=["GET"])(create_html_serve("signup.html", logged_in_redir=True))
app.route("/settings", methods=["GET"])(get_settings_page)

app.route("/home", methods=["GET"])(create_html_serve("home.html", logged_out_redir=True))
app.route("/logout", methods=["GET"])(create_html_serve("logout.html"))
app.route("/u/<path:user>", methods=["GET"])(get_user_page)
app.route("/p/<path:post_id>", methods=["GET"])(get_post_page)

app.route("/css/<path:filename>", methods=["GET"])(create_folder_serve("css"))
app.route("/js/<path:filename>", methods=["GET"])(create_folder_serve("js"))
app.route("/img/<path:filename>", methods=["GET"])(create_folder_serve("img"))
app.route("/robots.txt", methods=["GET"])(create_html_serve("robots.txt"))

app.route("/api/account/signup", methods=["POST"])(api_account_signup)
app.route("/api/account/login", methods=["POST"])(api_account_login)

app.route("/api/user/follower/add", methods=["POST"])(api_user_follower_add)
app.route("/api/user/follower/remove", methods=["DELETE"])(api_user_follower_remove)
app.route("/api/user/settings/theme", methods=["POST"])(api_user_settings_theme)
app.route("/api/user/settings/color", methods=["POST"])(api_user_settings_color)
app.route("/api/user/settings/display-name", methods=["POST"])(api_user_settings_display_name)

app.route("/api/post/create", methods=["PUT"])(api_post_create)
app.route("/api/post/following", methods=["GET"])(api_post_following)
app.route("/api/post/recent", methods=["GET"])(api_post_recent)
app.route("/api/post/user/<path:user>", methods=["GET"])(api_post_user_)

# Create routes for forcing all http response codes
for i in [
    100, 101, 102, 103,
    200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
    300, 301, 302, 303, 304, 305, 306, 307, 308,
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410,
            411, 412, 413, 414, 415, 416, 417, 418, 421, 422,
            423, 424, 425, 426, 428, 429, 431, 451,
    500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511
]:
    app.route(f"/{i}")(create_error_serve(i))

# What to do on certain errors
@app.errorhandler(500)
def error_500(err): return create_html_serve("500.html")(), 500

@app.errorhandler(404)
def error_404(err): return create_html_serve("404.html")(), 404

# Start the flask server if the program is the main program
# running and not imported from another program
if __name__ == "__main__":
    app.run(port=80, debug=DEBUG)
