# For API functions that relate to comments, for example liking, creating, etc.

import time

from django.db.models import Count
from django.db.utils import IntegrityError
from posts.models import Comment, M2MLikeC, Notification, Post, User

from ..helper import (check_muted_words, check_ratelimit, create_notification,
                      delete_notification, find_mentions, trim_whitespace)
from ..lang import DEFAULT_LANG, get_lang
from ..variables import (ENABLE_CONTENT_WARNINGS, ENABLE_LOGGED_OUT_CONTENT,
                         ENABLE_POST_DELETION, MAX_CONTENT_WARNING_LENGTH,
                         MAX_POST_LENGTH, OWNER_USER_ID, POSTS_PER_REQUEST)
from .admin import BitMask, log_admin_action
from .schema import APIResponse, CommentID, EditComment, NewComment


def comment_create(request, data: NewComment) -> APIResponse:
    if rl := check_ratelimit(request, "PUT /api/comment/create"):
        return rl

    token = request.COOKIES.get("token")
    user = User.objects.get(token=token)
    lang = get_lang(user)

    content = trim_whitespace(data.content)
    c_warning = trim_whitespace(data.c_warning, True) if ENABLE_CONTENT_WARNINGS else ("", False)

    parent = (Comment if data.comment else Post).objects.get(pk=data.id)
    can_view = parent.can_view(user)
    if can_view[0] is False and (can_view[1] == "blocked" or can_view[1] == "private"):
        return 400, {
            "success": False
        }

    if not content[1] or len(c_warning[0]) > MAX_CONTENT_WARNING_LENGTH or len(content[0]) > MAX_POST_LENGTH:
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH))
        }

    if check_muted_words(content[0], c_warning[0]):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["muted"]
        }

    timestamp = round(time.time())

    Comment.objects.create(
        content=content[0],
        creator=user,
        timestamp=timestamp,
        content_warning=c_warning[0] or None,
        comments=[],
        quotes=[],
        parent=data.id,
        private=data.private,
        parent_is_comment=data.comment
    )

    comment = Comment.objects.get(
        content=content[0],
        creator=user,
        timestamp=timestamp,
        parent=data.id
    )

    if comment.comment_id not in parent.comments:
        parent.comments.append(comment.comment_id)
        parent.save()

    creator = parent.creator
    if creator.user_id != user.user_id and not creator.blocking.contains(user) and not user.blocking.contains(creator):
        create_notification(
            creator,
            "comment",
            comment.comment_id
        )

    for i in find_mentions(content[0], [user.username, creator.username]):
        try:
            notif_for = User.objects.get(username=i.lower())
            if not notif_for.blocking.contains(user) and not user.blocking.contains(notif_for):
                create_notification(notif_for, "ping_c", comment.comment_id)

        except User.DoesNotExist:
            ...

    return {
        "success": True,
        "actions": [
            { "name": "prepend_timeline", "post": comment.json(user), "comment": True },
            { "name": "update_element", "query": "#post-text", "value": "" },
            { "name": "update_element", "query": "#c-warning", "value": "", "focus": True }
        ]
    }

def comment_list(request, id: int, comment: bool, sort: str, offset: int=0) -> APIResponse: # TODO
    if rl := check_ratelimit(request, "GET /api/comments"):
        return rl

    offset = 0 if offset == -1 else offset

    if sort not in ["liked", "random", "newest", "oldest"]:
        return 400, {
            "success": False
        }

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
        lang = get_lang(user)
    except User.DoesNotExist:
        if not ENABLE_LOGGED_OUT_CONTENT:
            return 400, {
                "success": False
            }

        user = None
        lang = DEFAULT_LANG

    try:
        if id < 0 or (Comment.objects.latest("comment_id").comment_id if comment else Post.objects.latest("post_id").post_id) < id:
            return 400, {
                "success": False,
                "message": lang["post"]["commend_id_does_not_exist"]
            }

    except ValueError:
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_comment_id"]
        }

    if comment:
        parent = Comment.objects.get(pk=id)
    else:
        parent = Post.objects.get(pk=id)

    comments = Comment.objects.filter(comment_id__in=parent.comments)

    if sort == "liked":
        comments = comments.annotate(like_count=Count('likes')).order_by('-like_count')
    else:
        comments = comments.order_by("?" if sort == "random" else "comment_id" if sort == "oldest" else "-comment_id")

    comments = comments[POSTS_PER_REQUEST * offset:]

    if comments.count() == 0:
        return {
            "success": True,
            "actions": [
                { "name": "populate_timeline", "posts": [], "end": True }
            ]
        }

    outputList = []
    offset = 0

    for comment_object in comments:
        can_view = comment_object.can_view(user)
        if can_view[0] is False and (can_view[1] == "blocked" or can_view[1] == "private"):
            offset += 1
            continue

        else:
            outputList.append(comment_object.json(user))

        if len(outputList) + offset >= POSTS_PER_REQUEST:
            break

    return {
        "success": True,
        "actions": [
            { "name": "populate_timeline", "posts": outputList, "end": sort == "random" or comments.count() <= POSTS_PER_REQUEST }
        ]
    }

