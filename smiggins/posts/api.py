from django.urls import path

from _server_module._api_user    import *
from _server_module._api_post    import *
from _server_module._api_comment import *
from _server_module._api_info    import *

from ninja import NinjaAPI, Schema
from ninja.renderers import BaseRenderer
import json

class JSONRenderer(BaseRenderer):
    media_type = "application/json"

    def render(self, request, data, *, response_status):
        try:
            if isinstance(data, str):
                return data

            return json.dumps(data)

        except TypeError:
            return data()

class accountSchema(Schema):
    username: str
    password: str

class themeSchema(Schema):
    theme: str

class colorSchema(Schema):
    color: str

class privSchema(Schema):
    priv: bool

class displNameSchema(Schema):
    displ_name: str

class followerSchema(Schema):
    username: str

class postSchema(Schema):
    content: str

class likeSchema(Schema):
    id: int

class commentSchema(postSchema):
    id: int
    comment: bool

api = NinjaAPI(renderer=JSONRenderer())

# Account stuff
@api.post("user/signup")
def signup(request, data: accountSchema):
    return api_account_signup(request=request, data=data)

@api.post("user/login")
def login(request, data: accountSchema):
    return api_account_login(request=request, data=data)

# User stuff
@api.post("user/settings/theme", response={200: dict, 400: dict})
def theme(request, data: themeSchema):
    return api_user_settings_theme(request=request, data=data)

@api.post("user/settings/color", response={200: dict, 400: dict})
def color(request, data: colorSchema):
    return api_user_settings_color(request=request, data=data)

@api.post("user/settings/priv")
def priv(request, data: privSchema):
    return api_user_settings_private(request=request, data=data)

@api.post("user/settings/display-name", response={200: dict, 400: dict})
def displName(request, data: displNameSchema):
    return api_user_settings_display_name(request=request, data=data)

@api.post("user/follower", response={201: dict, 400: dict})
def followAdd(request, data: followerSchema):
    return api_user_follower_add(request=request, data=data)

@api.delete("user/follower", response={201: dict, 400: dict})
def followRemove(request, data: followerSchema):
    return api_user_follower_remove(request=request, data=data)

# Post stuff
@api.put("post/create", response={201: dict, 400:dict})
def postCreate(request, data: postSchema):
    return api_post_create(request=request, data=data)

@api.get("post/following")
def postFollowing(request, offset: int = -1):
    return api_post_list_following(request=request, offset=offset)

@api.get("post/recent")
def postRecent(request, offset: int = -1):
    return api_post_list_recent(request=request, offset=offset)

@api.get("post/user/{str:username}", response={200: dict, 404: dict})
def postUser(request,  username, offset: int = -1):
    return api_post_list_user(request=request, username=username, offset=offset)

@api.post("post/like", response={200: dict, 404: dict})
def likeAdd(request, data: likeSchema):
    return api_post_like_add(request=request, data=data)

@api.delete("post/like", response={200: dict, 404: dict})
def likeRemove(request, data: likeSchema):
    return api_post_like_remove(request=request, data=data)

# Comment stuff
@api.get("comments", response={200: dict, 404: dict, 400: dict})
def commentList(request, id: int, comment: bool, offset: int = -1):
    return api_comment_list(request=request, is_comment=comment, id=id, offset=offset)

@api.put("comment/create", response={201: dict, 400:dict})
def postCreate(request, data: commentSchema):
    return api_comment_create(request=request, data=data)

@api.post("comment/like", response={200: dict, 404: dict})
def likeAdd(request, data: likeSchema):
    return api_comment_like_add(request=request, data=data)

@api.delete("comment/like", response={200: dict, 404: dict})
def likeRemove(request, data: likeSchema):
    return api_comment_like_remove(request=request, data=data)

# Information
@api.get("info/username")
def usernameGet(request):
    return api_info_username(request=request)

urlpatterns = [
    path("", api.urls)
]
