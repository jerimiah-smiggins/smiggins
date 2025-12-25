# these api routes don't use the normal encoding/decoding that the others do
import json

from django.http import (HttpResponse, HttpResponseBadRequest,
                         HttpResponseForbidden, HttpResponseServerError)
from posts.middleware.ratelimit import s_HttpRequest as HttpRequest
from posts.models import PushNotification

from ..variables import VAPID


def sw_get_publickey(request: HttpRequest) -> HttpResponse:
    if not VAPID:
        return HttpResponseServerError("No VAPID keys supplied.")

    return HttpResponse(
        VAPID["public"],
        content_type="application/octet-stream"
    )

def sw_register(request: HttpRequest) -> HttpResponse:
    if not request.s_user:
        return HttpResponseForbidden()

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponseBadRequest()

    if "endpoint" not in data or "keys" not in data:
        return HttpResponseBadRequest()

    PushNotification.objects.update_or_create(
        endpoint=data["endpoint"],
        defaults={
            "user": request.s_user,
            "keys": json.dumps(data["keys"])[:1000], # shouldn't be too long (hopefully) - attempts to prevents abuse by bad actors
            "expires": data["expires"] if "expires" in data else None
        }
    )

    return HttpResponse()

def sw_unregister(request: HttpRequest) -> HttpResponse:
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponseBadRequest()

    if "endpoint" not in data:
        return HttpResponseBadRequest()

    try:
        notif = PushNotification.objects.get(
            endpoint=data["endpoint"]
        )
    except PushNotification.DoesNotExist:
        ...
    else:
        notif.delete()

    return HttpResponse()
