# Non-default library dependencies: flask
import hashlib
import shutil
import flask
import json
import time
import sys
import os

# Union from typing allows multiple possible types for type annotations
from typing import Union, Callable
from flask import request

VERSION: str = "0.0.5" # Version
SITE_NAME: str = "Jerimiah Smiggins" # Name wip
DEBUG: bool = True # Whether or not to enable flask debug mode.

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
PRIVATE_AUTHENTICATOR_KEY: str = hashlib.sha256(b"PRIVATE_AUTHENTICATION_KEY_TRINKEY_ABC").hexdigest()

ABSOLUTE_CONTENT_PATH: str = "./public/" # Where html/css/js is served from
ABSOLUTE_SAVING_PATH: str  = "./save/"   # Where user information, posts, etc. are saved

# General use functions
def sha(string: Union[str, bytes]) -> str:
    # Returns the sha256 hash of a string.

    if type(string) == str:
        return hashlib.sha256(str.encode(string)).hexdigest()
    elif type(string) == bytes:
        return hashlib.sha256(string).hexdigest()
    return ""

def format_html(html_content: str, custom_replace: dict[str, str]={}) -> str:
    # Formats the served html content. This is ran on all served HTML files,
    # so add something here if it should be used globally with the template given.

    html_content = html_content.replace("{{HTML_HEADERS}}", HTML_HEADERS)
    html_content = html_content.replace("{{HTML_FOOTERS}}", HTML_FOOTERS)

    html_content = html_content.replace("{{VERSION}}", VERSION)
    html_content = html_content.replace("{{SITE_NAME}}", SITE_NAME)

    if "token" in request.cookies and validate_token(request.cookies["token"]):
        th = load_user_json(token_to_id(request.cookies["token"]))["theme"]
        html_content = html_content.replace("{{THEME}}", th)
        html_content = html_content.replace("<body>", f"<body data-theme='{th}'>")
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

def ensure_file(path: str, default_value: str="", folder: bool=False) -> None:
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

# Website helper functions
def validate_token(token: Union[str, bytes]) -> bool:
    # Ensures that a specific token corresponds to an actual account.

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

def generate_post_id(inc: bool=True) -> int:
    # This returns the next free post id. If `inc` is false,
    # then the next free will not be incremented.

    f = int(open(f"{ABSOLUTE_SAVING_PATH}next_post.txt", "r").read())

    if inc:
        g = open(f"{ABSOLUTE_SAVING_PATH}next_post.txt", "w")
        g.write(str(f + 1))
        g.close()

    return f

def generate_user_id(inc: bool=True) -> int:
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

def validate_username(username: str, existing: bool=True) -> int:
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

# Routing functions
def create_html_serve(path: str, logged_in_redir: bool=False, logged_out_redir: bool=False) -> Callable:
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
    try:
        if not validate_token(request.cookies["token"]):
            return return_dynamic_content_type(format_html(
                open(f"{ABSOLUTE_CONTENT_PATH}/redirect_index.html", "r").read(),
            ), "text/html"), 403
    except:
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}/redirect_index.html", "r").read(),
        ), "text/html"), 401

    if validate_username(user):
        self_id = token_to_id(request.cookies["token"])
        user_id = username_to_id(user)
        is_following = user_id in load_user_json(self_id)["following"]
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}/user.html", "r").read(),
            custom_replace={
                "{{USERNAME}}": user,
                "{{FOLLOW}}": "Unfollow" if is_following else "Follow",
                "{{IS_FOLLOWED}}": "1" if is_following else "0",
                "{{IS_HIDDEN}}": "hidden" if user_id == self_id else ""
            }
        ), "text/html")
    else:
        return flask.send_file(f"{ABSOLUTE_CONTENT_PATH}redirect_home.html")

# API functions
def api_account_signup() -> flask.Response:
    # This is what is called when someone requests to follow another account.
    # Login required: false
    # Parameters:
    # - "username": the username of the account that is trying to be created
    # - "password": the sha256 hashed password of the account that is trying to be created

    x: dict[str, str] = json.loads(request.data)
    x["username"] = x["username"].lower()

    # e3b0c44... is the sha for an empty string
    if x["password"] == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return return_dynamic_content_type(json.dumps({
            "valid": False,
            "reason": "Invalid password."
        }), "application/json")

    user_valid = validate_username(x["username"], existing=False)
    if user_valid == 1:
        user_id = generate_user_id()
        preferences = {
            "following": [user_id],
            "user_id": user_id,
            "display_name": x["username"],
            "theme": "dark",
            "profile_picture": "default"
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

    elif user_valid == -1:
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
    # Parameters:
    # - "username": the username of the account that is trying to be logged into
    # - "password": the sha256 hashed password of the account that is trying to be logged into

    x: dict[str, str] = json.loads(request.data)
    token = generate_token(x["username"], x["password"])

    if validate_username(x["username"]) == 1:
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
        return return_dynamic_content_type(json.dumps({
            "valid": False,
            "reason": f"Account with username {x['username']} doesn't exist."
        }), "application/json")

def api_user_follower_add() -> Union[tuple[flask.Response, int], flask.Response]: # type: ignore // WIP
    # This is what is called when someone requests to follow another account.
    # Login required: true
    # Parameters:
    # - "username": the username of the account to follow

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except:
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
    }), "application/json")

def api_user_follower_remove() -> Union[tuple[flask.Response, int], flask.Response]: # type: ignore // WIP
    # This is what is called when someone requests to unfollow another account.
    # Login required: true
    # Parameters:
    # - "username": the username of the account to unfollow

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except:
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
    }), "application/json")

