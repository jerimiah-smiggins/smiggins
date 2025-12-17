import json
from pathlib import Path

import yaml


def d(obj, *keys: str | int, default=None):
    if not keys:
        return obj

    if not isinstance(obj, dict) or not isinstance(obj, list) or keys[0] not in obj:
        return default

    return d(obj[keys[0]], *keys[1:], default=default)

def keyval_from_lang(keyval, lang, id: str, tree: list[str]=[]):
    if isinstance(keyval, dict):
        if not isinstance(lang, dict):
            return None

        out = {}
        for key, val in keyval.items():
            if key in lang:
                out[key] = keyval_from_lang(val, lang[key], id, tree + [key])
            else:
                if PRINT_MISSING:
                    print(f"{id}: missing key {'.'.join(tree + [key])}")
                out[key] = None
        return out

    elif isinstance(keyval, str):
        if keyval == "str":
            if isinstance(lang, str):
                return lang
            print(f"{id}: wrong type {'.'.join(tree)}")
            return str(lang)

        elif keyval == "str[]":
            if isinstance(lang, list):
                return [str(i) for i in lang]
            print(f"{id}: wrong type {'.'.join(tree)}")
            return []

        elif keyval == "numbered":
            if isinstance(lang, dict):
                out = {}

                for num, val in lang.items():
                    if num == "*" or str(num) == "".join([i for i in str(num) if i in "01234567890"]):
                        out[str(num)] = val
                    else:
                        print(f"{id}: invalid number {'.'.join(tree)}:", num)

                return out

            print(f"{id}: wrong type {'.'.join(tree)}")

            return {
                "*": str(lang)
            }

    else:
        print(f"{id}: unknown format {'.'.join(tree)}:", keyval)
        return None

def get_ts_typedef(keyval) -> str:
    if isinstance(keyval, dict):
        out = ""
        for key, val in keyval.items():
            out += f'{' ' if out else ''}"{key}": {get_ts_typedef(val)},'
        return f"{{{out[:-1]}}}"

    elif isinstance(keyval, str):
        if keyval == "str":
            return "string"

        elif keyval == "str[]":
            return "string[]"

        elif keyval == "numbered":
            return "{[key in number | \"*\"]: string}"

    print("unknown format", keyval)
    return "null"

def get_schema(keyval, only_properties: bool=False) -> dict:
    if isinstance(keyval, dict):
        out = {
            "type": "object",
            "additionalProperties": False,
            "properties": {}
        }
        for key, val in keyval.items():
            out["properties"][key] = get_schema(val)
        return out["properties"] if only_properties else out

    elif isinstance(keyval, str):
        if keyval == "str":
            return {
                "type": "string"
            }

        elif keyval == "str[]":
            return {
                "type": "array",
                "items": {
                    "type": "string"
                }
            }

        elif keyval == "numbered":
            return {
                "type": "object",
                "additionalProperties": False,
                "patternProperties": {
                    "\\*|\\d+": {
                        "type": "string"
                    }
                }
            }

    return {
        "type": "unknown"
    }

PRINT_MISSING = True
BASE_DIR = Path(__file__).parent
OUT_FILE = BASE_DIR / "../ts/lang.ts"
meta = yaml.safe_load(open(BASE_DIR / "meta.yaml", "r"))

languages = {}

for lang in meta["languages"]:
    f = yaml.safe_load(open(BASE_DIR / f"{lang}.yaml", "r"))
    L = {
        "meta": {
            "id": lang,
            "name": f["meta"]["name"],
            "fallbacks": [i for i in d(f, "meta", "fallback", default=[]) if i in meta["languages"]],
        },
        **keyval_from_lang(meta["defs"], f, lang) # type: ignore
    }

    languages[lang] = L

# TODO: handle fallbacks

json.dump({
    "$schema": "https://json-schema.org/draft-07/schema#",
    "type": "object",
    "additionalProperties": False,
    "required": ["meta"],
    "properties": {
        "meta": {
            "type": "object",
            "additionalProperties": False,
            "required": ["name"],
            "properties": {
                "name": { "type": "string" },
                "fallback": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "maintainers": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "past_maintainers": {
                    "type": "array",
                    "items": { "type": "string" }
                }
            }
        },
        **get_schema(meta["defs"], True)
    }
}, open(BASE_DIR / "lang.schema.json", "w"), indent=2)

f = open(OUT_FILE, "w")
f.write(f"""// This file is automatically generated by smiggins/langs/_generator.py.
// DO NOT EDIT THIS FILE DIRECTLY. All changes WILL be overwritten.

type languages = {" | ".join([f'"{lang}"' for lang in meta["languages"]])};
type LanguageData = {{
    meta: {{ id: languages, name: string, fallbacks: languages[] }},
    {get_ts_typedef(meta["defs"])[1:-1]}
}};

const LANGS: {{ [key in languages]: LanguageData }} = {{
{"\n".join([f'  "{lang}": {json.dumps(data)}' for lang, data in languages.items()])}
}};

let L: LanguageData = LANGS[localStorage.getItem("smiggins-language") as languages | null || "{meta["languages"][0]}"];
""")

f.close()
