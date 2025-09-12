# For API functions that relate to posts, for example creating, fetching home lists, etc.

import time
from typing import Any

from django.db.models import Count
from django.db.utils import IntegrityError
from posts.models import (Comment, Hashtag, M2MLike, M2MLikeC, Notification,
                          Poll, PollChoice, PollVote, Post, User)

from ..helper import (check_muted_words, check_ratelimit, create_notification,
                      delete_notification, find_hashtags, find_mentions,
                      trim_whitespace, validate_username)
from ..lang import DEFAULT_LANG, get_lang
from ..timeline import get_timeline
from ..variables import (ENABLE_LOGGED_OUT_CONTENT, ENABLE_PINNED_POSTS,
                         ENABLE_POLLS, ENABLE_POST_DELETION, ENABLE_USER_BIOS,
                         MAX_CONTENT_WARNING_LENGTH, MAX_POLL_OPTION_LENGTH,
                         MAX_POLL_OPTIONS, MAX_POST_LENGTH, OWNER_USER_ID)
from .admin import BitMask, log_admin_action
from .schema import (APIResponse, EditPost, NewPost, NewQuote, PollSchema,
                     PostID)
from .timeline import get_post_json


def post_create(request, data: NewPost) -> dict | tuple[int, dict]:
    # if rl := check_ratelimit(request, "POST /api/post"):
    #     return rl

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

def OLD_post_create(request, data: NewPost) -> APIResponse:
    if rl := check_ratelimit(request, "PUT /api/post/create"):
        return rl

    token = request.COOKIES.get("token")
    user = User.objects.get(token=token)

    if not ENABLE_POLLS:
        data.poll = []

    if len(data.poll) > MAX_POLL_OPTIONS:
        return 400, {
            "success": False
        }

    poll: list[str] = []
    for i in data.poll:
        i = trim_whitespace(i, True)
        if i[1]:
            if not isinstance(i[0], str) or len(i[0]) > MAX_POLL_OPTION_LENGTH:
                return 400, {
                    "success": False
                }

            poll.append(i[0])

    if len(poll) == 1:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_poll"],
            "actions": [
                { "name": "update_element", "query": "#poll input", "disabled": False, "focus": True }
            ]
        }

    content = trim_whitespace(data.content)
    c_warning = trim_whitespace(data.cw or "", True)

    if len(c_warning[0]) > MAX_CONTENT_WARNING_LENGTH or len(content[0]) > MAX_POST_LENGTH or not (content[1] or len(poll)):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH)),
            "actions": [
                { "name": "update_element", "query": "#post-text", "disabled": False, "focus": True }
            ]
        }

    if check_muted_words(
        content[0],
        c_warning[0],
        *poll
    ):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["muted"],
            "actions": [
                { "name": "update_element", "query": "#post-text", "disabled": False, "focus": True }
            ]
        }

    timestamp = round(time.time())
    post = Post.objects.create(
        content=content[0],
        content_warning=c_warning[0] or None,
        creator=user,
        timestamp=timestamp,
        comments=[],
        quotes=[],
        private=data.private
    )

    post = Post.objects.get(
        timestamp=timestamp,
        creator=user.user_id,
        content=content[0]
    )

    if len(poll) >= 2:
        p = Poll.objects.create(target=post)
        choices: list[PollChoice] = []

        for choice in poll:
            choices.append(PollChoice(
                poll=p,
                content=choice
            ))

        PollChoice.objects.bulk_create(choices)

    for i in find_mentions(content[0], [user.username]):
        try:
            notif_for = User.objects.get(username=i.lower())
            if not notif_for.blocking.contains(user) and not user.blocking.contains(notif_for):
                create_notification(notif_for, "ping_p", post.post_id)

        except User.DoesNotExist:
            pass

    for i in find_hashtags(content[0]):
        try:
            tag = Hashtag.objects.get(tag=i.lower())
        except Hashtag.DoesNotExist:
            tag = Hashtag.objects.create(tag=i.lower())

        tag.posts.add(post)

    return {
        "success": True,
        "actions": [
            { "name": "prepend_timeline", "post": post.json(user), "comment": False },
            { "name": "update_element", "query": "#post-text", "value": "", "disabled": False, "focus": True},
            { "name": "update_element", "query": "#c-warning", "value": "" },
            { "name": "update_element", "query": "#poll input", "value": "", "all": True }
        ]
    }

