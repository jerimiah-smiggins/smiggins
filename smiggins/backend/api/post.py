# For API functions that relate to posts, for example creating, fetching home lists, etc.

import sys
import threading
import time
from itertools import chain

import requests
from django.db.models import Count
from django.db.utils import IntegrityError
from posts.models import Comment, Hashtag, M2MLike, Notification, Post, User

from ..helper import (DEFAULT_LANG, can_view_post, check_muted_words,
                      create_api_ratelimit, create_notification,
                      delete_notification, ensure_ratelimit, find_hashtags,
                      find_mentions, get_lang, get_post_json, trim_whitespace,
                      validate_username, get_poll)
from ..variables import (API_TIMINGS, ENABLE_CONTENT_WARNINGS,
                         ENABLE_LOGGED_OUT_CONTENT, ENABLE_PINNED_POSTS,
                         ENABLE_POLLS, ENABLE_POST_DELETION,
                         MAX_CONTENT_WARNING_LENGTH, MAX_POLL_OPTION_LENGTH,
                         MAX_POLL_OPTIONS, MAX_POST_LENGTH, OWNER_USER_ID,
                         POST_WEBHOOKS, POSTS_PER_REQUEST, SITE_NAME, VERSION)
from .admin import BitMask, log_admin_action
from .schema import APIResponse, EditPost, NewPost, NewQuote, Poll, PostID


def post_hook(request, user: User, post: Post) -> None:
    def post_inside(request, user: User, post: Post):
        meta = POST_WEBHOOKS[user.username]
        lang = get_lang()

        content = post.content + (f"\n\n{lang['home']['quote_recursive']}" if post.quote else f"\n\n{lang['home']['quote_poll']}" if post.poll else "")

        if meta[1] == "discord":
            body = {
                "content": None,
                "embeds": [{
                    "description": content,
                    "color": int(user.color[1::], 16),
                    "author": {
                        "name": user.display_name,
                        "url": f"http://{request.META['HTTP_HOST']}/u/{user.username}"
                    },
                    "footer": {
                        "text": f"{SITE_NAME} v{VERSION}"
                    }
                }]
            }

        else:
            body = {
                "content": content
            }

        requests.post(meta[0], json=body, timeout=5)

    threading.Thread(target=post_inside, kwargs={
        "request": request,
        "user": user,
        "post": post
    }).start()

def post_create(request, data: NewPost) -> APIResponse:
    # Called when a new post is created.

    token = request.COOKIES.get("token")
    user = User.objects.get(token=token)

    if not ENABLE_POLLS:
        data.poll = []

    if not ensure_ratelimit("api_post_create", token):
        lang = get_lang(user)
        return 429, {
            "success": False,
            "message": lang["generic"]["ratelimit"],
            "actions": [
                { "name": "update_element", "query": "#post-text", "disabled": False, "focus": True }
            ]
        }

    if len(data.poll) > MAX_POLL_OPTIONS:
        return 400, {
            "success": False
        }

    poll = []
    for i in data.poll:
        i = trim_whitespace(i, True)
        if i:
            if len(i) > MAX_POLL_OPTION_LENGTH:
                create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
                return 400, {
                    "success": False
                }

            poll.append(i)

    if len(poll) == 1:
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_poll"],
            "actions": [
                { "name": "update_element", "query": "#poll input", "disabled": False, "focus": True }
            ]
        }

    content = trim_whitespace(data.content)
    c_warning = trim_whitespace(data.c_warning, True) if ENABLE_CONTENT_WARNINGS else ""

    if len(c_warning) > MAX_CONTENT_WARNING_LENGTH or len(content) > MAX_POST_LENGTH or len(content) < (0 if len(poll) else 1):
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH)),
            "actions": [
                { "name": "update_element", "query": "#post-text", "disabled": False, "focus": True }
            ]
        }

    if check_muted_words(
        content,
        c_warning,
        *poll
    ):
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["muted"],
            "actions": [
                { "name": "update_element", "query": "#post-text", "disabled": False, "focus": True }
            ]
        }

    create_api_ratelimit("api_post_create", API_TIMINGS["create post"], token)

    timestamp = round(time.time())
    post = Post.objects.create(
        content=content,
        content_warning=c_warning or None,
        creator=user,
        timestamp=timestamp,
        comments=[],
        quotes=[],
        private=data.private,
        poll={
            "votes": [],
            "choices": len(poll),
            "content": [{ "value": i, "votes": [] } for i in poll]
        } if poll else None
    )

    post = Post.objects.get(
        timestamp=timestamp,
        creator=user.user_id,
        content=content
    )

    for i in find_mentions(content, [user.username]):
        try:
            notif_for = User.objects.get(username=i.lower())
            if not notif_for.blocking.contains(user) and not user.blocking.contains(notif_for):
                create_notification(notif_for, "ping_p", post.post_id)

        except User.DoesNotExist:
            pass

    for i in find_hashtags(content):
        try:
            tag = Hashtag.objects.get(tag=i.lower())
        except Hashtag.DoesNotExist:
            tag = Hashtag.objects.create(tag=i.lower())

        tag.posts.add(post)

    if user.username in POST_WEBHOOKS:
        post_hook(request, user, post)

    return {
        "success": True,
        "actions": [
            { "name": "prepend_timeline", "post": get_post_json(post, user), "comment": False },
            { "name": "update_element", "query": "#post-text", "value": "", "disabled": False, "focus": True},
            { "name": "update_element", "query": "#c-warning", "value": "" },
            { "name": "update_element", "query": "#poll input", "value": "", "all": True }
        ]
    }

