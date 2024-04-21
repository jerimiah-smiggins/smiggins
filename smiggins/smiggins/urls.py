from django.contrib import admin as django_admin
from django.urls import include, path

from backend._settings import CONTACT_INFO
from backend.variables import ROBOTS, BADGE_DATA
from backend.helper import create_simple_return
from backend.templating import *

urlpatterns = [
    path("api/", include("smiggins.api")),

    path("", create_simple_return("index.html", redirect_logged_in=True)),
    path("home/", create_simple_return("home.html", redirect_logged_out=True)),
    path("login/", create_simple_return("login.html", redirect_logged_in=True)),
    path("signup/", create_simple_return("signup.html", redirect_logged_in=True)),
    path("logout/", create_simple_return("logout.html")),

    path("contact/", contact),
    path("settings/", settings),
    path("u/<str:username>/", user),
    path("p/<int:post_id>/", post),
    path("c/<int:comment_id>/", comment),

    path("admin/", admin),
    path("django-admin/", django_admin.site.urls),

    path("badges.js", create_simple_return("", content_type="text/javascript", content_override="const badges={" + (",".join(["\"" + i.replace("\\", "\\\\").replace("\"", "\\\"") + "\":'" + BADGE_DATA[i].replace("'", "\"") + "'" for i in BADGE_DATA])) + "}")),
    path("robots.txt", create_simple_return("", content_type="text/plain", content_override=ROBOTS)),
    path(".well-known/security.txt", create_simple_return("", content_type="text/plain", content_override="\n".join([{"email": "Email", "text": "Other", "url": "Link"}[i[0]] + f": {i[1]}" for i in CONTACT_INFO]) + "\n"))
]

handler404 = "backend.templating._404"
handler500 = "backend.templating._500"
