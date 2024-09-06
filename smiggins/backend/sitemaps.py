# Like templating.py for sitemaps

from math import ceil
from django.http import HttpResponse
from django.db.models import Q

from datetime import datetime, timezone
import time
from posts.models import User, Post
from .helper import get_HTTP_response
from .variables import ITEMS_PER_SITEMAP, WEBSITE_URL

def _get_lastmod(ts: int | float=time.time(), short: bool=False) -> str:
    if short:
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime('%Y-%m-%d')
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()

def sitemap_index(request) -> HttpResponse:
    r = get_HTTP_response(
        request, "sitemap/index.xml", user=None,

        URL=WEBSITE_URL,
        lastmod=_get_lastmod(short=True),
        users=list(range(ceil(User.objects.count() / ITEMS_PER_SITEMAP))),
        posts=list(range(ceil(Post.objects.filter(Q(private_post=False) | Q(private_post=None)).count() / ITEMS_PER_SITEMAP)))
    )
    r["Content-Type"] = "application/xml"
    return r

def sitemap_base(request) -> HttpResponse:
    r = get_HTTP_response(
        request, "sitemap/base.xml", user=None,

        URL=WEBSITE_URL
    )
    r["Content-Type"] = "application/xml"
    return r

def sitemap_user(request, index: int) -> HttpResponse:
    r = get_HTTP_response(
        request, "sitemap/user.xml", user=None,

        URL=WEBSITE_URL,
        usernames=User.objects.order_by("user_id").values_list("username", flat=True)[index * ITEMS_PER_SITEMAP : (index + 1) * ITEMS_PER_SITEMAP :]
    )
    r["Content-Type"] = "application/xml"
    return r

def sitemap_post(request, index: int) -> HttpResponse:
    r = get_HTTP_response(
        request, "sitemap/post.xml", user=None,

        URL=WEBSITE_URL,
        posts=[[i[0], _get_lastmod(i[1])] for i in Post.objects.filter(Q(private_post=False) | Q(private_post=None)).order_by("post_id").values_list("post_id", "timestamp")[index * ITEMS_PER_SITEMAP : (index + 1) * ITEMS_PER_SITEMAP :]]
    )
    r["Content-Type"] = "application/xml"
    return r
