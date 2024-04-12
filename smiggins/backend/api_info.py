# This is to get information about the client, like ip, username, etc.
# Do NOT add telemetry here.

from ._settings import *
from .packages import *
from .helper import *

def api_info_username(request) -> dict:
    # Returns the username from token

    token = request.COOKIES.get('token')
    user = User.objects.get(token=token)

    return {
        "username": user.username
    }
