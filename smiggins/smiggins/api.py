import json
from typing import Callable

from backend.api import (ApiAdmin, ApiComment, ApiEmail, ApiInfo, ApiMessages,
                         ApiPost, ApiUser)
from backend.variables import (ENABLE_BADGES, ENABLE_EDITING_POSTS,
                               ENABLE_EMAIL, ENABLE_HASHTAGS,
                               ENABLE_NEW_ACCOUNTS, ENABLE_POST_DELETION,
                               ENABLE_PRIVATE_MESSAGES, ENABLE_QUOTES,
                               SITE_NAME, VERSION)
from django.urls import path
from ninja import NinjaAPI
from ninja.renderers import BaseRenderer


class JSONRenderer(BaseRenderer):
    media_type = "application/json"

    def render(self, request, data, *, response_status):
        try:
            return json.dumps(data)

        except TypeError:
            return data()

api = NinjaAPI(
    renderer=JSONRenderer(),
    title=SITE_NAME,
    version=VERSION
)

routes: list[tuple[str, str, Callable, bool | None, str, str, str | list[str]]] = [
#   ["path/to/endpoint", "METHOD", function,, requirements, "summary", "description", "group"]
    ("user/signup", "POST", ApiUser.signup, ENABLE_NEW_ACCOUNTS, "Sign up", "Handles signing up for a new account", "User"),
    ("user/login", "POST", ApiUser.login, None, "Log in", "Handles logging in to an account", "User"),
    ("user/notifications", "GET", ApiUser.notifications_list, None, "Get notification list", "Returns a list of notifications for a user", "User"),
    ("user/notifications", "DELETE", ApiUser.read_notifs, None, "Read notification", "Marks notifications as read", "User"),
    ("user/settings/theme", "PATCH", ApiUser.settings_theme, None, "Set theme", "Sets the user's theme", "User"),
    ("user/settings", "PATCH", ApiUser.settings, None, "Set settings", "Sets all global settings for a user besides theme", "User"),
    ("user/password", "PATCH", ApiUser.change_password, None, "Set password", "Handles changing a user's password", "User"),
    ("user/follow", "POST", ApiUser.follower_add, None, "Follow", "Handles following someone", "User"),
    ("user/follow", "DELETE", ApiUser.follower_remove, None, "Unfollow", "Handles unfollowing someone", "User"),
    ("user/pending", "GET", ApiUser.list_pending, None, "Follow request list", "Lists pending follow requests", "User"),
    ("user/pending", "POST", ApiUser.accept_pending, None, "Accept follow request", "Accepts a follow request", "User"),
    ("user/pending", "DELETE", ApiUser.remove_pending, None, "Deny follow request", "Denies a follow request", "User"),
    ("user/block", "POST", ApiUser.block_add, None, "Block", "Blocks another user", "User"),
    ("user/block", "DELETE", ApiUser.block_remove, None, "Unblock", "Unblocks another user", "User"),
    ("user/pin", "PATCH", ApiPost.pin_post, None, "Pin", "Pins a post to your profile", ["User", "Post"]),
    ("user/pin", "DELETE", ApiPost.unpin_post, None, "Unpin", "Unpins a post to your profile", ["User", "Post"]),
    ("user", "DELETE", ApiUser.user_delete, None, "Delete Account", "Deletes the current account", "User"),
    ("comment/create", "PUT", ApiComment.comment_create, None, "Create comment", "Handles creating a comment", "Comment"),
    ("quote/create", "PUT", ApiPost.quote_create, ENABLE_QUOTES, "Create quote", "Handles quoting a post", "Post"),
    ("post/create", "PUT", ApiPost.post_create, None, "Create post", "Handles creating a post", "Post"),
    ("post/user/{str:username}", "GET", ApiPost.post_list_user, None, "User timeline", "Returns a list of the posts from a user", ["Post", "Timeline"]),
    ("post/following", "GET", ApiPost.post_list_following, None, "Following timeline", "Returns a list of posts for your following timeline", ["Post", "Timeline"]),
    ("post/recent", "GET", ApiPost.post_list_recent, None, "Recent timeline", "Returns a list of the most recent posts for the recent timeline", ["Post", "Timeline"]),
    ("comments", "GET", ApiComment.comment_list, None, "Comment timeline", "Returns a list of comments for a post", ["Comment", "Timeline"]),
    ("hashtag/{str:hashtag}", "GET", ApiPost.hashtag_list, ENABLE_HASHTAGS, "Hashtag timeline", "Returns a list of posts with a hashtag", ["Post", "Timeline"]),
    ("post", "DELETE", ApiPost.post_delete, ENABLE_POST_DELETION, "Delete post", "Deletes a post", "Post"),
    ("comment", "DELETE", ApiComment.comment_delete, ENABLE_POST_DELETION, "Delete comment", "Deletes a comment", "Comment"),
    ("post/like", "POST", ApiPost.post_like_add, None, "Like post", "Likes a post", "Post"),
    ("post/like", "DELETE", ApiPost.post_like_remove, None, "Unlike post", "Removes a like from a post", "Post"),
    ("comment/like", "POST", ApiComment.comment_like_add, None, "Like comment", "Likes a comment", "Comment"),
    ("comment/like", "DELETE", ApiComment.comment_like_remove, None, "Unlike comment", "Removes a like from a comment", "Comment"),
    ("post/edit", "PATCH", ApiPost.edit, ENABLE_EDITING_POSTS, "Edit post", "Handles editing a post", "Post"),
    ("comment/edit", "PATCH", ApiComment.edit, ENABLE_EDITING_POSTS, "Edit comment", "Handles editing a comment", "Comment"),
    ("post/vote", "POST", ApiPost.poll_vote, None, "Poll voting", "Handles voting in a poll", "Post"),
    ("messages/list", "GET", ApiMessages.recent_messages, ENABLE_PRIVATE_MESSAGES, "Recent messages", "Returns a list of recent people who've messaged you", "Message"),
    ("messages/new", "POST", ApiMessages.container_create, ENABLE_PRIVATE_MESSAGES, "Message someone new", "Handles creating a message group between you and another person", "Message"),
    ("messages", "GET", ApiMessages.messages_list, ENABLE_PRIVATE_MESSAGES, "List messages", "Lists recent messages with someone", "Message"),
    ("messages", "POST", ApiMessages.send_message, ENABLE_PRIVATE_MESSAGES, "Send message", "Sends a message to someone", "Message"),
    ("admin/user", "DELETE", ApiAdmin.user_delete, None, "Delete account", "Deletes a user's account", ["Admin", "User"]),
    ("admin/badge", "POST", ApiAdmin.badge_add, ENABLE_BADGES, "Add badge", "Adds a badge to a user", "Admin"),
    ("admin/badge", "PATCH", ApiAdmin.badge_remove, ENABLE_BADGES, "Remove badge", "Removes a badge from a user", "Admin"),
    ("admin/badge", "PUT", ApiAdmin.badge_create, ENABLE_BADGES, "New badge", "Creates a new badge", "Admin"),
    ("admin/badge", "DELETE", ApiAdmin.badge_delete, ENABLE_BADGES, "Delete badge", "Deletes an existing badge", "Admin"),
    ("admin/info", "GET", ApiAdmin.account_info, None, "Get account info", "Returns basic public information about a user", "Admin"),
    ("admin/save-acc", "PATCH", ApiAdmin.account_save, None, "Save account info", "Saves basic information about a user's account", "Admin"),
    ("admin/level", "GET", ApiAdmin.load_level, None, "Load permissions", "Loads the admin permissions for a user", "Admin"),
    ("admin/level", "PATCH", ApiAdmin.set_level, None, "Set permissions", "Sets the admin permissions for a user", "Admin"),
    ("admin/logs", "GET", ApiAdmin.logs, None, "Get logs", "Returns a list of admin logs", "Admin"),
    ("email/password", "POST", ApiEmail.password_reset, ENABLE_EMAIL, "Reset password", "Sends an email that allows the user to reset their password if forgotten", ["Email", "User"]),
    ("email/save", "POST", ApiEmail.set_email, ENABLE_EMAIL, "Set email", "Sets the email for a user", ["Email", "User"]),
    ("info/notifications", "GET", ApiInfo.notifications, None, "Notifications", "Returns the status of any notifications", ["Misc", "User"]),
    ("info/version", "GET", ApiInfo.version, None, "Get version", "Returns the real version of the server. Isn't based on the configuration in settings", "Misc")
]

for route in routes:
    if route[3] is None or route[3]:
        getattr(api, route[1].lower())(
            route[0],
            response={
                200: dict,
                400: dict,
                404: dict,
                429: dict
            },
            summary=route[4],
            description=route[5],
            tags=[route[6]] if isinstance(route[6], str) else route[6]
        )(route[2])

urlpatterns = [
    path("", api.urls) # type: ignore
]
