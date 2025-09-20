from typing import Literal

from .builder import ResponseCodes


def _extractString(length_bits: Literal[8, 16], data: bytes) -> tuple[str, bytes]:
    length: int = _extractInt(length_bits, data)
    return (
        bytes.decode(data[length_bits // 8 : length + length_bits // 8]),
        data[length + length_bits // 8:]
    )

def _extractInt(length_bits: Literal[8, 16, 32, 64], data: bytes) -> int:
    return int.from_bytes(data[:length_bits // 8])

def _toHex(data: bytes) -> str:
    return "".join([hex(i)[2:].zfill(2) for i in data])

def parse_request(data: bytes, route: int) -> dict:
    print(*[hex(i)[2:].zfill(2) for i in data])

    if route == ResponseCodes.SIGN_UP:
        username, data = _extractString(8, data)
        otp, _ = _extractString(8, data[32:])

        return {
            "username": username,
            "password": _toHex(data[:32]),
            "otp": otp
        }

    if route == ResponseCodes.LOG_IN:
        username, data = _extractString(8, data)

        return {
            "username": username,
            "password": _toHex(data[:32])
        }

    return {}
