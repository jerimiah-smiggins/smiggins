# For API functions that relate to messages for example sending, deleting, etc.

from ._settings import MAX_POST_LENGTH, MESSAGES_PER_REQUEST
from .packages  import User, PrivateMessageContainer, PrivateMessage, time, Schema, sys
from .helper    import trim_whitespace, get_container_id, get_badges

class NewContainer(Schema):
    username: str

class NewMessage(Schema):
    username: str
    content: str

def container_create(request, data: NewContainer) -> tuple | dict:
    # Called when a new comment is created.

    token = request.COOKIES.get('token')
    self_user = User.objects.get(token=token)

    if self_user.username == data.username:
        return 400, {
            "success": False,
            "reason": "Look, a lack of friends is a common issue, but you can't talk to yourself!"
        }

    user = User.objects.get(username=data.username)
    container_id = get_container_id(user.username, self_user.username)

    if user.user_id in self_user.blocking:
        return 400, {
            "success": False,
            "reason": "You are blocking this person!"
        }
    elif self_user.user_id in user.blocking:
        return 400, {
            "success": False,
            "reason": "You are blocked by this person!"
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

    return 201, {
        "success": True
    }

def messages_since(request, username: str, message_id: int) -> tuple | dict:
    user = User.objects.get(token=request.COOKIES.get('token'))

    if user.username == username:
        return 400, {
            "success": False
        }

    try:
        messages = PrivateMessageContainer.objects.get(container_id=get_container_id(user.username, username)).messages
    except PrivateMessageContainer.DoesNotExist:
        return 404, {
            "success": False
        }

    return {
        "success": True,
        "new": len(messages) and messages[-1] > message_id
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

    content = trim_whitespace(data.content, True)
    if len(content) == 0 or len(content) > MAX_POST_LENGTH:
        return 400, {
            "success": False,
            "reason": "Invalid message size"
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
            index = 0

        list_of_messages = container_messages[-MESSAGES_PER_REQUEST + index : index if index else None :][::-1]
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
                "unread": i in user.unread_messages
            })

        except PrivateMessageContainer.DoesNotExist:
            ...

    return {
        "success": True,
        "more": len(user.messages) - (offset + 1) * MESSAGES_PER_REQUEST > 0,
        "messages": message_json
    }
