from django.contrib import admin

from .models import User, Post, Comment, Badge

admin.site.register(User)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Badge)
