# For API functions that relate to posts, for example creating, fetching home lists, etc.

import threading
import requests
import random
import time
import sys

from ninja import Schema

from posts.models import User, Post, Comment, Hashtag, Notification

from ..variables import (
    API_TIMINGS,
    MAX_POST_LENGTH,
    POSTS_PER_REQUEST,
    OWNER_USER_ID,
    MAX_POLL_OPTIONS,
    MAX_POLL_OPTION_LENGTH,
    POST_WEBHOOKS,
    SITE_NAME,
    VERSION,
    ENABLE_PINNED_POSTS,
    ENABLE_POLLS,
    ENABLE_LOGGED_OUT_CONTENT,
    MAX_CONTENT_WARNING_LENGTH,
    ENABLE_CONTENT_WARNINGS
)

from ..helper import (
    ensure_ratelimit,
    create_api_ratelimit,
    validate_username,
    trim_whitespace,
    get_post_json,
    log_admin_action,
    create_notification,
    find_mentions,
    find_hashtags,
    get_lang,
    DEFAULT_LANG,
    delete_notification,
    can_view_post
)

class NewPost(Schema):
    c_warning: str
    content: str
    poll: list[str]
    private: bool

class NewQuote(Schema):
    c_warning: str
    content: str
    quote_id: int
    quote_is_comment: bool
    private: bool

class PostID(Schema):
    id: int

class Poll(Schema):
    id: int
    option: int

def post_hook(request, user: User, post: Post):
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

def post_create(request, data: NewPost) -> tuple | dict:
    # Called when a new post is created.

    token = request.COOKIES.get('token')
    user = User.objects.get(token=token)

    if not ENABLE_POLLS:
        data.poll = []

    if not ensure_ratelimit("api_post_create", token):
        lang = get_lang(user)
        return 429, {
            "success": False,
            "reason": lang["generic"]["ratelimit"]
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
                return 400, {
                    "success": False
                }

            poll.append(i)

    if len(poll) == 1:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["post"]["invalid_poll"]
        }

    content = trim_whitespace(data.content)
    c_warning = trim_whitespace(data.c_warning, True) if ENABLE_CONTENT_WARNINGS else ""

    if len(c_warning) > MAX_CONTENT_WARNING_LENGTH or len(content) > MAX_POST_LENGTH or len(content) < (0 if len(poll) else 1):
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH))
        }

    create_api_ratelimit("api_post_create", API_TIMINGS["create post"], token)

    timestamp = round(time.time())
    post = Post.objects.create(
        content = content,
        content_warning = c_warning or None,
        creator = user.user_id,
        timestamp = timestamp,
        likes = [],
        comments = [],
        quotes = [],
        private_post = data.private,
        poll = {
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

    user.posts.append(post.post_id)
    user.save()

    for i in find_mentions(content, [user.username]):
        try:
            notif_for = User.objects.get(username=i.lower())
            if user.user_id not in notif_for.blocking and notif_for.user_id not in user.blocking:
                create_notification(notif_for, "ping_p", post.post_id)

        except User.DoesNotExist:
            pass

    for i in find_hashtags(content):
        try:
            tag = Hashtag.objects.get(tag=i.lower())
        except Hashtag.DoesNotExist:
            tag = Hashtag(
                tag = i
            )

        tag.posts.append(post.post_id)
        tag.save()

    if user.username in POST_WEBHOOKS:
        post_hook(request, user, post)

    return 201, {
        "success": True,
        "post_id": post.post_id
    }

def quote_create(request, data: NewQuote) -> tuple | dict:
    # Called when a post is quoted.

    user = User.objects.get(token=request.COOKIES.get('token'))

    if not ensure_ratelimit("api_post_create", request.COOKIES.get('token')):
        lang = get_lang(user)
        return 429, {
            "success": False,
            "reason": "Ratelimited"
        }

    try:
        quoted_post = (Comment if data.quote_is_comment else Post).objects.get(pk=data.quote_id)

    except Post.DoesNotExist:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["post"]["invalid_quote_post"]
        }
    except Comment.DoesNotExist:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["post"]["invalid_quote_comment"]
        }

    post_owner = User.objects.get(user_id=quoted_post.creator)

    can_view = can_view_post(user, post_owner, quoted_post)

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
            "reason": lang["post"]["invalid_length"].replace("%s", str(MAX_POST_LENGTH))
        }

    create_api_ratelimit("api_post_create", API_TIMINGS["create post"], request.COOKIES.get("token"))

    timestamp = round(time.time())
    post = Post.objects.create(
        content = content,
        creator = user.user_id,
        timestamp = timestamp,
        content_warning = c_warning or None,
        likes = [],
        comments = [],
        quotes = [],
        private_post = data.private,
        quote = data.quote_id,
        quote_is_comment = data.quote_is_comment
    )

    post = Post.objects.get(
        timestamp=timestamp,
        creator=user.user_id,
        content=content
    )

    quoted_post.quotes.append(post.post_id)
    quoted_post.save()

    user.posts.append(post.post_id)
    user.save()

    try:
        quote_creator = User.objects.get(user_id=quoted_post.creator)
        if quoted_post.creator != user.user_id and quote_creator.user_id not in user.blocking and user.user_id not in quote_creator.blocking:
            create_notification(
                quote_creator,
                "quote",
                post.post_id
            )

        for i in find_mentions(content, [user.username, quote_creator.username]):
            try:
                notif_for = User.objects.get(username=i.lower())
                if user.user_id not in notif_for.blocking and notif_for.user_id not in user.blocking:
                    create_notification(notif_for, "ping_p", post.post_id)

            except User.DoesNotExist:
                ...
    except User.DoesNotExist:
        ...

    for i in find_hashtags(content):
        try:
            tag = Hashtag.objects.get(tag=i.lower())

        except Hashtag.DoesNotExist:
            tag = Hashtag(
                tag=i
            )

        tag.posts.append(post.post_id)
        tag.save()

    if user.username in POST_WEBHOOKS:
        post_hook(request, user, post)

    return 201, {
        "post": get_post_json(post.post_id, user.user_id, cache={
            user.user_id: user
        }),
        "success": True
    }

