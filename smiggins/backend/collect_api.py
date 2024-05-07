from .api_admin import account_info, account_save, badge_add, badge_create, badge_delete, badge_remove, logs, set_level, user_delete
from .api_comment import comment_create, comment_delete, comment_like_add, comment_like_remove, comment_list
from .api_info import notifications, username
from .api_post import post_create, post_delete, post_like_add, post_like_remove, post_list_following, post_list_recent, post_list_user, quote_create, pin_post, unpin_post
from .api_user import block_add, block_remove, change_password, follower_add, follower_remove, login, notifications_list, read_notifs, settings, settings_theme, signup
from .api_messages import container_create

class ApiAdmin:
    account_info = account_info
    account_save = account_save
    badge_add = badge_add
    badge_create = badge_create
    badge_delete = badge_delete
    badge_remove = badge_remove
    logs = logs
    set_level = set_level
    user_delete = user_delete

class ApiComment:
    comment_create = comment_create
    comment_delete = comment_delete
    comment_like_add = comment_like_add
    comment_like_remove = comment_like_remove
    comment_list = comment_list

class ApiInfo:
    notifications = notifications
    username = username

class ApiPost:
    pin_post = pin_post
    post_create = post_create
    post_delete = post_delete
    post_like_add = post_like_add
    post_like_remove = post_like_remove
    post_list_following = post_list_following
    post_list_recent = post_list_recent
    post_list_user = post_list_user
    quote_create = quote_create
    unpin_post = unpin_post

class ApiUser:
    block_add = block_add
    block_remove = block_remove
    change_password = change_password
    follower_add = follower_add
    follower_remove = follower_remove
    login = login
    notifications_list = notifications_list
    read_notifs = read_notifs
    settings = settings
    settings_theme = settings_theme
    signup = signup

class ApiMessage:
    container_create = container_create
