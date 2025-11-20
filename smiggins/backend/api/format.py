from typing import Literal

from django.http import HttpRequest, HttpResponse
from posts.models import M2MPending, Notification, Poll, Post, User


class ResponseCodes:
    # Make sure to update the corresponding values in ts/parser.ts
    LOG_IN = 0x01
    SIGN_UP = 0x02

    FOLLOW = 0x10
    UNFOLLOW = 0x11
    BLOCK = 0x12
    UNBLOCK = 0x13
    ACCEPT_FOLREQ = 0x14
    DENY_FOLREQ = 0x15

    GET_PROFILE = 0x20
    SAVE_PROFILE = 0x21
    DELETE_ACCOUNT = 0x22
    CHANGE_PASSWORD = 0x23
    DEFAULT_VISIBILITY = 0x24
    VERIFY_FOLLOWERS = 0x25

    CREATE_POST = 0x30
    LIKE = 0x31
    UNLIKE = 0x32
    PIN = 0x33
    UNPIN = 0x34
    POLL_VOTE = 0x35
    POLL_REFRESH = 0x36
    EDIT_POST = 0x3e
    DELETE_POST = 0x3f

    ADMIN_DELETE_USER = 0x40
    GENERATE_OTP = 0x41
    DELETE_OTP = 0x42
    LIST_OTP = 0x43
    GET_ADMIN_PERMISSIONS = 0x44
    SET_ADMIN_PERMISSIONS = 0x45

    TIMELINE_GLOBAL = 0x60
    TIMELINE_FOLLOWING = 0x61
    TIMELINE_USER = 0x62
    TIMELINE_COMMENTS = 0x63
    TIMELINE_NOTIFICATIONS = 0x64
    TIMELINE_HASHTAG = 0x65
    TIMELINE_FOLREQ = 0x66

    NOTIFICATIONS = 0x70

class ErrorCodes:
    # Make sure to update the corresponding values in ts/parser.ts
    BAD_REQUEST = 0x00
    BAD_USERNAME = 0x10
    USERNAME_USED = 0x11
    BAD_PASSWORD = 0x12
    INVALID_OTP = 0x13
    CANT_INTERACT = 0x20
    BLOCKING = 0x21
    POST_NOT_FOUND = 0x30
    POLL_SINGLE_OPTION = 0x31
    NOT_AUTHENTICATED = 0xfe
    RATELIMIT = 0xff

MAX_STR8 = 1 << 8 - 1
MAX_STR16 = 1 << 16 - 1

def b(i: int, length: int=1) -> bytes:
    # converts an int to bytes of a certain length
    return i.to_bytes(length=length, byteorder="big")

