from backend.api.admin import (admin_delete_user, delete_otp, generate_otp,
                               get_admin_lvl, list_otps, set_admin_lvl)
from backend.api.messages import (get_gid, send_message, tl_message_groups,
                                  tl_messages)
from backend.api.notifications import notifications
from backend.api.post import (add_like, pin_post, poll_refresh, poll_vote,
                              post_create, post_delete, post_edit, remove_like,
                              unpin_post)
from backend.api.push import sw_get_publickey, sw_register, sw_unregister
from backend.api.timeline import (tl_comments, tl_following, tl_folreq,
                                  tl_global, tl_hashtag, tl_notifications,
                                  tl_search, tl_user, tl_user_followers,
                                  tl_user_following)
from backend.api.user import (block_add, block_remove, change_password,
                              delete_account, follow_add, follow_remove,
                              folreq_accept, folreq_deny, get_profile, login,
                              save_profile, set_post_visibility,
                              set_verify_followers, signup)
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
api.post("user/follow-request")(folreq_accept)
api.delete("user/follow-request")(folreq_deny)

api.get("user")(get_profile)
api.patch("user")(save_profile)
api.delete("user")(delete_account)
api.patch("user/password")(change_password)

api.patch("user/default_post")(set_post_visibility)
api.patch("user/verify_followers")(set_verify_followers)

api.delete("admin/user")(admin_delete_user)
api.get("admin/invite")(list_otps)
api.post("admin/invite")(generate_otp)
api.delete("admin/invite")(delete_otp)
api.get("admin/permissions/{str:username}")(get_admin_lvl)
api.post("admin/permissions")(set_admin_lvl)

api.get("timeline/global")(tl_global)
api.get("timeline/following")(tl_following)
api.get("timeline/user/{str:username}")(tl_user)
api.get("timeline/post/{int:post_id}")(tl_comments)
api.get("timeline/notifications")(tl_notifications)
api.get("timeline/tag/{str:tag}")(tl_hashtag)
api.get("timeline/follow-requests")(tl_folreq)
api.get("timeline/search")(tl_search)
api.get("timeline/user/following/{str:username}")(tl_user_following)
api.get("timeline/user/followers/{str:username}")(tl_user_followers)

api.post("post")(post_create)
api.patch("post")(post_edit)
api.delete("post")(post_delete)

api.post("post/like/{int:post_id}")(add_like)
api.delete("post/like/{int:post_id}")(remove_like)

api.post("post/pin/{int:post_id}")(pin_post)
api.delete("post/pin")(unpin_post)

api.get("post/poll/{int:post_id}")(poll_refresh)
api.post("post/poll")(poll_vote)

api.get("message/list")(tl_message_groups)
api.get("messages/{int:gid}")(tl_messages)
api.post("message/{int:gid}")(send_message)
api.get("message/group")(get_gid)

api.get("notifications")(notifications)

api.get("sw/publickey")(sw_get_publickey)
api.post("sw/register")(sw_register)
api.post("sw/unregister")(sw_unregister)

urlpatterns = [
    path("", api.urls)
]
