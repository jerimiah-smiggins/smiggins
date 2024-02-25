# This is to get information about the client, like ip, username, etc.
# Do NOT add telemetry here.

from ._packages import *
from ._settings import *
from ._helper import *

def api_info_username(request):
    # Returns the username from token

    token = request.COOKIES.get('token')
    user = Users.objects.get(token=token)

    return {
        "username": user.username
    }
