from .admin import (account_info, account_save, badge_add, badge_create,
                    badge_delete, badge_remove, load_level, logs, set_level,
                    user_delete)
from .comment import (comment_create, comment_delete, comment_like_add,
                      comment_like_remove, comment_list)
from .email import password_reset, set_email
from .info import notifications, username, version
from .messages import (container_create, messages_list, recent_messages,
                       send_message)
from .post import (hashtag_list, pin_post, poll_vote, post_create, post_delete,
                   post_like_add, post_like_remove, post_list_following,
                   post_list_recent, post_list_user, quote_create, unpin_post)
from .user import (accept_pending, block_add, block_remove, change_password,
                   follower_add, follower_remove, list_pending, login,
                   notifications_list, read_notifs, remove_pending, settings,
                   settings_theme, signup)


class ApiAdmin:
    account_info = account_info
    account_save = account_save
    badge_add = badge_add
    badge_create = badge_create
    badge_delete = badge_delete
    badge_remove = badge_remove
    logs = logs
    set_level = set_level
    load_level = load_level
    user_delete = user_delete

class ApiComment:
    comment_create = comment_create
    comment_delete = comment_delete
    comment_like_add = comment_like_add
    comment_like_remove = comment_like_remove
    comment_list = comment_list

class ApiEmail:
    password_reset = password_reset
    set_email = set_email

class ApiInfo:
    notifications = notifications
    username = username
    version = version

class ApiMessages:
    container_create = container_create
    messages_list = messages_list
    recent_messages = recent_messages
    send_message = send_message

class ApiPost:
    hashtag_list = hashtag_list
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
    poll_vote = poll_vote

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
    list_pending = list_pending
    accept_pending = accept_pending
    remove_pending = remove_pending
