from typing import Literal

from django.http import HttpResponse

from .format import b


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
            bytes_representation = str.encode(i[0])[: 1 << i[1] - 1]
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