def quote_create(request, data: NewQuote) -> APIResponse:
    if rl := check_ratelimit(request, "PUT /api/quote/create"):
        return rl

    token = request.COOKIES.get("token")
    user = User.objects.get(token=token)

    try:
        quoted_post = (Comment if data.quote_is_comment else Post).objects.get(pk=data.quote_id)

    except Post.DoesNotExist:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_quote_post"]
        }
    except Comment.DoesNotExist:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_quote_comment"]
        }

    can_view = quoted_post.can_view(user)

    if can_view[0] is False and can_view[1] in ["private", "blocked"]:
        return 400, {
            "success": False
        }

    content = trim_whitespace(data.content)
    c_warning = trim_whitespace(data.c_warning, True)

    if len(c_warning[0]) > MAX_CONTENT_WARNING_LENGTH or len(content[0]) > MAX_POST_LENGTH or not content[1]:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH))
        }

    if check_muted_words(
        content[0],
        c_warning[0]
    ):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["muted"]
        }

    timestamp = round(time.time())
    post = Post.objects.create(
        content=content[0],
        creator=user,
        timestamp=timestamp,
        content_warning=c_warning[0] or None,
        comments=[],
        quotes=[],
        private=data.private,
        quote=data.quote_id,
        quote_is_comment=data.quote_is_comment
    )

    post = Post.objects.get(
        timestamp=timestamp,
        creator=user.user_id,
        content=content[0]
    )

    quoted_post.quotes.append(post.post_id)
    quoted_post.save()

    try:
        quote_creator = quoted_post.creator
        if quote_creator.user_id != user.user_id and not user.blocking.contains(quote_creator) and not quote_creator.blocking.contains(user):
            create_notification(
                quote_creator,
                "quote",
                post.post_id
            )

        for i in find_mentions(content[0], [user.username, quote_creator.username]):
            try:
                notif_for = User.objects.get(username=i.lower())
                if not notif_for.blocking.contains(user) and not user.blocking.contains(notif_for):
                    create_notification(notif_for, "ping_p", post.post_id)

            except User.DoesNotExist:
                ...
    except User.DoesNotExist:
        ...

    for i in find_hashtags(content[0]):
        try:
            tag = Hashtag.objects.get(tag=i.lower())

        except Hashtag.DoesNotExist:
            tag = Hashtag.objects.create(
                tag=i
            )

        tag.posts.add(post)

    return {
        "success": True,
        "actions": [
            { "name": "prepend_timeline", "post": post.json(user), "comment": False },
            { "name": "update_element", "query": f".post-container[data-{'comment' if data.quote_is_comment else 'post'}-id='{data.quote_id}'] .quote-inputs", "html": "" },
            { "name": "update_element", "query": f".post-container[data-{'comment' if data.quote_is_comment else 'post'}-id='{data.quote_id}'] .quote-number", "inc": 1 }
        ]
    }

def hashtag_list(request, hashtag: str, sort: str, offset: int | None=None, forwards: bool=False) -> APIResponse:
    if rl := check_ratelimit(request, "GET /api/hashtag/{str:hashtag}"):
        return rl

    if sort not in ["random", "recent", "liked"]:
        return 400, {
            "success": False
        }

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        if not ENABLE_LOGGED_OUT_CONTENT:
            return 400, {
                "success": False
            }

        user = None

    try:
        tag = Hashtag.objects.get(tag=hashtag)
    except Hashtag.DoesNotExist:
        return {
            "success": True,
            "actions": [
                { "name": "populate_timeline", "end": True, "posts": [] }
            ]
        }

    def post_cv(post: Post | Any) -> bool:
        return isinstance(post, Post) and post.can_view(user)[0]

    if sort == "liked":
        posts = tag.posts.all().annotate(like_count=Count('likes')).order_by('-like_count')
    else:
        posts = tag.posts.all().order_by("?" if sort == "random" else "-post_id")

    tl = get_timeline(
        posts,
        offset,
        user,
        use_pages=sort == "liked",
        always_end=sort == "random",
        forwards=forwards and sort == "recent",
        condition=post_cv
    )

    return {
        "success": True,
        "actions": [
            { "name": "populate_forwards_cache", "posts": tl[0] if tl[1] else [], "its_a_lost_cause_just_refresh_at_this_point": not tl[1] }
            if forwards and sort == "recent" else
            { "name": "populate_timeline", "posts": tl[0], "end": tl[1], "forwards": forwards }
        ]
    }

