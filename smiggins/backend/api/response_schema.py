from ninja import Schema


class RGeneric(Schema):
    success: bool = True

class RReason(Schema):
    success: bool = False
    reason: str | None = None

generic_response = { 200: RGeneric, 400: RReason }
generic_with_404 = { 200: RGeneric, 400: RReason, 404: RReason }
generic_with_ratelimit = { 200: RGeneric, 400: RReason, 429: RReason }

# admin.py

class RAccountInfo(RGeneric):
    username: str
    user_id: int
    bio: str
    displ_name: str
    token: str | None = None

class RAccountPermissions(RGeneric):
    level: int

class RAdminLogContent(Schema):
    type: str
    by: str
    info: str
    timestamp: int
    target: str

class RAdminLogs(RGeneric):
    content: list[RAdminLogContent]

# comment.py + post.py

class RTimeline(RGeneric):
    posts: list
    end: bool

class RPostJSON(RGeneric):
    post: dict

class RUserList(RGeneric):
    posts: list
    end: bool
    can_view: bool
    following: int
    followers: int
    bio: str
    self: bool
    pinned: dict

# info.py

class RUsername(RGeneric):
    username: str

class RNotificationStatus(RGeneric):
    notifications: bool
    messages: bool
    followers: bool

class RVersion(RGeneric):
    version: list[int]

# messages.py

class RMessageList(RGeneric):
    messages: list
    more: bool

# user.py

# i need to migrate signup/login to success but i'm too lazy
class RValid(Schema):
    valid: bool = True

class RValidReason(Schema):
    valid: bool = False
    reason: str | None = None

class RToken(RValid):
    token: str

class RFollow(RGeneric):
    pending: bool

class RNotificationsList(RGeneric):
    notifications: list

class RPendingFollowers(RGeneric):
    more: bool
    pending: list
