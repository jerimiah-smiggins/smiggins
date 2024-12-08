# Run to compile .less files into css. Optionally specify specific files to compile

import os
import sys
from pathlib import Path

CONFIG = {
    "in_directory": Path("./smiggins/less"),
    "out_directory": Path("./smiggins/templates/css"),
    "compress": True
}

for i in [i if i.endswith(".less") else f"{i}.less" for i in sys.argv[1::]] or os.listdir(CONFIG["in_directory"]):
    os.system(f"lessc {CONFIG['in_directory'] / i} {CONFIG['out_directory'] / i.replace('.less', '.css')}  {'--clean-css' if CONFIG['compress'] else ''}")
    print(i)
