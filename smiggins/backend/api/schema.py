from ninja import Schema


class Username(Schema):
    username: str

class NewPost(Schema):
    cw: str | None
    content: str
    poll: list[str]
    private: bool
    quote: int | None

class Password(Schema):
    password: str

class Account(Username):
    password: str
    otp: str | None = None

class Profile(Schema):
    display_name: str
    bio: str
    gradient: bool
    color_one: str
    color_two: str

class Private(Schema):
    private: bool

class ChangePassword(Schema):
    current_password: str
    new_password: str

