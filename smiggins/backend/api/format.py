from .builder import ResponseCodes, ErrorCodes, build_response
from .parser import _extract_string, _to_hex

from django.http import HttpResponse

class ApiResponseBase:
    response_code = 0

    def __init__(self):
        self.response_data: bytes | int = 0;

    def parse_request(self, data: bytes) -> dict: ...
    def set_response(self, **data): ...

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

class SignUp(ApiResponseBase):
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

class LogIn(ApiResponseBase):
    response_code = ResponseCodes.LOG_IN

    def parse_request(self, data: bytes) -> dict:
        username, data = _extract_string(8, data)
        return {
            "username": username,
            "password": _to_hex(data[:32])
        }

    def set_response(self, token: str):
        self.response_data = bytes(bytearray.fromhex(token))
