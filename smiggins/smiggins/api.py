from django.urls import path

from backend.api_admin   import api_admin_account_info, api_admin_account_save, api_admin_badge_add, api_admin_badge_create, api_admin_badge_delete, api_admin_badge_remove, api_admin_set_level, api_admin_user_delete, api_admin_logs
from backend.api_comment import api_comment_create, api_comment_delete, api_comment_like_add, api_comment_like_remove, api_comment_list
from backend.api_info    import api_info_username
from backend.api_post    import api_post_create, api_post_delete, api_post_like_add, api_post_like_remove, api_post_list_following, api_post_list_recent, api_post_list_user, api_quote_create
from backend.api_user    import api_account_login, api_account_signup, api_user_follower_add, api_user_follower_remove, api_user_settings, api_user_settings_theme, api_user_block_add, api_user_block_remove
from backend.packages    import json

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
api.patch ("user/settings/theme", response=response_schema)(api_user_settings_theme)
api.patch ("user/settings", response=response_schema)(api_user_settings)
api.post  ("user/follower", response=response_schema)(api_user_follower_add)
api.delete("user/follower", response=response_schema)(api_user_follower_remove)
api.post  ("user/block", response=response_schema)(api_user_block_add)
api.delete("user/block", response=response_schema)(api_user_block_remove)

# Post stuff
api.put("post/create",    response=response_schema)(api_post_create)
api.put("comment/create", response=response_schema)(api_comment_create)
api.put("quote/create",   response=response_schema)(api_quote_create)

api.get("post/user/{str:username}", response=response_schema)(api_post_list_user)
api.get("post/following", response=response_schema)(api_post_list_following)
api.get("post/recent",    response=response_schema)(api_post_list_recent)
api.get("comments",       response=response_schema)(api_comment_list)

api.delete("post",    response=response_schema)(api_post_delete)
api.delete("comment", response=response_schema)(api_comment_delete)

api.post  ("post/like",    response=response_schema)(api_post_like_add)
api.delete("post/like",    response=response_schema)(api_post_like_remove)
api.post  ("comment/like", response=response_schema)(api_comment_like_add)
api.delete("comment/like", response=response_schema)(api_comment_like_remove)

# Admin stuff
api.get   ("admin/info",     response=response_schema)(api_admin_account_info)
api.delete("admin/user",     response=response_schema)(api_admin_user_delete)
api.patch ("admin/save-acc", response=response_schema)(api_admin_account_save)
api.patch ("admin/level",    response=response_schema)(api_admin_set_level)
api.get   ("admin/logs",     response=response_schema)(api_admin_logs)

api.post  ("admin/badge", response=response_schema)(api_admin_badge_add)    # Add badge to user
api.put   ("admin/badge", response=response_schema)(api_admin_badge_create) # New badge
api.delete("admin/badge", response=response_schema)(api_admin_badge_delete) # Delete badge
api.patch ("admin/badge", response=response_schema)(api_admin_badge_remove) # Remove badge from user

# Information
api.get("info/username", response=response_schema)(api_info_username)

urlpatterns = [
    path("", api.urls) # type: ignore
]
