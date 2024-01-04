# For API functions that relate to comments, for example liking, creating, etc.

from ._packages import *
from ._settings import *
from ._helper import *

def api_comment_create() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when a new comment is created.
    # Login required: true
    # Ratelimit: 1s for unsuccessful, 3s for successful
    # Parameters:
    # - "content": the content of the comment. must be between 1 >= x >= 280 characters
    # - "id": the id for the post being commented on. must be a valid id between 0 < x < next post id

    x = std_checks(
        ratelimit=True,
        ratelimit_api_id="api_comment_create",
        ratelimit_identifier=request.remote_addr,

        token=request.cookies["token"],

        parameters=True,
        required_params=["content", "id"]
    )

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

    if len(post) > 280 or len(post) < 1:
        create_api_ratelimit("api_comment_create", 1000, request.remote_addr)
        return return_dynamic_content_type(json.dumps({
            "success": False,
            "reason": "Invalid post length. Must be between 1 and 280 characters."
        }), "application/json"), 400

    if x["id"] < 0 or generate_post_id(inc=False) < x["id"]:
        create_api_ratelimit("api_comment_create", 1000, request.remote_addr)
        return return_dynamic_content_type(json.dumps({
            "success": False,
            "reason": "Invalid post id. Must be between 0 and next possible post id (exclusive)."
        }), "application/json"), 400

    create_api_ratelimit("api_comment_create", 3000, request.remote_addr)

    timestamp = round(time.time())
    comment_id = generate_comment_id()
    user_id = token_to_id(request.cookies["token"])

    g = open(f"{ABSOLUTE_SAVING_PATH}posts/comments/{comment_id}.json", "w")
    g.write(json.dumps({
        "content": post,
        "creator": { "id": user_id },
        "timestamp": timestamp,
        "interactions": {
            "likes": [],
            "comments": [],
            # below are not implemented, placeholders to be potentially created in the future
            "reposts": []
        }
    }))
    g.close()

    if "comment" in x:
        post_json = load_comment_json(x["id"])
    else:
        post_json = load_post_json(x["id"])
    if not ("interactions" in post_json and "comments" in post_json["interactions"]) or comment_id not in post_json["interactions"]["comments"]:
        if "interactions" in post_json:
            if "comments" in post_json["interactions"]:
                post_json["interactions"]["comments"].append(comment_id)
            else:
                post_json["interactions"]["comments"] = [comment_id]
        else:
            post_json["interactions"] = {"likes": [], "comments": [comment_id], "reposts": []}

        if "comment" in x:
            save_comment_json(x["id"], post_json)
        else:
            save_post_json(x["id"], post_json)

    return return_dynamic_content_type(json.dumps({
        "success": True,
        "comment_id": comment_id
    }), "application/json"), 201

def api_comment_list() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when the comments for a post are refreshed.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    std_checks(
        token=request.cookies["token"],

        args=True,
        required_args=["id"]
    )

    try:
        if int(request.args.get("id")) >= generate_post_id(inc=False) or int(request.args.get("id")) <= 0: # type: ignore // pylance likes to complain :3
            flask.abort(400)
    except ValueError:
        flask.abort(400)

    offset = sys.maxsize if request.args.get("offset") == None else int(request.args.get("offset")) # type: ignore // pylance likes to complain :3

    if request.args.get("comment"):
        post_json = load_comment_json(int(request.args.get("id"))) # type: ignore // pylance likes to complain :3
    else:
        post_json = load_post_json(int(request.args.get("id"))) # type: ignore // pylance likes to complain :3
    user_id = token_to_id(request.cookies["token"])

    if "interactions" not in post_json or "comments" not in post_json["interactions"]:
        return return_dynamic_content_type(json.dumps({
            "posts": [],
            "end": True
        }), "application/json")

    while len(post_json["interactions"]["comments"]) and post_json["interactions"]["comments"][0] > offset:
        post_json["interactions"]["comments"].pop(0)

    end = len(post_json["interactions"]["comments"])
    outputList = []
    offset = 0
    for i in post_json["interactions"]["comments"]:
        post_info = load_comment_json(i)
        user_json = load_user_json(post_info["creator"]["id"])

        if "private" in user_json and user_json["private"] and user_id not in user_json["following"]:
            offset += 1

        else:
            outputList.append({
                "post_id": i,
                "creator_id": post_info["creator"]["id"],
                "display_name": user_json["display_name"],
                "creator_username": user_json["display_name"] if "username" not in user_json else user_json["username"],
                "content": post_info["content"],
                "timestamp": post_info["timestamp"],
                "liked": "interactions" in post_info and "likes" in post_info["interactions"] and user_id in post_info["interactions"]["likes"],
                "likes": len(post_info["interactions"]["likes"]) if "interactions" in post_info and "likes" in post_info["interactions"] else 0,
                "comments": len(post_info["interactions"]["comments"]) if "interactions" in post_info and "comments" in post_info["interactions"] else 0,
                "private_acc": "private" in user_json and user_json["private"]
            })

        if len(outputList) == 20:
            break

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": len(post_json) - offset <= 20
    }), "application/json")

def api_comment_like_add() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when someone likes a comment.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - comment id to like

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["id"]
    )

    try:
        if generate_comment_id(inc=False) <= int(x["id"]):
            return return_dynamic_content_type(json.dumps({
                "success": False
            }), "application/json"), 404

    except ValueError:
        return return_dynamic_content_type(json.dumps({
            "success": False
        }), "application/json"), 404

    user_id = token_to_id(request.cookies["token"])
    post_json = load_comment_json(x["id"])
    if not ("interactions" in post_json and "likes" in post_json["interactions"]) or "user_id" not in post_json["interactions"]["likes"]:
        if "interactions" in post_json:
            if "likes" in post_json["interactions"]:
                post_json["interactions"]["likes"].append(user_id)
            else:
                post_json["interactions"]["likes"] = [user_id]
        else:
            post_json["interactions"] = {"likes": [user_id], "comments": [], "reposts": []}
        save_comment_json(x["id"], post_json)

    return return_dynamic_content_type(json.dumps({
        "success": True
    }), "application/json")

def api_comment_like_remove() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when someone unlikes a comment.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - comment id to unlike

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["id"]
    )

    try:
        if generate_comment_id(inc=False) <= int(x["id"]):
            return return_dynamic_content_type(json.dumps({
                "success": False
            }), "application/json"), 404

    except ValueError:
        print(x["id"])
        return return_dynamic_content_type(json.dumps({
            "success": False
        }), "application/json"), 404

    user_id = token_to_id(request.cookies["token"])
    post_json = load_comment_json(x["id"])
    if "interactions" in post_json and "likes" in post_json["interactions"]:
        if user_id in post_json["interactions"]["likes"]:
            post_json["interactions"]["likes"].remove(user_id)
            save_comment_json(x["id"], post_json)

    return return_dynamic_content_type(json.dumps({
        "success": True
    }), "application/json")
