from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader

from _server_module._settings import *
from _server_module._variables import *
from _server_module._helper import *

from .models import Users, Posts, Comments
# Create your views here.

def index(request) -> HttpResponse:
    return get_HTTP_response(request, "posts/index.html")

def home(request) -> HttpResponse:
    return get_HTTP_response(request, "posts/home.html")

def login(request) -> HttpResponse:
    return get_HTTP_response(request, "posts/login.html")

def signup(request) -> HttpResponse:
    return get_HTTP_response(request, "posts/signup.html")

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
        return get_HTTP_response(request, "posts/redirect_index.html")

    try:
        user = Users.objects.get(token=token)
    except Users.DoesNotExist:
        print("I uh what?")
        logged_in = False

    response = get_HTTP_response(
        request, "posts/settings.html",

        DISPLAY_NAME = user.display_name,
        BANNER_COLOR = user.color or "#3a1e93",
        SELECTED_IF_DARK = "selected" if user.theme == "dark" else "",
        SELECTED_IF_LIGHT = "selected" if user.theme == "light" else "",
        CHECKED_IF_PRIV = "checked" if user.private else ""
    )

    response.set_cookie("token", token.lower())
    return response

def user(request, username) -> HttpResponse:
    logged_in = True

    try:
        token = request.COOKIES["token"]
        if not validate_token(token):
            logged_in = False
    except KeyError:
        logged_in = False

    if logged_in:
        self_id = Users.objects.get(token=token).user_id
    else:
        self_id = 0

    try:
        user = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return get_HTTP_response(
            request, "posts/redirect_home.html" if logged_in else "posts/redirect_index.html"
        )

    response = get_HTTP_response(
        request, "posts/user.html",

        LOGGED_IN = str(logged_in).lower(),
        USERNAME = user.username,
        DISPLAY_NAME = user.display_name,
        BANNER_COLOR = user.color or "#3a1e93",
        IS_FOLLOWING = user.user_id in Users.objects.get(pk=self_id).following if logged_in else "",
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
        self_id = Users.objects.get(token=token).user_id
    else:
        self_id = 0

    try:
        post = Posts.objects.get(pk=post_id)
    except Posts.DoesNotExist:
        return get_HTTP_response(
            request, "posts/redirect_home.html" if logged_in else "posts/redirect_index.html"
        )

    try:
        creator = Users.objects.get(pk=post.creator)
    except Users.DoesNotExist:
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
        self_id = Users.objects.get(token=token).user_id
    else:
        self_id = 0

    try:
        comment = Comments.objects.get(pk=comment_id)
    except Comments.DoesNotExist:
        context = {"HTML_HEADERS" : HTML_HEADERS}
        return HttpResponse(loader.get_template("posts/redirect_home.html" if logged_in else "posts/redirect_index.html").render(context, request))

    try:
        creator = Users.objects.get(pk=comment.creator)
    except Users.DoesNotExist:
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
