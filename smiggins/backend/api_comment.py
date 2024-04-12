# For API functions that relate to comments, for example liking, creating, etc.

from ._settings import *
from .packages import *
from .schema import *
from .helper import *

def api_comment_create(request, data: commentSchema) -> tuple | dict:
    # Called when a new comment is created.

    token = request.COOKIES.get('token')

    if not ensure_ratelimit("api_comment_create", token):
        return 429, {
            "success": False,
            "reason": "Ratelimited"
        }

    id = data.id
    is_comment = data.comment
    content = data.content.replace("\r", "")

    for i in ["\t", "\u2002", "\u2003", "\u2004", "\u2005", "\u2007", "\u2008", "\u2009", "\u200a", "\u200b", "\u2800"]:
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

    user = User.objects.get(token=token)

    comment = Comment(
        content = content,
        creator = user.user_id,
        timestamp = timestamp,
        likes = [],
        comments = [],
        reposts = []
    )
    comment.save()

    comment = Comment.objects.get(
        timestamp=timestamp,
        creator=user.user_id,
        content=content
    )

    if is_comment:
        parent = Comment.objects.get(comment_id=id)
    else:
        parent = Post.objects.get(post_id=id)

    if comment.comment_id not in parent.comments:
        parent.comments.append(comment.comment_id)

    parent.save()

    return 201, {
        "success": True,
        "comment_id": comment.comment_id
    }

def api_comment_list(request, id: int, comment: bool, offset: int=-1) -> tuple | dict:
    # Called when the comments for a post are refreshed.

    token = request.COOKIES.get('token')
    offset = 0 if offset == -1 else offset
    logged_in = True

    try:
        if not validate_token(token):
            logged_in = False
    except KeyError:
        logged_in = False

    try:
        if id < 0 or (Comment.objects.latest('comment_id').comment_id if comment else Post.objects.latest('post_id').post_id) < id:
            return 400, {
                "reason": "Idk your id is not right at all"
            }

    except ValueError:
        return 400, {
            "reason": "Your id broke soemthing owo"
        }

    if comment:
        parent = Comment.objects.get(pk=id)
    else:
        parent = Post.objects.get(pk=id)
    user_id = User.objects.get(token=token).user_id if logged_in else 0
    if parent.comments == []:
        return 200, {
            "posts": [],
            "end": True
        }

    while len(parent.comments) and parent.comments[0] < offset:
        parent.comments.pop(0)

    outputList = []
    offset = 0
    for i in parent.comments:
        comment_object = Comment.objects.get(pk=i)
        creator = User.objects.get(pk=comment_object.creator)

        if creator.private and user_id not in creator.following:
            offset += 1

        else:
            outputList.append({
                "post_id": i,
                "display_name": creator.display_name,
                "creator_username": creator.username,
                "content": comment_object.content,
                "timestamp": comment_object.timestamp,
                "liked":  user_id in comment_object.likes,
                "likes": len(comment_object.likes),
                "comments": len(comment_object.comments),
                "private_acc": creator.private,
                "color": creator.color,
                "color_two": creator.color_two or DEFAULT_BANNER_COLOR,
                "gradient": creator.gradient
            })

        if len(outputList) >= POSTS_PER_REQUEST:
            break

    return 200, {
        "posts": outputList,
        "end": len(parent.comments) - offset <= POSTS_PER_REQUEST
    }

def api_comment_like_add(request, data: likeSchema):
    # Called when someone likes a comment.

    token = request.COOKIES.get('token')
    id = data.id

    try:
        if id > Comment.objects.latest('comment_id').comment_id:
            return 404, {
                "success": False
            }

    except ValueError:
        return 404, {
            "success": False
        }

    user = User.objects.get(token=token)
    comment = Comment.objects.get(comment_id=id)

    if user.user_id not in comment.likes:
            if comment.likes != []:
                comment.likes.append(user.user_id)
            else:
                comment.likes = [user.user_id]
    comment.save()

    return 200, {
        "success": True
    }

def api_comment_like_remove(request, data: likeSchema):
    # Called when someone unlikes a comment.

    token = request.COOKIES.get('token')
    id = data.id

    try:
        if id > Comment.objects.latest('comment_id').comment_id:
            return 404, {
                "success": False
            }
    except ValueError:
        return 404, {
                "success": False
            }

    user = User.objects.get(token=token)
    comment = Comment.objects.get(comment_id=id)

    if user.user_id in comment.likes:
        comment.likes.remove(user.user_id)
    comment.save()

    return 200, {
        "success": True
    }
