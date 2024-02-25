# For API functions that relate to comments, for example liking, creating, etc.

from ._packages import *
from ._settings import *
from ._helper import *

def api_comment_create(request, data) -> dict:
    # Called when a new comment is created.
    # Login required: true
    # Ratelimit: 1s for unsuccessful, 3s for successful
    # Parameters:
    # - "content": the content of the comment. must be between 1 >= x >= 280 characters
    # - "id": the id for the post being commented on. must be a valid id between 0 < x < next post id

    token = request.COOKIES.get('token')
    content = data.content.replace("\r", "").replace("\t", " ").replace("\u200b", " ")
    id = data.id
    print(data.id)
    is_comment = data.comment

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
        create_api_ratelimit("api_comment_create", API_TIMINGS["create post failure"], token)
        return 400, {
            "success": False,
            "reason": f"Invalid post length. Must be between 1 and {MAX_POST_LENGTH} characters."
        }

    create_api_ratelimit("api_comment_create", API_TIMINGS["create comment"], token)

    timestamp = round(time.time())

    user = Users.objects.get(token=token)

    comment = Comments(
        content = content,
        creator = user.user_id,
        timestamp = timestamp,
        likes = [],
        comments = [],
        reposts = []
    )
    comment.save()

    comment = Comments.objects.get(content=content,timestamp=timestamp,creator=user.user_id)


    if is_comment:
        parent = Comments.objects.get(comment_id=id)
    else:
        parent = Posts.objects.get(post_id=id)

    if comment.comment_id not in parent.comments:
        parent.comments.append(comment.comment_id)

    parent.save()

    return 201, {
        "success": True,
        "comment_id": comment.comment_id
    }

def api_comment_list(request, offset, is_comment, id) -> dict:
    # Called when the comments for a post are refreshed.
    # Login required: true
    # Ratelimit: none
    # Parameters: id, offset

    token = request.COOKIES.get('token')
    offset = 0 if offset == -1 else offset

    logged_in = True

    try:
        if not validate_token(token):
            logged_in = False
    except KeyError:
        logged_in = False

    try:
        if id < 0 or (Comments.objects.latest('comment_id').comment_id if is_comment else Posts.objects.latest('post_id').post_id) < id:
            return 400, {
                "reason": "Idk your id is not right at all"
            }

    except ValueError:
        return 400, {
            "reason": "Your id broke soemthing owo"
        }

    if is_comment:
        parent = Comments.objects.get(pk=id)
    else:
        parent = Posts.objects.get(pk=id)
    user_id = Users.objects.get(token=token).user_id if logged_in else 0
    if parent.comments == []:
        return 200, {
            "posts": [],
            "end": True
        }

    print(offset)
    while len(parent.comments) and parent.comments[0] < offset:
        parent.comments.pop(0)

    outputList = []
    offset = 0
    for i in parent.comments:
        comment = Comments.objects.get(pk=i)
        creator = Users.objects.get(pk=comment.creator)

        if creator.private and user_id not in creator.following:
            offset += 1

        else:
            outputList.append({
                "post_id": i,
                "display_name": creator.display_name,
                "creator_username": creator.username,
                "content": comment.content,
                "timestamp": comment.timestamp,
                "liked":  user_id in comment.likes,
                "likes": len(comment.likes),
                "comments": len(comment.comments),
                "private_acc": creator.private
            })

        if len(outputList) >= POSTS_PER_REQUEST:
            break

    return 200, {
        "posts": outputList,
        "end": len(parent.comments) - offset <= POSTS_PER_REQUEST
    }

def api_comment_like_add(request, data):
    # Called when someone likes a comment.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - comment id to like

    token = request.COOKIES.get('token')
    id = data.id

    try:
        if id > Comments.objects.latest('comment_id').comment_id:
            return 404, {
                "success": False
            }
    except ValueError:
        return 404, {
                "success": False
            }

    user = Users.objects.get(token=token)
    comment = Comments.objects.get(comment_id=id)

    if user.user_id not in comment.likes:
            if comment.likes != []:
                comment.likes.append(user.user_id)
            else:
                comment.likes = [user.user_id]
    comment.save()

    return 200, {
        "success": True
    }

def api_comment_like_remove(request, data):
    # Called when someone unlikes a comment.
    # Login required: true
    # Ratelimit: none
    # Parameters: id: int - comment id to unlike

    token = request.COOKIES.get('token')
    id = data.id

    try:
        if id > Comments.objects.latest('comment_id').comment_id:
            return 404, {
                "success": False
            }
    except ValueError:
        return 404, {
                "success": False
            }

    user = Users.objects.get(token=token)
    comment = Comments.objects.get(comment_id=id)

    if user.user_id in comment.likes:
        comment.likes.remove(user.user_id)
    comment.save()

    return 200, {
        "success": True
    }
