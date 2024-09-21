from backend.api.admin import BitMask
from django import template

register = template.Library()

@register.filter
def get(obj, key):
    return obj[key]

@register.filter
def js_bool(input: bool):
    return str(input).lower()

@register.simple_tag
def admin_level(level, identifier):
    print(level, identifier)
    return BitMask.can_use_direct(level, identifier)

@register.simple_tag(name="any")
def any_true(*args):
    return any(args)
