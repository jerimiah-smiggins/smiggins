# This is to get information about the client, like ip, username, etc.
# Do NOT add telemetry here.

from posts.models import User

from ..variables import ENABLE_PRIVATE_MESSAGES, REAL_VERSION


def notifications(request) -> tuple[int, dict] | dict:
    # Returns whether or not you have unread notifications

    try:
        user = User.objects.get(token=request.COOKIES.get('token'))
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

def version(request) -> dict:
    # Returns the site version

    return {
        "success": True,
        "version": list(REAL_VERSION)
    }
