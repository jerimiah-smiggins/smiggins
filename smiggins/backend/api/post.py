import time

from django.db.utils import IntegrityError
from django.http import HttpRequest, HttpResponse
from posts.models import (Hashtag, M2MHashtagPost, M2MLike, Notification, Post,
                          User)

from ..helper import find_hashtags, find_mentions, trim_whitespace
from ..variables import (MAX_CONTENT_WARNING_LENGTH, MAX_POLL_OPTION_LENGTH,
                         MAX_POST_LENGTH)
from .format import ErrorCodes, api_CreatePost, api_Like, api_Unlike


def post_create(request: HttpRequest) -> HttpResponse:
    api = api_CreatePost()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    data = api.parse_request(request.body)

    poll: list[str] = []
    if data["poll"]:
        for i in data["poll"]:
            if (i := trim_whitespace(i, True))[0]:
                if not isinstance(i[0], str) or len(i[0]) > MAX_POLL_OPTION_LENGTH:
                    return api.error(ErrorCodes.BAD_REQUEST)

                poll.append(i[0])

    if len(poll) == 1:
        return api.error(ErrorCodes.POLL_SINGLE_OPTION)

    content = trim_whitespace(data["content"])
    cw = trim_whitespace(data["cw"] or "", True)

    if len(cw[0]) > MAX_CONTENT_WARNING_LENGTH or len(content[0]) > MAX_POST_LENGTH or not (content[1] or len(poll)):
        return api.error(ErrorCodes.BAD_REQUEST)

    ts = round(time.time())

    quote = None
    if data["quote"]:
        try:
            quote = Post.objects.get(post_id=data["quote"])
        except Post.DoesNotExist:
            ...

    comment_parent = None
    if data["comment"]:
        try:
            comment_parent = Post.objects.get(post_id=data["comment"])
        except Post.DoesNotExist:
            ...

    Post.objects.create(
        content=content[0],
        content_warning=cw[0] or None,
        creator=user,
        timestamp=ts,
        private=data["private"],
        quoted_post=quote,
        comment_parent=comment_parent
    )

    post = Post.objects.get(
        content=content[0],
        content_warning=cw[0] or None,
        creator=user,
        timestamp=ts,
        private=data["private"]
    )

    # TODO: add poll

    pending_notification_objects = []

    if comment_parent and comment_parent.creator.username != user.username:
        pending_notification_objects.append(Notification(
            is_for=comment_parent.creator,
            post=post,
            event_type="comment",
            timestamp=ts
        ))

    if quote and quote.creator.username != user.username:
        pending_notification_objects.append(Notification(
            is_for=quote.creator,
            post=post,
            event_type="quote",
            timestamp=ts
        ))

    mentions = find_mentions(content[0], [user.username, comment_parent.creator.username if comment_parent else "!", quote.creator.username if quote else "!"])
    if mentions:
        users: dict[str, User] = User.objects.in_bulk(mentions, field_name="username")

        for notified_user in users.values():
            pending_notification_objects.append(Notification(
                is_for=notified_user,
                post=post,
                event_type="ping",
                timestamp=ts
            ))

    if pending_notification_objects:
        Notification.objects.bulk_create(pending_notification_objects, ignore_conflicts=True) # gives AssertionError without ignore_conficts for no reason

    pending_hashtag_objects = []
    for tag in find_hashtags(content[0]):
        try:
            hashtag = Hashtag.objects.get(tag=tag)
        except Hashtag.DoesNotExist:
            hashtag = Hashtag.objects.create(tag=tag)

        pending_hashtag_objects.append(M2MHashtagPost(
            post=post,
            hashtag=hashtag
        ))

    if pending_hashtag_objects:
        M2MHashtagPost.objects.bulk_create(pending_hashtag_objects, ignore_conflicts=True)

    # TODO:? respect MAX_NOTIFS variable

    return api.response(post=post, user=user)

def add_like(request, post_id: int) -> HttpResponse:
    api = api_Like()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    creator = post.creator

    if creator.blocking.contains(user) \
    or creator.blockers.contains(user) \
    or (post.private and creator.username != user.username and not creator.followers.contains(user)):
        return api.error(ErrorCodes.CANT_INTERACT)

    try:
        post.likes.add(user)
    except IntegrityError:
        print("like already exists")

    if post.creator != user:
        try:
            Notification.objects.create(
                timestamp=round(time.time()),
                event_type="like",
                linked_like=M2MLike.objects.get(user=user, post=post),
                post=post,
                is_for=post.creator
            )
        except M2MLike.DoesNotExist:
            print("couldn't make like notif object")

    return api.response()

def remove_like(request, post_id: int) -> HttpResponse:
    api = api_Unlike()

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        M2MLike.objects.get(user=user, post=post_id).delete()
    except M2MLike.DoesNotExist:
        ...

    return api.response()
