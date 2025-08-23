from django.db.models import Q
from django.db.models.manager import BaseManager
from posts.models import Comment, Post, User

from ..variables import POSTS_PER_REQUEST


def get_post_json(post: Post | Comment) -> dict:
    return {
        "id": post.post_id if isinstance(post, Post) else post.comment_id,
        "content": post.content,
        "content_warning": post.content_warning,
        "timestamp": post.timestamp,

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
            if show_blocked:
                tl = tl.filter(
                    ~Q(creator__blockers=user) # exclude blocked users
                )

            tl = tl.filter(
                ~Q(private=True) # public posts
              | Q(creator=user) # post from self
              | (Q(private=True) & Q(creator__followers=user)) # private but following
            ).distinct()
        else:
            tl = tl.filter(~Q(private=True))

    if forwards:
        tl = tl.reverse()

    objs = list(tl[:POSTS_PER_REQUEST + 1])

    return len(objs) <= POSTS_PER_REQUEST, [get_post_json(i) for i in objs[:POSTS_PER_REQUEST]]

def tl_following(request, offset: int | None=None, forwards: bool=False):
    # if rl := check_ratelimit(request, "GET /api/timeline/following"):
    #     return NEW_RL

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False,
            "reason": "NOT_AUTHENTICATED"
        }

    end, posts = get_timeline(
        Post.objects.order_by("-pk").filter(
            Q(creator=user) | Q(creator__followers=user)
        ),
        offset,
        user
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
        return 400, {
            "success": False,
            "reason": "NOT_AUTHENTICATED"
        }

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
