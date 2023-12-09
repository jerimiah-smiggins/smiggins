import hashlib
import shutil
import flask
import json
import os

from flask import request

VERSION: str = "0.0.1"
SITE_NAME: str = "Twitter"
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

# Set this to the absolute path for the code. For testing purpouses you can use relative paths.
ABSOLUTE_CONTENT_PATH: str = "./public/" # Where html/css/js is served from
ABSOLUTE_SAVING_PATH:  str = "./save/"   # Where user information, posts, etc. are saved

# General use flask functions
def sha(string: str | bytes) -> str:
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

def read_content(path: str) -> str:
    return open(f"{ABSOLUTE_CONTENT_PATH}{path if path[0] != '/' else path[1::]}", "r").read()

def read_database(path: str) -> str:
    return open(f"{ABSOLUTE_SAVING_PATH}{path if path[0] != '/' else path[1::]}", "r").read()

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
def validate_token(token: str | bytes) -> bool:
    f = json.loads(read_database("users.json"))
    for i in f:
        if f[i]["token"] == token:
            return True
    return False

def generate_token(username: str, password: str) -> str:
    return sha(sha(f"{username}:{password}") + PRIVATE_AUTHENTICATOR_KEY)

def validate_username(username: str, existing: bool=True) -> int:
    # 1 - valid
    # -1 - taken
    # -2 - invalid characters
    # -3 - invalid length

    if existing:
        try:
            json.loads(open(f"{ABSOLUTE_SAVING_PATH}users.json", "r").read())[username]
            return 1
        except KeyError:
            return 0
    else:
        try:
            json.loads(open(f"{ABSOLUTE_SAVING_PATH}users.json", "r").read())[username]
            return -1
        except KeyError:
            pass

        if (len(username) > 18 or len(username) < 1):
            return -3

        for i in username:
            if i not in "abcdefghijklmnopqrstuvwxyz0123456789_-":
                return -2

        return 1

# Routing functions
def create_html_serve(path: str, response_code: int=200):
    x = lambda: return_dynamic_content_type(format_html(read_content(f'/{path}')), 'text/html')
    x.__name__ = path
    return x

def create_folder_serve(path: str):
    x = lambda filename: return_dynamic_content_type(format_html(read_content(f'/{path if path[-1] != "/" else path[:-1:]}/{filename}')) if filename.split(".")[-1] == "html" else read_content(f'/{path if path[-1] != "/" else path[:-1:]}/{filename}'), FILE_CONTENT_TYPE_MAP[filename.split(".")[-1]])
    x.__name__ = path
    return x

def api_account_signup():
    x: dict[str, str] = json.loads(request.data)
    x["username"] = x["username"].lower()

    if x["password"] == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
        return return_dynamic_content_type(json.dumps({
            "valid": False,
            "reason": "Invalid password."
        }), "application/json")

    user_valid = validate_username(x["username"], existing=False)
    if user_valid == 1:
        token = generate_token(x["username"], x["password"])
        f = json.loads(open(f"{ABSOLUTE_SAVING_PATH}users.json", "r").read())
        f[x["username"]] = {
            "token": token,
            "display_name": x["username"]
        }
        g = open(f"{ABSOLUTE_SAVING_PATH}users.json", "w")
        g.write(json.dumps(f))
        g.close()

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

def api_account_login():
    x: dict[str, str] = json.loads(request.data)

# Rest of the code
if __name__ == "__main__":
    ensure_file(ABSOLUTE_SAVING_PATH, folder=True)
    ensure_file(f"{ABSOLUTE_SAVING_PATH}users.json", "{}")
    ensure_file(f"{ABSOLUTE_SAVING_PATH}user_info", folder=True)

    app = flask.Flask(__name__)

    app.route("/", methods=["GET"])(create_html_serve("index.html"))
    app.route("/login", methods=["GET"])(create_html_serve("login.html"))
    app.route("/signup", methods=["GET"])(create_html_serve("signup.html"))
    app.route("/css/<path:filename>", methods=["GET"])(create_folder_serve("css"))
    app.route("/js/<path:filename>", methods=["GET"])(create_folder_serve("js"))

    app.route("/api/account/signup", methods=["POST"])(api_account_signup)
    app.route("/api/account/login", methods=["POST"])(api_account_login)

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
