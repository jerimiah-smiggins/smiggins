from typing import Literal

from .builder import ResponseCodes


def _extract_string(length_bits: Literal[8, 16], data: bytes) -> tuple[str, bytes]:
    length: int = _extract_int(length_bits, data)
    return (
        bytes.decode(data[length_bits // 8 : length + length_bits // 8]),
        data[length + length_bits // 8:]
    )

def _extract_int(length_bits: Literal[8, 16, 32, 64], data: bytes) -> int:
    return int.from_bytes(data[:length_bits // 8])

def _extract_bool(num: int, offset: int) -> bool:
    return bool((num >> offset) & 1)

def _to_hex(data: bytes) -> str:
    return "".join([hex(i)[2:].zfill(2) for i in data])

def parse_request(data: bytes, route: int) -> dict:
    # print(*[hex(i)[2:].zfill(2) for i in data])

    if route == ResponseCodes.SIGN_UP:
        username, data = _extract_string(8, data)
        otp, _ = _extract_string(8, data[32:])

        return {
            "username": username,
            "password": _to_hex(data[:32]),
            "otp": otp
        }

    elif route == ResponseCodes.LOG_IN:
        username, data = _extract_string(8, data)

        return {
            "username": username,
            "password": _to_hex(data[:32])
        }

    elif route == ResponseCodes.CREATE_POST:
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
            for i in range(poll_items):
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

    elif route == ResponseCodes.SAVE_PROFILE:
        gradient = _extract_bool(int(data[0]), 7)
        display_name, data = _extract_string(8, data[1:])
        bio, data = _extract_string(16, data)

        return {
            "display_name": display_name,
            "bio": bio,
            "gradient": gradient,
            "color_one": "#" + _to_hex(data[:3]),
            "color_two": "#" + _to_hex(data[3:6])
        }

    return {}
