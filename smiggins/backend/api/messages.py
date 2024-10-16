# For API functions that relate to messages for example sending, deleting, etc.

import time

from posts.models import PrivateMessage, PrivateMessageContainer, User

from ..helper import get_badges, get_container_id, get_lang, trim_whitespace
from ..variables import MAX_POST_LENGTH, MESSAGES_PER_REQUEST
from .schema import NewContainer, NewMessage


def container_create(request, data: NewContainer) -> tuple | dict:
    # Called when a new comment is created.

    token = request.COOKIES.get('token')
    self_user = User.objects.get(token=token)

    if self_user.username == data.username:
        lang = get_lang(self_user)
        return 400, {
            "success": False,
            "reason": lang["messages"]["yourself"]
        }

    user = User.objects.get(username=data.username)
    container_id = get_container_id(user.username, self_user.username)

    if user.user_id in self_user.blocking:
        lang = get_lang(self_user)
        return 400, {
            "success": False,
            "reason": lang["messages"]["blocking"]
        }
    elif self_user.user_id in user.blocking:
        lang = get_lang(self_user)
        return 400, {
            "success": False,
            "reason": lang["messages"]["blocked"]
        }

    try:
        PrivateMessageContainer.objects.get(container_id=container_id)
        return {
            "success": True
        }
    except PrivateMessageContainer.DoesNotExist:
        pass

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
        "success": True
    }

def send_message(request, data: NewMessage) -> tuple | dict:
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

    if container.user_one.user_id in container.user_two.blocking or container.user_two.user_id in container.user_one.blocking:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["messages"]["blocking_blocked"]
        }

    content = trim_whitespace(data.content, True)
    if len(content) == 0 or len(content) > MAX_POST_LENGTH:
        lang = get_lang(user)
        return 400, {
            "success": False,
            "reason": lang["messages"]["invalid_size"]
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
        if container_id not in container.user_one.unread_messages:
            container.user_one.unread_messages.append(container_id)
    else:
        if container_id not in container.user_two.unread_messages:
            container.user_two.unread_messages.append(container_id)

    container.user_one.save()
    container.user_two.save()

    x = PrivateMessage.objects.create(
        timestamp = timestamp,
        content = content,
        from_user_one = data.username == container_id.split(":")[1],
        message_container = container
    )

    x = PrivateMessage.objects.get(
        content = content,
        timestamp = timestamp,
        message_container = container
    )

    container.messages.append(x.message_id)
    container.save()

    return {
        "success": True
    }

def messages_list(request, username: str, forward: bool=True, offset: int=-1) -> tuple | dict:
    user = User.objects.get(token=request.COOKIES.get("token"))

    if user.username == username:
        return 400, {
            "success": False
        }

    container_id = get_container_id(username, user.username)
    container = PrivateMessageContainer.objects.get(container_id=container_id)
    container_messages = container.messages
    is_user_one = username == container_id.split(":")[1]

    if is_user_one and container_id in container.user_one.unread_messages:
        container.user_one.unread_messages.remove(container_id)
        container.user_one.save()

    if not is_user_one and container_id in container.user_two.unread_messages:
        container.user_two.unread_messages.remove(container_id)
        container.user_two.save()

    if forward:
        try:
            index = container_messages.index(offset)
        except ValueError:
            index = len(container_messages)

        list_of_messages = container_messages[max(0, index - MESSAGES_PER_REQUEST) : index if index else None :][::-1]
        more = len(container_messages) - MESSAGES_PER_REQUEST * max(1, offset + 1) > 0

    else:
        try:
            index = container_messages.index(offset)
        except ValueError:
            index = 0

        list_of_messages = container_messages[index + 1 : index + MESSAGES_PER_REQUEST :][::-1]
        more = len(list_of_messages) - index - MESSAGES_PER_REQUEST > 0

    messages = []
    for i in list_of_messages:
        try:
            message = PrivateMessage.objects.get(
                message_id=i,
            )

            messages.append({
                "timestamp": message.timestamp,
                "content": message.content,
                "from_self": is_user_one == message.from_user_one,
                "id": i
            })

        except PrivateMessage.DoesNotExist:
            ...

    return 200, {
        "success": True,
        "messages": messages,
        "more": more
    }

def recent_messages(request, offset: int=-1) -> tuple | dict:
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

            other_user = container.user_one if i.split(":")[1] == self_username else container.user_two
            message = PrivateMessage.objects.get(message_id=container.messages[-1]) if len(container.messages) else ""

            message_json.append({
                "content": message.content if isinstance(message, PrivateMessage) else "",
                "timestamp": message.timestamp if isinstance(message, PrivateMessage) else 0,
                "username": other_user.username,
                "display_name": other_user.display_name,
                "badges": get_badges(other_user),
                "unread": i in user.unread_messages,
                "color_one": other_user.color,
                "color_two": other_user.color_two,
                "gradient_banner": other_user.gradient
            })

        except PrivateMessageContainer.DoesNotExist:
            ...

    return {
        "success": True,
        "more": len(user.messages) - (offset + 1) * MESSAGES_PER_REQUEST > 0,
        "messages": message_json
    }