def hashtag_list(request, hashtag: str) -> tuple | dict:
    # Returns a list of hashtags. `offset` is a filler variable.

    token = request.COOKIES.get("token")

    try:
        user = User.objects.get(token=token)
        user_id = user.user_id
        cache = { user_id: user }
    except User.DoesNotExist:
        user_id = 0
        cache = {}

    try:
        tag = Hashtag.objects.get(tag=hashtag)
        posts = tag.posts
        p2 = [i for i in posts]
        random.shuffle(posts)
    except Hashtag.DoesNotExist:
        return 400, {
            "success": False
        }

    removed = False
    post_list = []
    for i in posts:
        x = get_post_json(i, user_id, cache=cache)

        if x["can_view"]:
            post_list.append(x)

            if len(post_list) >= POSTS_PER_REQUEST:
                break
        else:
            p2.remove(i)
            removed = True

    if removed:
        tag.posts = p2
        tag.save()

    return {
        "success": True,
        "end": True,
        "posts": post_list
    }

def post_list_following(request, offset: int=-1) -> tuple | dict:
    # Called when the following tab is refreshed.

    token = request.COOKIES.get('token')
    offset = sys.maxsize if offset == -1 else offset

    try:
        user = User.objects.get(token=token)
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    potential = []
    for i in user.following:
        potential += User.objects.get(pk=i).posts
    potential = sorted(potential, reverse=True)

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i
            break

    potential = potential[index::]
    offset = 0
    outputList = []

    for i in potential:
        try:
            post_json = get_post_json(i, user.user_id)
            if post_json["can_view"]:
                outputList.append(post_json)
            else:
                offset += 1
                continue
        except Post.DoesNotExist:
            offset += 1
            continue

        if len(outputList) >= POSTS_PER_REQUEST:
            break

    return {
        "posts": outputList,
        "end": len(potential) - offset <= POSTS_PER_REQUEST
    }

def post_list_recent(request, offset: int=-1) -> tuple | dict:
    # Called when the recent posts tab is refreshed.

    token = request.COOKIES.get('token')

    if offset == -1:
        try:
            next_id = Post.objects.latest('post_id').post_id
        except Post.DoesNotExist:
            return {
                "posts": [],
                "end": True
            }
    else:
        next_id = offset - 1

    end = next_id <= POSTS_PER_REQUEST
    user = User.objects.get(token=token)

    outputList = []
    offset = 0
    i = next_id
    cache = {}

    while i > next_id - POSTS_PER_REQUEST - offset and i > 0:
        try:
            current_post = Post.objects.get(pk=i)
        except Post.DoesNotExist:
            offset += 1
            i -= 1
            continue

        if not can_view_post(user, None, current_post, cache)[0]:
            offset += 1

        else:
            outputList.append(get_post_json(i, user.user_id, cache=cache))

        i -= 1

    return {
        "posts": outputList,
        "end": end
    }

def post_list_user(request, username: str, offset: int=-1) -> tuple | dict:
    # Called when getting posts from a specific user.

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
            "reason" : lang["post"]["invalid_username"]
        }

    offset = sys.maxsize if offset == -1 or not isinstance(offset, int) else offset
    user = User.objects.get(username=username)

    if self_user.user_id in user.blocking:
        return 400, {
            "success": False,
            "reason": lang["messages"]["blocked"]
        }

    potential = user.posts[::-1]

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i
            break

    potential = potential[index::]
    cache = {
        user.user_id: user
    }

    if logged_in:
        cache[self_user.user_id] = self_user

    outputList = []
    c = 0
    for i in potential:
        c += 1
        try:
            x = get_post_json(i, self_user.user_id if logged_in else 0, cache=cache)

            if "private_acc" not in x or not x["private_acc"]:
                outputList.append(x)

            if len(outputList) >= POSTS_PER_REQUEST:
                break

        except Post.DoesNotExist:
            user.posts.remove(i)
            user.save()


    if ENABLE_PINNED_POSTS:
        try:
            pinned_post = get_post_json(user.pinned, self_user.user_id if logged_in else 0, False, cache)
        except Post.DoesNotExist:
            pinned_post = {}
    else:
        pinned_post = {}

    return {
        "success": True,
        "posts": outputList,
        "end": len(potential) <= c,
        "can_view": True,
        "following": len(user.following) - 1,
        "followers": len(user.followers),
        "bio": user.bio or "",
        "self": False if not logged_in else self_user.username == username,
        "pinned": pinned_post
    }

