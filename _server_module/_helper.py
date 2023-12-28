# Contains helper functions. These aren't for routing, instead doing something that can be used in other places in the code.

from ._packages import *
from ._settings import *
from ._variables import *

# Website nonspecific helper functions
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

# Website specific helper functions
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

def load_post_json(post_id: Union[int, str]) -> dict:
    # Returns the post id.json file based on the specified post id.

    return json.loads(open(f"{ABSOLUTE_SAVING_PATH}posts/{post_id}.json").read())

def load_comment_json(comment_id: Union[int, str]) -> dict:
    # Returns the comment id.json file based on the specified comment id.

    return json.loads(open(f"{ABSOLUTE_SAVING_PATH}posts/comments/{comment_id}.json").read())

def save_user_json(user_id: Union[int, str], user_json: dict[str, Union[str, int, bool]]) -> None:
    # Saves the user settings.json file based on the specified user id
    # with the specified content.

    f = open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/settings.json", "w")
    f.write(json.dumps(user_json))
    f.close()

def save_post_json(post_id: Union[int, str], post_json: dict[str, Union[str, int, bool]]) -> None:
    # Saves the post id.json file based on the specified post id
    # with the specified content.

    f = open(f"{ABSOLUTE_SAVING_PATH}posts/{post_id}.json", "w")
    f.write(json.dumps(post_json))
    f.close()

def save_comment_json(comment_id: Union[int, str], comment_json: dict[str, Union[str, int, bool]]) -> None:
    # Saves the post id.json file based on the specified post id
    # with the specified content.

    f = open(f"{ABSOLUTE_SAVING_PATH}posts/comments/{comment_id}.json", "w")
    f.write(json.dumps(comment_json))
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

def generate_comment_id(*, inc: bool=True) -> int:
    # This returns the next free comment id. If `inc` is false,
    # then the next free will not be incremented.

    f = int(open(f"{ABSOLUTE_SAVING_PATH}next_comment.txt", "r").read())

    if inc:
        g = open(f"{ABSOLUTE_SAVING_PATH}next_comment.txt", "w")
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

def std_checks(*,
        ratelimit: bool=False,
        ratelimit_api_id: str="",
        ratelimit_identifier: Union[str, None]="",

        token: str="",

        parameters: bool=False,
        required_params: list[str]=[],

        args: bool=False,
        required_args: list[str]=[]
    ) -> dict:
    # Removes a lot of boilerplate used to validate request calls.

    if ratelimit:
        if not ensure_ratelimit(ratelimit_api_id, ratelimit_identifier):
            flask.abort(429)

    if token != "":
        try:
            if not validate_token(request.cookies["token"]): flask.abort(403)
        except KeyError:
            flask.abort(401)

    if args:
        for i in required_args:
            if request.args.get(i) == None:
                flask.abort(400)

    if parameters:
        try:
            x = json.loads(request.data)
        except json.JSONDecodeError:
            flask.abort(400)

        for i in required_params:
            if i not in x:
                flask.abort(400)

        return x

    return {}
