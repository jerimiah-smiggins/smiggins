import time

from django.db.utils import IntegrityError
from django.http import HttpRequest, HttpResponse
from posts.models import (Hashtag, M2MHashtagPost, M2MLike, Notification, Poll,
                          PollChoice, PollVote, Post, User)

from ..helper import find_hashtags, find_mentions, trim_whitespace
from ..variables import (MAX_CONTENT_WARNING_LENGTH, MAX_POLL_OPTION_LENGTH,
                         MAX_POST_LENGTH)
from .format import (ErrorCodes, api_CreatePost, api_DeletePost, api_EditPost,
                     api_Like, api_Pin, api_PollRefresh, api_PollVote,
                     api_Unlike, api_Unpin)


def post_create(request: HttpRequest) -> HttpResponse:
    api = api_CreatePost(request)

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    data = api.parse_data()

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
        else:
            if quote.creator.verify_followers and not user.following.contains(quote.creator) \
            or quote.creator.blocking.contains(user):
                quote = None

    comment_parent = None
    if data["comment"]:
        try:
            comment_parent = Post.objects.get(post_id=data["comment"])
        except Post.DoesNotExist:
            ...
        else:
            if comment_parent.creator.verify_followers and not user.following.contains(comment_parent.creator) \
            or comment_parent.creator.blocking.contains(user):
                comment_parent = None

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

    if len(poll) >= 2:
        p = Poll.objects.create(target=post)
        choices: list[PollChoice] = []

        for choice in poll:
            choices.append(PollChoice(
                poll=p,
                content=choice
            ))

        PollChoice.objects.bulk_create(choices)

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

def post_edit(request: HttpRequest) -> HttpResponse:
    api = api_EditPost(request)

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    data = api.parse_data()

    try:
        post = Post.objects.get(post_id=data["post_id"])
    except Post.DoesNotExist:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    if user != post.creator:
        return api.error(ErrorCodes.BAD_REQUEST)

    post.content = data["content"]
    post.content_warning = data["cw"]
    post.private = data["private"]
    post.edited = True
    post.edited_at = round(time.time())
    post.save()

    return api.response()

def post_delete(request: HttpRequest) -> HttpResponse:
    api = api_DeletePost(request)

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    pid = api.parse_data()

    try:
        post = Post.objects.get(post_id=pid)
    except Post.DoesNotExist:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    if user.admin_level & 1 or user == post.creator:
        post.delete()
        return api.response(pid=pid)

    return api.error(ErrorCodes.CANT_INTERACT)

def add_like(request: HttpRequest, post_id: int) -> HttpResponse:
    api = api_Like(request)

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
        ...
    else:
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
                ...

    return api.response()

def remove_like(request: HttpRequest, post_id: int) -> HttpResponse:
    api = api_Unlike(request)

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        M2MLike.objects.get(user=user, post=post_id).delete()
    except M2MLike.DoesNotExist:
        ...

    return api.response()

def pin_post(request: HttpRequest, post_id: int) -> HttpResponse:
    api = api_Pin(request)

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    user.pinned = post
    user.save()

    return api.response()

def unpin_post(request: HttpRequest) -> HttpResponse:
    api = api_Unpin(request)

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    user.pinned = None
    user.save()

    return api.response()

def poll_vote(request: HttpRequest) -> HttpResponse:
    api = api_PollVote(request)

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    data = api.parse_data()

    try:
        post = Post.objects.get(post_id=data["post_id"])
    except Post.DoesNotExist:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    if not post.poll:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    try:
        obj = post.poll.choices.order_by("pk")[data["option"]]
    except IndexError:
        return api.error(ErrorCodes.BAD_REQUEST)

    try:
        PollVote.objects.create(
            poll=post.poll,
            choice=obj,
            user=user
        )
    except IntegrityError:
        ...

    return api.response(pid=post.post_id, poll=post.poll, user=user)

def poll_refresh(request: HttpRequest, post_id: int) -> HttpResponse:
    api = api_PollRefresh(request)

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    if not post.poll:
        return api.error(ErrorCodes.POST_NOT_FOUND)

    return api.response(pid=post.post_id, poll=post.poll, user=user)
