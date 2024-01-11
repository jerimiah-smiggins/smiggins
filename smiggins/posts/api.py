from django.urls import path

from _server_module._api_user import *

from ninja import NinjaAPI, Schema
from ninja.renderers import BaseRenderer
import json



class JSONRenderer(BaseRenderer):
    media_type = "application/json"

    def render(self, request, data, *, response_status):
        try:
            return json.dumps(data)
        except TypeError:
            return data()

api = NinjaAPI(renderer=JSONRenderer())


class accountSchema(Schema):
    username: str
    password: str

class followerSchema(Schema):
    username: str

# (api_account_signup)
@api.post("user/signup")
def signup(request, data: accountSchema):
    print(data.username, data.password)
    return api_account_signup(request=request, data=data)

# (api_account_login)
@api.post("user/login")
def login(request, data: accountSchema):
    print(data.username + data.password)
    return api_account_login




urlpatterns = [
    path("", api.urls)
]

'''
# Create user api routes
app.route("/api/user/follower/add", methods=["POST"])(api_user_follower_add)
app.route("/api/user/follower/remove", methods=["DELETE"])(api_user_follower_remove)
Just make method change which function? (POST to /api/user/follower does follower add, DELETE does follower remove)
app.route("/api/user/settings/theme", methods=["POST"])(api_user_settings_theme)
app.route("/api/user/settings/color", methods=["POST"])(api_user_settings_color)
app.route("/api/user/settings/display-name", methods=["POST"])(api_user_settings_display_name)
app.route("/api/user/settings/priv", methods=["POST"])(api_user_settings_private)

# Create post api routes
app.route("/api/post/create", methods=["PUT"])(api_post_create)
app.route("/api/post/following", methods=["GET"])(api_post_list_following)
app.route("/api/post/recent", methods=["GET"])(api_post_list_recent)
app.route("/api/post/like/add", methods=["POST"])(api_post_like_add)
app.route("/api/post/like/remove", methods=["DELETE"])(api_post_like_remove)
Just make method change which function? (POST to /api/post/like does like add, DELETE does like remove)
app.route("/api/post/user/<path:user>", methods=["GET"])(api_post_list_user)

# Create comment api routes
app.route("/api/comments", methods=["GET"])(api_comment_list)
Add /list to the end for consistancy? (/api/comment/list)
app.route("/api/comment/create", methods=["PUT"])(api_comment_create)
app.route("/api/comment/like/add", methods=["POST"])(api_comment_like_add)
app.route("/api/comment/like/remove", methods=["DELETE"])(api_comment_like_remove)
Just make method change which function? (POST to /api/comment/like does like add, DELETE does like remove)

# Create info routes
app.route("/api/info/ip", methods=["GET"])(api_info_ip)
app.route("/api/info/username", methods=["GET"])(api_info_username)
Just make it /api/ip , /username ?
'''