import hashlib
import os
import pathlib
import re
from typing import Any, Literal

import json5 as json
from django.db.utils import OperationalError
from posts.models import Badge

from ._api_keys import auth_key

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent

def error(string):
    print(f"\x1b[91m{string}\x1b[0m")

CREDITS: dict[str, list[str]] = {
    "lead": ["trinkey"],
    "contributors": [
        "Subroutine7901",
        "DiamondTaco",
        "TheMineCommander"
    ]
}

# Set default variable states
REAL_VERSION: tuple[int, int, int] = (0, 13, 5)
VERSION: str = ".".join([str(i) for i in REAL_VERSION])
SITE_NAME: str = "Jerimiah Smiggins"
WEBSITE_URL: str | None = None
DEBUG: bool = True
OWNER_USER_ID: int = 1
MAX_ADMIN_LOG_LINES: int = 1000
DEFAULT_LANGUAGE: str = "en-US"
DEFAULT_DARK_THEME: str = "dark"
DEFAULT_LIGHT_THEME: str = "dawn"
CACHE_LANGUAGES: bool | None = None
ALLOW_SCRAPING: bool = False
MAX_USERNAME_LENGTH: int = 18
MAX_DISPL_NAME_LENGTH: int = 32
MAX_CONTENT_WARNING_LENGTH: int = 100
MAX_POST_LENGTH: int = 280
MAX_BIO_LENGTH: int = 280
MAX_POLL_OPTION_LENGTH: int = 64
MAX_POLL_OPTIONS: int = 8
DEFAULT_BANNER_COLOR: str = "#3a1e93"
POSTS_PER_REQUEST: int = 20
MESSAGES_PER_REQUEST: int = 40
MAX_NOTIFICATIONS: int = 25
CONTACT_INFO: list[list[str]] = [
    ["email", "trinkey@duck.com"],
    ["url",   "https://github.com/jerimiah-smiggins/smiggins/issues"],
    ["url",   "https://discord.gg/tH7QnHApwu"],
    ["text",  "DM me on discord (@trinkey_)"]
]
POST_WEBHOOKS: dict[str, list[str]] = {}
SOURCE_CODE: bool = True
RATELIMIT: bool = True
ENABLE_USER_BIOS: bool = True
ENABLE_PRONOUNS: bool = True
ENABLE_GRADIENT_BANNERS: bool = True
ENABLE_PRIVATE_MESSAGES: bool = True
ENABLE_POST_DELETION: bool = True
ENABLE_EDITING_POSTS: bool = True
ENABLE_HASHTAGS: bool = True
ENABLE_CONTACT_PAGE: bool = True
ENABLE_CREDITS_PAGE: bool = True
ENABLE_PINNED_POSTS: bool = True
ENABLE_ACCOUNT_SWITCHER: bool = True
ENABLE_BADGES: bool = True
ENABLE_QUOTES: bool = True
ENABLE_CONTENT_WARNINGS: bool = True
ENABLE_POLLS: bool = True
ENABLE_LOGGED_OUT_CONTENT: bool = True
ENABLE_NEW_ACCOUNTS: bool = True
ENABLE_EMAIL: bool = False
ENABLE_SITEMAPS: bool = False
ITEMS_PER_SITEMAP: int = 500
GOOGLE_VERIFICATION_TAG: str | None = ""
DISCORD: str | None = "tH7QnHApwu"
FAVICON_CACHE_TIMEOUT: int | None = 7200
SITEMAP_CACHE_TIMEOUT: int | None = 86400
GENERIC_CACHE_TIMEOUT: int | None = 604800
API_TIMINGS: dict[str, int] = {}
FAVICON_DATA: str = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path fill="@{background}" d="M0 73.1C0 32.8 32.8 0 73.1 0h365.7c40.3 0 73.1 32.8 73.1 73.1v365.7c0 40.3-32.8 73.1-73.1 73.1H73.1C32.8 511.9 0 479.1 0 438.8z"/>
  <path fill="@{background_alt}" d="m388.9 159.2 53.2-.6v235.6c0 42.9-34.8 77.8-77.8 77.8H247.6c-14.3 0-25.9-11.6-25.9-25.9s11.6-25.9 25.9-25.9H293L182.8 332v114.1c0 14.3-11.6 25.9-25.9 25.9S131 460.4 131 446.1V261.4c8.5 2.2 17.2 3.2 25.9 3.2 38.4 0 72-20.8 89.9-51.9h13.9c54.1 0 101.8 27.6 129.6 69.5v-69.1l-1.3-53.9zm-258 75c-17.7-6.2-32.5-18.7-41.6-34.8-6.5-11.3-10.2-24.6-10.2-38.6v-95c0-4.8 3.8-8.6 8.6-8.7h.2c2.7 0 5.2 1.3 6.8 3.4l10.4 13.9 22 29.4 3.9 5.2h51.9l3.9-5.2 22-29.4 10.4-13.8c1.6-2.2 4.1-3.5 6.8-3.5h.2c4.8 0 8.6 3.9 8.6 8.7v95c0 14.6-4.1 28.8-11.7 41.2-2.3 3.8-5 7.4-8 10.7-14.3 15.9-35 27.1-58 25.9s-18.1-1.5-26.2-4.4m51.9-60.4c7.2 0 13-5.8 13-13s-5.8-13-13-13-13 5.8-13 13 5.8 13 13 13m-38.9-13c0-7.2-5.8-13-13-13s-13 5.8-13 13 5.8 13 13 13 13-5.8 13-13"/>
  <path fill="@{background_alt}" d="m389.2 169.1-.4-10.6v-.7c1.4-34.2-27.2-54.5-44.9-53.1h-1.8c-9.8.4-17.6 4.7-22.7 10.8-1.3 1.7-2.6 3.4-3.6 5.3 4.8-3 10.3-4.5 16.3-3.9 24.8 2.1 31.3 25.5 30.6 37.4-.8 14.8-10 28.6-25.5 35.4-16.9 8.4-36 3.6-48.6-4.5-14.3-9.1-25.6-24.7-28.3-45.3-3.7-21.5 4.7-43.2 17.9-59.2 14-16.3 35.5-28.9 61.5-29.7 52.4-3.9 104.2 45.4 102.5 107.6"/>
  <path fill="@{accent}" d="m379.7 148.5 53.2-.6v235.6c0 42.9-34.8 77.8-77.8 77.8H238.4c-14.3 0-25.9-11.6-25.9-25.9s11.6-25.9 25.9-25.9h45.4l-110.2-88.2v114.1c0 14.3-11.6 25.9-25.9 25.9s-25.9-11.6-25.9-25.9V250.7c8.5 2.2 17.2 3.2 25.9 3.2 38.4 0 72-20.8 89.9-51.9h13.9c53.1 0 101.8 27.6 129.6 69.5v-69.1l-1.3-53.9zm-257.9 75c-17.7-6.2-32.5-18.7-41.6-34.8-6.5-11.3-10.2-24.6-10.2-38.6v-95c0-4.8 3.8-8.6 8.6-8.7h.2c2.7 0 5.2 1.3 6.8 3.4L96 63.7l22 29.4 3.9 5.2h51.9l3.9-5.2 22-29.4 10.4-13.8c1.6-2.2 4.1-3.5 6.8-3.5h.2c4.8 0 8.6 3.9 8.6 8.7v95c0 14.6-4.1 28.8-11.7 41.2-2.3 3.8-5 7.4-8 10.7-14.3 15.9-35 25.9-53 25.9s-23.1-1.5-31.2-4.4m56.8-60.4c7.2 0 13-5.8 13-13s-5.8-13-13-13-13 5.8-13 13 5.8 13 13 13m-38.9-13c0-7.2-5.8-13-13-13s-13 5.8-13 13 5.8 13 13 13 13-5.8 13-13"/>
  <path fill="@{accent}" d="M379.8 149v-1.9c1.3-34.2-27.4-54.5-45.1-53.1h-1.8c-9.8.4-17.6 4.7-22.7 10.8-1.3 1.7-2.6 3.4-3.6 5.3 4.8-3 10.3-4.5 16.3-3.9 24.8 2.1 31.3 25.5 30.6 37.4-.8 14.8-10 28.6-25.5 35.4-16.9 8.4-36 3.6-48.6-4.5-14.3-9.1-25.6-24.7-28.3-45.3-3.7-21.5 4.7-43.2 17.9-59.2 14-16.3 35.5-28.9 61.5-29.7 52.4-3.9 104.2 45.9 102.5 108.1"/>
