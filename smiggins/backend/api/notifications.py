from django.http import HttpResponse
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest
from posts.models import M2MMessageMember

from .format import ErrorCodes, api_PendingNotifications


def notifications(request: HttpRequest) -> HttpResponse:
    api = api_PendingNotifications(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    return api.response(
        notifications=bool(request.s_user.notifications.filter(read=False).count()),
        messages=M2MMessageMember.objects.filter(user=request.s_user, unread=True).exists(),
        follow_requests=bool(request.s_user.pending_followers.count())
    )