def quote_create(request, data: NewQuote) -> APIResponse:
    # Called when a post is quoted.

    token = request.COOKIES.get("token")
    user = User.objects.get(token=token)

    if not ensure_ratelimit("api_post_create", token):
        lang = get_lang(user)
        return 429, {
            "success": False,
            "message": lang["generic"]["ratelimit"]
        }

    try:
        quoted_post = (Comment if data.quote_is_comment else Post).objects.get(pk=data.quote_id)

    except Post.DoesNotExist:
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_quote_post"]
        }
    except Comment.DoesNotExist:
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_quote_comment"]
        }

    can_view = can_view_post(user, quoted_post.creator, quoted_post)

    if can_view[0] is False and can_view[1] in ["private", "blocked"]:
        return 400, {
            "success": False
        }

    content = trim_whitespace(data.content)
    c_warning = trim_whitespace(data.c_warning, True) if ENABLE_CONTENT_WARNINGS else ""

    if len(c_warning) > MAX_CONTENT_WARNING_LENGTH or len(content) > MAX_POST_LENGTH or len(content) < 1:
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], request.COOKIES.get("token"))
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH))
        }

    if check_muted_words(
        content,
        c_warning
    ):
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], request.COOKIES.get("token"))
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["post"]["muted"]
        }

    create_api_ratelimit("api_post_create", API_TIMINGS["create post"], request.COOKIES.get("token"))

    timestamp = round(time.time())
    post = Post.objects.create(
        content=content,
        creator=user,
        timestamp=timestamp,
        content_warning=c_warning or None,
        comments=[],
        quotes=[],
        private=data.private,
        quote=data.quote_id,
        quote_is_comment=data.quote_is_comment
    )

    post = Post.objects.get(
        timestamp=timestamp,
        creator=user.user_id,
        content=content
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

        for i in find_mentions(content, [user.username, quote_creator.username]):
            try:
                notif_for = User.objects.get(username=i.lower())
                if not notif_for.blocking.contains(user) and not user.blocking.contains(notif_for):
                    create_notification(notif_for, "ping_p", post.post_id)

            except User.DoesNotExist:
                ...
    except User.DoesNotExist:
        ...

    for i in find_hashtags(content):
        try:
            tag = Hashtag.objects.get(tag=i.lower())

        except Hashtag.DoesNotExist:
            tag = Hashtag.objects.create(
                tag=i
            )

        tag.posts.add(post)

    if user.username in POST_WEBHOOKS:
        post_hook(request, user, post)

    return {
        "success": True,
        "actions": [
            { "name": "prepend_timeline", "post": get_post_json(post, user), "comment": False },
            { "name": "update_element", "query": f".post-container[data-{'comment' if data.quote_is_comment else 'post'}-id='{data.quote_id}'] .quote-inputs", "html": "" },
            { "name": "update_element", "query": f".post-container[data-{'comment' if data.quote_is_comment else 'post'}-id='{data.quote_id}'] .quote-number", "inc": 1 }
        ]
    }

def hashtag_list(request, hashtag: str, sort: str, offset: int=0) -> APIResponse:
    # Returns a list of posts with a specific hashtag

    if sort not in ["random", "recent", "liked"]:
        return 400, {
            "success": False
        }

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        ...

    try:
        tag = Hashtag.objects.get(tag=hashtag)
    except Hashtag.DoesNotExist:
        return {
            "success": True,
            "actions": [
                { "name": "populate_timeline", "end": True, "posts": [] }
            ]
        }

    if sort == "liked":
        posts = tag.posts.all().annotate(like_count=Count('likes')).order_by('-like_count')
    else:
        posts = tag.posts.all().order_by("?" if sort == "random" else "-post_id")

    posts = posts[POSTS_PER_REQUEST * offset:]
    post_list = []

    offset = 0
    for post in posts:
        x = get_post_json(post, user)

        if "can_view" in x and x["can_view"]:
            post_list.append(x)
        else:
            offset += 1

        if len(post_list) + offset >= POSTS_PER_REQUEST:
            break

    return {
        "success": True,
        "actions": [
            { "name": "populate_timeline", "end": sort == "random" or posts.count() <= POSTS_PER_REQUEST, "posts": post_list }
        ]
    }

def post_list_following(request, offset: int=-1) -> APIResponse:
    offset = sys.maxsize if offset == -1 else offset

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    user_posts = user.posts.filter(post_id__lt=offset)

    followed_users_posts = []
    for followed_user in user.following.all():
        followed_user_posts = followed_user.posts.filter(post_id__lt=offset)
        followed_users_posts.append(followed_user_posts)

    combined_posts = sorted(list(chain(user_posts, *followed_users_posts)), key=lambda p: p.post_id, reverse=True)

    offset = 0
    outputList = []

    for post in combined_posts:
        try:
            post_json = get_post_json(post, user)
        except Post.DoesNotExist:
            offset += 1
            continue
        else:
            if post_json["can_view"]:
                outputList.append(post_json)
            else:
                offset += 1
                continue

        if len(outputList) >= POSTS_PER_REQUEST:
            break

    return {
        "success": True,
        "actions": [
            { "name": "populate_timeline", "posts": outputList, "end": len(combined_posts) - offset <= POSTS_PER_REQUEST }
        ]
    }

def post_list_recent(request, offset: int=-1) -> APIResponse:
    # Called when the recent posts tab is refreshed.

    if offset == -1:
        try:
            next_id = Post.objects.latest('post_id').post_id
        except Post.DoesNotExist: # No posts exist
            return {
                "success": True,
                "actions": [
                    { "name": "populate_timeline", "posts": [], "end": True }
                ]
            }
    else:
        next_id = offset - 1

    end = next_id <= POSTS_PER_REQUEST
    user = User.objects.get(token=request.COOKIES.get("token"))

    outputList = []
    offset = 0
    i = next_id

    while i > next_id - POSTS_PER_REQUEST - offset and i > 0:
        try:
            current_post = Post.objects.get(pk=i)
        except Post.DoesNotExist:
            offset += 1
            i -= 1
            continue

        if not can_view_post(user, None, current_post)[0]:
            offset += 1

        else:
            outputList.append(get_post_json(current_post, user))

        i -= 1

    return {
        "success": True,
        "actions": [
            {  "name": "populate_timeline", "posts": outputList, "end": end }
        ]
    }

def post_list_user(request, username: str, offset: int=-1) -> APIResponse:
    # Called when getting posts from a specific user.

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

        lang = DEFAULT_LANG
        logged_in = False

    if not validate_username(username):
        return 404, {
            "success": False,
            "message" : lang["post"]["invalid_username"]
        }

    offset = sys.maxsize if offset == -1 or not isinstance(offset, int) else offset
    user = User.objects.get(username=username)

    if logged_in and user.blocking.contains(self_user):
        return 400, {
            "success": False,
            "message": lang["messages"]["blocked"]
        }

    potential = user.posts.filter(post_id__lt=offset).order_by("-post_id")

    outputList = []
    c = 0
    for i in potential:
        c += 1
        x = get_post_json(i, self_user if logged_in else 0)

        if "private_acc" not in x or not x["private_acc"]:
            outputList.append(x)

        if len(outputList) >= POSTS_PER_REQUEST:
            break

    pinned_post = None
    if ENABLE_PINNED_POSTS:
        if user.pinned:
            pinned_post = get_post_json(user.pinned, self_user if logged_in else 0, False)

    return {
        "success": True,
        "actions": [
            {
                "name": "populate_timeline",
                "posts": outputList,
                "end": len(potential) <= c,
                "extra": {
                    "type": "user",
                    "pinned": pinned_post,
                    "bio": user.bio or "",
                    "following": user.following.count(),
                    "followers": user.followers.count()
                }
            }
        ]
    }

def post_like_add(request, data: PostID) -> APIResponse:
    # Called when someone likes a post.

    user = User.objects.get(token=request.COOKIES.get("token"))
    post = Post.objects.get(post_id=data.id)

    can_view = can_view_post(user, post.creator, post)
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
            { "name": "update_element", "query": f"div[data-post-id='{data.id}'] button.like", "attribute": [{ "name": "data-liked", "value": "true" }] },
            { "name": "update_element", "query": f"div[data-post-id='{data.id}'] span.like-number", "inc": 1 }
        ]
    }

