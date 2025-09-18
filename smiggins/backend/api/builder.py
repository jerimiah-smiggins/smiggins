from typing import Literal

from django.http import HttpResponse


class ResponseCodes:
    # Make sure to update the corresponding values in ts/parser.ts
    LOG_IN = 0x01
    SIGN_UP = 0x02

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
    return i.to_bytes(length=length)

def build_response(
    response_code: int,
    data: int | list[tuple[Literal["bool", "bytes", "i8", "i16", "i32", "i64", "str_i8", "str_i16", "str_nolen"], bool | int | str | bytes]]=[],
    http_response: int | None=None
) -> HttpResponse:
    if isinstance(data, int):
        return _to_obj(http_response or 400, b(response_code | (1 << 7)) + b(data))

    response = b(response_code)
    print(data)

    for datatype, value in data:
        if datatype == "bytes" and (isinstance(value, bytes) or isinstance(value, bytearray)):
            response += value
        else:
            print(f"Unknown datatype {datatype}")
            return build_response(response_code, ErrorCodes.BAD_REQUEST)

    return _to_obj(http_response or 200, response)

def _to_obj(http_response: int, data: bytes) -> HttpResponse:
    print(data, len(data))
    return HttpResponse(data, content_type="application/octet-stream", status=http_response)
