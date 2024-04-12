# For getting pages, not api.

from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader

from posts.models import User, Post, Comment

from ._settings import DEFAULT_BANNER_COLOR
from .helper import *

def settings(request) -> HttpResponse:
    try:
        token: str = request.COOKIES["token"].lower()
        if not validate_token(token):
            return HttpResponseRedirect("/", status=307)
    except KeyError:
        return HttpResponseRedirect("/", status=307)

    try:
        user = User.objects.get(token=token)
    except User.DoesNotExist:
        return HttpResponseRedirect("/", status=307)

    return get_HTTP_response(
        request, "posts/settings.html",

        DISPLAY_NAME        = user.display_name,
        BANNER_COLOR        = user.color or DEFAULT_BANNER_COLOR,
        BANNER_COLOR_TWO    = user.color_two or DEFAULT_BANNER_COLOR,
        CHECKED_IF_GRADIENT = "checked" if user.gradient else "",
        CHECKED_IF_PRIV     = "checked" if user.private  else "",

        SELECTED_IF_LIGHT = "selected" if user.theme == "light" else "",
        SELECTED_IF_GRAY  = "selected" if user.theme == "gray"  else "",
        SELECTED_IF_DARK  = "selected" if user.theme == "dark"  else "",
        SELECTED_IF_BLACK = "selected" if user.theme == "black" else ""
    )

def user(request, username) -> HttpResponse:
    logged_in = True
    username = username.lower()
    token = ""

    try:
        token = request.COOKIES["token"]
        if not validate_token(token):
            logged_in = False
    except KeyError:
        logged_in = False

    if logged_in:
        self_id = User.objects.get(token=token).user_id
    else:
        self_id = 0

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404_user.html"
        )

    return get_HTTP_response(
        request, "posts/user.html",

        LOGGED_IN = str(logged_in).lower(),
        USERNAME = user.username,
        DISPLAY_NAME = user.display_name,
        BANNER_COLOR = user.color or DEFAULT_BANNER_COLOR,
        IS_FOLLOWING = str(user.user_id in User.objects.get(pk=self_id).following) if logged_in else "false",
        IS_HIDDEN = "hidden" if user.user_id == self_id else ""
    )

def post(request, post_id) -> HttpResponse:
    logged_in = True
    token = ""

    try:
        token = request.COOKIES["token"]
        if not validate_token(token):
            logged_in = False
    except KeyError:
        logged_in = False

    self_id = User.objects.get(token=token).user_id if logged_in else 0

    try:
        post = Post.objects.get(pk=post_id)
        creator = User.objects.get(pk=post.creator)
    except Post.DoesNotExist or User.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    if creator.private and self_id not in creator.following:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    return get_HTTP_response(
        request, "posts/post.html",

        CREATOR_USERNAME = creator.username,
        DISPLAY_NAME = creator.display_name,
        LOGGED_IN = str(logged_in).lower(),
        POST_ID   = str(post.post_id),
        CONTENT   = post.content,
        TIMESTAMP = str(post.timestamp),
        COMMENTS  = str(len(post.comments)),
        COMMENT   = "false",
        LIKED     = str(post.likes != [] and self_id in post.likes and logged_in).lower(),
        LIKES     = str(len(post.likes)) if post.likes != [] else "0",
        PRIVATE   = "" if creator.private else "hidden"
    )

def comment(request, comment_id) -> HttpResponse:
    logged_in = True
    token = ""

    try:
        token = request.COOKIES["token"]
        if not validate_token(token):
            logged_in = False
    except KeyError:
        logged_in = False

    self_id = User.objects.get(token=token).user_id if logged_in else 0

    try:
        comment = Comment.objects.get(pk=comment_id)
    except Comment.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    try:
        creator = User.objects.get(pk=comment.creator)
    except User.DoesNotExist:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    if creator.private and self_id not in creator.following:
        return get_HTTP_response(
            request, "posts/404_post.html"
        )

    return get_HTTP_response(
        request, "posts/post.html",

        CREATOR_USERNAME = creator.username,
        DISPLAY_NAME     = creator.display_name,
        LOGGED_IN = str(logged_in).lower(),
        POST_ID   = str(comment.comment_id),
        CONTENT   = comment.content,
        TIMESTAMP = str(comment.timestamp),
        COMMENTS  = str(len(comment.comments)),
        COMMENT   = "true",
        LIKED     = str(comment.likes != [] and self_id in comment.likes and logged_in).lower(),
        LIKES     = str(len(comment.likes)) if comment.likes != [] else "0",
        PRIVATE   = "" if creator.private else "hidden"
    )

def contact(request) -> HttpResponse:
    return get_HTTP_response(
        request, "posts/contact.html",

        CONTACT_LIST = "<li>" + "</li><li>".join([f'<a href="mailto:{i[1]}">{i[1]}</a>' if i[0] == "email" else f'<a href="{i[1]}">{i[1]}</a>' if i[0] == "url" else i[1] for i in CONTACT_INFO]) + "</li>"
    )
