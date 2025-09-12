from backend.helper import create_simple_return
from backend.templating import webapp, manifest_json
from backend.variables import DEBUG, GENERIC_CACHE_TIMEOUT, REAL_VERSION, ROBOTS
from django.contrib import admin as django_admin
from django.http import HttpResponseRedirect
from django.urls import include, path, re_path
from django.views.decorators.cache import cache_page

cache_prefix = ".".join([str(i) for i in REAL_VERSION])

# variables to reduce code duplication
_favicon = lambda request: HttpResponseRedirect("/static/img/old_favicon.png", status=308) # noqa: E731
_robots_txt = create_simple_return("", content_type="text/plain", content_override=ROBOTS)

urlpatterns = list(filter(bool, [
    path("api/", include("smiggins.api")),
    path("manifest.json", manifest_json),
    path("django-admin/", django_admin.site.urls),
    path("favicon.ico", cache_page(GENERIC_CACHE_TIMEOUT, key_prefix=cache_prefix)(_favicon) if GENERIC_CACHE_TIMEOUT else _favicon),
    path("robots.txt", cache_page(GENERIC_CACHE_TIMEOUT, key_prefix=cache_prefix)(_robots_txt) if GENERIC_CACHE_TIMEOUT else _robots_txt),

    re_path("^.*$", webapp)
]))

del _favicon, _robots_txt

handler500 = "backend.templating._500"
handler404 = "backend.templating._404"