def _extract_string(length_bits: Literal[8, 16], data: bytes) -> tuple[str, bytes]:
    length: int = _extract_int(length_bits, data)
    return (
        bytes.decode(data[length_bits // 8 : length + length_bits // 8]),
        data[length + length_bits // 8:]
    )

def _extract_int(length_bits: Literal[8, 16, 32, 64], data: bytes) -> int:
    return int.from_bytes(data[:length_bits // 8], "big")

def _extract_bool(num: int, offset: int) -> bool:
    return bool((num >> offset) & 1)

def _to_hex(data: bytes) -> str:
    return "".join([hex(i)[2:].zfill(2) for i in data])

def _to_floatint(num: int | float, *, is_infinity: bool=False) -> bytes:
    # 0isnnnnn nnnnndpp
    #  ^^^----------^^- pwr - 0: none, 1: k, 2: m, 3: b
    #  |||-num 0-1k |-divide by 10 (y/n)
    #  ||-sign
    #  |-infinity

    if is_infinity:
        return b(1 << 14, 2)

    output = 0

    if num < 0:
        num = -num
        output |= 1 << 13

    c = 0
    while num >= 1000:
        num /= 1000
        c += 1

    if c > 4:
        return _to_floatint(0, is_infinity=True)

    if c and num < 10:
        num *= 10
        output |= 1 << 2

    output |= (int(num) << 3) | (c & 0b11)

    return b(output, 2)

def _post_to_bytes(post: Post, user: User | None, user_data_override: User | None=None, timestamp_override: int | None=None) -> bytes:
    can_view_quote = True
    comment: Post | None = post.comment_parent
    quote: Post | None = post.quoted_post
    poll = post.poll if hasattr(post, "poll") else None

    if quote:
        can_view_quote = bool(
            (not quote.private or (user == quote.creator) or (user and user.following.contains(quote.creator))) # private, not following
        and (not (user and quote.creator.blocking.contains(user))) # blocked by creator
        and (not (user and user.blocking.contains(quote.creator))) # blocking creator
        )

    output = b(post.post_id, 4) + b(timestamp_override or post.timestamp, 8)

    output += b( # flags
        (post.creator.verify_followers if post.private is None else post.private) << 7 # private
      | (comment is not None) << 6 # has comment
      | (quote is not None) << 5 # is quote
      | can_view_quote << 4 # quote visible
      | (post.likes.contains(user) if user else False) << 3 # liked
      | (can_view_quote and quote is not None and (quote.creator.verify_followers if quote.private is None else quote.private)) << 2 # quote is private
      | (can_view_quote and quote is not None and quote.comment_parent is not None) << 1 # quote is comment
      | int(poll is not None) # has poll
    ) + b(
        post.edited << 7 # post edited
      | (quote is not None and quote.edited) << 6 # poll edited
      | (quote is not None and hasattr(quote, "poll")) << 5 # quote has poll
      | (quote is not None and quote.quoted_post is not None) << 4 # quote has quote
    )

    if comment:
        output += b(comment.post_id, 4)

    # interactions
    output += _to_floatint(post.likes.count()) + _to_floatint(post.quotes.count()) + _to_floatint(post.comments.count())

    content_bytes = str.encode(post.content)[:MAX_STR16]
    cw_bytes = str.encode(post.content_warning or "")[:MAX_STR8]
    username_bytes = str.encode((user_data_override or post.creator).username)[:MAX_STR8]
    display_name_bytes = str.encode((user_data_override or post.creator).display_name)[:MAX_STR8]
    pronouns_bytes = str.encode((user_data_override or post.creator).pronouns)[:MAX_STR8]

    output += b(len(content_bytes), 2) + content_bytes
    output += b(len(cw_bytes), 1) + cw_bytes
    output += b(len(username_bytes), 1) + username_bytes
    output += b(len(display_name_bytes), 1) + display_name_bytes
    output += b(len(pronouns_bytes), 1) + pronouns_bytes

    if poll:
        output += _poll_to_bytes(poll, user)

    if can_view_quote and quote:
        output += b(quote.post_id, 4) + b(quote.timestamp, 8)

        if quote.comment_parent:
            output += b(quote.comment_parent.post_id, 4)

        quote_content_bytes = str.encode(quote.content)[:MAX_STR16]
        quote_cw_bytes = str.encode(quote.content_warning or "")[:MAX_STR8]
        quote_username_bytes = str.encode(quote.creator.username)[:MAX_STR8]
        quote_display_name_bytes = str.encode(quote.creator.display_name)[:MAX_STR8]
        quote_pronouns_bytes = str.encode(quote.creator.pronouns)[:MAX_STR8]

        output += b(len(quote_content_bytes), 2) + quote_content_bytes
        output += b(len(quote_cw_bytes), 1) + quote_cw_bytes
        output += b(len(quote_username_bytes), 1) + quote_username_bytes
        output += b(len(quote_display_name_bytes), 1) + quote_display_name_bytes
        output += b(len(quote_pronouns_bytes), 1) + quote_pronouns_bytes

    return output

def _poll_to_bytes(poll: Poll, user: User | None) -> bytes:
    total_votes = poll.votes.count()
    choices = [*poll.choices.order_by("pk")]

    output = _to_floatint(total_votes) + b(len(choices))

    for choice in choices:
        content_bytes = str.encode(choice.content)
        output += b(len(content_bytes)) + content_bytes + b(int(choice.votes.count() / total_votes * 1000) if total_votes else 0, 2) + b(choice.votes.filter(user=user).exists() << 7)

    return output

def _notification_to_bytes(notification: Notification, user: User | None) -> bytes:
    quote_types = {
        "comment": 1,
        "quote": 2,
        "ping": 3,
        "like": 4
    }

    return b((not notification.read) << 7 | quote_types[notification.event_type]) + _post_to_bytes(
        notification.post,
        user,
        notification.linked_like.user if notification.event_type == "like" and notification.linked_like else None,
        notification.timestamp
    )

class _api_BaseResponse:
    response_code = 0

    def __init__(self, request: HttpRequest):
        self.response_data: bytes | int = 0
        self.request = request

    def parse_data(self) -> dict: raise NotImplementedError("This request format doesn't have a body.")
    def set_response(self, **data): raise NotImplementedError("This request format doesn't have a response.")

    def set_error(self, error_code: int):
        self.response_data = error_code

    def get_response(self, http_code_override: int | None=None) -> HttpResponse:
        http_code = http_code_override or (400 if isinstance(self.response_data, int) else 200)

        if isinstance(self.response_data, int): # error code
            response = bytes([self.response_code | 0x80, self.response_data])
        else:
            response = bytes([self.response_code]) + self.response_data

        return HttpResponse(
            response,
            content_type="application/octet-stream",
            status=http_code
        )

    def error(self, error_code: int) -> HttpResponse:
        self.set_error(error_code)
        return self.get_response()

    def response(self, **data) -> HttpResponse:
        self.set_response(**data)
        return self.get_response()

# 0X - Authentication
class api_SignUp(_api_BaseResponse):
    response_code = ResponseCodes.SIGN_UP

    def parse_data(self) -> dict:
        username, data = _extract_string(8, self.request.body)
        otp, _ = _extract_string(8, data[32:])

        return {
            "username": username,
            "password": _to_hex(data[:32]),
            "otp": otp
        }

    def set_response(self, token: str):
        self.response_data = bytes(bytearray.fromhex(token))

class api_LogIn(_api_BaseResponse):
    response_code = ResponseCodes.LOG_IN

    def parse_data(self) -> dict:
        username, data = _extract_string(8, self.request.body)
        return {
            "username": username,
            "password": _to_hex(data[:32])
        }

    def set_response(self, token: str):
        self.response_data = bytes(bytearray.fromhex(token))

# 1X - Relationships
class api_Unfollow(_api_BaseResponse):
    response_code = ResponseCodes.UNFOLLOW

    def parse_data(self) -> str:
        return bytes.decode(self.request.body).lower()

    def set_response(self):
        self.response_data = b""

class api_Follow(api_Unfollow):
    response_code = ResponseCodes.FOLLOW

    def set_response(self, is_pending: bool):
        self.response_data = bytes([is_pending << 7])

class api_Unblock(api_Unfollow):
    response_code = ResponseCodes.UNBLOCK

class api_Block(api_Unfollow):
    response_code = ResponseCodes.BLOCK

class api_AcceptFolreq(api_Unfollow):
    response_code = ResponseCodes.ACCEPT_FOLREQ

class api_DenyFolreq(api_Unfollow):
    response_code = ResponseCodes.DENY_FOLREQ

# 2X - Settings and Account Management
class api_GetProfile(_api_BaseResponse):
    response_code = ResponseCodes.GET_PROFILE

    def set_response(
        self,
        user: User
    ):
        display_name_bytes = str.encode(user.display_name)[:MAX_STR8]
        bio_bytes = str.encode(user.bio)[:MAX_STR16]
        pronouns_bytes = str.encode(user.pronouns)[:MAX_STR8]

        self.response_data = b""
        self.response_data += b(len(display_name_bytes)) + display_name_bytes
        self.response_data += b(len(bio_bytes), 2) + bio_bytes
        self.response_data += b(len(pronouns_bytes)) + pronouns_bytes
        self.response_data += bytearray.fromhex(user.color[1:7] + user.color_two[1:7])
        self.response_data += b(user.gradient << 7 | user.verify_followers << 6)

class api_SaveProfile(_api_BaseResponse):
    response_code = ResponseCodes.SAVE_PROFILE

    def parse_data(self) -> dict:
        data = self.request.body
        gradient = _extract_bool(int(data[0]), 7)
        display_name, data = _extract_string(8, data[1:])
        bio, data = _extract_string(16, data)
        pronouns, data = _extract_string(8, data)

        return {
            "display_name": display_name,
            "bio": bio,
            "pronouns": pronouns,
            "gradient": gradient,
            "color_one": "#" + _to_hex(data[:3]),
            "color_two": "#" + _to_hex(data[3:6])
        }

    def set_response(self):
        self.response_data = b""

class api_DeleteAccount(_api_BaseResponse):
    response_code = ResponseCodes.DELETE_ACCOUNT

    def parse_data(self) -> dict:
        return {
            "password": _to_hex(self.request.body[:32])
        }

    def set_response(self):
        self.response_data = b""

class api_ChangePassword(_api_BaseResponse):
    response_code = ResponseCodes.CHANGE_PASSWORD

    def parse_data(self) -> dict:
        data = self.request.body
        return {
            "current_password": _to_hex(data[:32]),
            "new_password": _to_hex(data[32:64])
        }

    def set_response(self, token: str):
        self.response_data = bytes(bytearray.fromhex(token))

class api_SetDefaultVisibility(_api_BaseResponse):
    response_code = ResponseCodes.DEFAULT_VISIBILITY

    def parse_data(self) -> bool:
        return bool(self.request.body[0] & 1)

    def set_response(self):
        self.response_data = b""

class api_SetVerifyFollowers(api_SetDefaultVisibility):
    response_code = ResponseCodes.VERIFY_FOLLOWERS

# 3X - Posts and Interactions
class api_CreatePost(_api_BaseResponse):
    response_code = ResponseCodes.CREATE_POST

    def parse_data(self) -> dict:
        data = self.request.body

        flags = int(data[0])
        has_quote = _extract_bool(flags, 6)
        has_poll = _extract_bool(flags, 5)
        has_comment = _extract_bool(flags, 4)

        content, data = _extract_string(16, data[1:])
        cw, data = _extract_string(8, data)

        quote_id = None
        polls = None
        comment_id = None

        if has_poll:
            poll_items = _extract_int(8, data)
            polls = []
            data = data[1:]
            for _ in range(poll_items):
                p, data = _extract_string(8, data)
                polls.append(p)

        if has_quote:
            quote_id = _extract_int(32, data)
            data = data[4:]

        if has_comment:
            comment_id = _extract_int(32, data)
            data = data[4:]

        print(bin(flags), has_quote, has_poll, has_comment, quote_id, comment_id)

        return {
            "content": content,
            "cw": cw,
            "private": _extract_bool(flags, 7),
            "quote": quote_id,
            "poll": polls,
            "comment": comment_id
        }

    def set_response(self, post: Post, user: User):
        self.response_data = _post_to_bytes(post, user)

class api_Like(_api_BaseResponse):
    response_code = ResponseCodes.LIKE

    def set_response(self):
        self.response_data = b""

class api_Unlike(api_Like):
    response_code = ResponseCodes.UNLIKE

class api_Pin(api_Like):
    response_code = ResponseCodes.PIN

class api_Unpin(api_Like):
    response_code = ResponseCodes.UNPIN

class api_PollRefresh(_api_BaseResponse):
    response_code = ResponseCodes.POLL_REFRESH

    def set_response(self, pid: int, poll: Poll, user: User):
        self.response_data = b(pid, 4) + _poll_to_bytes(poll, user)

class api_PollVote(api_PollRefresh):
    response_code = ResponseCodes.POLL_VOTE

    def parse_data(self) -> dict:
        data = self.request.body
        return {
            "post_id": _extract_int(32, data),
            "option": data[4]
        }

class api_EditPost(_api_BaseResponse):
    response_code = ResponseCodes.EDIT_POST

    def parse_data(self) -> dict:
        data = self.request.body
        content = _extract_string(16, data[5:])

        return {
            "post_id": _extract_int(32, data),
            "private": _extract_bool(data[4], 7),
            "content": content[0],
            "cw": _extract_string(8, content[1])[0]
        }

    def set_response(self):
        self.response_data = b""

class api_DeletePost(_api_BaseResponse):
    response_code = ResponseCodes.DELETE_POST

    def parse_data(self) -> int:
        return _extract_int(32, self.request.body)

    def set_response(self, pid: int):
        self.response_data = b(pid, 4)

# 4X - Administration
class api_AdminDeleteUser(_api_BaseResponse):
    response_code = ResponseCodes.ADMIN_DELETE_USER

    def parse_data(self) -> str:
        return bytes.decode(self.request.body).lower()

    def set_response(self):
        self.response_data = b""

class api_GenerateOTP(_api_BaseResponse):
    response_code = ResponseCodes.GENERATE_OTP

    def set_response(self, otp: str):
        self.response_data = bytes(bytearray.fromhex(otp))

class api_DeleteOTP(_api_BaseResponse):
    response_code = ResponseCodes.DELETE_OTP

    def parse_data(self) -> str:
        return _to_hex(self.request.body[:32])

    def set_response(self):
        self.response_data = b""

class api_ListOTPs(_api_BaseResponse):
    response_code = ResponseCodes.LIST_OTP

    def set_response(self, otps: list[str]):
        self.response_data = bytearray.fromhex("".join(otps))

class api_GetAdminPermissions(_api_BaseResponse):
    response_code = ResponseCodes.GET_ADMIN_PERMISSIONS

    def set_response(self, user: User):
        self.response_data = b(user.admin_level & 0b1010000011, 2)

class api_SetAdminPermissions(_api_BaseResponse):
    response_code = ResponseCodes.SET_ADMIN_PERMISSIONS

    def parse_data(self) -> dict:
        data = self.request.body
        return {
            "username": _extract_string(8, data[2:])[0].lower(),
            "permissions": _extract_int(16, data)
        }

    def set_response(self):
        self.response_data = b""

# 6X - Timelines
class _api_TimelineBase(_api_BaseResponse):
    def set_response(
        self,
        end: bool,
        forwards: bool,
        posts: list[Post] | list[Notification],
        user: User
    ):
        self.response_data = b(end << 7 | forwards << 6) + b(len(posts))

        for i in posts:
            if isinstance(i, Post):
                self.response_data += _post_to_bytes(i, user)
            else:
                self.response_data += _notification_to_bytes(i, user)

class api_TimelineGlobal(_api_TimelineBase):
    response_code = ResponseCodes.TIMELINE_GLOBAL

class api_TimelineFollowing(_api_TimelineBase):
    response_code = ResponseCodes.TIMELINE_FOLLOWING

class api_TimelineUser(_api_TimelineBase):
    response_code = ResponseCodes.TIMELINE_USER

    def set_response(self, end: bool, forwards: bool, posts: list[Post] | list[Notification], user: User, self_user: User):
        display_name_bytes = str.encode(user.display_name)[:MAX_STR8]
        pronouns_bytes = str.encode(user.pronouns)[:MAX_STR8]
        bio_bytes = str.encode(user.bio)[:MAX_STR16]

        user_data = b(len(display_name_bytes)) + display_name_bytes
        user_data += b(len(pronouns_bytes)) + pronouns_bytes
        user_data += b(len(bio_bytes), 2) + bio_bytes
        user_data += bytes(bytearray.fromhex(user.color[1:] + (user.color_two if user.gradient else user.color)[1:]))
        user_data += _to_floatint(user.followers.count()) + _to_floatint(user.following.count())

        super().set_response(end, forwards, posts, self_user)

        if isinstance(self.response_data, int):
            return

        flags = self.response_data[0]

        if not isinstance(flags, int):
            return

        flags |= self_user.following.contains(user) << 5 \
               | self_user.blocking.contains(user) << 4 \
               | user.pending_followers.contains(self_user) << 3 \
               | (user.pinned is not None) << 2
        self.response_data = user_data + b(flags) + (_post_to_bytes(user.pinned, self_user) if user.pinned else b"") + self.response_data[1:]

class api_TimelineComments(_api_TimelineBase):
    response_code = ResponseCodes.TIMELINE_COMMENTS

    def set_response(self, end: bool, forwards: bool, posts: list[Post] | list[Notification], user: User, focused_post: Post):
        super().set_response(end, forwards, posts, user)

        if isinstance(self.response_data, int):
            return

        self.response_data = _post_to_bytes(focused_post, user) + b(0) + self.response_data

class api_TimelineNotifications(_api_TimelineBase):
    response_code = ResponseCodes.TIMELINE_NOTIFICATIONS

class api_TimelineHashtag(_api_TimelineBase):
    response_code = ResponseCodes.TIMELINE_HASHTAG

class api_TimelineFolreq(_api_BaseResponse):
    response_code = ResponseCodes.TIMELINE_FOLREQ

    def set_response(self, end: bool, users: list[M2MPending]):
        self.response_data = b(end << 7) + b(len(users))

        for user in users:
            username_bytes = str.encode(user.following.username)[:MAX_STR8]
            display_name_bytes = str.encode(user.following.display_name)[:MAX_STR8]
            bio_bytes = str.encode(user.following.bio)[:MAX_STR16]

            self.response_data += b(user.pk, 4)
            self.response_data += b(len(username_bytes)) + username_bytes
            self.response_data += b(len(display_name_bytes)) + display_name_bytes
            self.response_data += b(len(bio_bytes), 2) + bio_bytes

# 7X - Statuses
class api_PendingNotifications(_api_BaseResponse):
    response_code = ResponseCodes.NOTIFICATIONS

    def set_response(self, notifications: bool, messages: bool, follow_requests: bool):
        self.response_data = b(notifications << 7 | messages << 6 | follow_requests << 5)