def post_like_add(request, data: PostID) -> tuple | dict:
    # Called when someone likes a post.

    token = request.COOKIES.get('token')
    id = data.id

    try:
        if id > Post.objects.latest('post_id').post_id:
            return 404, {
                "success": False
            }

    except ValueError:
        return 404, {
            "success": False
        }

    user = User.objects.get(token=token)
    post = Post.objects.get(post_id=id)
    post_owner = User.objects.get(user_id=post.creator)

    can_view = can_view_post(user, post_owner, post)

    if can_view[0] is False and can_view[1] in ["private", "blocked"]:
        return 400, {
            "success": False
        }

    if user.user_id not in post.likes:
        user.likes.append([id, False])
        post.likes.append(user.user_id)

        user.save()
        post.save()

    return {
        "success": True
    }

def post_like_remove(request, data: PostID) -> tuple | dict:
    # Called when someone unlikes a post.

    token = request.COOKIES.get('token')
    id = data.id

    try:
        if id > Post.objects.latest('post_id').post_id:
            return 404, {
                "success": False
            }
    except ValueError:
        return 404, {
            "success": False
        }

    user = User.objects.get(token=token)
    post = Post.objects.get(post_id=id)

    if user.user_id in post.likes:
        try:
            user.likes.remove([id, False])
            user.save()
        except ValueError:
            pass

        post.likes.remove(user.user_id)
        post.save()

    return {
        "success": True
    }

def post_delete(request, data: PostID) -> tuple | dict:
    # Called when someone deletes a post.

    token = request.COOKIES.get('token')
    id = data.id

    try:
        post = Post.objects.get(post_id=id)
        user = User.objects.get(token=token)
    except Post.DoesNotExist:
        return 404, {
            "success": False
        }
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    admin = user.user_id == OWNER_USER_ID or user.admin_level >= 1
    creator = post.creator == user.user_id

    if admin and not creator:
        log_admin_action("Delete post", user, f"Deleted post {id} (content: {post.content})")

    if creator or admin:
        creator = User.objects.get(user_id=post.creator)
        creator.posts.remove(id)
        creator.save()

        for tag in find_hashtags(post.content):
            try:
                tag_object = Hashtag.objects.get(tag=tag)
                tag_object.posts.remove(id)
                tag_object.save()

            except Hashtag.DoesNotExist:
                pass
            except ValueError:
                pass

        if post.quote:
            try:
                quoted_post = (Comment if post.quote_is_comment else Post).objects.get(pk=post.quote)
                quoted_post.quotes.remove(id)
                quoted_post.save()

            except Post.DoesNotExist:
                pass
            except Comment.DoesNotExist:
                pass

        try:
            for notif in Notification.objects.filter(
                event_id=post.post_id,
                event_type="ping_p"
            ):
                delete_notification(notif)

        except Notification.DoesNotExist:
            ...

        try:
            delete_notification(
                Notification.objects.get(
                    event_id=post.post_id,
                    event_type="quote"
                )
            )

        except Notification.DoesNotExist:
            ...

        post.delete()

        return {
            "success": True
        }

    return 400, {
        "success": False
    }

def pin_post(request, data: PostID) -> tuple | dict:
    # Called when someone pins a post.

    token = request.COOKIES.get('token')
    id = data.id

    try:
        post = Post.objects.get(post_id=id)
        user = User.objects.get(token=token)
    except Post.DoesNotExist:
        return 404, {
            "success": False
        }
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if post.creator == user.user_id:
        user.pinned = post.post_id
        user.save()

        return {
            "success": True
        }

    return 400, {
        "success": False
    }

def unpin_post(request) -> tuple | dict:
    # Called when someone unpins a post.

    token = request.COOKIES.get('token')

    try:
        user = User.objects.get(token=token)
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    user.pinned = 0
    user.save()

    return {
        "success": True
    }

def poll_vote(request, data: Poll):
    post = Post.objects.get(post_id=data.id)
    poll = post.poll

    if isinstance(poll, dict):
        if (poll["choices"] < data.option or data.option <= 0):
            return 400, {
                "success": False
            }

        user = User.objects.get(token=request.COOKIES.get('token'))
        creator = User.objects.get(user_id=post.creator)

        can_view = can_view_post(user, creator, post)
        if can_view[0] is False and can_view[1] in ["private", "blocked"]:
            return 400, {
                "success": False
            }

        user_id = user.user_id

        if user_id in poll["votes"]:
            return 400, {
                "success": False
            }

        poll["votes"].append(user_id)
        poll["content"][data.option - 1]["votes"].append(user_id)

        post.poll = poll
        post.save()

        return 200, {
            "success": True
        }

    return 400, {
        "success": False
    }
#.private_