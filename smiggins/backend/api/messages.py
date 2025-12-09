import time

from django.http import HttpResponse
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest
from posts.models import M2MMessageMember, Message, MessageGroup, User

from ..helper import trim_whitespace
from .format import (ErrorCodes, api_MessageGetGroupID,
                     api_MessageGroupTimeline, api_MessageSend,
                     api_MessageTimeline)
from .timeline import get_timeline

MAX_USERS_IN_MSG_GROUP = 100

def get_group(id: int | User, *users: User) -> MessageGroup:
    if isinstance(id, int):
        return MessageGroup.objects.get(id=id)

    gid = MessageGroup.get_id(id, *users)
    group, created = MessageGroup.objects.get_or_create(group_id=gid, defaults={ "timestamp": 0 })

    if created:
        group = MessageGroup.objects.get(group_id=gid)

        pending_members = []
        for user in (id, *users):
            pending_members.append(M2MMessageMember(
                user=user,
                group=group,
                unread=False
            ))

        M2MMessageMember.objects.bulk_create(pending_members)

    return group

def tl_message_groups(request: HttpRequest, offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_MessageGroupTimeline(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    end, groups = get_timeline(
        MessageGroup.objects.filter(members=request.s_user),
        offset,
        request.s_user,
        forwards,
        no_visibility_check=True,
        order_by=["-timestamp"]
    )

    api.set_response(end, forwards, groups, request.s_user)
    return api.get_response()

def tl_messages(request: HttpRequest, gid: int, offset: int | None=None, forwards: bool=False) -> HttpResponse:
    api = api_MessageTimeline(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        group = get_group(gid)
    except MessageGroup.DoesNotExist:
        return api.error(ErrorCodes.BAD_REQUEST)

    if not group.members.contains(request.s_user):
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    end, messages = get_timeline(
        group.messages.only(
            "content",
            "timestamp",
            "user__username",
            "user__display_name"
        ),
        offset,
        request.s_user,
        forwards,
        no_visibility_check=True,
        order_by=["-timestamp"]
    )

    api.set_response(end, forwards, messages, request.s_user)
    return api.get_response()

def send_message(request: HttpRequest, gid: int) -> HttpResponse:
    api = api_MessageSend(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    try:
        group = get_group(gid)
    except MessageGroup.DoesNotExist:
        return api.error(ErrorCodes.BAD_REQUEST)

    ts = round(time.time())
    content = trim_whitespace(api.parse_data(), True)

    Message.objects.create(
        content=content,
        group=group,
        user=request.s_user,
        timestamp=ts
    )

    group.members.exclude(user_id=request.s_user.user_id).update(unread=True)

    return api.response(
        content=content,
        timestamp=ts,
        user=request.s_user
    )

def get_gid(request: HttpRequest, usernames: str) -> HttpResponse:
    api = api_MessageGetGroupID(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    username_list = [i.lower() for i in set(usernames.split(",") + [request.s_user.username])]
    print(username_list)

    if len(username_list) <= 1 or len(username_list) > MAX_USERS_IN_MSG_GROUP:
        return api.error(ErrorCodes.BAD_REQUEST)

    users = User.objects.filter(username__in=username_list)

    if len(username_list) != users.count():
        return api.error(ErrorCodes.BAD_USERNAME)

    group = get_group(*users)

    return api.response(gid=group.id)
