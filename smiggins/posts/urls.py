from django.urls import path

from backend._settings import ROBOTS, CONTACT_INFO
from backend.helper import create_simple_return
from backend.templating import *

urlpatterns = [
    path("", create_simple_return("posts/index.html", redirect_logged_in=True), name="index"),
    path("home", create_simple_return("posts/home.html", redirect_logged_out=True), name="home"),
    path("login", create_simple_return("posts/login.html", redirect_logged_in=True), name="login"),
    path("signup", create_simple_return("posts/signup.html", redirect_logged_in=True), name="signup"),
    path("logout", create_simple_return("posts/logout.html"), name="logout"),

    path("contact", contact, name="contact"),
    path("settings", settings, name="settings"),
    path("u/<str:username>", user, name="user"),
    path("p/<int:post_id>", post, name="post"),
    path("c/<int:comment_id>", comment, name="comment"),

    path("robots.txt", create_simple_return("", content_type="text/plain", content_override=ROBOTS), name="robots"),
    path(".well-known/security.txt", create_simple_return("", content_type="text/plain", content_override="\n".join([{"email": "Email", "text": "Other", "url": "Link"}[i[0]] + f": {i[1]}" for i in CONTACT_INFO]) + "\n"), name="security")
]
