from backend.helper import create_simple_return
from backend.templating import api_docs, manifest_json, webapp
from backend.variables import DEBUG, ROBOTS
from django.contrib import admin as django_admin
from django.http import HttpResponseRedirect
from django.urls import include, path, re_path

from .settings import SERVICE_WORDER_DIR

# variables to reduce code duplication
_favicon = lambda request: HttpResponseRedirect("/static/img/old_favicon.png", status=308) # noqa: E731
_robots_txt = create_simple_return(ROBOTS, content_type="text/plain")
_sw = create_simple_return(open(SERVICE_WORDER_DIR, "r").read(), content_type="application/javascript")

urlpatterns = list(filter(bool, [
    DEBUG and path("api/docs", api_docs),
    path("sw.js", _sw),
    path("api/", include("smiggins.api")),
    path("manifest.json", manifest_json),
    path("django-admin/", django_admin.site.urls),
    path("favicon.ico", _favicon),
    path("robots.txt", _robots_txt),

    re_path("^.*$", webapp)
]))

del _favicon, _robots_txt
