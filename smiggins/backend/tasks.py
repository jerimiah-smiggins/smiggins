import threading
import time

from posts.models import URLPart

def remove_extra_urlparts():
    print("r")
    current_time = round(time.time())

    for i in URLPart.objects.all():
        if i.expire <= current_time:
            print(i.url)
            i.delete()

    # Rerun after two hours
    threading.Timer(60 * 2, remove_extra_urlparts)
