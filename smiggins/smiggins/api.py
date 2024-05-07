from django.urls import path

from backend.collect_api import ApiAdmin, ApiComment, ApiInfo, ApiPost, ApiUser, ApiMessage
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
api.post("user/signup", response=response_schema)(ApiUser.signup)
api.post("user/login",  response=response_schema)(ApiUser.login)

# User stuff
api.get   ("user/notifications",  response=response_schema)(ApiUser.notifications_list)
api.delete("user/notifications",  response=response_schema)(ApiUser.read_notifs)
api.patch ("user/settings/theme", response=response_schema)(ApiUser.settings_theme)
api.patch ("user/password", response=response_schema)(ApiUser.change_password)
api.patch ("user/settings", response=response_schema)(ApiUser.settings)
api.post  ("user/follower", response=response_schema)(ApiUser.follower_add)
api.delete("user/follower", response=response_schema)(ApiUser.follower_remove)
api.post  ("user/block", response=response_schema)(ApiUser.block_add)
api.delete("user/block", response=response_schema)(ApiUser.block_remove)

# Post stuff
api.put("post/create",    response=response_schema)(ApiPost.post_create)
api.put("comment/create", response=response_schema)(ApiComment.comment_create)
api.put("quote/create",   response=response_schema)(ApiPost.quote_create)

api.get("post/user/{str:username}", response=response_schema)(ApiPost.post_list_user)
api.get("post/following", response=response_schema)(ApiPost.post_list_following)
api.get("post/recent",    response=response_schema)(ApiPost.post_list_recent)
api.get("comments",       response=response_schema)(ApiComment.comment_list)

api.delete("post",    response=response_schema)(ApiPost.post_delete)
api.delete("comment", response=response_schema)(ApiComment.comment_delete)

api.post  ("post/like",    response=response_schema)(ApiPost.post_like_add)
api.delete("post/like",    response=response_schema)(ApiPost.post_like_remove)
api.post  ("comment/like", response=response_schema)(ApiComment.comment_like_add)
api.delete("comment/like", response=response_schema)(ApiComment.comment_like_remove)

api.patch ("user/pin", response=response_schema)(ApiPost.pin_post)
api.delete("user/pin", response=response_schema)(ApiPost.unpin_post)

# Message stuff
api.post  ("messages/new", response=response_schema)(ApiMessage.container_create)

# Admin stuff
api.get   ("admin/info",     response=response_schema)(ApiAdmin.account_info)
api.delete("admin/user",     response=response_schema)(ApiAdmin.user_delete)
api.patch ("admin/save-acc", response=response_schema)(ApiAdmin.account_save)
api.patch ("admin/level",    response=response_schema)(ApiAdmin.set_level)
api.get   ("admin/logs",     response=response_schema)(ApiAdmin.logs)

api.post  ("admin/badge", response=response_schema)(ApiAdmin.badge_add)    # Add badge to user
api.put   ("admin/badge", response=response_schema)(ApiAdmin.badge_create) # New badge
api.delete("admin/badge", response=response_schema)(ApiAdmin.badge_delete) # Delete badge
api.patch ("admin/badge", response=response_schema)(ApiAdmin.badge_remove) # Remove badge from user

# Information
api.get("info/username", response=response_schema)(ApiInfo.username)
api.get("info/notifications", response=response_schema)(ApiInfo.notifications)

urlpatterns = [
    path("", api.urls) # type: ignore
]
