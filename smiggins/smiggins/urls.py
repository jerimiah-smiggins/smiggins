from django.contrib import admin as django_admin
from django.urls import include, path
from django.http import HttpResponseRedirect

from backend.helper import create_simple_return

from backend.variables import (
    CONTACT_INFO,
    ENABLE_PRIVATE_MESSAGES,
    ENABLE_HASHTAGS,
    ENABLE_CONTACT_PAGE,
    ENABLE_CHANGELOG_PAGE,
    ENABLE_CREDITS_PAGE,
    ENABLE_EMAIL,
    ROBOTS,
    DEBUG,
    ENABLE_SITEMAPS
)

from backend.sitemaps import sitemap_index, sitemap_base, sitemap_post, sitemap_user
from backend.api.email import link_manager as email_manager
from backend.api.email import test_link as test_email

from backend.templating import (
    contact,
    settings,
    user,
    user_lists,
    post,
    comment,
    admin,
    message,
    hashtag,
    credit
)

from posts.models import (
    User,
    Post,
    Comment,
    Badge,
    Notification,
    PrivateMessageContainer,
    PrivateMessage,
    Hashtag
)

django_admin.site.register(User)
django_admin.site.register(Post)
django_admin.site.register(Comment)
django_admin.site.register(Badge)
django_admin.site.register(Notification)
django_admin.site.register(PrivateMessageContainer)
django_admin.site.register(PrivateMessage)
django_admin.site.register(Hashtag)

urlpatterns = list(filter(bool, [
    path("api/", include("smiggins.api")),

    path("", create_simple_return("index.html", redirect_logged_in=True)),
    path("home/", create_simple_return("home.html", redirect_logged_out=True)),
    path("login/", create_simple_return("login.html", redirect_logged_in=True)),
    path("signup/", create_simple_return("signup.html", redirect_logged_in=True)),
    path("logout/", create_simple_return("logout.html")),
    path("reset-password/", create_simple_return("reset-password.html", redirect_logged_in=True)) if ENABLE_EMAIL else None,

    path("settings/", settings),
    path("contact/", contact) if ENABLE_CONTACT_PAGE else None,
    path("notifications/", create_simple_return("notifications.html", redirect_logged_out=True)),
    path("changelog/", create_simple_return("changelog.html")) if ENABLE_CHANGELOG_PAGE else None,
    path("credits/", credit) if ENABLE_CREDITS_PAGE else None,
    path("messages/", create_simple_return("messages.html", redirect_logged_out=True)) if ENABLE_PRIVATE_MESSAGES else None,

    path("hashtag/<str:hashtag>/", hashtag) if ENABLE_HASHTAGS else None,
    path("u/<str:username>/", user),
    path("u/<str:username>/lists/", user_lists),
    path("p/<int:post_id>/", post),
    path("c/<int:comment_id>/", comment),
    path("m/<str:username>/", message) if ENABLE_PRIVATE_MESSAGES else None,

    path("email/test/<str:intent>", test_email) if DEBUG and ENABLE_EMAIL else None,
    path("email/<str:key>/", email_manager) if ENABLE_EMAIL else None,

    path("admin/", admin),
    path("django-admin/", django_admin.site.urls),

    path("favicon.ico", lambda request: HttpResponseRedirect("/static/img/favicon.ico", status=308)),
    path("robots.txt", create_simple_return("", content_type="text/plain", content_override=ROBOTS)),
    path(".well-known/security.txt", create_simple_return("", content_type="text/plain", content_override="\n".join([{"email": "Email", "text": "Other", "url": "Link"}[i[0]] + f": {i[1]}" for i in CONTACT_INFO]) + "\n")),

    path("sitemap.xml", sitemap_index) if ENABLE_SITEMAPS else None,
    path("sitemaps/base.xml", sitemap_base) if ENABLE_SITEMAPS else None,
    path("sitemaps/u/<int:index>.xml", sitemap_user) if ENABLE_SITEMAPS else None,
    path("sitemaps/p/<int:index>.xml", sitemap_post) if ENABLE_SITEMAPS else None
]))

handler404 = "backend.templating._404"
handler500 = "backend.templating._500"
