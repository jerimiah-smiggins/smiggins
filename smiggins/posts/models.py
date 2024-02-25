from django.db import models

class Users(models.Model):
    user_id      = models.IntegerField(primary_key=True)
    username     = models.CharField(max_length=300, unique=True)
    token        = models.CharField(max_length=64)

    display_name = models.CharField(max_length=300)
    theme        = models.CharField(max_length=30)
    color        = models.CharField(max_length=7)
    private      = models.BooleanField()

    following    = models.JSONField()
    posts        = models.JSONField()
    followers    = models.JSONField()

    def __str__(self):
        return self.username

class Posts(models.Model):
    post_id   = models.IntegerField(primary_key=True)
    content   = models.CharField(max_length=65536)
    creator   = models.IntegerField()
    timestamp = models.IntegerField()

    likes     = models.JSONField()
    comments  = models.JSONField()
    reposts   = models.JSONField()

    def __str__(self):
        return self.content

class Comments(models.Model):
    comment_id = models.IntegerField(primary_key=True)
    content    = models.CharField(max_length=65536)
    creator    = models.IntegerField()
    timestamp  = models.IntegerField()

    likes      = models.JSONField()
    comments   = models.JSONField()
    reposts    = models.JSONField()

    def __str__(self):
        return self.content