def api_user_settings_theme() -> Union[tuple[flask.Response, int], flask.Response]:
    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except:
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

def api_post_create() -> Union[tuple[flask.Response, int], flask.Response]:
    # This is what is called when a new post is created.
    # Login required: true
    # Parameters:
    # - "content": the content of the post. must be between 1 >= x >= 280 characters

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except:
        flask.abort(401)

    try:
        x = json.loads(request.data)
    except:
        flask.abort(400)

    for i in ["content"]:
        if i not in x:
            flask.abort(400)

    if (len(x["content"]) > 280 or len(x["content"]) < 1):
        return return_dynamic_content_type(json.dumps({
            "success": False,
            "reason": "Invalid post length. Must be between 1 and 280 characters."
        }), "application/json"), 400

    timestamp = round(time.time())
    post_id = generate_post_id()
    user_id = token_to_id(request.cookies["token"])

    f = json.loads(open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", "r").read())
    f.append(post_id)

    g = open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", "w")
    g.write(json.dumps(f))
    g.close()

    g = open(f"{ABSOLUTE_SAVING_PATH}tweets/{post_id}.json", "w")
    g.write(json.dumps({
        "content": x["content"],
        "creator": {
            "id": user_id
        },
        "timestamp": timestamp
    }))
    g.close()

    return return_dynamic_content_type(json.dumps({
        "success": True,
        "post_id": post_id
    }), "application/json"), 201

def api_post_following() -> Union[tuple[flask.Response, int], flask.Response]:
    # This is what is called when the following tab is refreshed.
    # Login required: true
    # Parameters: none

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except:
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

    potential = potential[index:index + 20:]

    outputList = []
    for i in potential:
        post_info = json.loads(open(f"{ABSOLUTE_SAVING_PATH}tweets/{i}.json", "r").read())
        outputList.append({
            "post_id": i,
            "creator_id": post_info["creator"]["id"],
            "creator_username": load_user_json(post_info["creator"]["id"])["display_name"],
            "content": post_info["content"],
            "timestamp": post_info["timestamp"]
        })

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": len(outputList) < 20
    }), "application/json")

def api_post_user_(user: str) -> Union[tuple[flask.Response, int], flask.Response]:
    # This is what is called when getting posts from a specific user.
    # Login required: true
    # Parameters: none

    try:
        if not validate_token(request.cookies["token"]): flask.abort(403)
    except:
        flask.abort(401)

    if not validate_username(user):
        flask.abort(404)

    offset = sys.maxsize if request.args.get("offset") == None else int(request.args.get("offset")) # type: ignore // pylance likes to complain :3

    user_id = username_to_id(user)
    potential = get_user_post_ids(username_to_id(user))[::-1]

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i
            break

    potential = potential[index:index + 20:]

    outputList = []
    for i in potential:
        post_info = json.loads(open(f"{ABSOLUTE_SAVING_PATH}tweets/{i}.json", "r").read())
        outputList.append({
            "post_id": i,
            "creator_id": user_id,
            "creator_username": user,
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
#     # This makes sure that the user is logged in. Remove if login isn't needed.
#     try:
#         if not validate_token(request.cookies["token"]): flask.abort(403)
#     except:
#         flask.abort(401)
#     # This parses the request data. Remove if not needed.
#     try:
#         x = json.loads(request.data)
#     except:
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

# Rest of the code
if __name__ == "__main__":
    # Make sure all required files for saving exist
    ensure_file(   ABSOLUTE_SAVING_PATH,            folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}users",     folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}tweets",    folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}tokens",    folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}usernames", folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}next_post.txt", "1")
    ensure_file(f"{ABSOLUTE_SAVING_PATH}next_user.txt", "1")

    # Initialize flask app
    app = flask.Flask(__name__)

    # Create all routes
    app.route("/", methods=["GET"])(create_html_serve("index.html", logged_in_redir=True))
    app.route("/login", methods=["GET"])(create_html_serve("login.html", logged_in_redir=True))
    app.route("/signup", methods=["GET"])(create_html_serve("signup.html", logged_in_redir=True))
    app.route("/settings", methods=["GET"])(create_html_serve("settings.html", logged_out_redir=True))

    app.route("/home", methods=["GET"])(create_html_serve("home.html", logged_out_redir=True))
    app.route("/logout", methods=["GET"])(create_html_serve("logout.html"))
    app.route("/u/<path:user>", methods=["GET"])(get_user_page)

    app.route("/css/<path:filename>", methods=["GET"])(create_folder_serve("css"))
    app.route("/js/<path:filename>", methods=["GET"])(create_folder_serve("js"))
    app.route("/img/<path:filename>", methods=["GET"])(create_folder_serve("img"))

    app.route("/api/account/signup", methods=["POST"])(api_account_signup)
    app.route("/api/account/login", methods=["POST"])(api_account_login)

    app.route("/api/user/follower/add", methods=["POST"])(api_user_follower_add)
    app.route("/api/user/follower/remove", methods=["DELETE"])(api_user_follower_remove)
    app.route("/api/user/settings/theme", methods=["POST"])(api_user_settings_theme)

    app.route("/api/post/create", methods=["PUT"])(api_post_create)
    app.route("/api/post/following", methods=["GET"])(api_post_following)
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

    # Start the flask server
    app.run(port=80, debug=DEBUG)
