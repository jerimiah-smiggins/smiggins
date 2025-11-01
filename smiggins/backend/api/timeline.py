from typing import Literal

from django.db.models import Q
from django.db.models.manager import BaseManager
from django.http import HttpRequest, HttpResponse
from posts.models import Hashtag, M2MPending, Notification, Post, User

from ..variables import POSTS_PER_REQUEST
from .format import (ErrorCodes, api_TimelineComments, api_TimelineFollowing,
                     api_TimelineFolreq, api_TimelineGlobal,
                     api_TimelineHashtag, api_TimelineNotifications,
                     api_TimelineUser)


def get_timeline(
    tl: BaseManager[Post] | BaseManager[Notification],
    offset: int | None,
    user: User | None,
    forwards: bool=False, *,
    no_visibility_check: bool=False,
    show_blocked: bool=False,
    order_by: list[str]=["-timestamp", "-pk"]
) -> tuple[bool, list[Post] | list[Notification]]:
    if offset:
        tl = tl.filter(**{
            f"timestamp__{'g' if forwards else 'l'}t": offset
        })

    tl = tl.order_by(*order_by)

    if not no_visibility_check:
        if user:
            tl = tl.filter(~Q(creator__blocking=user)) # exclude users who block you

            if not show_blocked:
                tl = tl.filter(~Q(creator__blockers=user)) # exclude users who you block

            tl = tl.filter(
                ~Q(private=True) # public posts
              | Q(creator=user) # post from self
              | (Q(private=True) & Q(creator__followers=user)) # private but following
            ).distinct()
        else:
            tl = tl.filter(~Q(private=True))

    objs: list[Post] | list[Notification] = list(tl[:POSTS_PER_REQUEST + 1]) # type: ignore
    return len(objs) <= POSTS_PER_REQUEST, objs[:POSTS_PER_REQUEST]

def tl_following(request: HttpRequest, comments: bool | None=None, offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_TimelineFollowing()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    end, posts = get_timeline(
        (Post.objects if comments else Post.objects.filter(comment_parent=None)).filter(
            Q(creator=user) | Q(creator__followers=user)
        ),
        offset,
        user,
        forwards
    )

    api.set_response(end, forwards, posts, user)
    return api.get_response()

def tl_global(request: HttpRequest, comments: bool | None=None, offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_TimelineGlobal()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    end, posts = get_timeline(
        Post.objects if comments else Post.objects.filter(comment_parent=None),
        offset,
        user,
        forwards
    )

    api.set_response(end, forwards, posts, user)
    return api.get_response()

def tl_user(request: HttpRequest, username: str, offset: int | None=None, forwards: bool=False, include_comments: bool=False) -> HttpResponse:
    api = api_TimelineUser()

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return api.error(ErrorCodes.BAD_USERNAME)

    p = user.posts.all()
    if not include_comments:
        p = p.filter(comment_parent=None)

    end, posts = get_timeline(
        p,
        offset,
        self_user,
        forwards,
        show_blocked=True
    )

    api.set_response(end, forwards, posts, user, self_user)
    return api.get_response()

def tl_comments(request: HttpRequest, post_id: int, sort: Literal["recent", "oldest", "random"], offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_TimelineComments()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    kwargs = {}

    if sort == "recent":
        ...
    elif sort == "oldest":
        kwargs["order_by"] = ["timestamp", "pk"]
        forwards = False
    # elif sort == "random": # TODO: random timeline has random duplication even though it should be .distinct()
    #     kwargs["order_by"] = ["?"]
    #     forwards = False
    #     offset = None
    else:
        return api.error(ErrorCodes.BAD_REQUEST)

    end, posts = get_timeline(
        post.comments,
        offset,
        user,
        forwards,
        **kwargs
    )

    api.set_response(end, forwards, posts, user, post)
    return api.get_response()

def tl_notifications(request: HttpRequest, offset: int | None=None, forwards: bool=False):
    api = api_TimelineNotifications()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    end, notifications = get_timeline(
        user.notifications,
        offset,
        user,
        forwards,
        no_visibility_check=True
    )

    api.set_response(end, forwards, notifications, user)

    unread_notifications = user.notifications.filter(read=False)

    for notif in unread_notifications:
        notif.read = True

    Notification.objects.bulk_update(unread_notifications, ["read"])

    return api.get_response()

def tl_hashtag(request: HttpRequest, tag: str, sort: Literal["recent", "oldest", "random"], offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_TimelineHashtag()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        hashtag = Hashtag.objects.get(tag=tag)
    except Hashtag.DoesNotExist:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    kwargs = {}

    if sort == "recent":
        ...
    elif sort == "oldest":
        kwargs["order_by"] = ["timestamp", "pk"]
        forwards = False
    else:
        return api.error(ErrorCodes.BAD_REQUEST)

    end, posts = get_timeline(
        hashtag.posts,
        offset,
        user,
        forwards,
        **kwargs
    )

    api.set_response(end, forwards, posts, user)
    return api.get_response()

def tl_folreq(request: HttpRequest, offset: int | None=None):
    api = api_TimelineFolreq()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    tl: BaseManager[M2MPending] = M2MPending.objects.filter(user=user).order_by("-pk")

    if offset:
        tl = tl.filter(pk__lt=offset)

    users: list[M2MPending] = list(tl[:POSTS_PER_REQUEST + 1])
    end = len(users) <= POSTS_PER_REQUEST

    api.set_response(end, users[:POSTS_PER_REQUEST])

    unread_notifications = user.notifications.filter(read=False)

    for notif in unread_notifications:
        notif.read = True

    Notification.objects.bulk_update(unread_notifications, ["read"])

    return api.get_response()
