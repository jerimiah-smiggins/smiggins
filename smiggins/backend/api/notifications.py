from django.http import HttpResponse
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest
from posts.models import M2MMessageMember

from .format import ErrorCodes, api_PendingNotifications


def notifications(request: HttpRequest) -> HttpResponse:
    api = api_PendingNotifications(request)

    if request.s_user is None:
        return api.error(ErrorCodes.NOT_AUTHENTICATED)

    notification_count = request.s_user.notifications.filter(read=False).count()
    message_count = M2MMessageMember.objects.filter(user=request.s_user, unread=True).count()
    folreq_count = request.s_user.pending_followers.count()

    return api.response(
        notifications=bool(notification_count),
        messages=bool(message_count),
        follow_requests=bool(folreq_count),
        count=min(100, notification_count + message_count + folreq_count)
    )
