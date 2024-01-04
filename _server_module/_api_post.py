# For API functions that relate to posts, for example creating, fetching home lists, etc.

from ._packages import *
from ._settings import *
from ._helper import *

def api_post_create() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when a new post is created.
    # Login required: true
    # Ratelimit: 1s for unsuccessful, 3s for successful
    # Parameters:
    # - "content": the content of the post. must be between 1 >= x >= 280 characters

    x = std_checks(
        ratelimit=True,
        ratelimit_api_id="api_post_create",
        ratelimit_identifier=request.remote_addr,

        token=request.cookies["token"],

        parameters=True,
        required_params=["content"]
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

    if (len(post) > 280 or len(post) < 1):
        create_api_ratelimit("api_post_create", 1000, request.remote_addr)
        return return_dynamic_content_type(json.dumps({
            "success": False,
            "reason": "Invalid post length. Must be between 1 and 280 characters."
        }), "application/json"), 400

    create_api_ratelimit("api_post_create", 3000, request.remote_addr)

    timestamp = round(time.time())
    post_id = generate_post_id()
    user_id = token_to_id(request.cookies["token"])

    f = json.loads(open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", "r").read())
    f.append(post_id)

    g = open(f"{ABSOLUTE_SAVING_PATH}users/{user_id}/posts.json", "w")
    g.write(json.dumps(f))
    g.close()

    g = open(f"{ABSOLUTE_SAVING_PATH}posts/{post_id}.json", "w")
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

    return return_dynamic_content_type(json.dumps({
        "success": True,
        "post_id": post_id
    }), "application/json"), 201

def api_post_list_following() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when the following tab is refreshed.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    std_checks(
        token=request.cookies["token"],
    )

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

    potential = potential[index::]
    user_id = token_to_id(request.cookies["token"])

    offset = 0
    outputList = []
    for i in potential:
        post_info = load_post_json(i)
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

            if len(outputList) >= 20:
                break

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": len(potential) - offset <= 20
    }), "application/json")

def api_post_list_recent() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when the recent posts tab is refreshed.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    std_checks(
        token=request.cookies["token"],
    )

    if request.args.get("offset") == None:
        next_id = generate_post_id(inc=False) - 1
    else:
        next_id = int(str(request.args.get("offset"))) - 1

    end = next_id <= 20
    user_id = token_to_id(request.cookies["token"])

    outputList = []
    offset = 0
    i = next_id
    while i > next_id - 20 - offset and i > 0:
        post_info = load_post_json(i)
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

        i -= 1

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": end
    }), "application/json")

def api_post_list_user(user: str) -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when getting posts from a specific user.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    x = std_checks(
        token=request.cookies["token"],
    )

    if not validate_username(user):
        flask.abort(404)

    offset = sys.maxsize if request.args.get("offset") == None else int(request.args.get("offset")) # type: ignore // pylance likes to complain :3

    self_id = token_to_id(request.cookies["token"])
    user_id = username_to_id(user)
    user_json = load_user_json(user_id)

    if "private" in user_json and user_json["private"] and self_id not in user_json["following"]:
        return return_dynamic_content_type(json.dumps({
            "posts": [],
            "end": True,
            "color": "#3a1e93" if "color" not in user_json else user_json["color"],
            "private": True,
            "can_view": False
        }))

    potential = get_user_post_ids(user_id)[::-1]

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i
            break

    potential = potential[index::]
    end = len(potential) <= 20
    potential = potential[:20:]

    outputList = []
    for i in potential:
        post_info = load_post_json(i)
        outputList.append({
            "post_id": i,
            "creator_id": user_id,
            "creator_username": user,
            "display_name": user_json["display_name"],
            "content": post_info["content"],
            "timestamp": post_info["timestamp"],
            "liked": "interactions" in post_info and "likes" in post_info["interactions"] and user_id in post_info["interactions"]["likes"],
            "likes": len(post_info["interactions"]["likes"]) if "interactions" in post_info and "likes" in post_info["interactions"] else 0,
            "comments": len(post_info["interactions"]["comments"]) if "interactions" in post_info and "comments" in post_info["interactions"] else 0
        })

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": end,
        "color": "#3a1e93" if "color" not in user_json else user_json["color"],
        "private": "private" in user_json and user_json["private"],
        "can_view": True
    }), "application/json")

def api_post_like_add() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when someone likes a post.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - post id to like

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["id"]
    )

    try:
        if generate_post_id(inc=False) <= int(x["id"]):
            return return_dynamic_content_type(json.dumps({
                "success": False
            }), "application/json"), 404

    except ValueError:
        return return_dynamic_content_type(json.dumps({
            "success": False
        }), "application/json"), 404

    user_id = token_to_id(request.cookies["token"])
    post_json = load_post_json(x["id"])
    if not ("interactions" in post_json and "likes" in post_json["interactions"]) or "user_id" not in post_json["interactions"]["likes"]:
        if "interactions" in post_json:
            if "likes" in post_json["interactions"]:
                if user_id not in post_json["interactions"]["likes"]:
                    post_json["interactions"]["likes"].append(user_id)
            else:
                post_json["interactions"]["likes"] = [user_id]
        else:
            post_json["interactions"] = {"likes": [user_id], "comments": [], "reposts": []}
        save_post_json(x["id"], post_json)

    return return_dynamic_content_type(json.dumps({
        "success": True
    }), "application/json")

def api_post_like_remove() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when someone unlikes a post.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - post id to unlike

    x = std_checks(
        token=request.cookies["token"],

        parameters=True,
        required_params=["id"]
    )

    try:
        if generate_post_id(inc=False) <= int(x["id"]):
            return return_dynamic_content_type(json.dumps({
                "success": False
            }), "application/json"), 404

    except ValueError:
        return return_dynamic_content_type(json.dumps({
            "success": False
        }), "application/json"), 404

    user_id = token_to_id(request.cookies["token"])
    post_json = load_post_json(x["id"])
    if "interactions" in post_json and "likes" in post_json["interactions"]:
        if user_id in post_json["interactions"]["likes"]:
            post_json["interactions"]["likes"].remove(user_id)
            save_post_json(x["id"], post_json)

    return return_dynamic_content_type(json.dumps({
        "success": True
    }), "application/json")
