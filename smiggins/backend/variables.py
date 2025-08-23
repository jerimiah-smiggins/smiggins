import hashlib
import os
import pathlib
import re
import sys
from typing import Any, Callable, Literal

import yaml
from dotenv import dotenv_values

print("Loading config...")

def dotenv_or_(key: str, val: Any, process: Callable[[str], Any]=lambda x: x) -> Any:
    try:
        return process(str(dotenv[key]))
    except KeyError:
        return val

def error(string):
    print(f"\x1b[91m{string}\x1b[0m")

dotenv = dotenv_values(".env")

auth_key = None
try:
    from ._api_keys import auth_key  # type: ignore
except ImportError:
    ...

auth_key = dotenv_or_("auth_key", auth_key, str.encode)

if "auth_key" not in globals() or not auth_key:
    error("auth_key not set in .env")
    exit()

if sys.version_info >= (3, 12):
    from typing import TypedDict
else:
    from typing_extensions import TypedDict

class DatabaseBackupsSchema(TypedDict):
    enabled: bool
    frequency: int | float
    keep: int
    path: str
    filename: str


BASE_DIR = pathlib.Path(__file__).resolve().parent.parent

CREDITS: dict[str, list[str]] = {
    "lead": ["trinkey"],
    "contributors": [
        "Subroutine7901",
        "DiamondTaco",
        "TheMineCommander"
    ]
}