</svg>"""
ENABLE_DYNAMIC_FAVICON: bool = True

THEMES = {
  "warm": {
    "name": {
      "default": "Noon"
    },
    "id": "warm",
    "light_theme": True,
    "colors": {
      "text": "#575279",
      "subtext": "#9893a5",
      "red": "#a03660",
      "background": "#faf4ed",
      "post_background": "#faf4ed",
      "poll_voted_background": "#f2e9e1",
      "poll_no_vote_background": "#fffaf3",
      "content_warning_background": "#fffaf3",
      "input_background": "#f2e9e1",
      "checkbox_background": "#f4ede8",
      "button_background": "#f2e9e1",
      "button_hover_background": "#fffaf3",
      "button_inverted_background": "#faf4ed",
      "input_border": "#f4ede8",
      "checkbox_border": "#f4ede8",
      "button_border": "#f4ede8",
      "table_border": "#f4ede8",
      "modal_backdrop": "#9893a580",
      "modal_background": "#faf4ed",
      "modal_border": "@accent",
      "gray": "#9893a5",
      "accent": {
        "rosewater": "#d7827e",
        "flamingo": "#d8707e",
        "pink": "#e56ed1",
        "mauve": "#7a51cb",
        "red": "#a03660",
        "maroon": "#b4637a",
        "peach": "#ff7322",
        "yellow": "#ea9d34",
        "green": "#7fa731",
        "teal": "#56949f",
        "sky": "#41a7eb",
        "sapphire": "#286983",
        "blue": "#2630c3",
        "lavender": "#907aa9"
      }
    }
  },
  "light": {
    "name": {
      "default": "Dawn"
    },
    "id": "light",
    "light_theme": True,
    "colors": {
      "text": "#4c4f69",
      "subtext": "#6c6f85",
      "red": "#d20f39",
      "background": "#eff1f5",
      "post_background": "#eff1f5",
      "poll_voted_background": "#dce0e8",
      "poll_no_vote_background": "#e6e9ef",
      "content_warning_background": "#e6e9ef",
      "input_background": "#dce0e8",
      "checkbox_background": "#ccd0da",
      "button_background": "#dce0e8",
      "button_hover_background": "#e6e9ef",
      "button_inverted_background": "#eff1f5",
      "input_border": "#ccd0da",
      "checkbox_border": "#ccd0da",
      "button_border": "#ccd0da",
      "table_border": "#ccd0da",
      "modal_backdrop": "#6c6f8580",
      "modal_background": "#eff1f5",
      "modal_border": "@accent",
      "gray": "#6c6f85",
      "accent": {
        "rosewater": "#dc8a78",
        "flamingo": "#dd7878",
        "pink": "#ea76cb",
        "mauve": "#8839ef",
        "red": "#d20f39",
        "maroon": "#e64553",
        "peach": "#fe640b",
        "yellow": "#df8e1d",
        "green": "#40a02b",
        "teal": "#179299",
        "sky": "#04a5e5",
        "sapphire": "#209fb5",
        "blue": "#1e66f5",
        "lavender": "#7287fd"
      }
    }
  },
  "gray": {
    "name": {
      "default": "Dusk"
    },
    "id": "gray",
    "light_theme": False,
    "colors": {
      "text": "#c6d0f5",
      "subtext": "#a5adce",
      "red": "#e78284",
      "background": "#303446",
      "post_background": "#303446",
      "poll_voted_background": "#232634",
      "poll_no_vote_background": "#292c3c",
      "content_warning_background": "#292c3c",
      "input_background": "#232634",
      "checkbox_background": "#414559",
      "button_background": "#232634",
      "button_hover_background": "#292c3c",
      "button_inverted_background": "#303446",
      "input_border": "#414559",
      "checkbox_border": "#414559",
      "button_border": "#414559",
      "table_border": "#414559",
      "modal_backdrop": "#23263480",
      "modal_background": "#303446",
      "modal_border": "@accent",
      "gray": "#a5adce",
      "accent": {
        "rosewater": "#f2d5cf",
        "flamingo": "#eebebe",
        "pink": "#f4b8e4",
        "mauve": "#ca9ee6",
        "red": "#e78284",
        "maroon": "#ea999c",
        "peach": "#ef9f76",
        "yellow": "#e5c890",
        "green": "#a6d189",
        "teal": "#81c8be",
        "sky": "#99d1db",
        "sapphire": "#85c1dc",
        "blue": "#8caaee",
        "lavender": "#babbf1"
      }
    }
  },
  "purple": {
    "name": {
      "default": "Sunset"
    },
    "id": "purple",
    "light_theme": False,
    "colors": {
      "text": "#dadada",
      "subtext": "#7d747a",
      "red": "#d67677",
      "background": "#190b14",
      "post_background": "#200e19",
      "poll_voted_background": "#3b2433",
      "poll_no_vote_background": "#2b1a25",
      "content_warning_background": "#2b1a25",
      "input_background": "#2e1425",
      "checkbox_background": "#2e1425",
      "button_background": "#3c1a30",
      "button_hover_background": "#5e2a4e",
      "button_inverted_background": "#190b14",
      "input_border": "#31202b",
      "checkbox_border": "#31202b",
      "button_border": "#31202b",
      "table_border": "#31202b",
      "modal_backdrop": "#00000080",
      "modal_background": "#190b14",
      "modal_border": "@accent",
      "gray": "#687390",
      "accent": {
        "rosewater": "#f4dbd6",
        "flamingo": "#f0c6c6",
        "pink": "#d8a4c6",
        "mauve": "#c486da",
        "red": "#d67677",
        "maroon": "#ee99a0",
        "peach": "#ffb675",
        "yellow": "#d3d381",
        "green": "#86b300",
        "teal": "#229e82",
        "sky": "#31b1ce",
        "sapphire": "#56a4b6",
        "blue": "#56a4e8",
        "lavender": "#cea4da"
      }
    }
  },
  "dark": {
    "name": {
      "default": "Dark"
    },
    "id": "dark",
    "light_theme": False,
    "colors": {
      "text": "#cad3f5",
      "subtext": "#a5adcb",
      "red": "#ed8796",
      "background": "#24273a",
      "post_background": "#24273a",
      "poll_voted_background": "#181926",
      "poll_no_vote_background": "#1e2030",
      "content_warning_background": "#1e2030",
      "input_background": "#181926",
      "checkbox_background": "#363a4f",
      "button_background": "#181926",
      "button_hover_background": "#1e2030",
      "button_inverted_background": "#24273a",
      "input_border": "#363a4f",
      "checkbox_border": "#363a4f",
      "button_border": "#363a4f",
      "table_border": "#363a4f",
      "modal_backdrop": "#18192680",
      "modal_background": "#24273a",
      "modal_border": "@accent",
      "gray": "#a5adcb",
      "accent": {
        "rosewater": "#f4dbd6",
        "flamingo": "#f0c6c6",
        "pink": "#f5bde6",
        "mauve": "#c6a0f6",
        "red": "#ed8796",
        "maroon": "#ee99a0",
        "peach": "#f5a97f",
        "yellow": "#eed49f",
        "green": "#a6da95",
        "teal": "#8bd5ca",
        "sky": "#91d7e3",
        "sapphire": "#7dc4e4",
        "blue": "#8aadf4",
        "lavender": "#b7bdf8"
      }
    }
  },
  "black": {
    "name": {
      "default": "Midnight"
    },
    "id": "black",
    "light_theme": False,
    "colors": {
      "text": "#cdd6f4",
      "subtext": "#a6adc8",
      "red": "#f38ba8",
      "background": "#1e1e2e",
      "post_background": "#1e1e2e",
      "poll_voted_background": "#11111b",
      "poll_no_vote_background": "#181825",
      "content_warning_background": "#181825",
      "input_background": "#11111b",
      "checkbox_background": "#313244",
      "button_background": "#11111b",
      "button_hover_background": "#181825",
      "button_inverted_background": "#1e1e2e",
      "input_border": "#313244",
      "checkbox_border": "#313244",
      "button_border": "#313244",
      "table_border": "#313244",
      "modal_backdrop": "#11111b80",
      "modal_background": "#1e1e2e",
      "modal_border": "@accent",
      "gray": "#a6adc8",
      "accent": {
        "rosewater": "#f5e0dc",
        "flamingo": "#f2cdcd",
        "pink": "#f5c2e7",
        "mauve": "#cba6f7",
        "red": "#f38ba8",
        "maroon": "#eba0ac",
        "peach": "#fab387",
        "yellow": "#f9e2af",
        "green": "#a6e3a1",
        "teal": "#94e2d5",
        "sky": "#89dceb",
        "sapphire": "#74c7ec",
        "blue": "#89b4fa",
        "lavender": "#b4befe"
      }
    }
  },
  "oled": {
    "name": {
      "default": "Black"
    },
    "id": "oled",
    "light_theme": False,
    "colors": {
      "text": "#cdd6f4",
      "subtext": "#a6adc8",
      "red": "#f38ba8",
      "background": "#000000",
      "post_background": "#000000",
      "poll_voted_background": "#11111b",
      "poll_no_vote_background": "#080810",
      "content_warning_background": "#080810",
      "input_background": "#11111b",
      "checkbox_background": "#313244",
      "button_background": "#11111b",
      "button_hover_background": "#080810",
      "button_inverted_background": "#000000",
      "input_border": "#313244",
      "checkbox_border": "#313244",
      "button_border": "#313244",
      "table_border": "#313244",
      "modal_backdrop": "#00000080",
      "modal_background": "#000000",
      "modal_border": "@accent",
      "gray": "#a6adc8",
      "accent": {
        "rosewater": "#f5e0dc",
        "flamingo": "#f2cdcd",
        "pink": "#f5c2e7",
        "mauve": "#cba6f7",
        "red": "#f38ba8",
        "maroon": "#eba0ac",
        "peach": "#fab387",
        "yellow": "#f9e2af",
        "green": "#a6e3a1",
        "teal": "#94e2d5",
        "sky": "#89dceb",
        "sapphire": "#74c7ec",
        "blue": "#89b4fa",
        "lavender": "#b4befe"
      }
    }
  }
}

_THEMES_INTERNALS = {
    "taken": [i for i in THEMES] + ["auto", "custom"],
    "map": {
        "noon": "warm",
        "dawn": "light",
        "dusk": "gray",
        "dark": "dark",
        "sunset": "purple",
        "midnight": "black",
        "black": "oled"
    }
}

# stores variable metadata
_VARIABLES: list[tuple[str | None, list[str], type | str | list | tuple | dict, bool]] = [
#   ["VAR_NAME", keys, type, allow_null]
    ("VERSION", ["version"], str, False),
    ("SITE_NAME", ["site_name"], str, False),
    ("WEBSITE_URL", ["website_url"], str, False),
    ("OWNER_USER_ID", ["owner_user_id"], int, False),
    ("DEBUG", ["debug"], bool, False),
    ("MAX_ADMIN_LOG_LINES", ["max_admin_log_lines"], int, False),
    ("DEFAULT_LANGUAGE", ["default_lang", "default_language"], str, False),
    ("DEFAULT_DARK_THEME", ["default_dark_theme"], "theme", False),
    ("DEFAULT_LIGHT_THEME", ["default_light_theme"], "theme", False),
    ("CACHE_LANGUAGES", ["cache_langs", "cache_languages"], bool, True),
    ("ALLOW_SCRAPING", ["allow_scraping"], bool, False),
    ("MAX_USERNAME_LENGTH", ["max_username_length"], int, False),
    ("MAX_DISPL_NAME_LENGTH", ["max_display_name_length"], int, False),
    ("MAX_BIO_LENGTH", ["max_bio_length", "max_user_bio_length"], int, False),
    ("MAX_CONTENT_WARNING_LENGTH", ["max_cw_length", "max_warning_length", "max_content_warning_length"], int, False),
    ("MAX_POST_LENGTH", ["max_post_length"], int, False),
    ("MAX_POLL_OPTIONS", ["max_poll_options"], int, False),
    ("MAX_POLL_OPTION_LENGTH", ["max_poll_option_length"], int, False),
    ("DEFAULT_BANNER_COLOR", ["default_banner_color"], "color", False),
    ("POSTS_PER_REQUEST", ["posts_per_request"], int, False),
    ("MESSAGES_PER_REQUEST", ["messages_per_request"], int, False),
    ("MAX_NOTIFICATIONS", ["max_notifs", "max_notifications"], int, False),
    ("CONTACT_INFO", ["contact_info", "contact_information"], [[str]], False),
    ("POST_WEBHOOKS", ["webhooks", "auto_webhooks", "post_webhooks", "auto_post_webhooks"], {str: [str]}, False),
    ("SOURCE_CODE", ["source_code"], bool, False),
    ("RATELIMIT", ["ratelimit"], bool, False),
    ("API_TIMINGS", ["api_timings"], {str: int}, False),
    ("ENABLE_USER_BIOS", ["enable_user_bios"], bool, False),
    ("ENABLE_PRONOUNS", ["enable_pronouns"], bool, False),
    ("ENABLE_GRADIENT_BANNERS", ["enable_gradient_banners"], bool, False),
    ("ENABLE_ACCOUNT_SWITCHER", ["enable_account_switcher"], bool, False),
    ("ENABLE_HASHTAGS", ["enable_hashtags"], bool, False),
    ("ENABLE_PRIVATE_MESSAGES", ["enable_private_messages"], bool, False),
    ("ENABLE_PINNED_POSTS", ["enable_pinned_posts"], bool, False),
    ("ENABLE_POST_DELETION", ["enable_post_deletion"], bool, False),
    ("ENABLE_EDITING_POSTS", ["enable_editing_posts"], bool, False),
    ("ENABLE_CONTACT_PAGE", ["enable_contact_page"], bool, False),
    ("ENABLE_CREDITS_PAGE", ["enable_credits_page"], bool, False),
    ("ENABLE_BADGES", ["enable_badges"], bool, False),
    ("ENABLE_QUOTES", ["enable_quotes"], bool, False),
    ("ENABLE_POLLS", ["enable_polls"], bool, False),
    ("ENABLE_CONTENT_WARNINGS", ["enable_cws", "enable_c_warnings", "enable_content_warnings"], bool, False),
    ("ENABLE_LOGGED_OUT_CONTENT", ["enable_logged_out", "enable_logged_out_content"], bool, False),
    ("ENABLE_NEW_ACCOUNTS", ["enable_signup", "enable_new_users", "enable_new_accounts"], bool, False),
    ("ENABLE_EMAIL", ["email", "enable_email"], bool, False),
    ("ENABLE_SITEMAPS", ["sitemaps", "enable_sitemaps"], bool, False),
    ("ITEMS_PER_SITEMAP", ["items_per_sitemap"], int, False),
    ("GOOGLE_VERIFICATION_TAG", ["google_verification_tag"], str, False),
    ("DISCORD", ["discord", "discord_invite"], str, True),
    ("FAVICON_CACHE_TIMEOUT", ["favicon_cache_timeout"], int, True),
    ("SITEMAP_CACHE_TIMEOUT", ["sitemap_cache_timeout"], int, True),
    ("GENERIC_CACHE_TIMEOUT", ["generic_cache_timeout"], int, True),
    (None, ["custom_themes"], "theme-object", False),
    ("FAVICON_DATA", ["favicon", "favicon_data", "favicon_svg"], str, False),
    ("ENABLE_DYNAMIC_FAVICON", ["dynamic_favicon", "enable_dynamic_favicon"], bool, False)
]

f = {}

try:
    f = json.load(open(BASE_DIR / "settings.json", "r"))
except ValueError:
    error("Invalid settings.json")
except FileNotFoundError:
    error("settings.json not found")

def typecheck(obj: Any, expected_type: type | str | list | tuple | dict, allow_null: bool=False) -> bool | None:
    # Checks for a custom type format.
    # Lists should always have 0 or 1 indexes, and dicts should always have 0 or 1 keys.
    # If a list is empty, it allows any values. Same with dicts.
    # examples - python -> custom
    # int | float -> (int, float)
    # list[str | int] -> [(str, int)]
    # dict[str, list[str] | str] -> {str: ([str], str)}

    if expected_type is Any: # typing.Any throws a TypeError when used with isinstance()
        return True

    if obj is None:
        return allow_null

    if isinstance(expected_type, type):
        return isinstance(obj, expected_type)

    if isinstance(expected_type, str):
        if expected_type == "color":
            return isinstance(obj, str) and bool(re.match(r"^#[0-9a-f]{6}$", obj))

        if expected_type == "theme":
            return isinstance(obj, str) and obj.lower() in _THEMES_INTERNALS["map"]

        if expected_type == "theme-object":
            if not isinstance(obj, list):
                return False

            def keycheck(object: dict, type_dict: dict[str, type | Literal["color", "color_noop", "color_noa"]], prefix: str=""):
                for key, expected in type_dict.items():
                    if key not in object:
                        error(f"{prefix}{key} should be in theme definition {object}, discarding")
                        return False
                    elif not (isinstance(object[key], str) and bool(re.match(f"^(?:#[0-9a-f]{{6}}{'' if expected == 'color_noop' or expected == 'color_noa' else '(?:[0-9a-f]{2})?'}{'' if expected == 'color_noa' else '|@accent(?:-50)?'})$", object[key])) if expected == "color" or expected == "color_noop" or expected == "color_noa" else isinstance(object[key], expected)):
                        error(f"{prefix}{key} should be type {expected} in theme definition {object}, discarding")
                        return False
                return True

            for i in obj:
                if not isinstance(i, dict):
                    error(f"{i} should be object in theme definition, discarding")
                    continue

                if not (keycheck(i, {
                    "name": dict,
                    "id": str,
                    "light_theme": bool,
                    "colors": dict,
                }) and keycheck(i["name"], {
                    "default": str
                }, "name.") and keycheck(i["colors"], {
                    "text": "color",
                    "subtext": "color",
                    "red": "color",
                    "background": "color_noop",
                    "post_background": "color",
                    "poll_no_vote_background": "color",
                    "poll_voted_background": "color",
                    "content_warning_background": "color",
                    "input_background": "color",
                    "checkbox_background": "color",
                    "button_background": "color",
                    "button_hover_background": "color",
                    "button_inverted_background": "color",
                    "input_border": "color",
                    "checkbox_border": "color",
                    "button_border": "color",
                    "table_border": "color",
                    "gray": "color",
                    "accent": dict
                }, "colors.") and keycheck(i["colors"]["accent"], {
                    "rosewater": "color_noa",
                    "flamingo": "color_noa",
                    "pink": "color_noa",
                    "mauve": "color_noa",
                    "red": "color_noa",
                    "maroon": "color_noa",
                    "peach": "color_noa",
                    "yellow": "color_noa",
                    "green": "color_noa",
                    "teal": "color_noa",
                    "sky": "color_noa",
                    "sapphire": "color_noa",
                    "blue": "color_noa",
                    "lavender": "color_noa"
                }, "colors.accent.")):
                    continue

                i["id"] = i["id"].lower()

                if len(i["id"]) > 30:
                    error(f"Theme id '{i['id']}' needs to be less than 30 characters. Truncating to {i['id'] := i['id'][:30]}")

                if i["id"] in _THEMES_INTERNALS["taken"]:
                    error(f"Theme with id '{i['id']}' already taken, discarding")
                    continue

                THEMES[i["id"]] = i
                _THEMES_INTERNALS["taken"].append(i["id"])

            return None

        # Add more special checks when needed

        return False

    if isinstance(expected_type, list):
        if not isinstance(obj, list):
            return False

        if len(expected_type):
            for i in obj:
                if not typecheck(i, expected_type[0], allow_null):
                    return False

        return True

    if isinstance(expected_type, tuple):
        for i in expected_type:
            if not typecheck(obj, i, allow_null):
                return False

        return True

    if isinstance(expected_type, dict):
        if not isinstance(obj, dict):
            return False

        if len(expected_type):
            types = list(expected_type.items())[0]

            for key, val in obj.items():
                if not typecheck(key, types[0], allow_null) or not typecheck(val, types[1], allow_null):
                    return False

        return True

    return False

def is_ok(val: Any, var: str | None, t: type | str | list | tuple | dict, null: bool=False):
    if x := typecheck(val, t, null):
        exec(f"global {var}\n{var} = {repr(val)}")

    elif x is None:
        ...

    elif val is not None:
        error(f"{val} should be {t}")

def clamp(
    val: int | None,
    minimum: int | None = None,
    maximum: int | None = None
) -> int:
    if val is None:
        return val # type: ignore

    if minimum is not None:
        val = max(minimum, val)

    if maximum is not None:
        val = min(maximum, val)

    return val

_var_dict: dict[str, tuple[str | None, list[str], type | str | list | tuple | dict, bool]] = {}
for i in _VARIABLES:
    for alias in i[1]:
        _var_dict[alias] = i

_themes_check = []

for key, val in f.items():
    key = key.lower()
    if key in _var_dict:
        if _var_dict[key][2] == "theme":
            _themes_check.append({"key": key, "val": val})
            continue

        is_ok(val, _var_dict[key][0], _var_dict[key][2], null=_var_dict[key][3])
    else:
        error(f"Unknown setting {key}")

for i in _themes_check:
    is_ok(i["val"], _var_dict[i["key"]][0], _var_dict[i["key"]][2], null=_var_dict[i["key"]][3])

del _VARIABLES, _var_dict, _themes_check

MAX_ADMIN_LOG_LINES = clamp(MAX_ADMIN_LOG_LINES, minimum=1)
MAX_USERNAME_LENGTH = clamp(MAX_USERNAME_LENGTH, minimum=1, maximum=200)
MAX_DISPL_NAME_LENGTH = clamp(MAX_DISPL_NAME_LENGTH, minimum=MAX_USERNAME_LENGTH, maximum=200)
MAX_BIO_LENGTH = clamp(MAX_BIO_LENGTH, minimum=1, maximum=65536)
MAX_CONTENT_WARNING_LENGTH = clamp(MAX_CONTENT_WARNING_LENGTH, minimum=1, maximum=200)
MAX_POST_LENGTH = clamp(MAX_POST_LENGTH, minimum=1, maximum=65536)
MAX_POLL_OPTIONS = clamp(MAX_POLL_OPTIONS, minimum=2)
MAX_POLL_OPTION_LENGTH = clamp(MAX_POLL_OPTION_LENGTH, minimum=1)
POSTS_PER_REQUEST = clamp(POSTS_PER_REQUEST, minimum=1)
MESSAGES_PER_REQUEST = clamp(MESSAGES_PER_REQUEST, minimum=1)
MAX_NOTIFICATIONS = clamp(MAX_NOTIFICATIONS, minimum=1)
ITEMS_PER_SITEMAP = clamp(ITEMS_PER_SITEMAP, minimum=50, maximum=50000)
SITEMAP_CACHE_TIMEOUT = clamp(SITEMAP_CACHE_TIMEOUT, minimum=0)
GENERIC_CACHE_TIMEOUT = clamp(SITEMAP_CACHE_TIMEOUT, minimum=0)

if CACHE_LANGUAGES is None:
    CACHE_LANGUAGES = not DEBUG

VALID_LANGUAGES_TEMP = [i for i in os.listdir(BASE_DIR / "lang") if len(i) <= 10 and i[-5::] == ".json"]
VALID_LANGUAGES: list[dict[str, str]] = [{
    "name": json.load(open(BASE_DIR / f"lang/{i}"))["meta"]["name"],
    "code": i[:-5:]
} for i in sorted(VALID_LANGUAGES_TEMP)]

if ENABLE_EMAIL and WEBSITE_URL is None:
    ENABLE_EMAIL = False
    error("You need to set the website_url setting to enable emails!")

if ENABLE_SITEMAPS and WEBSITE_URL is None:
    ENABLE_SITEMAPS = False
    error("You need to set the website_url setting to enable sitemaps!")

DEFAULT_DARK_THEME = _THEMES_INTERNALS["map"][DEFAULT_DARK_THEME.lower()]
DEFAULT_LIGHT_THEME = _THEMES_INTERNALS["map"][DEFAULT_LIGHT_THEME.lower()]

for key, val in {
    "signup unsuccessful": 1000,
    "signup successful": 15000,
    "login unsuccessful": 1000,
    "login successful": 5000,
    "create comment": 3000,
    "create comment failure": 1000,
    "create post": 3000,
    "create post failure": 1000
}.items():
    if key not in API_TIMINGS:
        API_TIMINGS[key] = val

# Used when hashing user tokens
PRIVATE_AUTHENTICATOR_KEY: str = hashlib.sha256(auth_key).hexdigest()

# Using nested dicts because indexing a dict is generally faster than
# for a list.
timeout_handler: dict[str, dict[str, None]] = {}

ROBOTS: str = """\
User-agent: *
Disallow: /settings/
Disallow: /home/
Disallow: /api/
Disallow: /static/

