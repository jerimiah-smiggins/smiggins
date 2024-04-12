# Contains helper functions. These aren't for routing, instead doing something that can be used in other places in the code.

from ._settings import *
from .packages import *
from .variables import *

def sha(string: Union[str, bytes]) -> str:
    # Returns the sha256 hash of a string.

    if type(string) == str:
        return hashlib.sha256(str.encode(string)).hexdigest()
    elif type(string) == bytes:
        return hashlib.sha256(string).hexdigest()
    return ""

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
        "MAX_USERNAME_LENGTH" : MAX_USERNAME_LENGTH,

        "THEME" : User.objects.get(token=request.COOKIES.get('token')).theme if validate_token(request.COOKIES.get('token')) else "dark"
    }

    for key, value in kwargs.items():
        context[key] = value

    return HttpResponse(
        loader.get_template(file).render(
            context,
            request
        )
    )

def create_simple_return(
    template_path: str,
    redirect_logged_out: bool=False,
    redirect_logged_in: bool=False,
    content_type: str="text/html", # Only works with content_override
    content_override: str | None=None
) -> Callable[..., HttpResponse | HttpResponseRedirect]:
    # This creates a response object. This was made so that its standardized
    # and creates less repeated code.
    x = lambda request: \
            HttpResponseRedirect("/home" if redirect_logged_in else "/", status=307) \
        if (redirect_logged_in and validate_token(request.COOKIES.get("token"))) or (redirect_logged_out and not validate_token(request.COOKIES.get("token"))) \
        else (HttpResponse(content_override, content_type=content_type) if content_override else get_HTTP_response(request, template_path))

    x.__name__ = template_path
    return x

def validate_token(token: str) -> bool:
    # Ensures that a specific token corresponds to an actual account.

    if not token:
        return False

    for i in token:
        if i not in "0123456789abcdef":
            return False

    try:
        User.objects.get(token=token).token
        return True
    except User.DoesNotExist:
        return False

def generate_token(username: str, password: str) -> str:
    # Generates a User' token given their username and hashed password.

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
            User.objects.get(username=username).username
            return 1
        except User.DoesNotExist:
            return 0
    else:
        try:
            User.objects.get(username=username).username
            return -1
        except User.DoesNotExist:
            pass

        if (len(username) > MAX_USERNAME_LENGTH or len(username) < 1):
            return -3

        return 1

def create_api_ratelimit(api_id: str, time_ms: Union[int, float], identifier: Union[str, None]) -> None:
    # Creates a ratelimit timeout for a specific user via the identifier.
    # The identifier should be the request.META.REMOTE_ADDR ip address
    # api_id is the identifier for the api, for example "api_account_signup". You
    # can generally use the name of that api's function for this.

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

    print(timeout_handler)

    return (not RATELIMIT) or not (api_id in timeout_handler and str(identifier) in timeout_handler[api_id])
