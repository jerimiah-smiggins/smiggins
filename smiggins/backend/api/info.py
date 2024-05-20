# This is to get information about the client, like ip, username, etc.
# Do NOT add telemetry here.

from ..packages import User

def username(request) -> tuple | dict:
    # Returns the username from token

    try:
        user = User.objects.get(token=request.COOKIES.get('token'))
    except User.DoesNotExist:
        return 400, {
            "success": False,
        }

    return {
        "success": True,
        "username": user.username
    }

def notifications(request) -> tuple | dict:
    # Returns whether or not you have unread notifications

    try:
        user = User.objects.get(token=request.COOKIES.get('token'))
    except User.DoesNotExist:
        return 400, {
            "success": False,
        }

    return {
        "success": True,
        "notifications": not user.read_notifs,
        "messages": len(user.unread_messages) != 0
    }
