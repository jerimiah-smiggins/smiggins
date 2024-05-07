# For API functions that relate to messages for example sending, deleting, etc.

from ._settings import MAX_POST_LENGTH, POSTS_PER_REQUEST
from .packages  import User, PrivateMessageContainer, PrivateMessage, time, Schema
from .helper    import trim_whitespace, get_container_id

class NewContainer(Schema):
    username: str

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

    container_id = get_container_id(user, self_user)


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
        return 400, {
            "success": False,
            "reason": "You're already talking to this person!"
        }
    except PrivateMessageContainer.DoesNotExist:
        pass

    PrivateMessageContainer.objects.create(
        container_id = container_id,
        user_one = self_user if user.username > self_user.username else user,
        user_two = user if user.username > self_user.username else self_user
    )

    return 201, {
        "success": True
    }