def comment_like_add(request, data: CommentID) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/comment/like"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))
    comment = Comment.objects.get(comment_id=data.id)

    can_view = comment.can_view(user)
    if can_view[0] is False and (can_view[1] == "blocked" or can_view[1] == "private"):
        return 400, {
            "success": False
        }

    try:
        comment.likes.add(user)
    except IntegrityError:
        ...

    return {
        "success": True,
        "actions": [
            { "name": "update_element", "query": f"div[data-comment-id='{data.id}'] button.like", "attribute": [{ "name": "data-liked", "value": "true" }, { "name": "data-like-anim", "value": "" }] },
            { "name": "update_element", "query": f"div[data-comment-id='{data.id}'] span.like-number", "inc": 1 }
        ]
    }

def comment_like_remove(request, data: CommentID) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/comment/like"):
        return rl

    try:
        M2MLikeC.objects.get(
            user=User.objects.get(token=request.COOKIES.get("token")),
            post=Comment.objects.get(comment_id=data.id)
        ).delete()
    except M2MLikeC.DoesNotExist:
        ...

    return {
        "success": True,
        "actions": [
            { "name": "update_element", "query": f"div[data-comment-id='{data.id}'] button.like", "attribute": [{ "name": "data-liked", "value": "false" }] },
            { "name": "update_element", "query": f"div[data-comment-id='{data.id}'] span.like-number", "inc": -1 }
        ]
    }

def comment_delete(request, data: CommentID) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/comment"):
        return rl

    try:
        comment = Comment.objects.get(comment_id=data.id)
        user = User.objects.get(token=request.COOKIES.get("token"))
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

    admin = user.user_id == OWNER_USER_ID or BitMask.can_use(user, BitMask.DELETE_POST)
    creator = comment.creator.user_id == user.user_id and ENABLE_POST_DELETION

    if admin and not creator:
        log_admin_action("Delete comment", user, comment.creator, f"Deleted comment {id}")

    if creator or admin:
        try:
            for notif in Notification.objects.filter(
                event_id=comment.comment_id,
                event_type__in=["ping_c", "comment"]
            ):
                delete_notification(notif)
        except Notification.DoesNotExist:
            ...

        comment.delete()

        return {
            "success": True,
            "actions": [
                { "name": "remove_from_timeline", "post_id": data.id, "comment": True }
            ]
        }

    return 400, {
        "success": False
    }

def comment_edit(request, data: EditComment) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/comment/edit"):
        return rl

    try:
        post = Comment.objects.get(comment_id=data.id)
        user = User.objects.get(token=request.COOKIES.get("token"))
    except Comment.DoesNotExist:
        return 404, {
            "success": False
        }
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if post.creator.user_id == user.user_id:
        content = trim_whitespace(data.content)
        c_warning = trim_whitespace(data.c_warning, True) if ENABLE_CONTENT_WARNINGS else ("", False)

        if not content[1] or len(c_warning[0]) > MAX_CONTENT_WARNING_LENGTH or len(content[0]) > MAX_POST_LENGTH:
            lang = get_lang(user)
            return 400, {
                "success": False,
                "message": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH))
            }

        post.edited = True
        post.edited_at = round(time.time())
        post.content = content[0]
        post.content_warning = c_warning[0]
        post.private = data.private

        post.save()

        return {
            "success": True,
            "actions": [
                { "name": "reset_post_html", "post_id": data.id, "comment": True, "post": post.json(user) }
            ]
        }

    return 400, {
        "success": False
    }

    if rl := check_ratelimit(request, "POST /api/comment/like"):
        return rl
