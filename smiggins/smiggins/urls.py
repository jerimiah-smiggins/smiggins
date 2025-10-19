from backend.helper import create_simple_return
from backend.templating import manifest_json, webapp
from backend.variables import ROBOTS
from django.contrib import admin as django_admin
from django.http import HttpResponseRedirect
from django.urls import include, path, re_path

# variables to reduce code duplication
_favicon = lambda request: HttpResponseRedirect("/static/img/old_favicon.png", status=308) # noqa: E731
_robots_txt = create_simple_return(ROBOTS, content_type="text/plain")

urlpatterns = list(filter(bool, [
    path("api/", include("smiggins.api")),
    path("manifest.json", manifest_json),
    path("django-admin/", django_admin.site.urls),
    path("favicon.ico", _favicon),
    path("robots.txt", _robots_txt),

    re_path("^.*$", webapp)
]))

del _favicon, _robots_txt
