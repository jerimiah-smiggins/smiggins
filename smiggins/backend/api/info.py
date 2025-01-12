# This is to get information about the client, like ip, username, etc.
# Do NOT add telemetry here.

from posts.models import User

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
        "notifications": not user.read_notifs,
        "messages": ENABLE_PRIVATE_MESSAGES and len(user.unread_messages) != 0,
        "followers": user.verify_followers and user.pending_followers.count() > 0
    }

def version(request) -> dict | APIResponse:
    if rl := check_ratelimit(request, "GET /api/info/version"):
        return rl

    return {
        "success": True,
        "version": list(REAL_VERSION)
    }
