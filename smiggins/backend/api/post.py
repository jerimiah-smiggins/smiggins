import time

from django.db.utils import IntegrityError
from django.http import HttpRequest, HttpResponse
from posts.models import M2MLike, Post, User

from ..helper import trim_whitespace
from ..variables import (MAX_CONTENT_WARNING_LENGTH, MAX_POLL_OPTION_LENGTH,
                         MAX_POST_LENGTH)
from .builder import ErrorCodes, ResponseCodes, build_response
from .schema import NewPost
from .parser import parse_request
from .timeline import get_post_data


def post_create(request: HttpRequest) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.CREATE_POST, ErrorCodes.NOT_AUTHENTICATED)

    data = parse_request(request.body, ResponseCodes.CREATE_POST)

    poll: list[str] = []
    if data["poll"]:
        for i in data["poll"]:
            if (i := trim_whitespace(i, True))[0]:
                if not isinstance(i[0], str) or len(i[0]) > MAX_POLL_OPTION_LENGTH:
                    return build_response(ResponseCodes.CREATE_POST, ErrorCodes.BAD_REQUEST)

                poll.append(i[0])

    if len(poll) == 1:
        return build_response(ResponseCodes.CREATE_POST, ErrorCodes.POLL_SINGLE_OPTION)

    content = trim_whitespace(data["content"])
    cw = trim_whitespace(data["cw"] or "", True)

    if len(cw[0]) > MAX_CONTENT_WARNING_LENGTH or len(content[0]) > MAX_POST_LENGTH or not (content[1] or len(poll)):
        return build_response(ResponseCodes.CREATE_POST, ErrorCodes.BAD_REQUEST)

    ts = round(time.time())

    quote = None
    if data["quote"]:
        try:
            quote = Post.objects.get(post_id=data["quote"])
        except Post.DoesNotExist:
            ...

    comment_parent = None
    if data["comment"]:
        try:
            comment_parent = Post.objects.get(post_id=data["comment"])
        except Post.DoesNotExist:
            ...

    Post.objects.create(
        content=content[0],
        content_warning=cw[0] or None,
        creator=user,
        timestamp=ts,
        private=data["private"],
        quoted_post=quote,
        comment_parent=comment_parent
    )

    post = Post.objects.get(
        content=content[0],
        content_warning=cw[0] or None,
        creator=user,
        timestamp=ts,
        private=data["private"]
    )

    # TODO: add poll
    # TODO: mention notifications and whatnot

    return build_response(ResponseCodes.CREATE_POST, get_post_data(post, user))

def add_like(request, post_id: int) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.LIKE, ErrorCodes.NOT_AUTHENTICATED)

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return build_response(ResponseCodes.LIKE, ErrorCodes.POST_NOT_FOUND)

    creator = post.creator

    if creator.blocking.contains(user) \
    or creator.blockers.contains(user) \
    or (post.private and creator.username != user.username and not creator.followers.contains(user)):
        return build_response(ResponseCodes.LIKE, ErrorCodes.CANT_INTERACT)

    try:
        post.likes.add(user)
    except IntegrityError:
        ...

    return build_response(ResponseCodes.LIKE)

def remove_like(request, post_id: int) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.UNLIKE, ErrorCodes.NOT_AUTHENTICATED)

    try:
        M2MLike.objects.get(user=user, post=post_id).delete()
    except M2MLike.DoesNotExist:
        ...

    return build_response(ResponseCodes.UNLIKE)
