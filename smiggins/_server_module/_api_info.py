# This is to get information about the client, like ip, username, etc.
# Do NOT add telemetry here.

from ._packages import *
from ._settings import *
from ._helper import *

def api_info_username():
    # Returns the username from token

    if "token" in request.cookies:
        return return_dynamic_content_type(load_user_json(token_to_id(request.cookies["token"]))["username"], "text/plain")
    flask.abort(400)

def api_info_ip():
    # Returns the user's IP

    return return_dynamic_content_type(str(request.remote_addr), "text/plain")
