# For API functions that relate to messages for example sending, deleting, etc.

import time
from sys import maxsize

from posts.models import PrivateMessage, PrivateMessageContainer, User

from ..helper import (check_muted_words, check_ratelimit, get_container_id,
                      trim_whitespace)
from ..lang import get_lang
from ..variables import MAX_POST_LENGTH, MESSAGES_PER_REQUEST
from .schema import APIResponse, NewContainer, NewMessage


def container_create(request, data: NewContainer) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/messages/new"):
        return rl

    self_user = User.objects.get(token=request.COOKIES.get("token"))
    username = data.username.strip().lower()

    if self_user.username == username:
        lang = get_lang(self_user)
        return 400, {
            "success": False,
            "message": lang["messages"]["yourself"]
        }

    user = User.objects.get(username=username)
    container_id = get_container_id(username, self_user.username)

    if self_user.blocking.contains(user):
        lang = get_lang(self_user)
        return 400, {
            "success": False,
            "message": lang["messages"]["blocking"]
        }
    elif user.blocking.contains(self_user):
        lang = get_lang(self_user)
        return 400, {
            "success": False,
            "message": lang["messages"]["blocked"]
        }

    try:
        PrivateMessageContainer.objects.get(container_id=container_id)
    except PrivateMessageContainer.DoesNotExist:
        PrivateMessageContainer.objects.create(
            container_id = container_id,
            user_one = self_user if user.username > self_user.username else user,
            user_two = user if user.username > self_user.username else self_user
        )

        user.messages.append(container_id)
        self_user.messages.append(container_id)

        user.save()
        self_user.save()

    return {
        "success": True,
        "actions": [
            { "name": "redirect", "to": "message", "extra": username }
        ]
    }

def send_message(request, data: NewMessage) -> APIResponse:
    if rl := check_ratelimit(request, "POST /api/messages"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if user.username == data.username:
        return 400, {
            "success": False
        }

    container_id = get_container_id(user.username, data.username)

    try:
        container = PrivateMessageContainer.objects.get(container_id=container_id)
    except PrivateMessageContainer.DoesNotExist:
        return 404, {
            "success": False
        }

    if container.user_two.blocking.contains(container.user_one) or container.user_one.blocking.contains(container.user_two):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["messages"]["blocking_blocked"]
        }

    content = trim_whitespace(data.content)
    if not content[1] or len(content[0]) > MAX_POST_LENGTH:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["messages"]["invalid_size"]
        }

    if check_muted_words(content[0]):
        lang = get_lang(user)
        return 400, {
            "success": False,
            "message": lang["messages"]["muted"]
        }

    timestamp = round(time.time())

    x = container.user_one.messages
    y = container.user_two.messages

    try:
        x.remove(container_id)
    except ValueError:
        pass

    try:
        y.remove(container_id)
    except ValueError:
        pass

    x.insert(0, container_id)
    y.insert(0, container_id)

    container.user_one.messages = x
    container.user_two.messages = y

    if data.username == container_id.split(":")[0]:
        container.unread_one = True
    else:
        container.unread_two = True

    container.user_one.save()
    container.user_two.save()
    container.save()

    PrivateMessage.objects.create(
        timestamp=timestamp,
        content=content[0],
        from_user_one=data.username == container_id.split(":")[1],
        message_container=container
    )

    return {
        "success": True,
        "actions": [
            { "name": "update_element", "query": "#your-mom", "value": "", "focus": True, "attribute": [{ "name": "disabled", "value": None }] },
            { "name": "refresh_timeline", "special": "message" },
        ]
    }

def messages_list(request, username: str, forward: bool=True, offset: int=-1) -> APIResponse: # TODO
    if rl := check_ratelimit(request, "GET /api/messages"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if user.username == username:
        return 400, {
            "success": False
        }

    container_id = get_container_id(username, user.username)
    container = PrivateMessageContainer.objects.get(container_id=container_id)
    is_user_one = username == container_id.split(":")[1]

    if is_user_one and container.unread_one:
        container.unread_one = False
        container.save()

    if not is_user_one and container.unread_two:
        container.unread_two = False
        container.save()

    if forward:
        list_of_messages = container.messages.filter(message_id__lt=maxsize if offset == -1 else offset).order_by("-message_id")
    else:
        list_of_messages = container.messages.filter(message_id__gt=offset).order_by("-message_id")

    more = list_of_messages.count() > MESSAGES_PER_REQUEST
    list_of_messages = list_of_messages[:MESSAGES_PER_REQUEST]

    messages = []
    for message in list_of_messages:
        messages.append({
            "timestamp": message.timestamp,
            "content": message.content,
            "from_self": is_user_one == message.from_user_one,
            "id": message.message_id
        })

    actions = []

    if len(messages):
        actions.append({ "name": "message_list", "messages": messages, "more": more, "forward": forward })

    if offset == -1:
        actions.append({ "name": "refresh_notifications" })

    return {
        "success": True,
        "actions": actions
    }

def recent_messages(request, offset: int=-1) -> APIResponse: # TODO??
    if rl := check_ratelimit(request, "GET /api/messages/list"):
        return rl

    user = User.objects.get(token=request.COOKIES.get("token"))

    if offset == -1:
        offset = 0

    messages = user.messages[offset * MESSAGES_PER_REQUEST : (offset + 1) * MESSAGES_PER_REQUEST :]
    message_json = []
    self_username = user.username

    for i in messages:
        try:
            container = PrivateMessageContainer.objects.get(
                container_id=i
            )

            isnt_user_one = self_username == container.container_id.split(":")[1]
            other_user = container.user_one if isnt_user_one else container.user_two
            recent_message = container.messages.last()
            message = PrivateMessage.objects.get(message_id=recent_message.message_id) if recent_message else ""

            message_json.append({
                "username": other_user.username,
                "display_name": other_user.display_name,
                "badges": other_user.get_badges(),
                "color_one": other_user.color,
                "color_two": other_user.color_two,
                "gradient_banner": other_user.gradient,
                "bio": message.content if isinstance(message, PrivateMessage) else "",
                "timestamp": message.timestamp if isinstance(message, PrivateMessage) else 0,
                "unread": container.unread_two if isnt_user_one else container.unread_one
            })

        except PrivateMessageContainer.DoesNotExist:
            ...

    return {
        "success": True,
        "actions": [
            { "name": "user_timeline", "special": "messages", "users": message_json, "more": len(user.messages) - (offset + 1) * MESSAGES_PER_REQUEST > 0 }
        ]
    }
