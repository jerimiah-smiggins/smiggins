import threading
import time

from posts.models import URLPart
from .variables import DEBUG

def remove_extra_urlparts():
    current_time = round(time.time())

    for i in URLPart.objects.all():
        if i.expire <= current_time:
            i.delete()

    # Only rerun if debug is false. The debug reloader doesn't kill any active
    # threads so this will just keep building up if this wasn't here
    if not DEBUG:
        # Rerun after two hours
        threading.Timer(60 * 60 * 2, remove_extra_urlparts).start()
