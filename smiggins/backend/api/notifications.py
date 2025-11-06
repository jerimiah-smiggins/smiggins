from django.http import HttpRequest, HttpResponse
from posts.models import User

from .format import ErrorCodes, api_PendingNotifications


def notifications(request: HttpRequest) -> HttpResponse:
    api = api_PendingNotifications(request)

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    return api.response(
        notifications=bool(user.notifications.filter(read=False).count()),
        messages=False, # TODO: Unread messages
        follow_requests=bool(user.pending_followers.count())
    )
