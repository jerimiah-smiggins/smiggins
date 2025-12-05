from django.http import HttpResponse
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest

from .format import ErrorCodes, api_PendingNotifications


def notifications(request: HttpRequest) -> HttpResponse:
    api = api_PendingNotifications(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    return api.response(
        notifications=bool(request.s_user.notifications.filter(read=False).count()),
        messages=False, # TODO: Unread messages
        follow_requests=bool(request.s_user.pending_followers.count())
    )
