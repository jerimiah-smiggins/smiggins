# For API functions that relate to posts, for example creating, fetching home lists, etc.

from ._packages import *
from ._settings import *
from ._helper import *

def api_post_create(request, data) -> dict:
    # Called when a new post is created.
    # Login required: true
    # Ratelimit: 1s for unsuccessful, 3s for successful
    # Parameters:
    # - "content": the content of the post. must be between 1 >= x >= 280 characters

    token = request.COOKIES.get('token')
    content = data.content.replace("\r", "").replace("\t", " ").replace("\u200b", " ")

    for i in ["\t", "​", "​", " ", " ", " ", " ", " ", " ", " ", " ", " ", "⠀"]:
        content = content.replace(i, " ")

    while "\n "    in content: content = content.replace("\n ", "\n")
    while "  "     in content: content = content.replace("  ", " ")
    while "\n\n\n" in content: content = content.replace("\n\n\n", "\n\n")

    try:
        if content[0]  in "\n ": content = content[1::]
        if content[-1] in "\n ": content = content[:-1:]
    except IndexError:
        content = ""

    if (len(content) > MAX_POST_LENGTH or len(content) < 1):
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        return 400, {
            "success": False,
            "reason": f"Invalid post length. Must be between 1 and {MAX_POST_LENGTH} characters."
        }

    create_api_ratelimit("api_post_create", API_TIMINGS["create post"], token)

    timestamp = round(time.time())
    
    user = Users.objects.get(token=token)

    post = Posts(
        content = content,
        creator = user.user_id,
        timestamp = timestamp,
        likes = [],
        comments = [],
        reposts = []
    )
    post.save()

    post = Posts.objects.get(content=content,timestamp=timestamp,creator=user.user_id)
    user.posts.append(post.post_id)
    user.save()

    return 201, {
        "success": True,
        "post_id": post.post_id
    }

def api_post_list_following(request, offset) -> dict:
    # Called when the following tab is refreshed.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    token = request.COOKIES.get('token')
    
    offset = sys.maxsize if offset == -1 else offset
    user = Users.objects.get(token=token)

    potential = []
    for i in user.following:
        potential += Users.objects.get(pk=i).posts
    potential = sorted(potential, reverse=True)

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i
            break

    potential = potential[index::]

    offset = 0
    outputList = []
    for i in potential:
        current_post = Posts.objects.get(pk=i)
        current_user = Users.objects.get(pk=current_post.creator)

        if current_user.private and user.user_id not in current_user.following:
            offset += 1

        else:
            outputList.append({
                "post_id": i,
                "creator_id": current_post.creator,
                "display_name": current_user.display_name,
                "creator_username": current_user.display_name,
                "content": current_post.content,
                "timestamp": current_post.timestamp,
                "liked": user.user_id in current_post.likes,
                "likes": len(current_post.likes) or 0,
                "comments": len(current_post.comments) or 0,
                "private_acc": current_user.private
            })

            if len(outputList) >= POSTS_PER_REQUEST:
                break

    return {
        "posts": outputList,
        "end": len(potential) - offset <= POSTS_PER_REQUEST
    }

def api_post_list_recent(request, offset) -> dict:
    # Called when the recent posts tab is refreshed.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    token = request.COOKIES.get('token')

    if offset == -1:
        next_id = Posts.objects.latest('post_id').post_id
    else:
        next_id = offset - 10

    end = next_id <= POSTS_PER_REQUEST
    user = Users.objects.get(token=token)

    outputList = []
    offset = 0
    i = next_id
    while i > next_id - POSTS_PER_REQUEST - offset and i > 0:
        try:
            current_post = Posts.objects.get(pk=i)
        
            current_user = Users.objects.get(pk=current_post.creator)
            if current_user.private and user.user_id not in current_user.following:
                offset += 1

            else:
                outputList.append({
                    "post_id": i,
                    "creator_id": current_post.creator,
                    "display_name": current_user.display_name,
                    "creator_username": current_user.username,
                    "content": current_post.content,
                    "timestamp": current_post.timestamp,
                    "liked": user.user_id in current_post.likes,
                    "likes": len(current_post.likes),
                    "comments": len(current_post.comments),
                    "private_acc": current_user.private
                })
        except Posts.DoesNotExist:
            pass

        i -= 1

    return {
        "posts": outputList,
        "end": end
    }

def api_post_list_user(user: str) -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when getting posts from a specific user.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    if not validate_username(user):
        flask.abort(404)

    offset = sys.maxsize if request.args.get("offset") == None else int(request.args.get("offset")) # type: ignore // pylance likes to complain :3

    self_id = token_to_id(token) if "token" in request.cookies and validate_token(token) else 0
    user_id = username_to_id(user)
    user_json = load_user_json(user_id)

    if "private" in user_json and user_json["private"] and self_id not in user_json["following"]:
        return return_dynamic_content_type(json.dumps({
            "posts": [],
            "end": True,
            "color": "#3a1e93" if "color" not in user_json else user_json["color"],
            "private": True,
            "can_view": False,
            "following": len(user_json["following"]) - 1,
            "followers": user_json["followers"]
        }))

    potential = get_user_post_ids(user_id)[::-1]

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i
            break

    potential = potential[index::]
    end = len(potential) <= POSTS_PER_REQUEST
    potential = potential[:POSTS_PER_REQUEST:]

    outputList = []
    for i in potential:
        post_info = load_post_json(i)
        outputList.append({
            "post_id": i,
            "creator_username": user,
            "display_name": user_json["display_name"],
            "content": post_info["content"],
            "timestamp": post_info["timestamp"],
            "liked": "interactions" in post_info and "likes" in post_info["interactions"] and self_id in post_info["interactions"]["likes"],
            "likes": len(post_info["interactions"]["likes"]) if "interactions" in post_info and "likes" in post_info["interactions"] else 0,
            "comments": len(post_info["interactions"]["comments"]) if "interactions" in post_info and "comments" in post_info["interactions"] else 0
        })

    return return_dynamic_content_type(json.dumps({
        "posts": outputList,
        "end": end,
        "color": "#3a1e93" if "color" not in user_json else user_json["color"],
        "private": "private" in user_json and user_json["private"],
        "can_view": True,
        "following": len(user_json["following"]) - 1,
        "followers": user_json["followers"]
    }), "application/json")

def api_post_like_add() -> Union[tuple[flask.Response, int], flask.Response]:
    # Called when someone likes a post.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - post id to like

    x = std_checks(
        token=token,

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

    user_id = token_to_id(token)
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
        token=token,

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

    user_id = token_to_id(token)
    post_json = load_post_json(x["id"])
    if "interactions" in post_json and "likes" in post_json["interactions"]:
        if user_id in post_json["interactions"]["likes"]:
            post_json["interactions"]["likes"].remove(user_id)
            save_post_json(x["id"], post_json)

    return return_dynamic_content_type(json.dumps({
        "success": True
    }), "application/json")
