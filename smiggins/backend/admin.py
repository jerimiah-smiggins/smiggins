# This contains everything admin replated, from templating to api calls.

from .packages import *
from .helper import *

def templating(request) -> HttpResponse | HttpResponseRedirect:
    try:
        token: str = request.COOKIES["token"].lower()

        if not validate_token(token):
            return get_HTTP_response(
                request, "posts/404.html"
            )

        user = User.objects.get(token=token)

    except KeyError or User.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404.html"
        )

    if user.user_id != OWNER_USER_ID and user.admin_level < 1:
        return get_HTTP_response(
            request, "posts/404.html"
        )

    return get_HTTP_response(
        request, "posts/admin.html",

        LEVEL = 5 if user.user_id == OWNER_USER_ID else user.admin_level,
        BADGE_DATA = BADGE_DATA
    )
