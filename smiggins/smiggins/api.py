from django.urls import path

from backend.api_admin   import *
from backend.api_comment import *
from backend.api_info    import *
from backend.api_post    import *
from backend.api_user    import *

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
api.patch ("user/settings", response=response_schema)(api_user_settings)
api.post  ("user/follower", response=response_schema)(api_user_follower_add)
api.delete("user/follower", response=response_schema)(api_user_follower_remove)
api.delete("user",          response=response_schema)(api_user_delete) #how should I space this

# Post stuff
api.put("post/create",    response=response_schema)(api_post_create)
api.put("comment/create", response=response_schema)(api_comment_create)
api.put("quote/create",   response=response_schema)(api_quote_create)

api.get("post/following", response=response_schema)(api_post_list_following)
api.get("post/recent",    response=response_schema)(api_post_list_recent)
api.get("post/user/{str:username}", response=response_schema)(api_post_list_user)
api.get("comments",       response=response_schema)(api_comment_list)

api.delete("post",    response=response_schema)(api_post_delete)
api.delete("comment", response=response_schema)(api_comment_delete)

api.post  ("post/like", response=response_schema)(api_post_like_add)
api.delete("post/like", response=response_schema)(api_post_like_remove)
api.post  ("comment/like", response=response_schema)(api_comment_like_add)
api.delete("comment/like", response=response_schema)(api_comment_like_remove)

# Admin stuff
api.get("admin/info", response=response_schema)(api_admin_account_info)

# Information
api.get("info/username", response=response_schema)(api_info_username)

urlpatterns = [
    path("", api.urls) # type: ignore
]
