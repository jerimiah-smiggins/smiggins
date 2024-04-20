from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("posts.api")),
    path("", include("posts.urls")),
]

handler404 = "posts.views._404"
handler500 = "posts.views._500"
