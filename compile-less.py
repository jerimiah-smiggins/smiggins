# Run to compile .less files into css. Optionally specify specific files to compile

import os
import threading
import sys
from pathlib import Path

CONFIG = {
    "in_directory": Path("./smiggins/less"),
    "out_directory": Path("./smiggins/templates/css"),
    "compress": True
}

def thread(file: str):
    os.system(f"lessc {CONFIG['in_directory'] / file} {CONFIG['out_directory'] / file.replace('.less', '.css')}  {'--clean-css' if CONFIG['compress'] else ''}")
    print(file)

threads = []
for i in [i if i.endswith(".less") else f"{i}.less" for i in sys.argv[1::]] or os.listdir(CONFIG["in_directory"]):
    threads.append(threading.Thread(target=thread, args=[i]))
    threads[-1].start()

for thread in threads:
    thread.join()
