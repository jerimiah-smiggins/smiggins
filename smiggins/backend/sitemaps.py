# Like templating.py for sitemaps

from math import ceil
from django.http import HttpResponse

from posts.models import User, Post
from .helper import get_HTTP_response
from .variables import ITEMS_PER_SITEMAP, WEBSITE_URL

def sitemap_index(request) -> HttpResponse:
    r = get_HTTP_response(
        request, "sitemap/index.xml",

        URL=WEBSITE_URL,
        users=list(range(ceil(User.objects.count() / ITEMS_PER_SITEMAP))),
        posts=list(range(ceil(Post.objects.count() / ITEMS_PER_SITEMAP)))
    )
    r["Content-Type"] = "application/xml"
    return r

def sitemap_base(request) -> HttpResponse:
    r = get_HTTP_response(
        request, "sitemap/base.xml",

        URL=WEBSITE_URL,
    )
    r["Content-Type"] = "application/xml"
    return r

def sitemap_user(request, index: int) -> HttpResponse:
    r = get_HTTP_response(
        request, "sitemap/user.xml",

        URL=WEBSITE_URL,
        usernames=User.objects.order_by("user_id").values_list("username", flat=True)[index * ITEMS_PER_SITEMAP : (index + 1) * ITEMS_PER_SITEMAP :]
    )
    r["Content-Type"] = "application/xml"
    return r

def sitemap_post(request, index: int) -> HttpResponse:
    r = get_HTTP_response(
        request, "sitemap/post.xml",

        URL=WEBSITE_URL,
        post_ids=Post.objects.order_by("post_id").values_list("post_id", flat=True)[index * ITEMS_PER_SITEMAP : (index + 1) * ITEMS_PER_SITEMAP :]
    )
    r["Content-Type"] = "application/xml"
    return r