# Set default variable states
REAL_VERSION: tuple[int, int, int] = (0, 14, 0)
VERSION: str = ".".join([str(i) for i in REAL_VERSION])
SITE_NAME: str = "Jerimiah Smiggins"
MOTDs: list[str] | None = None
WEBSITE_URL: str | None = None
DEBUG: bool = True
DATABASE_BACKUPS: DatabaseBackupsSchema = {
    "enabled": False,
    "frequency":  24,
    "keep": 5,
    "path": "$/backups/",
    "filename": "db-$.sqlite3"
}
OWNER_USER_ID: int = 1
MAX_ADMIN_LOG_LINES: int = 1000
DEFAULT_LANGUAGE: str = "en-US"
DEFAULT_DARK_THEME: str = "dark"
DEFAULT_LIGHT_THEME: str = "dawn"
CACHE_LANGUAGES: bool | None = True
ALLOW_SCRAPING: bool = False
ALLOW_INDEXING: bool = True
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
MAX_MUTED_WORDS: int = 50
MAX_MUTED_WORD_LENGTH: int = 500
CONTACT_INFO: list[list[str]] = [
    ["email", "trinkey@duck.com"],
    ["url",   "https://github.com/jerimiah-smiggins/smiggins/issues"],
    ["url",   "https://discord.gg/tH7QnHApwu"],
    ["text",  "DM me on discord (@trinkey_)"]
]
CUSTOM_HEADERS: dict[str, Any] = {}
SOURCE_CODE: bool = True
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
ENABLE_POLLS: bool = True
ENABLE_LOGGED_OUT_CONTENT: bool = True
ENABLE_NEW_ACCOUNTS: bool | Literal["otp"] = True
ENABLE_EMAIL: bool = False
ENABLE_SITEMAPS: bool = False
ITEMS_PER_SITEMAP: int = 500
GOOGLE_VERIFICATION_TAG: str | None = ""
DISCORD: str | None = "tH7QnHApwu"
FAVICON_CACHE_TIMEOUT: int | None = 7200
SITEMAP_CACHE_TIMEOUT: int | None = 86400
GENERIC_CACHE_TIMEOUT: int | None = 604800
FAVICON_DATA: str = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path fill="@{background}" d="M0 73.1C0 32.8 32.8 0 73.1 0h365.7c40.3 0 73.1 32.8 73.1 73.1v365.7c0 40.3-32.8 73.1-73.1 73.1H73.1C32.8 511.9 0 479.1 0 438.8z"/>
  <path fill="@{background_alt}" d="m388.9 159.2 53.2-.6v235.6c0 42.9-34.8 77.8-77.8 77.8H247.6c-14.3 0-25.9-11.6-25.9-25.9s11.6-25.9 25.9-25.9H293L182.8 332v114.1c0 14.3-11.6 25.9-25.9 25.9S131 460.4 131 446.1V261.4c8.5 2.2 17.2 3.2 25.9 3.2 38.4 0 72-20.8 89.9-51.9h13.9c54.1 0 101.8 27.6 129.6 69.5v-69.1l-1.3-53.9zm-258 75c-17.7-6.2-32.5-18.7-41.6-34.8-6.5-11.3-10.2-24.6-10.2-38.6v-95c0-4.8 3.8-8.6 8.6-8.7h.2c2.7 0 5.2 1.3 6.8 3.4l10.4 13.9 22 29.4 3.9 5.2h51.9l3.9-5.2 22-29.4 10.4-13.8c1.6-2.2 4.1-3.5 6.8-3.5h.2c4.8 0 8.6 3.9 8.6 8.7v95c0 14.6-4.1 28.8-11.7 41.2-2.3 3.8-5 7.4-8 10.7-14.3 15.9-35 27.1-58 25.9s-18.1-1.5-26.2-4.4m51.9-60.4c7.2 0 13-5.8 13-13s-5.8-13-13-13-13 5.8-13 13 5.8 13 13 13m-38.9-13c0-7.2-5.8-13-13-13s-13 5.8-13 13 5.8 13 13 13 13-5.8 13-13"/>
  <path fill="@{background_alt}" d="m389.2 169.1-.4-10.6v-.7c1.4-34.2-27.2-54.5-44.9-53.1h-1.8c-9.8.4-17.6 4.7-22.7 10.8-1.3 1.7-2.6 3.4-3.6 5.3 4.8-3 10.3-4.5 16.3-3.9 24.8 2.1 31.3 25.5 30.6 37.4-.8 14.8-10 28.6-25.5 35.4-16.9 8.4-36 3.6-48.6-4.5-14.3-9.1-25.6-24.7-28.3-45.3-3.7-21.5 4.7-43.2 17.9-59.2 14-16.3 35.5-28.9 61.5-29.7 52.4-3.9 104.2 45.4 102.5 107.6"/>
  <path fill="@{accent}" d="m379.7 148.5 53.2-.6v235.6c0 42.9-34.8 77.8-77.8 77.8H238.4c-14.3 0-25.9-11.6-25.9-25.9s11.6-25.9 25.9-25.9h45.4l-110.2-88.2v114.1c0 14.3-11.6 25.9-25.9 25.9s-25.9-11.6-25.9-25.9V250.7c8.5 2.2 17.2 3.2 25.9 3.2 38.4 0 72-20.8 89.9-51.9h13.9c53.1 0 101.8 27.6 129.6 69.5v-69.1l-1.3-53.9zm-257.9 75c-17.7-6.2-32.5-18.7-41.6-34.8-6.5-11.3-10.2-24.6-10.2-38.6v-95c0-4.8 3.8-8.6 8.6-8.7h.2c2.7 0 5.2 1.3 6.8 3.4L96 63.7l22 29.4 3.9 5.2h51.9l3.9-5.2 22-29.4 10.4-13.8c1.6-2.2 4.1-3.5 6.8-3.5h.2c4.8 0 8.6 3.9 8.6 8.7v95c0 14.6-4.1 28.8-11.7 41.2-2.3 3.8-5 7.4-8 10.7-14.3 15.9-35 25.9-53 25.9s-23.1-1.5-31.2-4.4m56.8-60.4c7.2 0 13-5.8 13-13s-5.8-13-13-13-13 5.8-13 13 5.8 13 13 13m-38.9-13c0-7.2-5.8-13-13-13s-13 5.8-13 13 5.8 13 13 13 13-5.8 13-13"/>
  <path fill="@{accent}" d="M379.8 149v-1.9c1.3-34.2-27.4-54.5-45.1-53.1h-1.8c-9.8.4-17.6 4.7-22.7 10.8-1.3 1.7-2.6 3.4-3.6 5.3 4.8-3 10.3-4.5 16.3-3.9 24.8 2.1 31.3 25.5 30.6 37.4-.8 14.8-10 28.6-25.5 35.4-16.9 8.4-36 3.6-48.6-4.5-14.3-9.1-25.6-24.7-28.3-45.3-3.7-21.5 4.7-43.2 17.9-59.2 14-16.3 35.5-28.9 61.5-29.7 52.4-3.9 104.2 45.9 102.5 108.1"/>
