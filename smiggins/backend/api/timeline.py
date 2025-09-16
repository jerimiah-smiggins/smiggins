from django.db.models import Q
from django.db.models.manager import BaseManager
from posts.models import Post, User

from ..variables import POSTS_PER_REQUEST


def get_post_json(post: Post, user: User | None) -> dict:
    return {
        "id": post.post_id,
        "content": post.content,
        "content_warning": post.content_warning,
        "timestamp": post.timestamp,
        "private": post.private,

        "interactions": {
            "likes": post.likes.count(),
            "liked": post.likes.contains(user) if user else False,
            "quotes": post.quotes.count(),
            "comments": post.comments.count()
        },

        "user": {
            "username": post.creator.username,
            "display_name": post.creator.display_name
        },

        "quote": { # TODO: don't show quotes you can't see (blocked, private, blocking...)
            "id": post.quoted_post.post_id,
            "content": post.quoted_post.content,
            "content_warning": post.quoted_post.content_warning,
            "timestamp": post.quoted_post.timestamp,
            "private": post.quoted_post.private,

            "user": {
                "username": post.quoted_post.creator.username,
                "display_name": post.quoted_post.creator.display_name
            }
        } if post.quoted_post else None
    }

def get_timeline(
    tl: BaseManager[Post],
    offset: int | None,
    user: User | None,
    forwards: bool=False, *,
    no_visibility_check: bool=False,
    show_blocked: bool=False,
    order_by: list[str]=["-timestamp", "-pk"]
) -> tuple[bool, list[dict]]:
    tl = tl.order_by(*order_by)

    if offset:
        tl = tl.filter(**{
            f"timestamp__{'g' if forwards else 'l'}t": offset
        })

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
    return len(objs) <= POSTS_PER_REQUEST, [get_post_json(i, user) for i in objs[:POSTS_PER_REQUEST]]

def tl_following(request, offset: int | None=None, forwards: bool=False):
    # if rl := check_ratelimit(request, "GET /api/timeline/following"):
    #     return NEW_RL

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    end, posts = get_timeline(
        Post.objects.filter(comment_parent=None).filter(
            Q(creator=user) | Q(creator__followers=user)
        ),
        offset,
        user,
        forwards
    )

    return {
        "success": True,
        "posts": posts,
        "end": end
    }

def tl_global(request, offset: int | None=None, forwards: bool=False) -> dict | tuple[int, dict]:
    # if rl := check_ratelimit(request, "GET /api/timeline/global"):
    #     return NEW_RL

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    end, posts = get_timeline(
        Post.objects.filter(comment_parent=None),
        offset,
        user,
        forwards
    )

    return {
        "success": True,
        "posts": posts,
        "end": end
    }

def tl_user(request, username: str, offset: int | None=None, forwards: bool=False, include_comments: bool=False) -> dict | tuple[int, dict]:
    # if rl := check_ratelimit(request, "GET /api/timeline/global"):
    #     return NEW_RL

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "NOT_AUTHENTICATED" }

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return 400, { "success": False, "reason": "BAD_USERNAME" }

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

    return {
        "success": True,
        "posts": posts,
        "end": end,
        "extraData": {
            "display_name": user.display_name,
            "color_one": user.color,
            "color_two": user.color_two if user.gradient else user.color,
            "following": self_user.following.contains(user) or user.pending_followers.contains(self_user) and "pending",
            "blocking": self_user.blocking.contains(user),
            "num_followers": user.followers.count(),
            "num_following": user.following.count()
        }
    }
