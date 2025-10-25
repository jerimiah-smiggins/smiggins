from backend.api.notifications import notifications
from backend.api.post import (add_like, pin_post, post_create, post_delete,
                              post_edit, remove_like, unpin_post)
from backend.api.timeline import (tl_comments, tl_following, tl_global,
                                  tl_hashtag, tl_notifications, tl_user)
from backend.api.user import (block_add, block_remove, change_password,
                              delete_account, follow_add, follow_remove,
                              get_profile, login, save_profile,
                              set_post_visibility, set_verify_followers,
                              signup)
from backend.variables import DEBUG, SITE_NAME, VERSION
from django.urls import path
from ninja import NinjaAPI

api = NinjaAPI(
    title=SITE_NAME,
    version=VERSION,
    docs_url="/docs" if DEBUG else None,
    openapi_url="/openapi.json" if DEBUG else None
)

api.post("user/signup")(signup)
api.post("user/login")(login)

api.post("user/follow")(follow_add)
api.delete("user/follow")(follow_remove)
api.post("user/block")(block_add)
api.delete("user/block")(block_remove)

api.get("user")(get_profile)
api.patch("user")(save_profile)
api.delete("user")(delete_account)
api.patch("user/password")(change_password)

api.patch("user/default_post")(set_post_visibility)
api.patch("user/verify_followers")(set_verify_followers)

api.get("timeline/global")(tl_global)
api.get("timeline/following")(tl_following)
api.get("timeline/user/{str:username}")(tl_user)
api.get("timeline/post/{int:post_id}")(tl_comments)
api.get("timeline/notifications")(tl_notifications)
api.get("timeline/tag/{str:tag}")(tl_hashtag)

api.post("post")(post_create)
api.patch("post")(post_edit)
api.delete("post")(post_delete)

api.post("post/like/{int:post_id}")(add_like)
api.delete("post/like/{int:post_id}")(remove_like)

api.post("post/pin/{int:post_id}")(pin_post)
api.delete("post/pin")(unpin_post)

api.get("notifications")(notifications)

urlpatterns = [
    path("", api.urls)
]
