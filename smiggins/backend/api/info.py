from django.db.models import Q
from posts.models import PrivateMessageContainer, User

from ..helper import check_ratelimit
from ..variables import ENABLE_PRIVATE_MESSAGES, REAL_VERSION
from .schema import APIResponse


def notifications(request) -> tuple[int, dict] | dict | APIResponse:
    if rl := check_ratelimit(request, "GET /api/info/notifications"):
        return rl

    try:
        user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    return {
        "success": True,
        "notifications": user.notifications.filter(read=False).count(),
        "messages": PrivateMessageContainer.objects.filter(Q(user_one=user, unread_one=True) | Q(user_two=user, unread_two=True)).count() if ENABLE_PRIVATE_MESSAGES else 0,
        "followers": (user.verify_followers or 0) and user.pending_followers.count()
    }

def version(request) -> dict | APIResponse:
    if rl := check_ratelimit(request, "GET /api/info/version"):
        return rl

    return {
        "success": True,
        "version": list(REAL_VERSION)
    }
