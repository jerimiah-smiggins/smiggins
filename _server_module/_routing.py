# For all things that are used for routing. API functions don't go here.

from ._packages import *
from ._settings import *
from ._variables import *
from ._helper import *

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
                "{{BANNER_COLOR}}": "#3a1e93" if "color" not in user_json else user_json["color"],
            }
        ), "text/html")
    else:
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}/redirect_home.html", "r").read(),
        ), "text/html"), 404

def get_post_page(post_id: Union[str, int]) -> Union[tuple[flask.Response, int], flask.Response]:
    # Returns the post page for a specific post
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

    user_id = token_to_id(request.cookies["token"])

    if int(post_id) < generate_post_id(inc=False) and int(post_id) > 0:
        post_info = load_post_json(post_id)
        user_json = load_user_json(post_info["creator"]["id"])

        if "private" in user_json and user_json["private"] and user_id not in user_json["following"]:
            return return_dynamic_content_type(format_html(
                open(f"{ABSOLUTE_CONTENT_PATH}/redirect_index.html", "r").read(),
            ), "text/html"), 404

        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}post.html", "r").read(),
            custom_replace={
                "{{CREATOR_USERNAME}}": user_json["display_name"] if "username" not in user_json else user_json["username"],
                "{{DISPLAY_NAME}}": user_json["display_name"],
                "{{CONTENT}}": post_info["content"].replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n"),
                "{{TIMESTAMP}}": str(post_info["timestamp"]),
                "{{POST_ID}}": str(post_id),
                "{{LIKED}}": str("interactions" in post_info and "likes" in post_info["interactions"] and user_id in post_info["interactions"]["likes"]).lower(),
                "{{LIKES}}": str(len(post_info["interactions"]["likes"])) if "interactions" in post_info and "likes" in post_info["interactions"] else "0",
                "{{COMMENTS}}": str(len(post_info["interactions"]["comments"])) if "interactions" in post_info and "comments" in post_info["interactions"] else "0",
                "{{COMMENT}}": "false"
            }
        ))

    return return_dynamic_content_type(format_html(
        open(f"{ABSOLUTE_CONTENT_PATH}/redirect_home.html", "r").read(),
    ), "text/html"), 404

def get_comment_page(post_id: Union[str, int]) -> Union[tuple[flask.Response, int], flask.Response]:
    # Returns the post page for a specific comment
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

    user_id = token_to_id(request.cookies["token"])

    if int(post_id) < generate_post_id(inc=False) and int(post_id) > 0:
        post_info = load_comment_json(post_id)
        user_json = load_user_json(post_info["creator"]["id"])
        return return_dynamic_content_type(format_html(
            open(f"{ABSOLUTE_CONTENT_PATH}post.html", "r").read(),
            custom_replace={
                "{{CREATOR_USERNAME}}": user_json["display_name"] if "username" not in user_json else user_json["username"],
                "{{DISPLAY_NAME}}": user_json["display_name"],
                "{{CONTENT}}": post_info["content"].replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n"),
                "{{TIMESTAMP}}": str(post_info["timestamp"]),
                "{{POST_ID}}": str(post_id),
                "{{LIKED}}": str("interactions" in post_info and "likes" in post_info["interactions"] and user_id in post_info["interactions"]["likes"]).lower(),
                "{{LIKES}}": str(len(post_info["interactions"]["likes"])) if "interactions" in post_info and "likes" in post_info["interactions"] else "0",
                "{{COMMENTS}}": str(len(post_info["interactions"]["comments"])) if "interactions" in post_info and "comments" in post_info["interactions"] else "0",
                "/api/post/like/": "/api/comment/like/",
                "{{COMMENT}}": "true"
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
                "{{BANNER_COLOR}}": "#3a1e93" if "color" not in x else x["color"],
                "{{CHECKED_IF_PRIV}}": "checked" if "private" in x and x["private"] else ""
            }
        ), 'text/html')

    return return_dynamic_content_type(format_html(
        open(f"{ABSOLUTE_CONTENT_PATH}redirect_index.html", "r").read()
    ), 'text/html')
