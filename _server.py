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

VERSION: str = "0.0.3"
SITE_NAME: str = "Twitter v2" # Twitt-er + trin-key
HTML_HEADERS: str = """
<link rel="stylesheet" href="/css/base.css">
<script src="/js/base.js"></script>
"""
DEBUG: bool = True

FILE_CONTENT_TYPE_MAP: dict[str, str] = {
    "js": "text/javascript",
    "css": "text/css",
    "html": "text/html",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "json": "application/json"
}

PRIVATE_AUTHENTICATOR_KEY: str = hashlib.sha256(b"PRIVATE_AUTHENTICATION_KEY_TRINKEY_ABC").hexdigest()

ABSOLUTE_CONTENT_PATH: str = "./public/" # Where html/css/js is served from
ABSOLUTE_SAVING_PATH: str  = "./save/"   # Where user information, posts, etc. are saved

# General use flask functions
def sha(string: Union[str, bytes]) -> str:
    if type(string) == str:
        return hashlib.sha256(str.encode(string)).hexdigest()
    elif type(string) == bytes:
        return hashlib.sha256(string).hexdigest()
    return ""

def format_html(html_content: str) -> str:
    html_content = html_content.replace("{{VERSION}}", VERSION)
    html_content = html_content.replace("{{SITE_NAME}}", SITE_NAME)
    html_content = html_content.replace("{{HTML_HEADERS}}", HTML_HEADERS)

    return html_content

def return_dynamic_content_type(content: str, content_type: str="text/html") -> flask.Response:
    response = flask.make_response(content)
    response.headers["Content-Type"] = content_type
    return response

def ensure_file(path: str, defaultValue: str="", folder: bool=False) -> None:
    if os.path.exists(path):
        if folder and not os.path.isdir(path):
            os.remove(path)
            os.makedirs(path)
        elif not folder and os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
            f = open(path, "w")
            f.write(defaultValue)
            f.close()
    else:
        if folder:
            os.makedirs(path)
        else:
            f = open(path, "w")
            f.write(defaultValue)
            f.close()

# Website helper functions
def validate_token(token: Union[str, bytes]) -> bool:
    try:
        open(f"{ABSOLUTE_SAVING_PATH}tokens/{token}.txt", "r")
        return True
    except FileNotFoundError:
        return False

def token_to_id(token: str) -> int:
    return int(open(f"{ABSOLUTE_SAVING_PATH}tokens/{token}.txt").read())

def load_user_json(user_id: Union[int, str]) -> dict:
    return json.loads(open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/settings.json").read())

def get_user_post_ids(user_id: Union[int, str]) -> list:
    return json.loads(open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", "r").read())

def increment_post_id(inc: bool=True) -> int:
    f = int(open(f"{ABSOLUTE_SAVING_PATH}next_post.txt", "r").read())

    if inc:
        g = open(f"{ABSOLUTE_SAVING_PATH}next_post.txt", "w")
        g.write(str(f + 1))
        g.close()

    return f

def generate_token(username: str, password: str) -> str:
    return sha(sha(f"{username}:{password}") + PRIVATE_AUTHENTICATOR_KEY)

def validate_username(username: str, existing: bool=True) -> int: # Make this work with the new filesystem
    #  1 - valid
    #  0 - invalid
    # -1 - taken
    # -2 - invalid characters
    # -3 - invalid length

    if existing:
        try:
            open(f"{ABSOLUTE_SAVING_PATH}users.json", "r")
            return 1
        except FileNotFoundError:
            return 0
    else:
        try:
            open(f"{ABSOLUTE_SAVING_PATH}users.json", "r")
            return -1
        except FileNotFoundError:
            pass

        if (len(username) > 18 or len(username) < 1):
            return -3

        for i in username:
            if i not in "abcdefghijklmnopqrstuvwxyz0123456789_-":
                return -2

        return 1

def generate_user_id(inc: bool=True) -> int:
    f = int(open(f"{ABSOLUTE_SAVING_PATH}next_user.txt", "r").read())

    if inc:
        g = open(f"{ABSOLUTE_SAVING_PATH}next_user.txt", "w")
        g.write(str(f + 1))
        g.close()

    return f

# Routing functions
def create_html_serve(path: str, logged_in_redir: bool=False) -> Callable:
    x = lambda: return_dynamic_content_type(
        format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}redirect.html" if logged_in_redir and "token" in request.cookies and validate_token(request.cookies["token"]) else f'{ABSOLUTE_CONTENT_PATH}{path}').read()
        ), 'text/html'
    )
    x.__name__ = path
    return x

def create_folder_serve(path: str) -> Callable:
    x = lambda filename: return_dynamic_content_type(
        format_html(
            open(f'{ABSOLUTE_CONTENT_PATH}{path if path[-1] != "/" else path[:-1:]}/{filename}', "r").read()
        ) if filename.split(".")[-1] == "html" else (
            open(f'{ABSOLUTE_CONTENT_PATH}{path if path[-1] != "/" else path[:-1:]}/{filename}', "r").read()
        ), FILE_CONTENT_TYPE_MAP[filename.split(".")[-1]]
    )
    x.__name__ = path
    return x

