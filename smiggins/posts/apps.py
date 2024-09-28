from django.apps import AppConfig
from django.template import Library

register = Library()

@register.filter(name='get')
def get(d, k):
    return d.get(k, None)

class PostsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'posts'
