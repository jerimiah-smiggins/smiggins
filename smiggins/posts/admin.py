from django.contrib import admin

from .models import Users, Posts, Comments

admin.site.register(Users)
admin.site.register(Posts)
admin.site.register(Comments)