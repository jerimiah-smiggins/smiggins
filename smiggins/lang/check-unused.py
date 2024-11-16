import os
import re
from pathlib import Path

import json5 as json

BASE_DIR = Path(__file__).parent.parent

search_dirs: list[tuple[Path, list[str]]] = [
    (BASE_DIR / "templates", ["html"]),
    (BASE_DIR / "templates/email", ["html"]),
    (BASE_DIR / "templates/email/conf", ["html"]),
    (BASE_DIR / "templates/sitemap", ["xml"]),
    (BASE_DIR / "ts", ["ts"]),
    (BASE_DIR / "ts/linkify", ["ts"]),
    (BASE_DIR / "less", ["less"]),
    (BASE_DIR / "backend", ["py"]),
    (BASE_DIR / "backend/api", ["py"]),
]

# For example if an item is accessed dynamically with code, like `lang.notifications.event[event_type]`
ignore: list[list[str]] = [
    ["generic", "time"],
    ["generic", "colors"],
    ["admin", "permissions", "descriptions"],
    ["admin", "permissions", "descriptions_extra"],
    ["admin", "logs", "who_format"],
    ["admin", "logs", "who_format_single"],
    ["notifications", "event"],
    ["settings", "cosmetic_themes"],
    ["generic", "pronouns"],
    ["post", "chars_singular"],
    ["post", "chars_plural"]
]

all_files = ""

def check(path: list[str]) -> bool:
    QUO = "[\"']"
    DOT = '\\.'
    BS = "\\"
    return bool(re.search(f"(?:lang|DEFAULT_LANG)\\[{QUO}{f'{QUO}{BS}]{BS}[{QUO}'.join(path)}{QUO}{BS}]|lang{DOT}{DOT.join(path)}", all_files))

def loop_through(lang: dict, path: list[str] | None=None) -> None:
    if path is None:
        path = []

    for i in lang:
        if path + [i] in ignore:
            continue

        if isinstance(lang[i], dict):
            loop_through(lang[i], path + [i])
        else:
            if not check(path + [i]):
                print(f"{'.'.join(path + [i])} not found")

for path in search_dirs:
    for file in os.listdir(path[0]):
        if not os.path.isfile(path[0] / file) or file.split(".")[-1] not in path[1]:
            continue

        all_files += " ".join([i for i in open(path[0] / file, "r").read().split(" ") if "lang" in i.lower()])

langs = [i for i in os.listdir() if len(i) <= 10 and i[-5::] == ".json"]

for lang in langs:
    print(lang)
    loop_through(json.load(open(lang))["texts"])
    print("-" * 20)
