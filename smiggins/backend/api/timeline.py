from django.db.models import Q
from django.db.models.manager import BaseManager
from posts.models import Comment, Post, User

from ..variables import POSTS_PER_REQUEST


def get_post_json(post: Post | Comment, user: User | None) -> dict:
    return {
        "id": post.post_id if isinstance(post, Post) else post.comment_id,
        "content": post.content,
        "content_warning": post.content_warning,
        "timestamp": post.timestamp,
        "private": post.private,

        "interactions": {
            "likes": post.likes.count(),
            "liked": post.likes.contains(user) if user else False,
            "quotes": len(post.quotes),
            "comments": len(post.comments)
        },

        "user": {
            "username": post.creator.username,
            "display_name": post.creator.display_name
        }
    }

def get_timeline(
    tl: BaseManager[Post] | BaseManager[Comment],
    offset: int | None,
    user: User | None,
    forwards: bool=False, *,
    no_visibility_check: bool=False,
    show_blocked: bool=False
) -> tuple[bool, list[dict]]:
    if offset:
        tl = tl.filter(**{
            f"pk__{'g' if forwards else 'l'}t": offset
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
        Post.objects.order_by("-pk").filter(
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
        Post.objects.order_by("-pk"),
        offset,
        user,
        forwards
    )

    return {
        "success": True,
        "posts": posts,
        "end": end
    }

def tl_user(request, username: str, offset: int | None=None, forwards: bool=False) -> dict | tuple[int, dict]:
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

    end, posts = get_timeline(
        user.posts.all().order_by("-pk"),
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
            "following": self_user.following.contains(user),
            "blocking": self_user.blocking.contains(user),
            "num_followers": user.followers.count(),
            "num_following": user.following.count()
        }
    }
