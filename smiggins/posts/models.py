from django.db import models

class User(models.Model):
    user_id      = models.IntegerField(primary_key=True)
    username     = models.CharField(max_length=300, unique=True)
    token        = models.CharField(max_length=64)

    # Admin level
    # 0 - Regular user
    # 1 - Ability to delete any post
    # 2 - Ability to delete any account
    # 3 - Ability to add badges to accounts and create new badges
    # 4 - Full access to modify anything in the database except for admin levels
    # 5 - Ability to add anyone as an admin of any level, including level 5. This is automatically given to the owner specified in _settings.py
    admin_level  = models.IntegerField(default=0)

    display_name = models.CharField(max_length=300)
    bio          = models.CharField(max_length=65536, null=True, blank=True)
    pronouns     = models.CharField(max_length=2, default="__")
    theme        = models.CharField(max_length=30)
    color        = models.CharField(max_length=7)
    color_two    = models.CharField(max_length=7, null=True, blank=True)
    gradient     = models.BooleanField(default=False)
    private      = models.BooleanField()

    following = models.JSONField(default=list)
    followers = models.JSONField(default=list, null=True, blank=True)
    blocking  = models.JSONField(default=list, null=True, blank=True)
    badges    = models.JSONField(default=list, null=True, blank=True)

    posts    = models.JSONField(default=list)
    comments = models.JSONField(default=list)
    likes    = models.JSONField(default=list) # list[list[id: int, is_comment: bool]]

    def __str__(self):
        return self.username

class Post(models.Model):
    post_id   = models.IntegerField(primary_key=True)
    content   = models.TextField(max_length=65536)
    creator   = models.IntegerField()
    timestamp = models.IntegerField()
    quote     = models.IntegerField(default=0)
    quote_is_comment = models.BooleanField(default=False)

    likes     = models.JSONField(null=True, blank=True)
    comments  = models.JSONField(null=True, blank=True)
    quotes    = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.content

class Comment(models.Model):
    comment_id = models.IntegerField(primary_key=True)
    content    = models.TextField(max_length=65536)
    creator    = models.IntegerField()
    timestamp  = models.IntegerField()
    parent     = models.IntegerField(default=0)
    parent_is_comment = models.BooleanField(default=False)

    likes      = models.JSONField(null=True, blank=True)
    comments   = models.JSONField(null=True, blank=True)
    quotes     = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.content

class Badge(models.Model):
    name     = models.CharField(max_length=64, primary_key=True, unique=True)
    svg_data = models.CharField(max_length=65536)
    users    = models.JSONField(default=list)

    def __str__(self):
        return self.name
