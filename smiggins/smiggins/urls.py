from backend.api.email import link_manager as email_manager
from backend.api.email import test_link as test_email
from backend.helper import create_simple_return
from backend.sitemaps import (sitemap_base, sitemap_comment, sitemap_hashtag,
                              sitemap_index, sitemap_post, sitemap_user)
from backend.templating import generate_favicon, webapp
from backend.variables import (CONTACT_INFO, DEBUG, ENABLE_EMAIL,
                               ENABLE_SITEMAPS, FAVICON_CACHE_TIMEOUT,
                               GENERIC_CACHE_TIMEOUT, REAL_VERSION, ROBOTS,
                               SITEMAP_CACHE_TIMEOUT)
from django.contrib import admin as django_admin
from django.http import HttpResponseRedirect
from django.urls import include, path, re_path
from django.views.decorators.cache import cache_page

cache_prefix = ".".join([str(i) for i in REAL_VERSION])

# variables to reduce code duplication
_favicon = lambda request, a=0: HttpResponseRedirect("/static/img/old_favicon.png", status=308) # noqa: E731
_robots_txt = create_simple_return("", content_type="text/plain", content_override=ROBOTS)
_security_txt = create_simple_return("", content_type="text/plain", content_override="\n".join([{"email": "Email", "text": "Other", "url": "Link"}[i[0]] + f": {i[1]}" for i in CONTACT_INFO]) + "\n")

urlpatterns = list(filter(bool, [
    path("api/", include("smiggins.api")),
    path("email/test/<str:intent>", test_email) if DEBUG and ENABLE_EMAIL else None,
    path("email/<str:key>/", email_manager) if ENABLE_EMAIL else None,

    path("django-admin/", django_admin.site.urls),

    #                 base   crust  accent
    #        /favicon-abcdef-123456-987654
    re_path(r"^favicon-((?:[0-9a-fA-F]{6}-){2}[0-9a-fA-F]{6})$", cache_page(FAVICON_CACHE_TIMEOUT, key_prefix=cache_prefix)(generate_favicon) if FAVICON_CACHE_TIMEOUT else generate_favicon),
    path("favicon.ico", cache_page(GENERIC_CACHE_TIMEOUT, key_prefix=cache_prefix)(_favicon) if GENERIC_CACHE_TIMEOUT else _favicon),
    path("robots.txt", cache_page(GENERIC_CACHE_TIMEOUT, key_prefix=cache_prefix)(_robots_txt) if GENERIC_CACHE_TIMEOUT else _robots_txt),
    path(".well-known/security.txt", cache_page(GENERIC_CACHE_TIMEOUT, key_prefix=cache_prefix)(_security_txt) if GENERIC_CACHE_TIMEOUT else _security_txt),

    path("sitemap.xml", (cache_page(SITEMAP_CACHE_TIMEOUT, key_prefix=cache_prefix)(sitemap_index) if SITEMAP_CACHE_TIMEOUT else sitemap_index)) if ENABLE_SITEMAPS else None,
    path("sitemaps/base.xml", (cache_page(SITEMAP_CACHE_TIMEOUT, key_prefix=cache_prefix)(sitemap_base) if SITEMAP_CACHE_TIMEOUT else sitemap_base)) if ENABLE_SITEMAPS else None,
    path("sitemaps/u/<int:index>.xml", (cache_page(SITEMAP_CACHE_TIMEOUT, key_prefix=cache_prefix)(sitemap_user) if SITEMAP_CACHE_TIMEOUT else sitemap_user)) if ENABLE_SITEMAPS else None,
    path("sitemaps/p/<int:index>.xml", (cache_page(SITEMAP_CACHE_TIMEOUT, key_prefix=cache_prefix)(sitemap_post) if SITEMAP_CACHE_TIMEOUT else sitemap_post)) if ENABLE_SITEMAPS else None,
    path("sitemaps/c/<int:index>.xml", (cache_page(SITEMAP_CACHE_TIMEOUT, key_prefix=cache_prefix)(sitemap_comment) if SITEMAP_CACHE_TIMEOUT else sitemap_post)) if ENABLE_SITEMAPS else None,
    path("sitemaps/h/<int:index>.xml", (cache_page(SITEMAP_CACHE_TIMEOUT, key_prefix=cache_prefix)(sitemap_hashtag) if SITEMAP_CACHE_TIMEOUT else sitemap_post)) if ENABLE_SITEMAPS else None,

    re_path("^.*$", webapp)

    # path("reset-password/", create_simple_return("reset-password.html", redirect_logged_in=True)) if ENABLE_EMAIL else None,

    # path("settings/", settings),
    # path("contact/", contact) if ENABLE_CONTACT_PAGE else None,
    # path("notifications/", create_simple_return("notifications.html", redirect_logged_out=True)),
    # path("credits/", credit) if ENABLE_CREDITS_PAGE else None,
    # path("messages/", create_simple_return("messages.html", redirect_logged_out=True)) if ENABLE_PRIVATE_MESSAGES else None,
    # path("pending/", pending),

    # path("hashtag/<str:hashtag>/", hashtag) if ENABLE_HASHTAGS else None,
    # path("u/<str:username>/", user),
    # path("u/<str:username>/lists/", user_lists),
    # path("p/<int:post_id>/", post),
    # path("c/<int:comment_id>/", comment),
    # path("m/<str:username>/", message) if ENABLE_PRIVATE_MESSAGES else None,

    # path("admin/", admin),
]))

del _favicon, _robots_txt, _security_txt

handler500 = "backend.templating._500"
