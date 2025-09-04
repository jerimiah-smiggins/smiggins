import json5 as json

from smiggins.settings import BASE_DIR

from .variables import CACHE_LANGUAGES, DEFAULT_LANGUAGE, VALID_LANGUAGES


def get_lang(lang=None, override_cache=False) -> dict[str, dict]:
    # Gets the language file for the specified user/language

    return {}

    if lang is None:
        lang = DEFAULT_LANGUAGE
    elif isinstance(lang, str):
        ...
    else:
        lang = lang.language or DEFAULT_LANGUAGE

    if not override_cache and CACHE_LANGUAGES:
        return LANGS[lang] if lang in LANGS else LANGS[DEFAULT_LANGUAGE]

    parsed = []

    def loop_through(found: dict, context: dict) -> dict:
        if isinstance(context, dict):
            for i in context:
                if isinstance(context[i], str):
                    if i not in found:
                        found[i] = context[i]
                else:
                    if i not in found:
                        found[i] = context[i]
                    else:
                        found[i] = loop_through(found[i], context[i])

        elif isinstance(found, str):
            if len(found) == 0:
                found = context

        return found

    def resolve_dependencies(lang: str, context: dict | None=None) -> tuple[dict[str, dict], dict]:
        if context is None:
            context = {}

        f = json.load(open(BASE_DIR / f"lang/{lang}.json", "r", encoding="utf-8"))
        parsed.append(lang)

        context = loop_through(context, f["texts"])

        for i in f["meta"]["fallback"]:
            if i not in parsed:
                resolve_dependencies(i, context)

        return context, f

    x, full = resolve_dependencies(lang)

    x["meta"] = {
        "language": lang,
        "version": full["meta"]["version"],
        "maintainers": full["meta"]["maintainers"],
        "past_maintainers": full["meta"]["past_maintainers"],
    }

    return x

LANGS = {}
if CACHE_LANGUAGES:
    import sys

    print("Generating language cache for ", end="")
    first = True

    for i in VALID_LANGUAGES:
        print(f"{'' if first else ', '}{i}", end="")
        LANGS[i] = get_lang(i, True)

        sys.stdout.flush()

        if first:
            first = False

    print()
    del sys

DEFAULT_LANG = get_lang()
