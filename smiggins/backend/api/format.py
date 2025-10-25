from typing import Literal

from django.http import HttpResponse
from posts.models import Notification, Post, User


class ResponseCodes:
    # Make sure to update the corresponding values in ts/parser.ts
    LOG_IN = 0x01
    SIGN_UP = 0x02
    FOLLOW = 0x10
    UNFOLLOW = 0x11
    BLOCK = 0x12
    UNBLOCK = 0x13
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
    EDIT_POST = 0x3e
    DELETE_POST = 0x3f
    TIMELINE_GLOBAL = 0x60
    TIMELINE_FOLLOWING = 0x61
    TIMELINE_USER = 0x62
    TIMELINE_COMMENTS = 0x63
    TIMELINE_NOTIFICATIONS = 0x64
    TIMELINE_HASHTAG = 0x65
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

class _api_BaseResponse:
    response_code = 0

    def __init__(self):
        self.response_data: bytes | int = 0

    def parse_request(self, data: bytes) -> dict: raise NotImplementedError("This request format doesn't have a body.")
    def set_response(self, **data):  raise NotImplementedError("This request format doesn't have a response.")

    def set_error(self, error_code: int):
        self.response_data = error_code

    def get_response(self, http_code_override: int | None=None) -> HttpResponse:
        http_code = http_code_override or (400 if isinstance(self.response_data, int) else 200)

        if isinstance(self.response_data, int):
            # error code
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

def _post_to_bytes(post: Post, user: User | None, user_data_override: User | None=None) -> bytes:
    can_view_quote = True
    comment: Post | None = post.comment_parent
    quote: Post | None = post.quoted_post

    output = b(post.post_id, 4) + b(post.timestamp, 8)

    output += b( # flags
        (post.creator.verify_followers if post.private is None else post.private) << 7 # private
      | (comment is not None) << 6 # has comment
      | (quote is not None) << 5 # has quote
      | can_view_quote << 4 # quote visible
      | (post.likes.contains(user) if user else False) << 3 # liked
      | (quote is not None and (quote.creator.verify_followers if quote.private is None else quote.private)) << 2 # quote is private
      | (quote is not None and quote.comment_parent is not None) << 1 # quote has comment
    )

    if comment:
        output += b(comment.post_id, 4)

    # interactions
    output += b(post.likes.count(), 2) + b(post.quotes.count(), 2) + b(post.comments.count(), 2)

    content_bytes = str.encode(post.content)[: 1 << 16 - 1]
    cw_bytes = str.encode(post.content_warning or "")[: 1 << 8 - 1]
    username_bytes = str.encode((user_data_override or post.creator).username)[: 1 << 8 - 1]
    display_name_bytes = str.encode((user_data_override or post.creator).display_name)[: 1 << 8 - 1]
    pronouns_bytes = str.encode((user_data_override or post.creator).pronouns)[: 1 << 8 - 1]

    output += b(len(content_bytes), 2) + content_bytes
    output += b(len(cw_bytes), 1) + cw_bytes
    output += b(len(username_bytes), 1) + username_bytes
    output += b(len(display_name_bytes), 1) + display_name_bytes
    output += b(len(pronouns_bytes), 1) + pronouns_bytes

    if quote:
        output += b(quote.post_id, 4) + b(quote.timestamp, 8)

        if quote.comment_parent:
            output += b(quote.comment_parent.post_id, 4)

        quote_content_bytes = str.encode(quote.content)[: 1 << 16 - 1]
        quote_cw_bytes = str.encode(quote.content_warning or "")[: 1 << 8 - 1]
        quote_username_bytes = str.encode(quote.creator.username)[: 1 << 8 - 1]
        quote_display_name_bytes = str.encode(quote.creator.display_name)[: 1 << 8 - 1]
        quote_pronouns_bytes = str.encode(quote.creator.pronouns)[: 1 << 8 - 1]

        output += b(len(quote_content_bytes), 2) + quote_content_bytes
        output += b(len(quote_cw_bytes), 1) + quote_cw_bytes
        output += b(len(quote_username_bytes), 1) + quote_username_bytes
        output += b(len(quote_display_name_bytes), 1) + quote_display_name_bytes
        output += b(len(quote_pronouns_bytes), 1) + quote_pronouns_bytes

    return output

def _notification_to_bytes(notification: Notification, user: User | None) -> bytes:
    quote_types = {
        "comment": 1,
        "quote": 2,
        "ping": 3,
        "like": 4
    }

    return b((not notification.read) << 7 | quote_types[notification.event_type]) + _post_to_bytes(notification.post, user, notification.linked_like.user if notification.event_type == "like" and notification.linked_like else None)

