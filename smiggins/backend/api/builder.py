from typing import Literal

from django.http import HttpResponse


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
    TIMELINE_GLOBAL = 0x60
    TIMELINE_FOLLOWING = 0x61
    TIMELINE_USER = 0x62
    TIMELINE_COMMENTS = 0x63
    TIMELINE_NOTIFICATIONS = 0x64

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

def b(i: int, length: int=1) -> bytes:
    return i.to_bytes(length=length, byteorder="big")

def build_response(
    response_code: int, #                            (number, # of bits)              (string, # length bits)
    data: int | list[bytes | bytearray | bool | tuple[int, Literal[8, 16, 32, 64]] | tuple[str, Literal[8, 16]]]=[],
    http_response: int | None=None
) -> HttpResponse:
    if isinstance(data, int):
        return _to_obj(http_response or 400, b(response_code | (1 << 7)) + b(data))

    response = b(response_code)

    bool_pending_data = 0
    num_bools = 0
    for i in data:
        if num_bools and not isinstance(i, bool):
            response += b(bool_pending_data << (8 - num_bools))
            bool_pending_data = 0
            num_bools = 0

        if isinstance(i, bytes) or isinstance(i, bytearray):
            response += i
        elif isinstance(i, bool):
            bool_pending_data <<= 1
            bool_pending_data |= int(i)
            num_bools += 1
        elif isinstance(i, tuple) and isinstance(i[0], str):
            bytes_representation = str.encode(i[0])
            response += b(len(bytes_representation), i[1] // 8)
            response += bytes_representation
        elif isinstance(i, tuple) and isinstance(i[0], int):
            response += b(i[0], i[1] // 8)

        else:
            print(f"builder: type {type(i)} is not supported - rc {response_code} ({i})")

        if num_bools == 8:
            response += b(bool_pending_data)
            bool_pending_data = 0
            num_bools = 0

    if num_bools:
        response += b(bool_pending_data << (8 - num_bools))

    return _to_obj(http_response or 200, response)

def _to_obj(http_response: int, data: bytes) -> HttpResponse:
    return HttpResponse(data, content_type="application/octet-stream", status=http_response)
