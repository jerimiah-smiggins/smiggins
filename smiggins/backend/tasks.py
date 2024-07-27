import threading
import time

from posts.models import URLPart

def remove_extra_urlparts():
    current_time = round(time.time())

    for i in URLPart.objects.all():
        if i.expire <= current_time:
            i.delete()

    # Rerun after two hours
    threading.Timer(60 * 60 * 2, remove_extra_urlparts).start()
