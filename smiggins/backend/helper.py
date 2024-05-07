# Contains helper functions. These aren't for routing, instead doing something that can be used in other places in the code.

from ._settings import SITE_NAME, VERSION, SOURCE_CODE, MAX_DISPL_NAME_LENGTH, MAX_POST_LENGTH, MAX_USERNAME_LENGTH, RATELIMIT, OWNER_USER_ID, ADMIN_LOG_PATH, MAX_ADMIN_LOG_LINES, MAX_NOTIFICATIONS
from .variables import HTML_FOOTERS, HTML_HEADERS, PRIVATE_AUTHENTICATOR_KEY, timeout_handler
from .packages  import Union, Callable, Any, HttpResponse, HttpResponseRedirect, loader, User, Comment, Post, Notification, threading, hashlib, pathlib, time, re

if ADMIN_LOG_PATH[:2:] == "./":
    ADMIN_LOG_PATH = str(pathlib.Path(__file__).parent.absolute()) + "/../" + ADMIN_LOG_PATH[2::]

def sha(string: Union[str, bytes]) -> str:
    # Returns the sha256 hash of a string.

    if isinstance(string, str):
        return hashlib.sha256(str.encode(string)).hexdigest()
    elif isinstance(string, bytes):
        return hashlib.sha256(string).hexdigest()
    return ""

def set_timeout(callback: Callable, delay_ms: Union[int, float]) -> None:
    # Works like javascript's setTimeout function.
    # Callback is a callable which will be called after
    # delay_ms has passed.

    def wrapper():
        threading.Event().wait(delay_ms / 1000)
        callback()

    thread = threading.Thread(target=wrapper)
    thread.start()

