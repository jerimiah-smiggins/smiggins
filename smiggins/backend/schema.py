from ninja import Schema

class accountSchema(Schema):
    username: str
    password: str

class postSchema(Schema):
    content: str

class quoteSchema(postSchema):
    quote_id: int
    quote_is_comment: bool

class commentSchema(postSchema):
    id: int
    comment: bool

class likeSchema(Schema):
    id: int

class userSchema(Schema):
    username: str

class themeSchema(Schema):
    theme: str

class settingsSchema(Schema):
    bio: str
    priv: bool
    color: str
    color_two: str
    displ_name : str
    is_gradient: bool

class adminAccountSaveSchema(Schema):
    displ_name: str
    bio: str
    id: int

class adminAccountSchema(Schema):
    identifier: str | int
    use_id: bool

class adminLevelSchema(adminAccountSchema):
    level: int

class badgeSchema(adminAccountSchema):
    badge_name: str

class newBadgeSchema(badgeSchema):
    badge_data: str
