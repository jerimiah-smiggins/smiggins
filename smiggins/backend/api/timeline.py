from typing import Literal

from django.db.models import Q
from django.db.models.manager import BaseManager
from django.http import HttpResponse
from posts.models import Post, User

from ..variables import POSTS_PER_REQUEST
from .builder import ErrorCodes, ResponseCodes, build_response


def get_post_data(post: Post, user: User | None) -> list:
    can_view_quote = True
    comment: Post | None = post.comment_parent
    quote: Post | None = post.quoted_post

    return [
        (post.post_id, 32),
        (post.timestamp, 64),
        post.creator.verify_followers if post.private is None else post.private,
        comment is not None,
        quote is not None,
        can_view_quote, # TODO: don't show quotes you can't see (blocked, private, blocking...)
        post.likes.contains(user) if user else False,
        can_view_quote and (quote or False) and quote.private,
        *([] if comment is None else [(comment.post_id, 32)]),
        (post.likes.count(), 16),
        (post.quotes.count(), 16),
        (post.comments.count(), 16),
        (post.content, 16),
        (post.content_warning or "", 8),
        (post.creator.username, 8),
        (post.creator.display_name, 8),
        *([] if quote is None or not can_view_quote else [
            (quote.post_id, 32),
            (quote.timestamp, 64),
            (quote.content, 16),
            (quote.content_warning or "", 8),
            (quote.creator.username, 8),
            (quote.creator.display_name, 8),
        ])
    ]

def get_timeline(
    tl: BaseManager[Post],
    offset: int | None,
    user: User | None,
    forwards: bool=False, *,
    no_visibility_check: bool=False,
    show_blocked: bool=False,
    order_by: list[str]=["-timestamp", "-pk"]
) -> tuple[bool, int, list]:
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

    objs = list(tl[:POSTS_PER_REQUEST + 1])
    return len(objs) <= POSTS_PER_REQUEST, min(POSTS_PER_REQUEST, len(objs)), sum([print(get_post_data(i, user)) or get_post_data(i, user) for i in objs[:POSTS_PER_REQUEST]], [])

def tl_following(request, offset: int | None=None, forwards: bool=False) -> HttpResponse:
    # if rl := check_ratelimit(request, "GET /api/timeline/following"):
    #     return NEW_RL

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.TIMELINE_FOLLOWING, ErrorCodes.NOT_AUTHENTICATED)

    end, length, posts = get_timeline(
        Post.objects.filter(comment_parent=None).filter(
            Q(creator=user) | Q(creator__followers=user)
        ),
        offset,
        user,
        forwards
    )

    return build_response(ResponseCodes.TIMELINE_FOLLOWING, [
        end, forwards, (length, 8), *posts
    ])

def tl_global(request, offset: int | None=None, forwards: bool=False) -> HttpResponse:
    # if rl := check_ratelimit(request, "GET /api/timeline/global"):
    #     return NEW_RL

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.TIMELINE_GLOBAL, ErrorCodes.NOT_AUTHENTICATED)

    end, length, posts = get_timeline(
        Post.objects.filter(comment_parent=None),
        offset,
        user,
        forwards
    )

    return build_response(ResponseCodes.TIMELINE_GLOBAL, [
        end, forwards, (length, 8), *posts
    ])

def tl_user(request, username: str, offset: int | None=None, forwards: bool=False, include_comments: bool=False) -> HttpResponse:
    # if rl := check_ratelimit(request, "GET /api/timeline/global"):
    #     return NEW_RL

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.TIMELINE_USER, ErrorCodes.NOT_AUTHENTICATED)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return build_response(ResponseCodes.TIMELINE_USER, ErrorCodes.BAD_USERNAME)

    p = user.posts.all()
    if not include_comments:
        p = p.filter(comment_parent=None)

    end, length, posts = get_timeline(
        p,
        offset,
        self_user,
        forwards,
        show_blocked=True
    )

    return build_response(ResponseCodes.TIMELINE_USER, [
        (user.display_name, 8),
        bytearray.fromhex(user.color[1:]),
        bytearray.fromhex((user.color_two if user.gradient else user.color)[1:]),
        (user.followers.count(), 16),
        (user.following.count(), 16),
        end,
        forwards,
        self_user.following.contains(user),
        self_user.blocking.contains(user),
        user.pending_followers.contains(self_user),
        (length, 8),
        *posts
    ])

def tl_comments(request, post_id: int, sort: Literal["recent", "oldest", "random"], offset: int | None=None, forwards: bool=False) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.TIMELINE_COMMENTS, ErrorCodes.NOT_AUTHENTICATED)

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return build_response(ResponseCodes.TIMELINE_COMMENTS, ErrorCodes.POST_NOT_FOUND)

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
        return build_response(ResponseCodes.TIMELINE_COMMENTS, ErrorCodes.BAD_REQUEST)

    end, length, posts = get_timeline(
        Post.objects.filter(comment_parent=post_id),
        offset,
        user,
        forwards,
        **kwargs
    )

    return build_response(ResponseCodes.TIMELINE_COMMENTS, [
        *get_post_data(post, user), (0, 8),
        end, forwards, (length, 8), *posts
    ])