def get_HTTP_response(request, file: str, **kwargs: Any) -> HttpResponse:
    context = {
        "SITE_NAME": SITE_NAME,
        "VERSION": VERSION,
        "SOURCE": str(SOURCE_CODE).lower(),

        "HTML_HEADERS": HTML_HEADERS,
        "HTML_FOOTERS": HTML_FOOTERS,

        "MAX_DISPL_NAME_LENGTH": MAX_DISPL_NAME_LENGTH,
        "MAX_POST_LENGTH": MAX_POST_LENGTH,
        "MAX_USERNAME_LENGTH": MAX_USERNAME_LENGTH,

        "THEME": User.objects.get(token=request.COOKIES.get('token')).theme if validate_token(request.COOKIES.get('token')) else "dark"
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
            HttpResponseRedirect("/home/" if redirect_logged_in else "/", status=307) \
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

    x = lambda: timeout_handler[api_id].pop(identifier)
    x.__name__ = f"{api_id}:{identifier}"
    set_timeout(x, time_ms)

def ensure_ratelimit(api_id: str, identifier: Union[str, None]) -> bool:
    # Returns whether or not a certain api is ratelimited for the specified
    # identifier. True = not ratelimited, False = ratelimited

    return (not RATELIMIT) or not (api_id in timeout_handler and str(identifier) in timeout_handler[api_id])

def get_badges(user: User) -> list[str]:
    # Returns the list of badges for the specified user

    return user.badges + (["administrator"] if user.admin_level >= 1 or user.user_id == OWNER_USER_ID else [])

def get_post_json(post_id: int, current_user_id: int=0, comment: bool=False, cache: dict[int, User] | None=None) -> dict[str, str | int | dict]:
    # Returns a dict object that includes information about the specified post

    if cache is None:
        cache = {}

    if comment:
        post = Comment.objects.get(comment_id=post_id)
    else:
        post = Post.objects.get(post_id=post_id)

    if post.creator in cache:
        creator = cache[post.creator]
    else:
        creator = User.objects.get(user_id=post.creator)
        cache[post.creator] = creator

    try:
        if current_user_id in cache:
            user = cache[current_user_id]
        else:
            user = User.objects.get(user_id=current_user_id)
            cache[current_user_id] = user
        logged_in = True
    except User.DoesNotExist:
        logged_in = False

    can_delete_all = current_user_id != 0 and (current_user_id == OWNER_USER_ID or User.objects.get(pk=current_user_id).admin_level >= 1)

    if creator.private and current_user_id not in creator.following:
        return {
            "private_acc": True,
            "can_view": False,
            "blocked": False
        }

    post_json = {
        "creator": {
            "display_name": creator.display_name,
            "username": creator.username,
            "badges": get_badges(creator),
            "private": creator.private,
            "pronouns": creator.pronouns
        },
        "post_id": post_id,
        "content": post.content,
        "timestamp": post.timestamp,
        "liked": current_user_id in (post.likes),
        "likes": len(post.likes),
        "comments": len(post.comments),
        "quotes": len(post.quotes),
        "can_delete": can_delete_all or creator.user_id == current_user_id,
        "can_pin": not comment and creator.user_id == current_user_id,
        "can_view": True,
        "parent": post.parent if isinstance(post, Comment) else -1,
        "parent_is_comment": post.parent_is_comment if isinstance(post, Comment) else False
    }

    if isinstance(post, Post) and post.quote != 0:
        try:
            if post.quote_is_comment:
                quote = Comment.objects.get(comment_id=post.quote)
            else:
                quote = Post.objects.get(post_id=post.quote)

            if quote.creator in cache:
                quote_creator = cache[quote.creator]
            else:
                quote_creator = User.objects.get(user_id=quote.creator)
                cache[quote.creator] = quote_creator

            if logged_in and quote_creator.user_id in user.blocking:
                quote_info = {
                    "deleted": False,
                    "blocked": True
                }

            elif quote_creator.private and current_user_id not in quote_creator.following:
                quote_info = {
                    "deleted": False,
                    "private_acc": True,
                    "can_view": False,
                    "blocked": False
                }

            else:
                quote_info = {
                    "creator": {
                        "display_name": quote_creator.display_name,
                        "username": quote_creator.username,
                        "badges": get_badges(quote_creator),
                        "private": quote_creator.private,
                        "pronouns": quote_creator.pronouns
                    },
                    "deleted": False,
                    "comment": post.quote_is_comment,
                    "post_id": quote.post_id if isinstance(quote, Post) else quote.comment_id,
                    "content": quote.content,
                    "timestamp": quote.timestamp,
                    "liked": current_user_id in (quote.likes),
                    "likes": len(quote.likes),
                    "comments": len(quote.comments),
                    "quotes": len(post.quotes),
                    "can_view": True,
                    "blocked": False,
                    "has_quote": isinstance(quote, Post) and quote.quote
                }

        except Comment.DoesNotExist:
            quote_info = {
                "deleted": True
            }
        except Post.DoesNotExist:
            quote_info = {
                "deleted": True
            }

        post_json["quote"] = quote_info

    return post_json

def trim_whitespace(string: str, purge_newlines: bool=False) -> str:
    # Trims whitespace from strings

    string = string.replace("\x0d", "")

    if purge_newlines:
        string = string.replace("\x0a", " ").replace("\x85", "")

    for i in ["\x09", "\x0b", "\x0c", "\xa0", "\u1680", "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200a", "\u200b", "\u2028", "\u2029", "\u202f", "\u205f", "\u2800", "\u3000", "\ufeff"]:
        string = string.replace(i, " ")

    while "\n "    in string: string = string.replace("\n ", "\n")
    while "  "     in string: string = string.replace("  ", " ")
    while "\n\n\n" in string: string = string.replace("\n\n\n", "\n\n")

    while len(string) and string[0] in " \n":
        string = string[1::]

    while len(string) and string[-1] in " \n":
        string = string[:-1:]

    return string

def log_admin_action(
    action_name: str,
    admin_user_object: User,
    log_info: str
) -> None:
    # Logs an administrative action

    if ADMIN_LOG_PATH is not None:
        old_log = b"\n".join(open(ADMIN_LOG_PATH, "rb").read().split(b"\n")[:MAX_ADMIN_LOG_LINES - 1:])

        f = open(ADMIN_LOG_PATH, "wb")
        f.write(str.encode(f"{round(time.time())} - {action_name}, done by {admin_user_object.username} (id: {admin_user_object.user_id}) - {log_info}\n") + old_log)
        f.close()

def find_mentions(message: str, exclude_users: list[str]=[]) -> list[str]:
    # Returns a list of all mentioned users in a string. Used for notifications

    return list(set([i for i in re.findall(r"@([a-zA-Z0-9\-_]{1," + str(MAX_USERNAME_LENGTH) + r"})", message) if i not in exclude_users]))

def create_notification(
    is_for: User,
    event_type: str, # "comment", "quote", "ping_p", or "ping_c"
    event_id: int # comment id or post id
) -> None:
    # Creates a new notification for the specified user

    timestamp = round(time.time())

    x = Notification.objects.create(
        is_for = is_for,
        event_type = event_type,
        event_id = event_id,
        timestamp = timestamp
    )

    x = Notification.objects.get(
        is_for = is_for,
        event_type = event_type,
        event_id = event_id,
        timestamp = timestamp
    )

    is_for.read_notifs = False
    is_for.notifications.append(x.notif_id)

    if len(is_for.notifications) >= MAX_NOTIFICATIONS:
        for i in is_for.notifications[:-MAX_NOTIFICATIONS:]:
            is_for.notifications.remove(i)
            Notification.objects.get(notif_id=i).delete()

    is_for.save()

def get_container_id(user_one: User | str, user_two: User | str) -> str:
    return f"{user_one.username if isinstance(user_one, User) else user_one}:{user_two.username if isinstance(user_two, User) else user_two}" if (user_two.username if isinstance(user_two, User) else user_two) > (user_one.username if isinstance(user_one, User) else user_one) else f"{user_two.username if isinstance(user_two, User) else user_two}-{user_one.username if isinstance(user_one, User) else user_one}"
