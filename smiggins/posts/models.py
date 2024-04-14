from django.db import models

class User(models.Model):
    user_id      = models.IntegerField(primary_key=True)
    username     = models.CharField(max_length=300, unique=True)
    token        = models.CharField(max_length=64)

    display_name = models.CharField(max_length=300)
    theme        = models.CharField(max_length=30)
    color        = models.CharField(max_length=7)
    color_two    = models.CharField(max_length=7, null=True)
    gradient     = models.BooleanField(default=False)
    private      = models.BooleanField()

    following    = models.JSONField()
    posts        = models.JSONField()
    followers    = models.JSONField()

    def __str__(self):
        return self.username

class Post(models.Model):
    post_id   = models.IntegerField(primary_key=True)
    content   = models.TextField(max_length=65536)
    creator   = models.IntegerField()
    timestamp = models.IntegerField()
    quote     = models.IntegerField(default=0)
    quote_is_comment = models.BooleanField(default=False)

    likes     = models.JSONField(blank=True)
    comments  = models.JSONField(blank=True)
    reposts   = models.JSONField(blank=True) # list of quote post ids, too lazy to rename

    def __str__(self):
        return self.content

class Comment(models.Model):
    comment_id = models.IntegerField(primary_key=True)
    content    = models.TextField(max_length=65536)
    creator    = models.IntegerField()
    timestamp  = models.IntegerField()

    likes      = models.JSONField(blank=True)
    comments   = models.JSONField(blank=True)
    reposts    = models.JSONField(blank=True) # list of quote post ids, too lazy to rename

    def __str__(self):
        return self.content
