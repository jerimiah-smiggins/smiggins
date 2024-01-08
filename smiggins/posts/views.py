from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader

from _server_module._settings import *
from _server_module._variables import *
from _server_module._helper import *

from .models import Users, Posts, Comments
# Create your views here.

def index(request):
    template = loader.get_template("posts/index.html")
    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "HIDE_SOURCE" : "" if SOURCE_CODE else "hidden",

        "HTML_HEADERS" : HTML_HEADERS,
        "HTML_FOOTERS" : HTML_FOOTERS,
        }
    return HttpResponse(template.render(context, request))

def home(request):
    template = loader.get_template("posts/home.html")
    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "MAX_POST_LENGTH" : MAX_POST_LENGTH,

        "HTML_HEADERS" : HTML_HEADERS,
        "HTML_FOOTERS" : HTML_FOOTERS,
    }
    return HttpResponse(template.render(context, request))

def login (request):
    template = loader.get_template("posts/login.html")
    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "MAX_USERNAME_LENGTH" : MAX_USERNAME_LENGTH,

        "HTML_HEADERS" : HTML_HEADERS,
    }
    return HttpResponse(template.render(context, request))

def signup (request):
    template = loader.get_template("posts/signup.html")
    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "MAX_USERNAME_LENGTH" : MAX_USERNAME_LENGTH,

        "HTML_HEADERS" : HTML_HEADERS,
    }
    return HttpResponse(template.render(context, request))

def user(request, username):
    template = loader.get_template("posts/user.html")
    
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
        context = {"HTML_HEADERS" : HTML_HEADERS}
        return HttpResponse(loader.get_template("posts/redirect_home.html" if logged_in else "posts/redirect_index.html").render(context, request))
    
    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "MAX_POST_LENGTH" : MAX_POST_LENGTH,
        "LOGGED_IN" : str(logged_in).lower(),

        "USERNAME" : user.username,
        "DISPLAY_NAME" : user.display_name,
        "BANNER_COLOR" : user.color or "#3a1e93",
        
        "IS_FOLLOWING": user.user_id in Users.objects.get(pk=self_id).following if logged_in else "",
        "IS_HIDDEN" : "hidden" if user.user_id == self_id else "",

        "HTML_HEADERS" : HTML_HEADERS,
        "HTML_FOOTERS" : HTML_FOOTERS
    }
    return HttpResponse(template.render(context, request))

def post(request, post_id):
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
        post = Posts.objects.get(pk=post_id)
    except Posts.DoesNotExist:
        context = {"HTML_HEADERS" : HTML_HEADERS}
        return HttpResponse(loader.get_template("posts/redirect_home.html" if logged_in else "posts/redirect_index.html").render(context, request))
    
    try:
        creator = Users.objects.get(pk=post.creator)
    except Users.DoesNotExist:
        print("I uh what")

    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "MAX_POST_LENGTH" : MAX_POST_LENGTH,
        "LOGGED_IN" : str(logged_in).lower(),

        "POST_ID" : post.post_id,
        "CREATOR_USERNAME" : creator.username,
        "DISPLAY_NAME" : creator.display_name,
        "CONTENT" : post.content,
        "TIMESTAMP" : post.timestamp,

        "COMMENTS" : str(len(post.comments)),
        "COMMENT" : "false",
        "LIKED": str(post.likes != [] and self_id in post.likes and logged_in).lower(),
        "LIKES": str(len(post.likes)) if post.likes != [] else "0",

        "HTML_HEADERS" : HTML_HEADERS,
        "HTML_FOOTERS" : HTML_FOOTERS,
    }
    return HttpResponse(template.render(context, request))

def comment(request, comment_id):
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

    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "MAX_POST_LENGTH" : MAX_POST_LENGTH,
        "LOGGED_IN" : str(logged_in).lower(),

        "POST_ID" : comment.comment_id,
        "CREATOR_USERNAME" : creator.username,
        "DISPLAY_NAME" : creator.display_name,
        "CONTENT" : comment.content,
        "TIMESTAMP" : comment.timestamp,

        "COMMENTS" : str(len(comment.comments)),
        "COMMENT" : "false",
        "LIKED": str(comment.likes != [] and self_id in comment.likes and logged_in).lower(),
        "LIKES": str(len(comment.likes)) if comment.likes != [] else "0",

        "HTML_HEADERS" : HTML_HEADERS,
        "HTML_FOOTERS" : HTML_FOOTERS,
    }
    return HttpResponse(template.render(context, request))