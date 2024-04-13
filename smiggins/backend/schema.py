from ninja import Schema

class accountSchema(Schema):
    username: str
    password: str

class postSchema(Schema):
    content: str

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

class displNameSchema(Schema):
    displ_name: str
