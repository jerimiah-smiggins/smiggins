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
    user: User, *,
    forwards: bool=False
) -> tuple[bool, list[dict]]:
    if offset:
        tl = tl.filter(**{
            f"pk__{'g' if forwards else 'l'}t": offset
        })

    if forwards:
        tl = tl.reverse()

    output = []
    count_offset = 0

    for obj in tl:
        if False:
            count_offset += 1
            continue

        output.append(get_post_json(obj))

        if len(output) >= POSTS_PER_REQUEST:
            break

    return tl.count() <= POSTS_PER_REQUEST + count_offset, output

def tl_following():
    ...

def tl_global(request, offset: int | None=None, forwards: bool=False) -> dict | tuple[int, dict]:
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
        Post.objects.order_by("-pk"),
        offset,
        user
    )

    return {
        "success": True,
        "posts": posts,
        "end": end
    }
