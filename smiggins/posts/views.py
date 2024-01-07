from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader

from _server_module._settings import *
from _server_module._variables import *

from .models import Users, Posts, Comments
# Create your views here.

def index(request):
    template = loader.get_template("posts/index.html")
    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "HTML_HEADERS" : HTML_HEADERS,
        "HTML_FOOTERS" : HTML_FOOTERS,
        "HIDE_SOURCE" : SOURCE_CODE
    }
    return HttpResponse(template.render(context, request))

def home(request):
    template = loader.get_template("posts/home.html")
    context = {
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "HTML_HEADERS" : HTML_HEADERS,
        "MAX_POST_LENGTH" : MAX_POST_LENGTH,
        "HTML_FOOTERS" : HTML_FOOTERS
    }
    return HttpResponse(template.render(context, request))

def user(request, user_id):
    template = loader.get_template("posts/user.html")
    context = {
        "DISPLAY_NAME" : "<Insert database call for user_id here>",
        "SITE_NAME" : SITE_NAME,
        "VERSION" : VERSION,
        "HTML_HEADERS" : HTML_HEADERS,
        "MAX_POST_LENGTH" : MAX_POST_LENGTH,
        "HTML_FOOTERS" : HTML_FOOTERS
    }
    return HttpResponse(template.render(context, request))

def post(request, post_id):
    return HttpResponse(f"This is post #{post_id}")

def comment(request, comment_id):
    return HttpResponse(f"This is comment #{comment_id}")