def post_like_remove(request, data: PostID) -> APIResponse:
    # Called when someone unlikes a post.

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
    # Called when someone deletes a post.

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
    # Called when someone pins a post.

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
    # Called when someone unpins a post.

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

def poll_vote(request, data: Poll) -> APIResponse:
    post = Post.objects.get(post_id=data.id)
    poll = post.poll

    if isinstance(poll, dict):
        if (poll["choices"] < data.option or data.option <= 0):
            return 400, {
                "success": False
            }

        user = User.objects.get(token=request.COOKIES.get("token"))

        can_view = can_view_post(user, post.creator, post)
        if can_view[0] is False and can_view[1] in ["private", "blocked"]:
            return 400, {
                "success": False
            }

        if user.user_id not in poll["votes"]:
            poll["votes"].append(user.user_id)
            poll["content"][data.option - 1]["votes"].append(user.user_id)

            post.poll = poll
            post.save()

        return {
            "success": True,
            "actions": [
                { "name": "refresh_poll", "poll": get_poll(post, user.user_id), "post_id": post.post_id }
            ]
        }

    return 400, {
        "success": False
    }

def poll_refresh(request, id: int) -> APIResponse:
    post = Post.objects.get(post_id=id)

    if post.poll:
        user = User.objects.get(token=request.COOKIES.get("token"))

        can_view = can_view_post(user, post.creator, post)
        if can_view[0] is False and can_view[1] in ["private", "blocked"]:
            return 400, {
                "success": False
            }

        return {
            "success": True,
            "actions": [
                { "name": "refresh_poll", "poll": get_poll(post, user.user_id), "post_id": post.post_id }
            ]
        }

    return 400, {
        "success": False
    }