</svg>"""
ENABLE_DYNAMIC_FAVICON: bool = True
ALTERNATE_IPS: bool | str = False
ENABLE_RATELIMIT: bool = True
RATELIMITS: dict[str, tuple[int, int] | None] = {}

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
    ("MOTDs", ["motd", "motds"], [str], True),
    ("OWNER_USER_ID", ["owner_user_id"], int, False),
    ("DEBUG", ["debug"], bool, False),
    ("DATABASE_BACKUPS",  ["db_backups", "db_backup"], "db",  False),
    ("MAX_ADMIN_LOG_LINES", ["max_admin_log_lines"], int, False),
    ("DEFAULT_LANGUAGE", ["default_lang", "default_language"], str, False),
    ("DEFAULT_DARK_THEME", ["default_dark_theme"], "theme", False),
    ("DEFAULT_LIGHT_THEME", ["default_light_theme"], "theme", False),
    ("CACHE_LANGUAGES", ["cache_langs", "cache_languages"], bool, True),
    ("ALLOW_SCRAPING", ["allow_scraping"], bool, False),
    ("ALLOW_INDEXING", ["allow_indexing"], bool, False),
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
    ("MAX_MUTED_WORDS", ["max_muted_words"], int, False),
    ("MAX_MUTED_WORD_LENGTH", ["max_muted_word_length"], int, False),
    ("CONTACT_INFO", ["contact_info", "contact_information"], [[str]], False),
    ("CUSTOM_HEADERS", ["custom_headers", "headers"], {str: Any}, False),
    ("SOURCE_CODE", ["source_code"], bool, False),
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
    ("ENABLE_LOGGED_OUT_CONTENT", ["enable_logged_out", "enable_logged_out_content"], bool, False),
    ("ENABLE_NEW_ACCOUNTS", ["enable_signup", "enable_new_users", "enable_new_accounts"], (bool, "Literal_otp"), False),
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
    ("ENABLE_DYNAMIC_FAVICON", ["dynamic_favicon", "enable_dynamic_favicon"], bool, False),
    ("ALTERNATE_IPS", ["alternate_ips"], (bool, str), False),
    ("ENABLE_RATELIMIT", ["enable_ratelimit"], bool, False),
    ("RATELIMITS", ["ratelimits"], {str: "ratelimit-value"}, False)
]

f = {}

try:
    f = yaml.safe_load(open(BASE_DIR / "settings.yaml", "r", encoding="utf-8"))
except ValueError:
    error("Invalid settings.yaml")
    exit()
except FileNotFoundError:
    error("settings.yaml not found")
    exit()

def typecheck(obj: Any, expected_type: type | str | list | tuple | dict, allow_null: bool=False) -> bool | None:
    # Checks for a custom type format.
    # Lists should always have 0 or 1 indexes, and dicts should always have 0 or 1 keys.
    # If a list is empty, it allows any values. Same with dicts.
    # examples - python -> custom
    # int | float | Literal["some string"] -> (int, float, "Literal_some string") (literal strings are case insensitive)
    # list[str | int] -> [(str, int)]
    # dict[str, list[str] | str] -> {str: ([str], str)}

    if expected_type is Any: # typing.Any throws a TypeError when used with isinstance()
        return True

    if obj is None and not isinstance(expected_type, str):
        return allow_null

    if isinstance(expected_type, type):
        return isinstance(obj, expected_type)

    if isinstance(expected_type, str):
        if expected_type.startswith("Literal_"):
            return isinstance(obj, str) and obj.lower() == expected_type[8::].lower()

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

                if "id" in i and i["id"] == "custom":
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
                    "poll_voted_background": "color",
                    "poll_no_vote_background": "color",
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
                    "modal_backdrop": "color",
                    "modal_background": "color",
                    "modal_border": "color",
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

        if expected_type == "db":
            if not isinstance(obj, dict):
                return False

            for key, val in {
                "enabled": bool,
                "frequency": (float, int),
                "keep": int,
                "path": str,
                "filename": str
            }.items():
                if not typecheck(obj[key], val):
                    error(f"db_backup, {key} should be {val}")
                    return False

            if "$" not in obj["filename"]:
                error("db_backup, '$' should be in filename")
                return False

            return True

        if expected_type == "ratelimit-value":
            if obj is None:
                return True

            if not isinstance(obj, list):
                return False

            if len(obj) != 2:
                return False

            if not all([isinstance(i, int) for i in obj]):
                return False

            return True

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
            if typecheck(obj, i, allow_null):
                return True

        return False

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
MAX_MUTED_WORDS = clamp(MAX_MUTED_WORDS, minimum=1)
MAX_MUTED_WORD_LENGTH = clamp(MAX_MUTED_WORD_LENGTH, minimum=1)
ITEMS_PER_SITEMAP = clamp(ITEMS_PER_SITEMAP, minimum=50, maximum=50000)
SITEMAP_CACHE_TIMEOUT = clamp(SITEMAP_CACHE_TIMEOUT, minimum=0)
GENERIC_CACHE_TIMEOUT = clamp(SITEMAP_CACHE_TIMEOUT, minimum=0)
DATABASE_BACKUPS["frequency"] = clamp(DATABASE_BACKUPS["frequency"], minimum=1) # type: ignore
DATABASE_BACKUPS["keep"] = clamp(DATABASE_BACKUPS["keep"], minimum=1)

if isinstance(ENABLE_NEW_ACCOUNTS, str):
    ENABLE_NEW_ACCOUNTS = ENABLE_NEW_ACCOUNTS.lower()

if CACHE_LANGUAGES is None:
    CACHE_LANGUAGES = not DEBUG

VALID_LANGUAGES: list[str] = sorted([i[:-5:] for i in os.listdir(BASE_DIR / "lang") if len(i) <= 10 and i[-5::] == ".json"])

if ENABLE_EMAIL and WEBSITE_URL is None:
    ENABLE_EMAIL = False
    error("You need to set the website_url setting to enable emails!")

if ENABLE_SITEMAPS and WEBSITE_URL is None:
    ENABLE_SITEMAPS = False
    error("You need to set the website_url setting to enable sitemaps!")

DEFAULT_DARK_THEME = _THEMES_INTERNALS["map"][DEFAULT_DARK_THEME.lower()]
DEFAULT_LIGHT_THEME = _THEMES_INTERNALS["map"][DEFAULT_LIGHT_THEME.lower()]

for key, val in {
  "GET /api/init/context": (10, 5),
  "GET /api/init/lang": (10, 60),
  "GET /api/init/muted": (10, 60),
  "GET /api/init/badges": (10, 60),
  "POST /api/user/signup": (2, 10),
  "POST /api/user/login": (5, 10),
  "GET /api/user/notifications": (5, 10),
  "PATCH /api/user/notifications": (2, 10),
  "DELETE /api/user/notifications": (2, 10),
  "PATCH /api/user/settings/theme": (10, 5),
  "PATCH /api/user/settings": (5, 10),
  "POST /api/user/muted": (4, 20),
  "PATCH /api/user/password": (4, 60),
  "POST /api/user/follow": (10, 5),
  "DELETE /api/user/follow": (10, 5),
  "GET /api/user/pending": (5, 10),
  "POST /api/user/pending": (10, 5),
  "DELETE /api/user/pending": (10, 5),
  "POST /api/user/block": (10, 5),
  "DELETE /api/user/block": (10, 5),
  "PATCH /api/user/pin": (2, 10),
  "DELETE /api/user/pin": (2, 10),
  "GET /api/user/lists": (10, 5),
  "DELETE /api/user": (4, 120),
  "PUT /api/comment/create": (5, 30),
  "PUT /api/quote/create": (5, 30),
  "PUT /api/post/create": (5, 60),
  "GET /api/post/user/{str:username}": (20, 60),
  "GET /api/post/following": (20, 60),
  "GET /api/post/recent": (20, 60),
  "GET /api/comments": (5, 10),
  "GET /api/hashtag/{str:hashtag}": (10, 5),
  "DELETE /api/post": (10, 10),
  "DELETE /api/comment": (10, 10),
  "POST /api/post/like": (10, 5),
  "DELETE /api/post/like": (10, 5),
  "POST /api/comment/like": (10, 5),
  "DELETE /api/comment/like": (10, 5),
  "PATCH /api/post/edit": (2, 10),
  "PATCH /api/comment/edit": (2, 10),
  "POST /api/post/poll": (10, 5),
  "GET /api/post/poll": (5, 10),
  "GET /api/messages/list": (10, 5),
  "POST /api/messages/new": (3, 10),
  "GET /api/messages": (10, 5),
  "POST /api/messages": (10, 10),
  "DELETE /api/admin/user": (4, 60),
  "POST /api/admin/badge": (10, 5),
  "PATCH /api/admin/badge": (10, 5),
  "PUT /api/admin/badge": (2, 5),
  "DELETE /api/admin/badge": (5, 5),
  "GET /api/admin/info": (10, 30),
  "PATCH /api/admin/info": (5, 10),
  "GET /api/admin/level": (10, 5),
  "PATCH /api/admin/level": (5, 5),
  "GET /api/admin/logs": (5, 10),
  "POST /api/admin/otp": (5, 5),
  "DELETE /api/admin/otp": (10, 5),
  "GET /api/admin/otp": (10, 5),
  "POST /api/admin/muted": (2, 10),
  "POST /api/email/password": (3, 60),
  "POST /api/email/save": (4, 20),
  "GET /api/info/notifications": (5, 10),
  "GET /api/info/version": None
}.items():
    if key not in RATELIMITS:
        RATELIMITS[key] = val

# Used when hashing user tokens
PRIVATE_AUTHENTICATOR_KEY: str = hashlib.sha256(auth_key).hexdigest()

ROBOTS: str = """\
User-agent: *
Disallow: /logout/
Disallow: /settings/
Disallow: /notifications/
Disallow: /messages/
Disallow: /pending/
Disallow: /m/
Disallow: /email/
Disallow: /admin/
Disallow: /django-admin/
Disallow: /api/

