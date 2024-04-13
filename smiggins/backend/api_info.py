# This is to get information about the client, like ip, username, etc.
# Do NOT add telemetry here.

from ._settings import *
from .packages import *
from .helper import *

def api_info_username(request) -> tuple | dict:
    # Returns the username from token

    token = request.COOKIES.get('token')
    try:
        user = User.objects.get(token=token)
    except User.DoesNotExist:
        return 400, {
            "success": False,
            "reason": "Invalid token"
        }

    return {
        "success": True,
        "username": user.username
    }
