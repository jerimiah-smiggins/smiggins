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

    if len(content) > MAX_POST_LENGTH or len(content) < 1:
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        return 400, {
            "success": False,
            "reason": f"Invalid post length. Must be between 1 and {MAX_POST_LENGTH} characters."
        }

    create_api_ratelimit("api_post_create", API_TIMINGS["create post"], token)

    timestamp = round(time.time())

    user = User.objects.get(token=token)

    post = Post(
        content = content,
        creator = user.user_id,
        timestamp = timestamp,
        likes = [],
        comments = [],
        reposts = []
    )
    post.save()

    post = Post.objects.get(content=content,timestamp=timestamp,creator=user.user_id)
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
    user = User.objects.get(token=token)

    potential = []
    for i in user.following:
        potential += User.objects.get(pk=i).posts
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
        current_post = Post.objects.get(pk=i)
        current_user = User.objects.get(pk=current_post.creator)

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
        try:
            next_id = Post.objects.latest('post_id').post_id
        except Post.DoesNotExist:
            return {
                "posts": [],
                "end": True
            }
    else:
        next_id = offset - 10

    end = next_id <= POSTS_PER_REQUEST
    user = User.objects.get(token=token)

    outputList = []
    offset = 0
    i = next_id

    while i > next_id - POSTS_PER_REQUEST - offset and i > 0:
        try:
            current_post = Post.objects.get(pk=i)

            current_user = User.objects.get(pk=current_post.creator)
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

        except Post.DoesNotExist:
            pass

        i -= 1

    return {
        "posts": outputList,
        "end": end
    }

def api_post_list_user(request, username, offset):
    # Called when getting posts from a specific user.
    # Login required: true
    # Ratelimit: none
    # Parameters: none

    if not validate_username(username):
        return 404, {
            "reason" : "Username is insvalbid"
        }

    token = request.COOKIES.get('token') if 'token' in request.COOKIES and validate_token(request.COOKIES.get('token')) else 0
    offset = sys.maxsize if offset == -1 else offset

    self_user = User.objects.get(token=token)
    user = User.objects.get(username=username)

    if user.private and self_user.user_id not in user.following:
        return 200, {
            "posts": [],
            "end": True,
            "color": user.color or "#3a1e93",
            "private": True,
            "can_view": False,
            "following": len(user.following) - 1,
            "followers": len(user.followers)
        }

    potential = user.posts[::-1]

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
        post = Post.objects.get(pk=i)
        outputList.append({
            "post_id": i,
            "creator_username": user.username,
            "display_name": user.display_name,
            "content": post.content,
            "timestamp": post.timestamp,
            "liked": self_user.user_id in post.likes,
            "likes": len(post.likes),
            "comments": len(post.comments),
        })

    return 200, {
        "posts": outputList,
        "end": end,
        "color": user.color or "#3a1e93",
        "private": user.private,
        "can_view": not user.private or self_user.user_id in user.following,
        "following": len(user.following) - 1,
        "followers": user.followers,
    }

def api_post_like_add(request, data):
    # Called when someone likes a post.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - post id to like

    token = request.COOKIES.get('token')
    id = data.id

    try:
        if id > Post.objects.latest('post_id').post_id:
            return 404, {
                "success": False
            }
    except ValueError:
        return 404, {
            "success": False
        }

    user = User.objects.get(token=token)
    post = Post.objects.get(post_id=id)

    if user.user_id not in post.likes:
            if post.likes != []:
                post.likes.append(user.user_id)
            else:
                post.likes = [user.user_id]
    post.save()

    return 200, {
        "success": True
    }

def api_post_like_remove(request, data):
    # Called when someone unlikes a post.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - post id to unlike

    token = request.COOKIES.get('token')
    id = data.id

    try:
        if id > Post.objects.latest('post_id').post_id:
            return 404, {
                "success": False
            }
    except ValueError:
        return 404, {
            "success": False
        }

    user = User.objects.get(token=token)
    post = Post.objects.get(post_id=id)

    if user.user_id in post.likes:
        post.likes.remove(user.user_id)
    post.save()

    return 200, {
        "success": True
    }
