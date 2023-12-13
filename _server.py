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

VERSION: str = "0.0.3" # Version
SITE_NAME: str = "Jerimiah Smiggins" # Name wip
DEBUG: bool = True # Whether or not to enable flask debug mode.

# Headers set at the top of every html file.
HTML_HEADERS: str = """
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/css/base.css">
<script src="/js/base.js"></script>
"""

# Map of file types to their corresponding content type used for
# serving files in a directory.
FILE_CONTENT_TYPE_MAP: dict[str, str] = {
    "js": "text/javascript",
    "css": "text/css",
    "html": "text/html",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "json": "application/json"
}

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

def format_html(html_content: str) -> str:
    # Formats the served html content. This is ran on all served HTML files,
    # so add something here if it should be used globally with the template given.

    html_content = html_content.replace("{{VERSION}}", VERSION)
    html_content = html_content.replace("{{SITE_NAME}}", SITE_NAME)
    html_content = html_content.replace("{{HTML_HEADERS}}", HTML_HEADERS)

    return html_content

def return_dynamic_content_type(content: str, content_type: str="text/html") -> flask.Response:
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

def load_user_json(user_id: Union[int, str]) -> dict:
    # Returns the user settings.json file based on the specified user id.

    return json.loads(open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/settings.json").read())

def get_user_post_ids(user_id: Union[int, str]) -> list:
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

        for i in username:
            if i not in "abcdefghijklmnopqrstuvwxyz0123456789_-":
                return -2

        return 1

# Routing functions
def create_html_serve(path: str, logged_in_redir: bool=False) -> Callable:
    # This returns a callable function that returns a formatted html file at the specified directory.

    x = lambda: return_dynamic_content_type(
        format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}redirect.html" if logged_in_redir and "token" in request.cookies and validate_token(request.cookies["token"]) else f'{ABSOLUTE_CONTENT_PATH}{path}').read()
        ), 'text/html'
    )
    x.__name__ = path
    return x

def create_folder_serve(path: str) -> Callable:
    # This returns a callable function that returns files in the specified directory
    # in relation to the base cdn directory.
    # This is meant to be used for stuff like CSS and JS, try
    # to use create_html_serve() for serving HTML

    x = lambda filename: return_dynamic_content_type(
        format_html(
            open(f'{ABSOLUTE_CONTENT_PATH}{path if path[-1] != "/" else path[:-1:]}/{filename}', "r").read()
        ) if filename.split(".")[-1] == "html" else (
            open(f'{ABSOLUTE_CONTENT_PATH}{path if path[-1] != "/" else path[:-1:]}/{filename}', "r").read()
        ), FILE_CONTENT_TYPE_MAP[filename.split(".")[-1]]
    )
    x.__name__ = path
    return x

def create_error_serve(err: int) -> Callable:
    # This returns a callable function that always returns the specified error.

    x = lambda: flask.abort(err)
    x.__name__ = str(err)
    return x

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
        if token == load_user_json(x["username"])["token"]:
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

    offset = sys.maxsize if not request.data or ("offset" in json.loads(request.data) and type(json.loads(request.data)["offset"]) != int) else json.loads(request.data)["offset"]

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

# Example function:
#           # If there is an option of returning a tuple (response and status code), then add the Union[]
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

    app.route("/home", methods=["GET"])(create_html_serve("home.html"))
    app.route("/logout", methods=["GET"])(create_html_serve("logout.html"))

    app.route("/css/<path:filename>", methods=["GET"])(create_folder_serve("css"))
    app.route("/js/<path:filename>", methods=["GET"])(create_folder_serve("js"))

    app.route("/api/account/signup", methods=["POST"])(api_account_signup)
    app.route("/api/account/login", methods=["POST"])(api_account_login)

    app.route("/api/user/follower/add", methods=["GET"])(api_user_follower_add)

    app.route("/api/post/create", methods=["PUT"])(api_post_create)
    app.route("/api/post/following", methods=["GET"])(api_post_following)

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