# 0X - Authentication
class api_SignUp(_api_BaseResponse):
    response_code = ResponseCodes.SIGN_UP

    def parse_request(self, data: bytes) -> dict:
        username, data = _extract_string(8, data)
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

    def parse_request(self, data: bytes) -> dict:
        username, data = _extract_string(8, data)
        return {
            "username": username,
            "password": _to_hex(data[:32])
        }

    def set_response(self, token: str):
        self.response_data = bytes(bytearray.fromhex(token))

# 1X - Relationships
class api_Unfollow(_api_BaseResponse):
    response_code = ResponseCodes.UNFOLLOW

    def parse_request(self, data: bytes) -> str:
        return bytes.decode(data).lower()

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

# 2X - Settings and Account Management
class api_GetProfile(_api_BaseResponse):
    response_code = ResponseCodes.GET_PROFILE

    def set_response(
        self,
        user: User
    ):
        display_name_bytes = str.encode(user.display_name)[: 1 << 8 - 1]
        bio_bytes = str.encode(user.bio)[: 1 << 16 - 1]
        pronouns_bytes = str.encode(user.pronouns)[: 1 << 8 - 1]

        self.response_data = b""
        self.response_data += b(len(display_name_bytes)) + display_name_bytes
        self.response_data += b(len(bio_bytes), 2) + bio_bytes
        self.response_data += b(len(pronouns_bytes)) + pronouns_bytes
        self.response_data += bytearray.fromhex(user.color[1:7] + user.color_two[1:7])
        self.response_data += b(user.gradient << 7 | user.verify_followers << 6)

class api_SaveProfile(_api_BaseResponse):
    response_code = ResponseCodes.SAVE_PROFILE

    def parse_request(self, data: bytes) -> dict:
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

    def parse_request(self, data: bytes) -> dict:
        return {
            "password": _to_hex(data[:32])
        }

    def set_response(self):
        self.response_data = b""

class api_ChangePassword(_api_BaseResponse):
    response_code = ResponseCodes.CHANGE_PASSWORD

    def parse_request(self, data: bytes) -> dict:
        return {
            "current_password": _to_hex(data[:32]),
            "new_password": _to_hex(data[32:64])
        }

    def set_response(self, token: str):
        self.response_data = bytes(bytearray.fromhex(token))

class api_SetDefaultVisibility(_api_BaseResponse):
    response_code = ResponseCodes.DEFAULT_VISIBILITY

    def parse_request(self, data: bytes) -> bool:
        return bool(data[0] & 1)

    def set_response(self):
        self.response_data = b""

class api_SetVerifyFollowers(api_SetDefaultVisibility):
    response_code = ResponseCodes.VERIFY_FOLLOWERS

# 3X - Posts and Interactions
class api_CreatePost(_api_BaseResponse):
    response_code = ResponseCodes.CREATE_POST

    def parse_request(self, data: bytes) -> dict:
        flags = int(data[0])
        has_quote = _extract_bool(flags, 6)
        has_poll = _extract_bool(flags, 5)
        has_comment = _extract_bool(flags, 4)

        content, data = _extract_string(16, data[1:])
        cw, data = _extract_string(8, data)

        quote_id = None
        polls = None
        comment_id = None

        if has_quote:
            quote_id = _extract_int(32, data)
            data = data[4:]

        if has_poll:
            poll_items = int(data, 8)
            polls = []
            data = data[1:]
            for _ in range(poll_items):
                p, data = _extract_string(8, data)
                polls.append(p)

        if has_comment:
            comment_id = _extract_int(32, data)
            data = data[4:]

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

class api_EditPost(_api_BaseResponse):
    response_code = ResponseCodes.EDIT_POST

    def parse_request(self, data: bytes) -> dict:
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

    def parse_request(self, data: bytes) -> int:
        return _extract_int(32, data)

    def set_response(self, pid: int):
        self.response_data = b(pid, 4)

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
        display_name_bytes = str.encode(user.display_name)[: 1 << 8 - 1]
        bio_bytes = str.encode(user.bio)[: 1 << 16 - 1]

        user_data = b(len(display_name_bytes)) + display_name_bytes
        user_data += b(len(bio_bytes), 2) + bio_bytes
        user_data += bytes(bytearray.fromhex(user.color[1:] + (user.color_two if user.gradient else user.color)[1:]))
        user_data += b(user.followers.count(), 2) + b(user.following.count(), 2)

        super().set_response(end, forwards, posts, user)

        if isinstance(self.response_data, int):
            return

        flags = self.response_data[0]

        if not isinstance(flags, int):
            return

        flags |= self_user.following.contains(user) << 5 | self_user.blocking.contains(user) << 4 | user.pending_followers.contains(self_user) << 3
        self.response_data = user_data + b(flags) + self.response_data[1:]

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

# 7X - Statuses
class api_PendingNotifications(_api_BaseResponse):
    response_code = ResponseCodes.NOTIFICATIONS

    def set_response(self, notifications: bool, messages: bool, follow_requests: bool):
        self.response_data = b(notifications << 7 | messages << 6 | follow_requests << 5)
