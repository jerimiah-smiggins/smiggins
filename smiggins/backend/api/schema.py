# For ninja api schemas

import sys
from typing import Any, Literal

from ninja import Schema

if sys.version_info >= (3, 11):
    from typing import NotRequired, TypedDict
else:
    from typing_extensions import NotRequired, TypedDict


class Username(Schema):
    username: str

# admin.py

class AccountIdentifier(Schema):
    identifier: str | int
    use_id: bool

class DeleteBadge(Schema):
    badge_name: str

class NewBadge(DeleteBadge):
    badge_data: str

class OTPName(Schema):
    otp: str

class UserBadge(AccountIdentifier):
    badge_name: str

class SaveUser(Schema):
    displ_name: str
    bio: str
    id: int

class UserLevel(AccountIdentifier):
    level: int

# comment.py

class NewComment(Schema):
    c_warning: str
    content: str
    comment: bool
    id: int
    private: bool

class EditComment(Schema):
    c_warning: str
    content: str
    private: bool
    id: int

class CommentID(Schema):
    id: int

# email.py

class Email(Schema):
    email: str
    password: str

# messages.py

class NewContainer(Username):
    ...

class NewMessage(Schema):
    username: str
    content: str

# post.py

class NewPost(Schema):
    c_warning: str
    content: str
    poll: list[str]
    private: bool

class EditPost(Schema):
    c_warning: str
    content: str
    private: bool
    id: int

class NewQuote(Schema):
    c_warning: str
    content: str
    quote_id: int
    quote_is_comment: bool
    private: bool

class PostID(Schema):
    id: int

class Poll(Schema):
    id: int
    option: int

# user.py

class Password(Schema):
    password: str

class Account(Username):
    password: str
    otp: str | None = None

class ChangePassword(Schema):
    password: str
    new_password: str

class Theme(Schema):
    theme: str

class Settings(Schema):
    bio: str
    lang: str
    color: str
    pronouns: str
    color_two: str
    displ_name: str
    is_gradient: bool
    approve_followers: bool
    default_post_visibility: str

# types
_postJSON = dict

class _actions_timeline_extra(TypedDict):
    type: Literal["user"]
    pinned: _postJSON | None
    bio: str
    followers: int
    following: int

class _actions_timeline(TypedDict):
    name: Literal["populate_timeline"]
    end: bool
    extra: NotRequired[_actions_timeline_extra]
    posts: list[_postJSON]

class _actions_prepend(TypedDict):
    name: Literal["prepend_timeline"]
    post: _postJSON
    comment: bool

class _actions_reset(TypedDict):
    name: Literal["reset_post_html"]
    post_id: int
    comment: bool
    post: _postJSON

class _actions_remove(TypedDict):
    name: Literal["remove_from_timeline"]
    post_id: int
    comment: bool

class _actions_refresh(TypedDict):
    name: Literal["refresh_timeline"]
    url_includes: NotRequired[list[str]]
    special: NotRequired[Literal["notifications", "pending", "message"]]

class _actions_user_tl_user(TypedDict):
    username: str
    display_name: str
    badges: list[str]
    color_one: str
    color_two: str
    gradient_banner: bool
    bio: str
    timestamp: NotRequired[int]
    unread: NotRequired[bool]

class _actions_user_tl(TypedDict):
    name: Literal["user_timeline"]
    users: list[_actions_user_tl_user]
    more: bool
    special: NotRequired[Literal["pending", "messages"]]

class _actions_notification_list(TypedDict):
    data: _postJSON
    read: bool
    event_type: str

class _actions_notification(TypedDict):
    name: Literal["notification_list"]
    notifications: list[_actions_notification_list]

class _actions_admin_info(TypedDict):
    name: Literal["admin_info"]
    username: str
    user_id: int
    bio: str
    displ_name: str
    token: NotRequired[str | None]

class _actions_admin_log_item(TypedDict):
    type: str
    by: str
    target: str | None
    info: str
    timestamp: int

class _actions_admin_log(TypedDict):
    name: Literal["admin_log"]
    content: list[_actions_admin_log_item]

class _actions_message_message(TypedDict):
    content: str
    from_self: bool
    id: int
    timestamp: int

class _actions_message(TypedDict):
    name: Literal["message_list"]
    messages: list[_actions_message_message]
    more: bool
    forward: bool

class _actions_auth(TypedDict):
    name: Literal["set_auth"]
    token: str

class _actions_localstorage(TypedDict):
    name: Literal["localstorage"]
    key: str
    value: Any

class _actions_reload(TypedDict):
    name: Literal["reload"]

class _actions_redirect(TypedDict):
    name: Literal["redirect"]
    to: Literal["message", "home", "logout"]
    extra: NotRequired[str]

class _actions_theme(TypedDict):
    name: Literal["set_theme"]
    auto: bool
    theme: dict | None

class _actions_element_class(TypedDict):
    class_name: str
    enable: bool

class _actions_element_attribute(TypedDict):
    name: str
    value: str | None

class _actions_element(TypedDict):
    name: Literal["update_element"]
    query: str
    all: NotRequired[bool]
    inc: NotRequired[int]
    text: NotRequired[str]
    html: NotRequired[str]
    value: NotRequired[str]
    focus: NotRequired[Any]
    checked: NotRequired[bool]
    disabled: NotRequired[bool]
    attribute: NotRequired[list[_actions_element_attribute]]
    set_class: NotRequired[list[_actions_element_class]]

class _actions(TypedDict):
    success: bool
    message: NotRequired[str]
    actions: NotRequired[list[
        _actions_timeline
      | _actions_prepend
      | _actions_reset
      | _actions_remove
      | _actions_refresh
      | _actions_user_tl
      | _actions_notification
      | _actions_admin_info
      | _actions_admin_log
      | _actions_message
      | _actions_auth
      | _actions_localstorage
      | _actions_reload
      | _actions_redirect
      | _actions_theme
      | _actions_element
    ]]

APIResponse = tuple[int, _actions] | _actions
