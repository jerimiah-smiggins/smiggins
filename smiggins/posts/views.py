from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader

from _server_module._settings import *
from _server_module._variables import *
from _server_module._helper import *

from .models import User, Post, Comment

def index(request) -> HttpResponse:
    if validate_token(request.COOKIES.get('token')):
        return HttpResponseRedirect("/home", status=307)
    return get_HTTP_response(request, "posts/index.html")

def home(request) -> HttpResponse:
    if not validate_token(request.COOKIES.get('token')):
        return HttpResponseRedirect("/", status=307)
    else:
        response = get_HTTP_response(request, "posts/home.html")
    return response

def login(request) -> HttpResponse:
    if validate_token(request.COOKIES.get('token')):
        return HttpResponseRedirect("/home", status=307)
    else:
        response = get_HTTP_response(request, "posts/login.html")
    return response

def signup(request) -> HttpResponse:
    if validate_token(request.COOKIES.get('token')):
        return HttpResponseRedirect("/home", status=307)
    else:
        response = get_HTTP_response(request, "posts/signup.html")
    return response

def logout(request) -> HttpResponse:
    return get_HTTP_response(request, "posts/logout.html")

def settings(request) -> HttpResponse:
    logged_in = True

    try:
        token: str = request.COOKIES["token"].lower()
        if not validate_token(token):
            logged_in = False
    except KeyError:
        logged_in = False

    if not logged_in:
        return HttpResponseRedirect("/", status=307)

    try:
        user = User.objects.get(token=token)
    except User.DoesNotExist:
        print("I uh what?")
        logged_in = False

    response = get_HTTP_response(
        request, "posts/settings.html",

        DISPLAY_NAME = user.display_name,
        BANNER_COLOR = user.color or "#3a1e93",
        CHECKED_IF_PRIV = "checked" if user.private else "",

        SELECTED_IF_LIGHT = "selected" if user.theme == "light" else "",
        SELECTED_IF_GRAY = "selected" if user.theme == "gray" else "",
        SELECTED_IF_DARK = "selected" if user.theme == "dark" else "",
        SELECTED_IF_BLACK = "selected" if user.theme == "black" else ""
    )

    response.set_cookie("token", token.lower())
    return response

def user(request, username) -> HttpResponse:
    logged_in = True
    username = username.lower()
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
        if logged_in:
            return get_HTTP_response(
                request, "posts/404_user.html"
            )
        return HttpResponseRedirect("/", status=307)

    response = get_HTTP_response(
        request, "posts/user.html",

        LOGGED_IN = str(logged_in).lower(),
        USERNAME = user.username,
        DISPLAY_NAME = user.display_name,
        BANNER_COLOR = user.color or "#3a1e93",
        IS_FOLLOWING = user.user_id in User.objects.get(pk=self_id).following if logged_in else "",
        IS_HIDDEN = "hidden" if user.user_id == self_id else ""
    )
    if logged_in:
        response.set_cookie('token',token.lower())
    return response

def post(request, post_id) -> HttpResponse:
    logged_in = True

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
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        if logged_in:
            return get_HTTP_response(
                request, "posts/404_post.html"
            )
        return HttpResponseRedirect("/", status=307)

    try:
        creator = User.objects.get(pk=post.creator)
    except User.DoesNotExist:
        pass
        # this should return like a 403 error

    # print(str(post.likes != [] and self_id in post.likes and logged_in).lower())

    response = get_HTTP_response(
        request, "posts/post.html",

        LOGGED_IN = str(logged_in).lower(),
        POST_ID = post.post_id,
        CREATOR_USERNAME = creator.username,
        DISPLAY_NAME = creator.display_name,
        CONTENT = post.content,
        TIMESTAMP = post.timestamp,
        COMMENTS = str(len(post.comments)),
        COMMENT = "false",
        LIKED = str(post.likes != [] and self_id in post.likes and logged_in).lower(),
        LIKES = str(len(post.likes)) if post.likes != [] else "0"
    )
    if logged_in:
        response.set_cookie('token', token.lower())
    return response

def comment(request, comment_id) -> HttpResponse:
    template = loader.get_template("posts/post.html")

    logged_in = True

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
        comment = Comment.objects.get(pk=comment_id)
    except Comment.DoesNotExist:
        if logged_in:
            return get_HTTP_response(
                request, "posts/404_post.html"
            )
        return HttpResponseRedirect("/", status=307)

    try:
        creator = User.objects.get(pk=comment.creator)
    except User.DoesNotExist:
        print("I uh what")

    response = get_HTTP_response(
        request, "posts/post.html",

        LOGGED_IN = str(logged_in).lower(),
        POST_ID = comment.comment_id,
        CREATOR_USERNAME = creator.username,
        DISPLAY_NAME = creator.display_name,
        CONTENT = comment.content,
        TIMESTAMP = comment.timestamp,
        COMMENTS = str(len(comment.comments)),
        COMMENT = "true",
        LIKED = str(comment.likes != [] and self_id in comment.likes and logged_in).lower(),
        LIKES = str(len(comment.likes)) if comment.likes != [] else "0"
    )

    response.set_cookie('token', token.lower())
    return response

def robots(request) -> HttpResponse:
    return HttpResponse(ROBOTS, content_type="text/plain")

def _404(request, exception) -> HttpResponse:
    response = get_HTTP_response(request, "posts/404.html")
    response.status_code = 404
    return response

def _500(request) -> HttpResponse:
    return 500, get_HTTP_response(request, "posts/500.html")
