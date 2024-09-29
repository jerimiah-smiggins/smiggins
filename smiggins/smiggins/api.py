import json
from typing import Any, Callable

from backend.api import (ApiAdmin, ApiComment, ApiEmail, ApiInfo, ApiMessages,
                         ApiPost, ApiUser)
from backend.api.response_schema import (RAccountInfo, RAccountPermissions,
                                         RAdminLogs, RFollow, RMessageList,
                                         RNotificationsList,
                                         RNotificationStatus,
                                         RPendingFollowers, RPostJSON, RReason,
                                         RTimeline, RToken, RUserList,
                                         RUsername, RValidReason, RVersion,
                                         generic_response, generic_with_404,
                                         generic_with_ratelimit)
from backend.variables import (ENABLE_BADGES, ENABLE_EDITING_POSTS,
                               ENABLE_EMAIL, ENABLE_HASHTAGS,
                               ENABLE_NEW_ACCOUNTS, ENABLE_POST_DELETION,
                               ENABLE_PRIVATE_MESSAGES, ENABLE_QUOTES,
                               SITE_NAME, VERSION)
from django.urls import path
from ninja import NinjaAPI, Schema
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

routes: list[tuple[str, str, Callable, Schema | dict[int, Any], bool | None, str, str, str | list[str]]] = [
#   ["path/to/endpoint", "METHOD", function, response_schema, requirements, "summary", "description", "group"]
    ("user/signup", "POST", ApiUser.signup, { 200: RToken, 400: RValidReason, 429: RValidReason }, ENABLE_NEW_ACCOUNTS, "Sign up", "Handles signing up for a new account", "User"),
    ("user/login", "POST", ApiUser.login, { 200: RToken, 400: RValidReason, 429: RValidReason }, None, "Log in", "Handles logging in to an account", "User"),
    ("user/notifications", "GET", ApiUser.notifications_list, { 200: RNotificationsList, 400: RReason }, None, "Get notification list", "Returns a list of notifications for a user", "User"),
    ("user/notifications", "DELETE", ApiUser.read_notifs, generic_response, None, "Read notification", "Marks notifications as read", "User"),
    ("user/settings/theme", "PATCH", ApiUser.settings_theme, generic_response, None, "Set theme", "Sets the user's theme", "User"),
    ("user/settings", "PATCH", ApiUser.settings, generic_response, None, "Set settings", "Sets all global settings for a user besides theme", "User"),
    ("user/password", "PATCH", ApiUser.change_password, generic_response, None, "Set password", "Handles changing a user's password", "User"),
    ("user/follower", "POST", ApiUser.follower_add, { 200: RFollow, 400: RReason }, None, "Follow", "Handles following someone", "User"),
    ("user/follower", "DELETE", ApiUser.follower_remove, generic_response, None, "Unfollow", "Handles unfollowing someone", "User"),
    ("user/pending", "GET", ApiUser.list_pending, { 200: RPendingFollowers }, None, "Follow request list", "Lists pending follow requests", "User"),
    ("user/pending", "POST", ApiUser.accept_pending, generic_response, None, "Accept follow request", "Accepts a follow request", "User"),
    ("user/pending", "DELETE", ApiUser.remove_pending, generic_response, None, "Deny follow request", "Denies a follow request", "User"),
    ("user/block", "POST", ApiUser.block_add, generic_response, None, "Block", "Blocks another user", "User"),
    ("user/block", "DELETE", ApiUser.block_remove, generic_response, None, "Unblock", "Unblocks another user", "User"),
    ("user/pin", "PATCH", ApiPost.pin_post, generic_with_404, None, "Pin", "Pins a post to your profile", ["User", "Post"]),
    ("user/pin", "DELETE", ApiPost.unpin_post, generic_response, None, "Unpin", "Unpins a post to your profile", ["User", "Post"]),
    ("comment/create", "PUT", ApiComment.comment_create, generic_with_ratelimit, None, "Create comment", "Handles creating a comment", "Comment"),
    ("quote/create", "PUT", ApiPost.quote_create, { 200: RPostJSON, 400: RReason, 429: RReason }, ENABLE_QUOTES, "Create quote", "Handles quoting a post", "Post"),
    ("post/create", "PUT", ApiPost.post_create, generic_response, None, "Create post", "Handles creating a post", "Post"),
    ("post/user/{str:username}", "GET", ApiPost.post_list_user, { 200: RUserList, 400: RReason, 404: RReason }, None, "User timeline", "Returns a list of the posts from a user", ["Post", "Timeline"]),
    ("post/following", "GET", ApiPost.post_list_following, { 200: RTimeline, 400: RReason }, None, "Following timeline", "Returns a list of posts for your following timeline", ["Post", "Timeline"]),
    ("post/recent", "GET", ApiPost.post_list_recent, { 200: RTimeline, 400: RReason }, None, "Recent timeline", "Returns a list of the most recent posts for the recent timeline", ["Post", "Timeline"]),
    ("comments", "GET", ApiComment.comment_list, { 200: RTimeline, 400: RReason }, None, "Comment timeline", "Returns a list of comments for a post", ["Comment", "Timeline"]),
    ("hashtag/{str:hashtag}", "GET", ApiPost.hashtag_list, { 200: RTimeline, 400: RReason }, ENABLE_HASHTAGS, "Hashtag timeline", "Returns a list of posts with a hashtag", ["Post", "Timeline"]),
    ("post", "DELETE", ApiPost.post_delete, generic_with_404, ENABLE_POST_DELETION, "Delete post", "Deletes a post", "Post"),
    ("comment", "DELETE", ApiComment.comment_delete, generic_with_404, ENABLE_POST_DELETION, "Delete comment", "Deletes a comment", "Comment"),
    ("post/like", "POST", ApiPost.post_like_add, generic_with_404, None, "Like post", "Likes a post", "Post"),
    ("post/like", "DELETE", ApiPost.post_like_remove, generic_with_404, None, "Unlike post", "Removes a like from a post", "Post"),
    ("comment/like", "POST", ApiComment.comment_like_add, generic_response, None, "Like comment", "Likes a comment", "Comment"),
    ("comment/like", "DELETE", ApiComment.comment_like_remove, generic_with_404, None, "Unlike comment", "Removes a like from a comment", "Comment"),
    ("post/edit", "PATCH", ApiPost.edit, { 200: RPostJSON, 400: RReason, 404: RReason }, ENABLE_EDITING_POSTS, "Edit post", "Handles editing a post", "Post"),
    ("comment/edit", "PATCH", ApiComment.edit, { 200: RPostJSON, 400: RReason, 404: RReason }, ENABLE_EDITING_POSTS, "Edit comment", "Handles editing a comment", "Comment"),
    ("post/vote", "POST", ApiPost.poll_vote, generic_response, None, "Poll voting", "Handles voting in a poll", "Post"),
    ("messages/list", "GET", ApiMessages.recent_messages, { 200: RMessageList, 400: RReason }, ENABLE_PRIVATE_MESSAGES, "Recent messages", "Returns a list of recent people who've messaged you", "Message"),
    ("messages/new", "POST", ApiMessages.container_create, generic_response, ENABLE_PRIVATE_MESSAGES, "Message someone new", "Handles creating a message group between you and another person", "Message"),
    ("messages", "GET", ApiMessages.messages_list, { 200: RMessageList }, ENABLE_PRIVATE_MESSAGES, "List messages", "Lists recent messages with someone", "Message"),
    ("messages", "POST", ApiMessages.send_message, generic_with_404, ENABLE_PRIVATE_MESSAGES, "Send message", "Sends a message to someone", "Message"),
    ("admin/user", "DELETE", ApiAdmin.user_delete, generic_with_404, None, "Delete account", "Deletes a user's account", ["Admin", "User"]),
    ("admin/badge", "POST", ApiAdmin.badge_add, generic_with_404, ENABLE_BADGES, "Add badge", "Adds a badge to a user", "Admin"),
    ("admin/badge", "PATCH", ApiAdmin.badge_remove, generic_with_404, ENABLE_BADGES, "Remove badge", "Removes a badge from a user", "Admin"),
    ("admin/badge", "PUT", ApiAdmin.badge_create, generic_response, ENABLE_BADGES, "New badge", "Creates a new badge", "Admin"),
    ("admin/badge", "DELETE", ApiAdmin.badge_delete, generic_response, ENABLE_BADGES, "Delete badge", "Deletes an existing badge", "Admin"),
    ("admin/info", "GET", ApiAdmin.account_info, { 200: RAccountInfo, 400: RReason, 404: RReason }, None, "Get account info", "Returns basic public information about a user", "Admin"),
    ("admin/save-acc", "PATCH", ApiAdmin.account_save, generic_with_404, None, "Save account info", "Saves basic information about a user's account", "Admin"),
    ("admin/level", "GET", ApiAdmin.load_level, { 200: RAccountPermissions, 400: RReason, 404: RReason }, None, "Load permissions", "Loads the admin permissions for a user", "Admin"),
    ("admin/level", "PATCH", ApiAdmin.set_level, generic_with_404, None, "Set permissions", "Sets the admin permissions for a user", "Admin"),
    ("admin/logs", "GET", ApiAdmin.logs, { 200: RAdminLogs, 400: RReason }, None, "Get logs", "Returns a list of admin logs", "Admin"),
    ("email/password", "POST", ApiEmail.password_reset, generic_response, ENABLE_EMAIL, "Reset password", "Sends an email that allows the user to reset their password if forgotten", ["Email", "User"]),
    ("email/save", "POST", ApiEmail.set_email, generic_response, ENABLE_EMAIL, "Set email", "Sets the email for a user", ["Email", "User"]),
    ("info/username", "GET", ApiInfo.username, { 200: RUsername, 400: RReason }, None, "Get username", "Returns the current user's username", ["Misc", "User"]),
    ("info/notifications", "GET", ApiInfo.notifications, { 200: RNotificationStatus, 400: RReason }, None, "Notifications", "Returns the status of any notifications", ["Misc", "User"]),
    ("info/version", "GET", ApiInfo.version, { 200: RVersion }, None, "Get version", "Returns the real version of the server. Isn't based on the configuration in settings", "Misc")
]

for route in routes:
    if route[4] is None or route[4]:
        getattr(api, route[1].lower())(route[0], response=route[3], summary=route[5], description=route[6], tags=[route[7]] if isinstance(route[7], str) else route[7])(route[2])

urlpatterns = [
    path("", api.urls) # type: ignore
]
