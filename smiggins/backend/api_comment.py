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

    content = trim_whitespace(data.content)

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
        quotes = [],
        parent = id,
        parent_is_comment = is_comment
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

    if comment.comment_id not in (parent.comments or []):
        parent.comments.append(comment.comment_id) # type: ignore

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

    while len(parent.comments or []) and parent.comments[0] < offset: # type: ignore
        parent.comments.pop(0) # type: ignore

    outputList = []
    offset = 0
    for i in (parent.comments or []):
        try:
            comment_object = Comment.objects.get(pk=i)
        except Comment.DoesNotExist:
            offset += 1
            continue

        creator = User.objects.get(pk=comment_object.creator)

        if creator.private and user_id not in creator.following:
            offset += 1
            continue

        else:
            outputList.append(get_post_json(i, user_id, True))

        if len(outputList) >= POSTS_PER_REQUEST:
            break

    return 200, {
        "posts": outputList,
        "end": len(parent.comments or []) - offset <= POSTS_PER_REQUEST
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

    if user.user_id not in (comment.likes or []):
            if comment.likes != []:
                comment.likes.append(user.user_id) # type: ignore
            else:
                comment.likes = [user.user_id] # type: ignore
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

    if user.user_id in (comment.likes or []):
        comment.likes.remove(user.user_id) # type: ignore
    comment.save()

    return 200, {
        "success": True
    }

def api_comment_delete(request, data: likeSchema) -> tuple | dict:
    # Called when someone deletes a post.

    token = request.COOKIES.get('token')
    id = data.id

    try:
        comment = Comment.objects.get(comment_id=id)
        user = User.objects.get(token=token)
    except Comment.DoesNotExist or User.DoesNotExist:
        return 404, {
            "success": False
        }

    if comment.parent:
        comment_parent = (Comment if comment.parent_is_comment else Post).objects.get(pk=comment.parent)
        comment_parent.comments.remove(id) # type: ignore
        comment_parent.save()

    if comment.creator == user.user_id or user.user_id == OWNER_USER_ID or user.admin_level >= 1:
        comment.delete()

        return {
            "success": True
        }

    return 400, {
        "success": False
    }
