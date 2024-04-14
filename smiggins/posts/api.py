from django.urls import path

from backend.api_user    import *
from backend.api_post    import *
from backend.api_comment import *
from backend.api_info    import *

from ninja.renderers import BaseRenderer
from ninja import NinjaAPI

response_schema = {
    200: dict,
    201: dict,
    400: dict,
    404: dict,
    429: dict
}

class JSONRenderer(BaseRenderer):
    media_type = "application/json"

    def render(self, request, data, *, response_status):
        try:
            return json.dumps(data)

        except TypeError:
            return data()

api = NinjaAPI(renderer=JSONRenderer())

# Account stuff
api.post("user/signup", response=response_schema)(api_account_signup)
api.post("user/login",  response=response_schema)(api_account_login)

# User stuff
api.post("user/settings/theme", response=response_schema)(api_user_settings_theme)
api.post("user/settings/color", response=response_schema)(api_user_settings_color)
api.post("user/settings/priv",  response=response_schema)(api_user_settings_private)
api.post("user/settings/display-name", response=response_schema)(api_user_settings_display_name)

api.post  ("user/follower", response=response_schema)(api_user_follower_add)
api.delete("user/follower", response=response_schema)(api_user_follower_remove)

# Post stuff
api.put("post/create",    response=response_schema)(api_post_create)
api.put("comment/create", response=response_schema)(api_comment_create)
api.put("quote/create",   response=response_schema)(api_quote_create)

api.get("post/following", response=response_schema)(api_post_list_following)
api.get("post/recent",    response=response_schema)(api_post_list_recent)
api.get("post/user/{str:username}", response=response_schema)(api_post_list_user)
api.get("comments",       response=response_schema)(api_comment_list)

api.post  ("post/like", response=response_schema)(api_post_like_add)
api.delete("post/like", response=response_schema)(api_post_like_remove)
api.post  ("comment/like", response=response_schema)(api_comment_like_add)
api.delete("comment/like", response=response_schema)(api_comment_like_remove)

# Comment stuff

# Information
api.get("info/username", response=response_schema)(api_info_username)

urlpatterns = [
    path("", api.urls) # type: ignore
]
