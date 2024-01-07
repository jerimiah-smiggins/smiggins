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
        self_id = ""

    try:
        user_id = Users.objects.get(username=username).user_id
    except Users.DoesNotExist:
        context = {"HTML_HEADERS" : HTML_HEADERS}
        return HttpResponse(loader.get_template("posts/redirect_home.html" if logged_in else "posts/redirect_index.html").render(context, request))
    
    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "MAX_POST_LENGTH" : MAX_POST_LENGTH,
        "LOGGED_IN" : logged_in,

        "USERNAME" : Users.objects.get(pk=user_id).username,
        "DISPLAY_NAME" : Users.objects.get(pk=user_id).display_name,
        
        "IS_FOLLOWING": user_id in Users.objects.get(pk=self_id).following if logged_in else "",
        "BANNER_COLOR" : Users.objects.get(pk=user_id).color or "#3a1e93",
        "IS_HIDDEN" : "hidden" if user_id == self_id else "",

        "HTML_HEADERS" : HTML_HEADERS,
        "HTML_FOOTERS" : HTML_FOOTERS
    }
    return HttpResponse(template.render(context, request))

def post(request, post_id):
    return HttpResponse(f"This is post #{post_id}")

def comment(request, comment_id):
    return HttpResponse(f"This is comment #{comment_id}")