# https://github.com/ai-robots-txt/ai.robots.txt/blob/main/robots.txt
User-agent: AI2Bot
User-agent: Ai2Bot-Dolma
User-agent: Amazonbot
User-agent: anthropic-ai
User-agent: Applebot
User-agent: Applebot-Extended
User-agent: Bytespider
User-agent: CCBot
User-agent: ChatGPT-User
User-agent: Claude-Web
User-agent: ClaudeBot
User-agent: cohere-ai
User-agent: cohere-training-data-crawler
User-agent: Diffbot
User-agent: DuckAssistBot
User-agent: FacebookBot
User-agent: FriendlyCrawler
User-agent: Google-Extended
User-agent: GoogleOther
User-agent: GoogleOther-Image
User-agent: GoogleOther-Video
User-agent: GPTBot
User-agent: iaskspider/2.0
User-agent: ICC-Crawler
User-agent: ImagesiftBot
User-agent: img2dataset
User-agent: ISSCyberRiskCrawler
User-agent: Kangaroo Bot
User-agent: Meta-ExternalAgent
User-agent: Meta-ExternalFetcher
User-agent: OAI-SearchBot
User-agent: omgili
User-agent: omgilibot
User-agent: PanguBot
User-agent: PerplexityBot
User-agent: PetalBot
User-agent: Scrapy
User-agent: SemrushBot
User-agent: Sidetrade indexer bot
User-agent: Timpibot
User-agent: VelenPublicWebCrawler
User-agent: Webzio-Extended
User-agent: YouBot
Disallow: /
""" if ALLOW_INDEXING else "User-agent: *\nDisallow: /\n"

print("Finished loading config")
