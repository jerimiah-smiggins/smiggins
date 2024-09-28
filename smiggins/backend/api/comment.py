# For API functions that relate to comments, for example liking, creating, etc.

import time

from posts.models import Comment, Notification, Post, User

from ..helper import (DEFAULT_LANG, can_view_post, create_api_ratelimit,
                      create_notification, delete_notification,
                      ensure_ratelimit, find_mentions, get_lang, get_post_json,
                      trim_whitespace)
from ..variables import (API_TIMINGS, ENABLE_CONTENT_WARNINGS,
                         ENABLE_LOGGED_OUT_CONTENT, MAX_CONTENT_WARNING_LENGTH,
                         MAX_POST_LENGTH, OWNER_USER_ID, POSTS_PER_REQUEST)
from .admin import log_admin_action
from .schema import CommentID, NewComment


def comment_create(request, data: NewComment) -> tuple | dict:
    # Called when a new comment is created.

    token = request.COOKIES.get('token')
    user = User.objects.get(token=token)

    lang = get_lang(user)
    lang = DEFAULT_LANG

    if not ensure_ratelimit("api_comment_create", token):
        return 429, {
            "success": False,
            "reason": lang["generic"]["ratelimit"]
        }

    id = data.id
    is_comment = data.comment
    content = data.content.replace("\r", "")

    content = trim_whitespace(data.content)
    c_warning = trim_whitespace(data.c_warning, True) if ENABLE_CONTENT_WARNINGS else ""

    parent = (Comment if is_comment else Post).objects.get(pk=id)
    can_view = can_view_post(user, User.objects.get(user_id=parent.creator), parent)
    if can_view[0] is False and (can_view[1] == "blocked" or can_view[1] == "private"):
        return 400, {
            "success": False
        }

    if len(c_warning) > MAX_CONTENT_WARNING_LENGTH or len(content) > MAX_POST_LENGTH or len(content) < 1:
        create_api_ratelimit("api_comment_create", API_TIMINGS["create post failure"], token)
        return 400, {
            "success": False,
            "reason": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH))
        }

    create_api_ratelimit("api_comment_create", API_TIMINGS["create comment"], token)

    timestamp = round(time.time())

    comment = Comment(
        content=content,
        creator=user.user_id,
        timestamp=timestamp,
        content_warning=c_warning or None,
        likes=[],
        comments=[],
        quotes=[],
        parent=id,
        private_comment=data.private,
        parent_is_comment=is_comment
    )
    comment.save()

    comment = Comment.objects.get(
        timestamp=timestamp,
        creator=user.user_id,
        content=content
    )

    user.comments.append(comment.comment_id)
    user.save()

    if comment.comment_id not in parent.comments:
        parent.comments.append(comment.comment_id)

    parent.save()

    try:
        creator = User.objects.get(user_id=parent.creator)
        if parent.creator != user.user_id and user.user_id not in creator.blocking and parent.creator not in user.blocking:
            create_notification(
                User.objects.get(user_id=parent.creator),
                "comment",
                comment.comment_id
            )
    except User.DoesNotExist:
        print("how")
        creator = None

    for i in find_mentions(content, [user.username, creator.username if creator else ""]):
        try:
            notif_for = User.objects.get(username=i.lower())
            if user.user_id not in notif_for.blocking and notif_for.user_id not in user.blocking:
                create_notification(notif_for, "ping_c", comment.comment_id)

        except User.DoesNotExist:
            ...

    return 201, {
        "success": True,
        "comment_id": comment.comment_id
    }

def comment_list(request, id: int, comment: bool, offset: int=-1) -> tuple | dict:
    # Called when the comments for a post are refreshed.

    token = request.COOKIES.get('token')
    offset = 0 if offset == -1 else offset

    try:
        user = User.objects.get(token=token)
        lang = get_lang(user)
        logged_in = True
    except User.DoesNotExist:
        if not ENABLE_LOGGED_OUT_CONTENT:
            return 400, {
                "success": False
            }

        lang = DEFAULT_LANG
        logged_in = False

    try:
        if id < 0 or (Comment.objects.latest('comment_id').comment_id if comment else Post.objects.latest('post_id').post_id) < id:
            return 400, {
                "reason": lang["post"]["commend_id_does_not_exist"]
            }

    except ValueError:
        return 400, {
            "reason": lang["post"]["invalid_comment_id"]
        }

    if comment:
        parent = Comment.objects.get(pk=id)
    else:
        parent = Post.objects.get(pk=id)

    user_id = user.user_id if logged_in else 0
    comments = parent.comments

    while len(comments) and comments[0] < offset:
        comments.pop(0)

    if comments == []:
        return 200, {
            "posts": [],
            "end": True
        }

    outputList = []
    offset = 0
    cache = {}

    if logged_in:
        self_user = User.objects.get(token=token)
    else:
        self_user = None

    for i in comments:
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

        can_view = can_view_post(self_user, creator, comment_object)
        if can_view[0] is False and (can_view[1] == "blocked" or can_view[1] == "private"):
            offset += 1
            continue

        else:
            outputList.append(get_post_json(i, user_id, True, cache=cache))

        if len(outputList) >= POSTS_PER_REQUEST:
            break

    return 200, {
        "posts": outputList,
        "end": len(comments) - offset <= POSTS_PER_REQUEST
    }

def comment_like_add(request, data: CommentID):
    # Called when someone likes a comment.

    token = request.COOKIES.get('token')
    id = data.id

    user = User.objects.get(token=token)
    comment = Comment.objects.get(comment_id=id)
    comment_owner = User.objects.get(user_id=comment.creator)

    can_view = can_view_post(user, comment_owner, comment)
    if can_view[0] is False and (can_view[1] == "blocked" or can_view[1] == "private"):
        return 400, {
            "success": False
        }

    if user.user_id not in comment.likes:
        user.likes.append([id, True])
        comment.likes.append(user.user_id)

        user.save()
        comment.save()

    return {
        "success": True
    }

def comment_like_remove(request, data: CommentID):
    # Called when someone removes a like from a comment.

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
            ...

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
        try:
            comment_parent.comments.remove(id)
        except ValueError:
            ...
        comment_parent.save()

    admin = user.user_id == OWNER_USER_ID or user.admin_level >= 1
    creator = comment.creator == user.user_id

    if admin and not creator:
        log_admin_action("Delete comment", user, User.objects.get(user_id=comment.creator), f"Deleted comment {id}")

    if creator or admin:
        try:
            for notif in Notification.objects.filter(
                event_id=comment.comment_id,
                event_type="ping_c"
            ):
                delete_notification(notif)

        except Notification.DoesNotExist:
            ...

        try:
            delete_notification(
                Notification.objects.get(
                    event_id=comment.comment_id,
                    event_type="comment"
                )
            )

        except Notification.DoesNotExist:
            ...

        comment.delete()

        return {
            "success": True
        }

    return 400, {
        "success": False
    }
