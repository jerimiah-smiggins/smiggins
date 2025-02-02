from html import escape

from backend.variables import REAL_VERSION
from django import template
from django.templatetags.static import static

register = template.Library()
version_string = ".".join([str(i) for i in REAL_VERSION])

@register.filter(is_safe=True)
def get_script(path: str) -> str:
    return f"<script src='{escape(static(path))}?v={version_string}'></script>"
