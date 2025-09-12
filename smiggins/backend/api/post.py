import time
from typing import Any

from django.db.models import Count
from django.db.utils import IntegrityError
from posts.models import Comment, M2MLike, M2MLikeC, Post, User

from ..helper import trim_whitespace
from ..variables import (MAX_CONTENT_WARNING_LENGTH, MAX_POLL_OPTION_LENGTH,
                         MAX_POST_LENGTH)
from .schema import NewPost
from .timeline import get_post_json


def post_create(request, data: NewPost) -> dict | tuple[int, dict]:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    poll: list[str] = []
    for i in data.poll:
        if (i := trim_whitespace(i, True))[0]:
            if not isinstance(i[0], str) or len(i[0]) > MAX_POLL_OPTION_LENGTH:
                return 400, {
                    "success": False
                }

            poll.append(i[0])

    if len(poll) == 1:
        return 400, { "success": False, "reason": "POLL_SINGLE_OPTION" }

    content = trim_whitespace(data.content)
    cw = trim_whitespace(data.cw or "", True)

    if len(cw[0]) > MAX_CONTENT_WARNING_LENGTH or len(content[0]) > MAX_POST_LENGTH or not (content[1] or len(poll)):
        return 400, { "success": False, "reason": "INVALID_LENGTH" }

    ts = round(time.time())

    Post.objects.create(
        content=content[0],
        content_warning=cw[0] or None,
        creator=user,
        timestamp=ts,
        comments=[],
        quotes=[],
        private=data.private
    )

    post = Post.objects.get(
        content=content[0],
        content_warning=cw[0] or None,
        creator=user,
        timestamp=ts,
        private=data.private
    )

    # TODO: add poll
    # TODO: mention notifications and whatnot

    return {
        "success": True,
        "post": get_post_json(post, user)
    }

def add_like(request, post_type: str, post_id: int) -> dict | tuple[int, dict]:
    if post_type != "post" and post_type != "comment":
        return 404, { "success": False }

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    if post_type == "comment":
        try:
            post = Comment.objects.get(comment_id=post_id)
        except Comment.DoesNotExist:
            return 400, { "success": False, "reason": "POST_NOT_FOUND" }
    else:
        try:
            post = Post.objects.get(post_id=post_id)
        except Post.DoesNotExist:
            return 400, { "success": False, "reason": "POST_NOT_FOUND" }

    creator = post.creator

    if creator.blocking.contains(user) \
    or creator.blockers.contains(user) \
    or (post.private and creator.username != user.username and not creator.followers.contains(user)):
        return 400, { "success": False, "reason": "CANT_INTERACT" }

    try:
        post.likes.add(user)
    except IntegrityError:
        ...

    return { "success": True }

def remove_like(request, post_type: str, post_id: int) -> dict | tuple[int, dict]:
    if post_type != "post" and post_type != "comment":
        return 404, { "success": False }

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    if post_type == "comment":
        try:
            M2MLikeC.objects.get(user=user, post=post_id).delete()
        except M2MLikeC.DoesNotExist:
            ...
    else:
        try:
            M2MLike.objects.get(user=user, post=post_id).delete()
        except M2MLike.DoesNotExist:
            ...

    return { "success": True }
