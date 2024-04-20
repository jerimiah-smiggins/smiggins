# This contains everything admin replated, from templating to api calls.

from .packages import *
from .helper import *

def templating(request) -> HttpResponse | HttpResponseRedirect:
    try:
        token: str = request.COOKIES["token"].lower()

        if not validate_token(token):
            return HttpResponseRedirect("/", status=307)

        user = User.objects.get(token=token)

    except KeyError or User.DoesNotExist:
        return HttpResponseRedirect("/", status=307)

    if user.user_id != OWNER_USER_ID or user.admin_level < 1:
        return HttpResponseRedirect("/home", status=307)

    return get_HTTP_response(
        request, "posts/admin.html",

        LEVEL = user.admin_level
    )
