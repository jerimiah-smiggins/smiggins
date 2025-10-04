from django.http import HttpResponse
from posts.models import User

from .builder import ErrorCodes, ResponseCodes, build_response


def notifications(request) -> HttpResponse:
    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return build_response(ResponseCodes.NOTIFICATIONS, ErrorCodes.NOT_AUTHENTICATED)

    return build_response(ResponseCodes.NOTIFICATIONS, [
        bool(user.notifications.filter(read=False).count()),
        False, # TODO: Unread messages
        False # TODO: Pending follow requests
    ])