# https://github.com/ai-robots-txt/ai.robots.txt/blob/main/robots.txt
User-agent: AI2Bot
User-agent: Ai2Bot-Dolma
User-agent: Amazonbot
User-agent: Applebot
User-agent: Applebot-Extended
User-agent: Bytespider
User-agent: CCBot
User-agent: ChatGPT-User
User-agent: Claude-Web
User-agent: ClaudeBot
User-agent: Diffbot
User-agent: FacebookBot
User-agent: FriendlyCrawler
User-agent: GPTBot
User-agent: Google-Extended
User-agent: GoogleOther
User-agent: GoogleOther-Image
User-agent: GoogleOther-Video
User-agent: ICC-Crawler
User-agent: ISSCyberRiskCrawler
User-agent: ImagesiftBot
User-agent: Kangaroo Bot
User-agent: Meta-ExternalAgent
User-agent: Meta-ExternalFetcher
User-agent: OAI-SearchBot
User-agent: PerplexityBot
User-agent: PetalBot
User-agent: Scrapy
User-agent: Sidetrade indexer bot
User-agent: Timpibot
User-agent: VelenPublicWebCrawler
User-agent: Webzio-Extended
User-agent: YouBot
User-agent: anthropic-ai
User-agent: cohere-ai
User-agent: facebookexternalhit
User-agent: iaskspider/2.0
User-agent: img2dataset
User-agent: omgili
User-agent: omgilibot
Disallow: /
"""

BADGE_DATA = {}

try:
    from backend._api_keys import smtp_auth  # type: ignore # noqa: F401
except ImportError:
    ENABLE_EMAIL = False

try:
    Badge.objects.get(name="administrator")

    for i in Badge.objects.all():
        BADGE_DATA[i.name] = i.svg_data

except Badge.DoesNotExist:
    icons = {
        "verified": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Verified</title><path d="M200.3 81.5C210.9 61.5 231.9 48 256 48s45.1 13.5 55.7 33.5c5.4 10.2 17.3 15.1 28.3 11.7 21.6-6.6 46.1-1.4 63.1 15.7s22.3 41.5 15.7 63.1c-3.4 11 1.5 22.9 11.7 28.2 20 10.6 33.5 31.6 33.5 55.7s-13.5 45.1-33.5 55.7c-10.2 5.4-15.1 17.2-11.7 28.2 6.6 21.6 1.4 46.1-15.7 63.1s-41.5 22.3-63.1 15.7c-11-3.4-22.9 1.5-28.2 11.7-10.6 20-31.6 33.5-55.7 33.5s-45.1-13.5-55.7-33.5c-5.4-10.2-17.2-15.1-28.2-11.7-21.6 6.6-46.1 1.4-63.1-15.7S86.6 361.6 93.2 340c3.4-11-1.5-22.9-11.7-28.2C61.5 301.1 48 280.1 48 256s13.5-45.1 33.5-55.7c10.2-5.4 15.1-17.3 11.7-28.3-6.6-21.6-1.4-46.1 15.7-63.1s41.5-22.3 63.1-15.7c11 3.4 22.9-1.5 28.2-11.7zM256 0c-35.9 0-67.8 17-88.1 43.4-33-4.3-67.6 6.2-93 31.6S39 135 43.3 168C17 188.2 0 220.1 0 256s17 67.8 43.4 88.1c-4.3 33 6.2 67.6 31.6 93s60 35.9 93 31.6c20.2 26.3 52.1 43.3 88 43.3s67.8-17 88.1-43.4c33 4.3 67.6-6.2 93-31.6s35.9-60 31.6-93c26.3-20.2 43.3-52.1 43.3-88s-17-67.8-43.4-88.1c4.3-33-6.2-67.6-31.6-93S377 39 344 43.3C323.8 17 291.9 0 256 0m113 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0z"/></svg>',
        "developer": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><title>Developer</title><path d="M80 112a32 32 0 1 0 0-64 32 32 0 1 0 0 64m80-32c0 35.8-23.5 66.1-56 76.3V192c0 22.1 17.9 40 40 40h160c22.1 0 40-17.9 40-40v-35.7c-32.5-10.2-56-40.5-56-76.3 0-44.2 35.8-80 80-80s80 35.8 80 80c0 35.8-23.5 66.1-56 76.3V192c0 48.6-39.4 88-88 88h-56v75.7c32.5 10.2 56 40.5 56 76.3 0 44.2-35.8 80-80 80s-80-35.8-80-80c0-35.8 23.5-66.1 56-76.3V280h-56c-48.6 0-88-39.4-88-88v-35.7C23.5 146.1 0 115.8 0 80 0 35.8 35.8 0 80 0s80 35.8 80 80m208 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64M256 432a32 32 0 1 0-64 0 32 32 0 1 0 64 0"/></svg>',
        "administrator": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Administrator</title><path d="M232 59.6v390.7C99.2 375.7 64.4 227.3 64 139.7c0-5 3.1-10.2 9-12.8zm48 390.8V59.6L439 127c5.9 2.5 9.1 7.8 9 12.8-.4 87.5-35.2 236-168 310.6M457.7 82.8 269.4 2.9C265.2 1 260.7 0 256 0s-9.2 1-13.4 2.9L54.3 82.8c-22 9.3-38.4 31-38.3 57.2.5 99.2 41.3 280.7 213.6 363.2 16.7 8 36.1 8 52.8 0C454.8 420.7 495.5 239.2 496 140c.1-26.2-16.3-47.9-38.3-57.2"/></svg>'
    }

    for i in icons:
        x = Badge.objects.create(
            name=i,
            svg_data=icons[i]
        )
        x.save()
        del x

    del icons

    for i in Badge.objects.all():
        BADGE_DATA[i.name] = i.svg_data

except OperationalError:
    print("\x1b[91mYou need to migrate your database! Do this by running 'manage.py migrate'. If you are already doing that, ignore this message.\x1b[0m")
