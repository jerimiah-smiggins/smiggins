# For API functions that relate to comments, for example liking, creating, etc.

from ._settings import MAX_POST_LENGTH, API_TIMINGS, OWNER_USER_ID, POSTS_PER_REQUEST
from .packages  import Comment, User, Post, time, Schema
from .helper    import trim_whitespace, create_api_ratelimit, ensure_ratelimit, validate_token, get_post_json, log_admin_action, create_notification, find_mentions

class NewComment(Schema):
    content: str
    comment: bool
    id: int

class CommentID(Schema):
    id: int

def comment_create(request, data: NewComment) -> tuple | dict:
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

    user.comments.append(comment.comment_id)
    user.save()

    if is_comment:
        parent = Comment.objects.get(comment_id=id)
    else:
        parent = Post.objects.get(post_id=id)

    if comment.comment_id not in parent.comments:
        parent.comments.append(comment.comment_id)

    parent.save()

    try:
        if parent.creator != user.user_id and user.user_id not in User.objects.get(user_id=parent.creator).blocking:
            create_notification(
                User.objects.get(user_id=parent.creator),
                "comment",
                comment.comment_id
            )
    except User.DoesNotExist:
        print("how")

    for i in find_mentions(content, [user.username, User.objects.get(user_id=parent.creator).username]):
        try:
            notif_for = User.objects.get(username=i.lower())
            if user.user_id not in notif_for.blocking:
                create_notification(notif_for, "ping_p", comment.comment_id)

        except User.DoesNotExist:
            pass

    return 201, {
        "success": True,
        "comment_id": comment.comment_id
    }

def comment_list(request, id: int, comment: bool, offset: int=-1) -> tuple | dict:
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
    cache = {}

    self_blocking = []
    if logged_in:
        self_blocking = User.objects.get(token=token).blocking

    for i in parent.comments:
        try:
            comment_object = Comment.objects.get(pk=i)
        except Comment.DoesNotExist:
            offset += 1
            continue

        try:
            creator = User.objects.get(pk=comment_object.creator)

        except User.DoesNotExist:
            offset += 1
            continue

        if creator.user_id in self_blocking or creator.private and user_id not in creator.following:
            offset += 1
            continue

        else:
            outputList.append(get_post_json(i, user_id, True, cache=cache))

        if len(outputList) >= POSTS_PER_REQUEST:
            break

    return 200, {
        "posts": outputList,
        "end": len(parent.comments) - offset <= POSTS_PER_REQUEST
    }

def comment_like_add(request, data: CommentID):
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
        user.likes.append([id, True])
        comment.likes.append(user.user_id)

        user.save()
        comment.save()

    return 200, {
        "success": True
    }

def comment_like_remove(request, data: CommentID):
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
        try:
            user.likes.remove([id, True])
            user.save()
        except ValueError:
            pass

        comment.likes.remove(user.user_id)
        comment.save()

    return 200, {
        "success": True
    }

def comment_delete(request, data: CommentID) -> tuple | dict:
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
        comment_parent.comments.remove(id)
        comment_parent.save()

    admin = user.user_id == OWNER_USER_ID or user.admin_level >= 1
    creator = comment.creator == user.user_id

    if admin and not creator:
        log_admin_action("Delete comment", user, f"Deleted comment {id} (parent: {comment.parent} (is_comment: {comment.parent_is_comment}), content: {comment.content})")

    if creator or admin:
        comment.delete()

        return {
            "success": True
        }

    return 400, {
        "success": False
    }
