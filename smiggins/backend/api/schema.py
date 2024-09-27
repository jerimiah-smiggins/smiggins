# For ninja api schemas

from ninja import Schema


class Username(Schema):
    username: str

# admin.py

class AccountIdentifier(Schema):
    identifier: str | int
    use_id: bool

class DeleteBadge(Schema):
    badge_name: str

class NewBadge(DeleteBadge):
    badge_data: str

class UserBadge(AccountIdentifier):
    badge_name: str

class SaveUser(Schema):
    displ_name: str
    bio: str
    id: int

class UserLevel(AccountIdentifier):
    level: int

# comment.py

class NewComment(Schema):
    c_warning: str
    content: str
    comment: bool
    id: int
    private: bool

class EditComment(Schema):
    c_warning: str
    content: str
    private: bool
    comment_id: int

class CommentID(Schema):
    id: int

# email.py

class Email(Schema):
    email: str

# messages.py

class NewContainer(Username):
    ...

class NewMessage(Schema):
    username: str
    content: str

# post.py

class NewPost(Schema):
    c_warning: str
    content: str
    poll: list[str]
    private: bool

class EditPost(Schema):
    c_warning: str
    content: str
    private: bool
    post_id: int

class NewQuote(Schema):
    c_warning: str
    content: str
    quote_id: int
    quote_is_comment: bool
    private: bool

class PostID(Schema):
    id: int

class Poll(Schema):
    id: int
    option: int

# user.py

class Account(Username):
    password: str

class ChangePassword(Schema):
    password: str
    new_password: str

class Theme(Schema):
    theme: str

class Settings(Schema):
    bio: str
    lang: str
    color: str
    pronouns: str
    color_two: str
    displ_name: str
    is_gradient: bool
    approve_followers: bool
    default_post_visibility: str
