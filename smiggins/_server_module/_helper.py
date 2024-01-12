# Contains helper functions. These aren't for routing, instead doing something that can be used in other places in the code.

from ._packages import *
from ._settings import *
from ._variables import *
from posts.models import Users, Posts, Comments

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader

from ninja.errors import HttpError

# Website nonspecific helper functions
def sha(string: Union[str, bytes]) -> str:
    # Returns the sha256 hash of a string.

    if type(string) == str:
        return hashlib.sha256(str.encode(string)).hexdigest()
    elif type(string) == bytes:
        return hashlib.sha256(string).hexdigest()
    return ""

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

def set_timeout(callback: Callable, delay_ms: Union[int, float]) -> None:
    # Works like javascript's setTimeout function.
    # Callback is a callable which will be called after
    # delay_ms has passed.

    def wrapper():
        threading.Event().wait(delay_ms / 1000)
        callback()
        print(timeout_handler)

    thread = threading.Thread(target=wrapper)
    thread.start()

def get_HTTP_response(request, file: str, **kwargs: str) -> HttpResponse:
    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "HIDE_SOURCE" : "" if SOURCE_CODE else "hidden",

        "HTML_HEADERS" : HTML_HEADERS,
        "HTML_FOOTERS" : HTML_FOOTERS,

        "MAX_DISPL_NAME_LENGTH" : MAX_DISPL_NAME_LENGTH,
        "MAX_POST_LENGTH" : MAX_POST_LENGTH,
        "MAX_USERNAME_LENGTH" : MAX_USERNAME_LENGTH
    }

    for key, value in kwargs.items():
        context[key] = value

    return HttpResponse(
        loader.get_template(file).render(
            context,
            request
        )
    )

# Website specific helper functions
def validate_token(token: str) -> bool:
    # Ensures that a specific token corresponds to an actual account.

    for i in token:
        if i not in "0123456789abcdef":
            return False

    try:
        Users.objects.get(token=token).token
        return True
    except Users.DoesNotExist:
        return False

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

        if (len(username) > MAX_USERNAME_LENGTH or len(username) < 1):
            return -3

        return 1

def create_api_ratelimit(api_id: str, time_ms: Union[int, float], identifier: Union[str, None]) -> None:
    # Creates a ratelimit timeout for a specific user via the identifier.
    # The identifier should be the request.META.REMOTE_ADDR ip address
    # api_id is the identifier for the api, for example "api_account_signup". You
    # can generally use the name of that api's funciton for this.

    if not RATELIMIT:
        return

    identifier = str(identifier)

    if api_id not in timeout_handler:
        timeout_handler[api_id] = {}
    timeout_handler[api_id][identifier] = None

    print(api_id, identifier, time_ms, timeout_handler)
    x = lambda: timeout_handler[api_id].pop(identifier)
    x.__name__ = f"{api_id}:{identifier}"
    set_timeout(x, time_ms)

def ensure_ratelimit(api_id: str, identifier: Union[str, None]) -> bool:
    # Returns whether or not a certain api is ratelimited for the specified
    # identifier. True = not ratelimited, False = ratelimited

    print(api_id, identifier, timeout_handler)

    return (not RATELIMIT) or not (api_id in timeout_handler and str(identifier) in timeout_handler[api_id])

def std_checks(*,
        data: dict={},

        ratelimit: bool=False,
        ratelimit_api_id: str="",
        ratelimit_identifier: Union[str, None]="",

        token: str="",
    ):
    # Removes a lot of boilerplate used to validate request calls.

    if ratelimit:
        if not ensure_ratelimit(ratelimit_api_id, ratelimit_identifier):
            raise HttpError(429, "Ha! you exceeded the ratelimit. Must suck to be you.")

    if token:
        try:
            if not validate_token(request.cookies["token"]):
                raise HttpError(403, "That's an invalid token! Somethin's wrong with your token cookie, so maybe clear it and login again?")
        except KeyError:
            raise HttpError(401, "There's something wrong with that token, idk what happened but you better start coping.")

    return data