def post_list_user(request, username: str, offset: int | None=None, forwards: bool=False) -> APIResponse:
    if rl := check_ratelimit(request, "GET /api/post/user/{str:username}"):
        return rl

    username = username.lower()

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
        lang = get_lang(self_user)
        logged_in = True
    except User.DoesNotExist:
        if not ENABLE_LOGGED_OUT_CONTENT:
            return 400, {
                "success": False
            }

        self_user = None
        lang = DEFAULT_LANG
        logged_in = False

    if not validate_username(username):
        return 404, {
            "success": False,
            "message": lang["post"]["invalid_username"]
        }

    def post_cv(post: Post | Any) -> bool:
        if not isinstance(post, Post):
            return False

        cv = post.can_view(self_user)
        return cv[0] is True or cv[1] == "blocking"

    def post_json(post: Post | Any) -> dict:
        if not isinstance(post, Post):
            return {}

        return post.json(self_user, hide_blocking=False)

    user = User.objects.get(username=username)

    if logged_in and user.blocking.contains(self_user):
        return 400, {
            "success": False,
            "message": lang["messages"]["blocked"]
        }

    tl = get_timeline(
        user.posts.order_by("-pk"),
        None if offset == -1 else offset,
        self_user,
        condition=post_cv,
        to_json=post_json,
        forwards=forwards
    )

    return {
        "success": True,
        "actions": [
            { "name": "populate_forwards_cache", "posts": tl[0] if tl[1] else [], "its_a_lost_cause_just_refresh_at_this_point": not tl[1] }
            if forwards else
            {
                "name": "populate_timeline",
                "posts": tl[0],
                "end": tl[1],
                "extra": {
                    "type": "user",
                    "pinned": user.pinned.json(self_user) if ENABLE_PINNED_POSTS and user.pinned else None,
                    "bio": user.bio or "" if ENABLE_USER_BIOS else "",
                    "following": user.following.count(),
                    "followers": user.followers.count()
                }
            }
        ]
    }

def post_like_add(request, data: PostID) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/post/like"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))
    post = Post.objects.get(post_id=data.id)

    can_view = post.can_view(user)
    if can_view[0] is False and can_view[1] in ["private", "blocked"]:
        return 400, {
            "success": False
        }

    try:
        post.likes.add(user)
    except IntegrityError:
        ...

    return {
        "success": True,
        "actions": [
            { "name": "update_element", "query": f"div[data-post-id='{data.id}'] button.like", "attribute": [{ "name": "data-liked", "value": "true" }, { "name": "data-like-anim", "value": "" }] },
            { "name": "update_element", "query": f"div[data-post-id='{data.id}'] span.like-number", "inc": 1 }
        ]
    }

def post_like_remove(request, data: PostID) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/post/like"):
        return rl

    try:
        M2MLike.objects.get(
            user=User.objects.get(token=request.COOKIES.get("token")),
            post=Post.objects.get(post_id=data.id)
        ).delete()
    except M2MLike.DoesNotExist:
        ...

    return {
        "success": True,
        "actions": [
            { "name": "update_element", "query": f"div[data-post-id='{data.id}'] button.like", "attribute": [{ "name": "data-liked", "value": "false" }] },
            { "name": "update_element", "query": f"div[data-post-id='{data.id}'] span.like-number", "inc": -1 }
        ]
    }

def post_delete(request, data: PostID) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/post"):
        return rl

    try:
        post = Post.objects.get(post_id=data.id)
        user = User.objects.get(token=request.COOKIES.get("token"))
    except Post.DoesNotExist:
        return 404, {
            "success": True,
            "actions": [
                { "name": "remove_from_timeline", "post_id": data.id, "comment": False }
            ]
        }
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    admin = user.user_id == OWNER_USER_ID or BitMask.can_use(user, BitMask.DELETE_POST)
    creator = post.creator.user_id == user.user_id and ENABLE_POST_DELETION

    if admin and not creator:
        log_admin_action("Delete post", user, post.creator, f"Deleted post {data.id}")

    if creator or admin:
        if post.quote:
            try:
                quoted_post = (Comment if post.quote_is_comment else Post).objects.get(pk=post.quote)
                quoted_post.quotes.remove(id)
                quoted_post.save()

            except ValueError:
                ...
            except Post.DoesNotExist:
                ...
            except Comment.DoesNotExist:
                ...

        try:
            for notif in Notification.objects.filter(
                event_id=post.post_id,
                event_type__in=["quote", "ping_p"]
            ):
                delete_notification(notif)
        except Notification.DoesNotExist:
            ...

        for tag in post.hashtags.all():
            if tag.posts.count() == 1:
                tag.delete()

        post.delete()

        return {
            "success": True,
            "actions": [
                { "name": "remove_from_timeline", "post_id": data.id, "comment": False }
            ]
        }

    return 400, {
        "success": False
    }

