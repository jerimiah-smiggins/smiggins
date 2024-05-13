# For API functions that relate to posts, for example creating, fetching home lists, etc.

from ._settings import API_TIMINGS, MAX_POST_LENGTH, POSTS_PER_REQUEST, OWNER_USER_ID
from .packages  import User, Post, Comment, Hashtag, time, sys, Schema, random
from .helper    import ensure_ratelimit, create_api_ratelimit, trim_whitespace, get_post_json, validate_username, validate_token, log_admin_action, create_notification, find_mentions, find_hashtags

class NewPost(Schema):
    content: str

class NewQuote(NewPost):
    quote_id: int
    quote_is_comment: bool

class PostID(Schema):
    id: int

def post_create(request, data: NewPost) -> tuple | dict:
    # Called when a new post is created.

    token = request.COOKIES.get('token')

    if not ensure_ratelimit("api_post_create", token):
        return 429, {
            "success": False,
            "reason": "Ratelimited"
        }

    content = trim_whitespace(data.content)

    if len(content) > MAX_POST_LENGTH or len(content) < 1:
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        return 400, {
            "success": False,
            "reason": f"Invalid post length. Must be between 1 and {MAX_POST_LENGTH} characters."
        }

    create_api_ratelimit("api_post_create", API_TIMINGS["create post"], token)

    timestamp = round(time.time())
    user = User.objects.get(token=token)
    post = Post.objects.create(
        content = content,
        creator = user.user_id,
        timestamp = timestamp,
        likes = [],
        comments = [],
        quotes = []
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
            if user.user_id not in notif_for.blocking:
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

    return 201, {
        "success": True,
        "post_id": post.post_id
    }

def quote_create(request, data: NewQuote) -> tuple | dict:
    # Called when a post is quoted.

    token = request.COOKIES.get('token')

    if not ensure_ratelimit("api_post_create", token):
        return 429, {
            "success": False,
            "reason": "Ratelimited"
        }

    try:
        quoted_post = (Comment if data.quote_is_comment else Post).objects.get(pk=data.quote_id)

    except Post.DoesNotExist:
        return 400, {
            "success": False,
            "reason": "The post you're quoting doesn't exist!"
        }
    except Comment.DoesNotExist:
        return 400, {
            "success": False,
            "reason": "The comment you're quoting doesn't exist!"
        }

    content = trim_whitespace(data.content)

    if len(content) > MAX_POST_LENGTH or len(content) < 1:
        create_api_ratelimit("api_post_create", API_TIMINGS["create post failure"], token)
        return 400, {
            "success": False,
            "reason": f"Invalid post length. Must be between 1 and {MAX_POST_LENGTH} characters."
        }

    create_api_ratelimit("api_post_create", API_TIMINGS["create post"], token)

    timestamp = round(time.time())
    user = User.objects.get(token=token)
    post = Post.objects.create(
        content = content,
        creator = user.user_id,
        timestamp = timestamp,
        likes = [],
        comments = [],
        quotes = [],
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
        if quoted_post.creator != user.user_id and user.user_id not in User.objects.get(pk=quoted_post.creator).blocking:
            create_notification(
                User.objects.get(user_id=quoted_post.creator),
                "quote",
                post.post_id
            )
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

    return 201, {
        "success": True,
        "post_id": post.post_id
    }

def hashtag_list(request, hashtag, offset: int=-1) -> tuple | dict:
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
            "success": False,
            "reason": "Hashtag not found"
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
            "success": False,
            "reason": "Invalid token"
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
    cache = {}

    for i in potential:
        try:
            current_post = Post.objects.get(pk=i)
        except Post.DoesNotExist:
            offset += 1
            continue

        current_user = User.objects.get(pk=current_post.creator)

        if current_user.private and user.user_id not in current_user.following:
            offset += 1

        else:
            outputList.append(get_post_json(i, user.user_id, cache=cache))

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
        next_id = offset - 10

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

        current_user = User.objects.get(pk=current_post.creator)
        if current_user.user_id in user.blocking or (current_user.private and user.user_id not in current_user.following):
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

    if not validate_username(username):
        return 404, {
            "reason" : "Username is insvalagaeg... LOOK JUST SHUT UP"
        }

    token = request.COOKIES.get('token') if 'token' in request.COOKIES and validate_token(request.COOKIES.get('token')) else 0
    offset = sys.maxsize if offset == -1 or not isinstance(offset, int) else offset

    user = User.objects.get(username=username)
    try:
        self_user = User.objects.get(token=token)
        logged_in = True
    except User.DoesNotExist:
        logged_in = False

    if user.private and (not logged_in or self_user.user_id not in user.following):
        return {
            "posts": [],
            "end": True,
            "private": True,
            "can_view": False,
            "following": len(user.following) - 1,
            "followers": len(user.followers),
            "bio": user.bio or "",
            "self": False
        }

    potential = user.posts[::-1]

    index = 0
    for i in range(len(potential)):
        if potential[i] < offset:
            index = i
            break

    potential = potential[index::]
    end = len(potential) <= POSTS_PER_REQUEST
    potential = potential[:POSTS_PER_REQUEST:]
    cache = {
        user.user_id: user
    }

    if logged_in:
        cache[self_user.user_id] = self_user

    outputList = []
    for i in potential:
        outputList.append(get_post_json(i, self_user.user_id if logged_in else 0, cache=cache))

    try:
        pinned_post = get_post_json(user.pinned, self_user.user_id if logged_in else 0, False, cache)
    except Post.DoesNotExist:
        pinned_post = {}

    return {
        "posts": outputList,
        "end": end,
        "private": user.private,
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

        if post.quote:
            try:
                quoted_post = (Comment if post.quote_is_comment else Post).objects.get(pk=post.quote)
                quoted_post.quotes.remove(id)
                quoted_post.save()

            except Post.DoesNotExist:
                pass
            except Comment.DoesNotExist:
                pass

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