# API functions
def api_account_signup() -> flask.Response:
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

        ensure_file(f"{ABSOLUTE_SAVING_PATH}usernames/{x['username']}.txt", defaultValue=str(user_id))
        ensure_file(f"{ABSOLUTE_SAVING_PATH}tokens/{token}.txt", defaultValue=str(user_id))
        ensure_file(f"{ABSOLUTE_SAVING_PATH}users/{user_id}", folder=True)
        ensure_file(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/token.txt", defaultValue=token)
        ensure_file(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", defaultValue="[]")
        ensure_file(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/settings.json", defaultValue=json.dumps(preferences))

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

def api_post_create() -> Union[tuple[flask.Response, int], flask.Response]: # Make this work with the new filesystem
    if not validate_token(request.cookies["token"]): flask.abort(401)

    x = json.loads(request.data)
    reply = "reply" in x

    if (len(x["content"]) > 280 or len(x["content"]) < 1) or (reply and int(reply) >= increment_post_id(inc=False)):
        return return_dynamic_content_type(json.dumps({
            "success": False,
            "reason": "Invalid post length. Must be between 1 and 280 characters."
        }), "application/json"), 400

    timestamp = round(time.time())
    post_id = increment_post_id()

    f = json.loads(open(f"{ABSOLUTE_SAVING_PATH}user_info/{request.cookies['token'].replace('.', '')}/posts.json", "r").read())
    f[str(post_id)] = {
        "timestamp": timestamp,
        "content": x["content"],
        "reply": reply
    }
    if reply:
        f[str(post_id)]["replyID"] = x["reply"]

    g = open(f"{ABSOLUTE_SAVING_PATH}user_info/{request.cookies['token'].replace('.', '')}/posts.json", "w")
    g.write(json.dumps(f))
    g.close()

    f = json.loads(open(f"{ABSOLUTE_SAVING_PATH}posts.json", "r").read())
    f[str(post_id)] = request.cookies['token']

    g = open(f"{ABSOLUTE_SAVING_PATH}posts.json", "w")
    g.write(json.dumps(f))
    g.close()

    return return_dynamic_content_type(json.dumps({
        "success": True,
        "post_id": post_id
    }), "application/json"), 201

def api_post_following() -> Union[tuple[flask.Response, int], flask.Response]: # This SHOULD work
    if not validate_token(request.cookies["token"]): flask.abort(401)
    offset = sys.maxsize if not request.data or ("offset" in json.loads(request.data) and type(json.loads(request.data)["offset"]) != int) else json.loads(request.data)["offset"]

    potential = []
    for i in load_user_json(token_to_id(request.cookies["token"]))["following"]:
        potential += get_user_post_ids(i)
    potential = sorted(potential, reverse=True)

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i

    potential = potential[index : index + 20 :]

    outputList = []
    for i in potential:
        outputList.append(json.loads(open(f"{ABSOLUTE_SAVING_PATH}tweets/{i}.json", "r").read()))

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": len(outputList) < 20
    }), "application/json")

# Rest of the code
if __name__ == "__main__":
    ensure_file(   ABSOLUTE_SAVING_PATH,            folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}users",     folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}tweets",    folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}tokens",    folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}usernames", folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}next_post.txt", "1")
    ensure_file(f"{ABSOLUTE_SAVING_PATH}next_user.txt", "1")

    app = flask.Flask(__name__)

    app.route("/", methods=["GET"])(create_html_serve("index.html", logged_in_redir=True))
    app.route("/login", methods=["GET"])(create_html_serve("login.html", logged_in_redir=True))
    app.route("/signup", methods=["GET"])(create_html_serve("signup.html", logged_in_redir=True))

    app.route("/home", methods=["GET"])(create_html_serve("home.html"))
    app.route("/logout", methods=["GET"])(create_html_serve("logout.html"))

    app.route("/css/<path:filename>", methods=["GET"])(create_folder_serve("css"))
    app.route("/js/<path:filename>", methods=["GET"])(create_folder_serve("js"))

    app.route("/api/account/signup", methods=["POST"])(api_account_signup)
    app.route("/api/account/login", methods=["POST"])(api_account_login)
    app.route("/api/post/create", methods=["PUT"])(api_post_create)
    app.route("/api/post/following", methods=["GET"])(api_post_following)

    @app.route("/404", methods=["GET", "POST", "PUT", "DELETE"])
    def force_404(): flask.abort(404)

    @app.route("/500", methods=["GET", "POST", "PUT", "DELETE"])
    def force_500(): flask.abort(500)

    @app.errorhandler(500)
    def error_500(err):
        return create_html_serve("500.html")(), 500

    @app.errorhandler(404)
    def error_404(err):
        return create_html_serve("404.html")(), 404

    app.run(port=80, debug=DEBUG)
