from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("home", views.home, name="home"),
    path("u/<int:user_id>", views.user, name="user"),
    path("p/<int:post_id>", views.post, name="post"),
    path("c/<int:comment_id>", views.comment, name="comment"),
]