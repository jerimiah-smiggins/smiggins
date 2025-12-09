from typing import Literal, TypeVar

from django.db.models import Model, Q
from django.db.models.manager import BaseManager
from django.http import HttpResponse
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest
from posts.models import Hashtag, M2MPending, Notification, Post, User

from ..variables import POSTS_PER_REQUEST
from .format import (ErrorCodes, api_TimelineComments, api_TimelineFollowing,
                     api_TimelineFolreq, api_TimelineGlobal,
                     api_TimelineHashtag, api_TimelineNotifications,
                     api_TimelineSearch, api_TimelineUser)

T = TypeVar("T", bound="Model")

def get_timeline(
    tl: BaseManager[T],
    offset: int | None,
    user: User | None,
    forwards: bool=False, *,
    no_visibility_check: bool=False,
    show_blocked: bool=False,
    order_by: list[str]=["-timestamp", "-pk"]
) -> tuple[bool, list[T]]:
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

    objs: list[T] = list(tl[:POSTS_PER_REQUEST + 1])
    return len(objs) <= POSTS_PER_REQUEST, objs[:POSTS_PER_REQUEST]

def tl_following(request: HttpRequest, comments: bool | None=None, offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_TimelineFollowing(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    end, posts = get_timeline(
        (Post.objects if comments else Post.objects.filter(comment_parent=None)).filter(
            Q(creator=request.s_user) | Q(creator__followers=request.s_user)
        ),
        offset,
        request.s_user,
        forwards
    )

    api.set_response(end, forwards, posts, request.s_user)
    return api.get_response()

def tl_global(request: HttpRequest, comments: bool | None=None, offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_TimelineGlobal(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    end, posts = get_timeline(
        Post.objects if comments else Post.objects.filter(comment_parent=None),
        offset,
        request.s_user,
        forwards
    )

    api.set_response(end, forwards, posts, request.s_user)
    return api.get_response()

def tl_user(request: HttpRequest, username: str, offset: int | None=None, forwards: bool=False, include_comments: bool=False) -> HttpResponse:
    api = api_TimelineUser(request)

    if request.s_user is None and forwards:
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
        request.s_user,
        forwards,
        show_blocked=True
    )

    api.set_response(end, forwards, posts, user, request.s_user)
    return api.get_response()

def tl_comments(request: HttpRequest, post_id: int, sort: Literal["recent", "oldest", "random"], offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_TimelineComments(request)

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    kwargs = {}

    if sort == "recent":
        ...
    elif sort == "oldest":
        kwargs["order_by"] = ["timestamp", "pk"]
        forwards = True
    # elif sort == "random": # TODO: random timeline has random duplication even though it should be .distinct()
    #     kwargs["order_by"] = ["?"]
    #     forwards = False
    #     offset = None
    else:
        return api.error(ErrorCodes.BAD_REQUEST)

    end, posts = get_timeline(
        post.comments,
        offset,
        request.s_user,
        forwards,
        **kwargs
    )

    api.set_response(end, forwards and sort != "oldest", posts, request.s_user, post)
    return api.get_response()

def tl_notifications(request: HttpRequest, offset: int | None=None, forwards: bool=False):
    api = api_TimelineNotifications(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    end, notifications = get_timeline(
        request.s_user.notifications,
        offset,
        request.s_user,
        forwards,
        no_visibility_check=True
    )

    api.set_response(end, forwards, notifications, request.s_user)

    unread_notifications = request.s_user.notifications.filter(read=False)

    for notif in unread_notifications:
        notif.read = True

    Notification.objects.bulk_update(unread_notifications, ["read"])

    return api.get_response()

def tl_hashtag(request: HttpRequest, tag: str, sort: Literal["recent", "oldest", "random"], offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_TimelineHashtag(request)

    if request.s_user is None:
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
        forwards = True
    else:
        return api.error(ErrorCodes.BAD_REQUEST)

    end, posts = get_timeline(
        hashtag.posts,
        offset,
        request.s_user,
        forwards,
        **kwargs
    )

    api.set_response(end, forwards and sort != "oldest", posts, request.s_user)
    return api.get_response()

def tl_folreq(request: HttpRequest, offset: int | None=None) -> HttpResponse:
    api = api_TimelineFolreq(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    tl: BaseManager[M2MPending] = M2MPending.objects.filter(user=request.s_user).order_by("-pk")

    if offset:
        tl = tl.filter(pk__lt=offset)

    users: list[M2MPending] = list(tl[:POSTS_PER_REQUEST + 1])
    end = len(users) <= POSTS_PER_REQUEST

    api.set_response(end, users[:POSTS_PER_REQUEST])

    request.s_user.notifications.filter(read=False).update(read=True)

    return api.get_response()

def tl_search(
    request: HttpRequest,
    sort: Literal["new", "old"],
    q: str="",
    cw: str="",
    user: str="",
    quote: bool | None=None,
    poll: bool | None=None,
    comment: bool | None=None,
    offset: int | None=None
) -> HttpResponse:
    api = api_TimelineSearch(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    kwargs = {}

    if sort == "new":
        ...
    elif sort == "old":
        kwargs["order_by"] = ["timestamp", "pk"]
        kwargs["forwards"] = True
    else:
        return api.error(ErrorCodes.BAD_REQUEST)

    tl = Post.objects.all()

    if q:
        tl = tl.filter(content__icontains=q)

    if cw:
        tl = tl.filter(content_warning__icontains=cw)

    if user:
        try:
            user_obj = User.objects.get(username=user)
        except User.DoesNotExist:
            api.set_response(True, False, [], request.s_user)
            return api.get_response()

        tl = tl.filter(creator=user_obj)

    if quote:
        tl = tl.filter(~Q(quoted_post=None))
    elif quote is not None:
        tl = tl.filter(quoted_post=None)

    if poll:
        tl = tl.filter(~Q(poll=None))
    elif quote is not None:
        tl = tl.filter(poll=None)

    if comment:
        tl = tl.filter(~Q(comment_parent=None))
    elif comment is not None:
        tl = tl.filter(comment_parent=None)

    end, posts = get_timeline(
        tl,
        offset,
        request.s_user,
        **kwargs
    )

    api.set_response(end, False, posts, request.s_user)
    return api.get_response()
