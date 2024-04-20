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

class followerSchema(Schema):
    username: str

class themeSchema(Schema):
    theme: str

class colorSchema(Schema):
    color: str
    color_two: str
    is_gradient: bool

class privSchema(Schema):
    priv: bool

class textSettingsSchema(Schema):
    displ_name: str
    bio: str

class settingsSchema(Schema):
    bio: str
    priv: bool
    color: str
    color_two: str
    displ_name : str
    is_gradient: bool
