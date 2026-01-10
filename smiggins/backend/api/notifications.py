from django.http import HttpResponse
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest

from .format import ErrorCodes, api_PendingNotifications


def notifications(request: HttpRequest) -> HttpResponse:
    api = api_PendingNotifications(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    return api.response(**request.s_user.get_notif_count())