def post_edit(request, data: EditPost) -> APIResponse:
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
        c_warning = trim_whitespace(data.c_warning, True) if ENABLE_CONTENT_WARNINGS else ""

        if len(c_warning) > MAX_CONTENT_WARNING_LENGTH or len(content) > MAX_POST_LENGTH or len(content) < (0 if post.poll else 1):
            lang = get_lang(user)
            return 400, {
                "success": False,
                "message": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH))
            }

        if check_muted_words(
            content,
            c_warning
        ):
            lang = get_lang(user)
            return 400, {
                "success": False,
                "message": lang["post"]["muted"]
            }

        post.edited = True
        post.edited_at = round(time.time())
        post.content = content
        post.content_warning = c_warning
        post.private = data.private

        post.save()

        for tag in post.hashtags.all():
            if tag.posts.count() == 1:
                tag.delete()
            else:
                tag.posts.remove(post)

        hashtags = find_hashtags(content)

        for tag in hashtags:
            try:
                tag_obj = Hashtag.objects.get(tag=tag)
            except Hashtag.DoesNotExist:
                tag_obj = Hashtag.objects.create(tag=tag)

            tag_obj.posts.add(post)

        return {
            "success": True,
            "actions": [
                { "name": "reset_post_html", "post_id": data.id, "comment": False, "post": get_post_json(post, user, False) }
            ]
        }

    return 400, {
        "success": False
    }
