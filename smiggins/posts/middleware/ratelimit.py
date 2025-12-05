import time
from typing import Callable

from backend.api.format import ErrorCodes
from backend.variables import ALTERNATE_IPS, ENABLE_RATELIMIT
from django.http import HttpRequest, HttpResponse

from smiggins.api import API_RATELIMITS

from ..models import User

RL_DATA: dict[str, dict] = {}

class s_HttpRequest(HttpRequest):
    user: User | None

class Ratelimit:
    def __init__(self, get_response: Callable[[s_HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: s_HttpRequest) -> HttpResponse:
        if not ENABLE_RATELIMIT or request.path.startswith("/django-admin/"):
            return self.get_response(request)

        try:
            user = User.objects.get(auth_key=request.COOKIES.get("token"))
        except User.DoesNotExist:
            user = None

        request.user = user

        # GET /foo/bar
        route = f"{request.method} {request.path}". rstrip("/?#")

        if route in API_RATELIMITS:
            data = API_RATELIMITS[route]
        elif (route := "/".join(route.split("/")[:-1]) + "/") in API_RATELIMITS:
            data = API_RATELIMITS[route]
        else:
            return self.get_response(request)

        now = time.time()

        for u in list(filter(lambda a: RL_DATA[a]["meta_expires"] < now, RL_DATA.keys())):
            del RL_DATA[u] # trim expired users

        for val in RL_DATA.values():
            for key, vals in val.items():
                if key == "meta_expires":
                    continue

                # trim expired list items
                val[key] = list(filter(lambda a: a >= now, vals))

        # username or ip from header or ip from remote_addr or "UNKNOWN"
        identifier: str = user.username if user is not None else (request.META.get(ALTERNATE_IPS if isinstance(ALTERNATE_IPS, str) else "X-Real-IP") if ALTERNATE_IPS else False) or request.META.get("REMOTE_ADDR") or "UNKNOWN"

        if identifier not in RL_DATA:
            RL_DATA[identifier] = {
                "meta_expires": 0
            }

        if route not in RL_DATA[identifier]:
            RL_DATA[identifier][route] = []
        elif len(RL_DATA[identifier][route]) >= data[0]:
            if request.path.startswith("/api/"):
                return HttpResponse(bytes([0xff, ErrorCodes.RATELIMIT]), status=429, content_type="application/octet-stream")
            return HttpResponse("429 Too Many Requests", status=429, content_type="text/plain")

        RL_DATA[identifier][route].append(now + data[1])
        RL_DATA[identifier]["meta_expires"] = max(RL_DATA[identifier]["meta_expires"], now + data[0])

        return self.get_response(request)