def pin_post(request, data: PostID) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/user/pin"):
        return rl

    try:
        post = Post.objects.get(post_id=data.id)
        user = User.objects.get(token=request.COOKIES.get("token"))
    except Post.DoesNotExist:
        return 404, {
            "success": False
        }
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    user.pinned = post
    user.save()

    lang = get_lang(user)

    return {
        "success": True,
        "message": lang["generic"]["success"],
        "actions": [
            { "name": "refresh_timeline", "url_includes": ["/u/"] }
        ]
    }

def unpin_post(request) -> APIResponse:
    if rl := check_ratelimit(request, "DELETE /api/user/pin"):
        return rl

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    user.pinned = None
    user.save()

    return {
        "success": True,
        "actions": [
            { "name": "refresh_timeline", "url_includes": ["/u/"] }
        ]
    }

def poll_vote(request, data: PollSchema) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/post/poll"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))
    post = Post.objects.get(post_id=data.id)

    if not hasattr(post, "poll"):
        return 400, {
            "success": False
        }

    can_view = post.can_view(user)
    if can_view[0] is False and can_view[1] in ["private", "blocked"]:
        return 400, {
            "success": False
        }

    poll = post.poll
    choice = poll.choices.filter(id=data.option)

    if choice.count() == 0:
        return 400, {
            "success": False
        }

    try:
        PollVote.objects.create(
            poll=poll,
            choice=choice[0],
            user=user
        )
    except IntegrityError:
        ...

    return {
        "success": True,
        "actions": [
            { "name": "refresh_poll", "poll": post.get_poll(user), "post_id": post.post_id }
        ]
    }

def poll_refresh(request, id: int) -> APIResponse:
    if rl := check_ratelimit(request, "GET /api/post/poll"):
        return rl

    post = Post.objects.get(post_id=id)

    if not hasattr(post, "poll"):
        return 400, {
            "success": False
        }

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))

        can_view = post.can_view(user)
        if can_view[0] is False and can_view[1] in ["private", "blocked"]:
            return 400, {
                "success": False
            }
    except User.DoesNotExist:
        ...

    return {
        "success": True,
        "actions": [
            { "name": "refresh_poll", "poll": post.get_poll(user), "post_id": post.post_id }
        ]
    }

def post_edit(request, data: EditPost) -> APIResponse:
    if rl := check_ratelimit(request, "PATCH /api/post/edit"):
        return rl

    try:
        post = Post.objects.get(post_id=data.id)
        user = User.objects.get(token=request.COOKIES.get("token"))
    except Post.DoesNotExist:
        return 404, {
            "success": False
        }
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if post.creator.user_id == user.user_id:
        content = trim_whitespace(data.content)
        c_warning = trim_whitespace(data.c_warning, True)

        if len(c_warning[0]) > MAX_CONTENT_WARNING_LENGTH or len(content[0]) > MAX_POST_LENGTH or not (content[1] or post.poll):
            lang = get_lang(user)
            return 400, {
                "success": False,
                "message": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH))
            }

        if check_muted_words(
            content[0],
            c_warning[0]
        ):
            lang = get_lang(user)
            return 400, {
                "success": False,
                "message": lang["post"]["muted"]
            }

        post.edited = True
        post.edited_at = round(time.time())
        post.content = content[0]
        post.content_warning = c_warning[0]
        post.private = data.private

        post.save()

        for tag in post.hashtags.all():
            if tag.posts.count() == 1:
                tag.delete()
            else:
                tag.posts.remove(post)

        hashtags = find_hashtags(content[0])

        for tag in hashtags:
            try:
                tag_obj = Hashtag.objects.get(tag=tag)
            except Hashtag.DoesNotExist:
                tag_obj = Hashtag.objects.create(tag=tag)

            tag_obj.posts.add(post)

        return {
            "success": True,
            "actions": [
                { "name": "reset_post_html", "post_id": data.id, "comment": False, "post": post.json(user) }
            ]
        }

    return 400, {
        "success": False
    }
