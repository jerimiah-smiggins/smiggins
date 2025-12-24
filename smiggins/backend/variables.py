import hashlib
import pathlib
import re
import sys
from typing import Any, Callable, Literal

import yaml
from dotenv import dotenv_values

print("Loading config...")
REAL_VERSION: tuple[int, int, int] = (1, 4, 3)

def dotenv_or_(key: str, val: Any, process: Callable[[str], Any]=lambda x: x) -> Any:
    try:
        return process(str(dotenv[key]))
    except KeyError:
        return val

def error(string):
    print(f"\x1b[91m{string}\x1b[0m")

dotenv = dotenv_values(".env")

auth_key = None # type: ignore
try:
    from ._api_keys import auth_key  # type: ignore
except ImportError:
    ...

auth_key: bytes = dotenv_or_("auth_key", auth_key, str.encode)

if not auth_key:
    error("auth_key not set in .env")
    auth_key = b""

try:
    VAPID = {
        "public": dotenv["VAPID_public_key"],
        "private": dotenv["VAPID_private_key"],
        "email": dotenv["VAPID_email"]
    }
except KeyError:
    error("VAPID keys not set in .env")
    VAPID = None

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

VERSION: str = ".".join([str(i) for i in REAL_VERSION])

# Set default variable states
SITE_NAME: str = "Jerimiah Smiggins"
SITE_DESCRIPTION: str = None # type: ignore - gets properly set after conf is loaded
WEBSITE_URL: str | None = None
MOTDs: list[str] | None = None
DEBUG: bool = True
DATABASE_BACKUPS: DatabaseBackupsSchema = {
    "enabled": False,
    "frequency":  24,
    "keep": 5,
    "path": "$/backups/",
    "filename": "db-$.sqlite3"
}
OWNER_USER_ID: int = 1
ALLOW_INDEXING: bool = True
MAX_USERNAME_LENGTH: int = 18
MAX_DISPL_NAME_LENGTH: int = 32
MAX_CONTENT_WARNING_LENGTH: int = 100
MAX_POST_LENGTH: int = 2000
MAX_BIO_LENGTH: int = 2000
MAX_POLL_OPTION_LENGTH: int = 64
MAX_POLL_OPTIONS: int = 8
DEFAULT_BANNER_COLOR: str = "#3a1e93"
POSTS_PER_REQUEST: int = 20
ENABLE_NEW_ACCOUNTS: bool | Literal["otp"] = True
ENABLE_ABOUT_PAGE: bool = True
ENABLE_PRONOUNS: bool = True
ENABLE_RATELIMIT: bool = True
GOOGLE_VERIFICATION_TAG: str | None = ""
# DISCORD: str | None = "tH7QnHApwu"
ALTERNATE_IPS: bool | str = False
TIMELINE_POLLING_INTERVAL: int = 15
NOTIFICATION_POLLING_INTERVAL: int = 60

API_RATELIMITS: dict[str, tuple[int, int]] = {
#   "METHOD /api/route": (MAX_REQ, PER_N_SECONDS)
#   "METHOD /api/route/*" implies another parameter after, such as /api/route/{int:var}

    "POST /api/user/signup": (4, 10),
    "POST /api/user/login": (6, 10),

    "POST /api/user/follow": (10, 2),
    "DELETE /api/user/follow": (10, 2),
    "POST /api/user/block": (10, 2),
    "DELETE /api/user/block": (10, 2),
    "POST /api/user/follow-request": (10, 2),
    "DELETE /api/user/follow-request": (10, 2),

    "GET /api/user": (10, 10),
    "PATCH /api/user": (10, 10),
    "DELETE /api/user": (4, 10),
    "PATCH /api/user/password": (4, 10),

    "PATCH /api/user/default_post": (10, 2),
    "PATCH /api/user/verify_followers": (10, 2),

    "GET /api/timeline/global": (10, 5),
    "GET /api/timeline/following": (10, 5),
    "GET /api/timeline/user/*": (10, 5),
    "GET /api/timeline/post/*": (10, 5),
    "GET /api/timeline/notifications": (10, 5),
    "GET /api/timeline/tag/*": (10, 5),
    "GET /api/timeline/follow-requests": (10, 5),
    "GET /api/timeline/search": (10, 5),
    "GET /api/timeline/user/following/*": (10, 5),
    "GET /api/timeline/user/followers/*": (10, 5),

    "POST /api/post": (10, 5),
    "PATCH /api/post": (10, 5),
    "DELETE /api/post": (20, 5),

    "POST /api/post/like/*": (10, 2),
    "DELETE /api/post/like/*": (10, 2),

    "POST /api/post/pin/*": (10, 2),
    "DELETE /api/post/pin": (10, 2),

    "GET /api/post/poll/*": (10, 2),
    "POST /api/post/poll": (10, 2),

    "GET /api/message/list": (10, 5),
    "GET /api/messages/*": (10, 5),
    "POST /api/message/*": (10, 5),
    "GET /api/message/group": (3, 120),

    "GET /api/notifications": (10, 2),
}

# stores variable metadata
_VARIABLES: list[tuple[str | None, list[str], type | str | list | tuple | dict, bool]] = [
#   ["VAR_NAME", keys, type, allow_null]
    ("SITE_NAME", ["site_name"], str, False),
    ("SITE_DESCRIPTION", ["site_description"], str, True),
    ("WEBSITE_URL", ["website_url"], str, False),
    ("MOTDs", ["motd", "motds"], [str], True),
    ("DEBUG", ["debug"], bool, False),
    ("DATABASE_BACKUPS",  ["db_backups", "db_backup"], "db",  False),
    ("OWNER_USER_ID", ["owner_user_id"], int, False),
    ("ALLOW_INDEXING", ["allow_indexing"], bool, False),
    ("MAX_USERNAME_LENGTH", ["max_username_length"], int, False),
    ("MAX_DISPL_NAME_LENGTH", ["max_display_name_length"], int, False),
    ("MAX_CONTENT_WARNING_LENGTH", ["max_cw_length", "max_warning_length", "max_content_warning_length"], int, False),
    ("MAX_POST_LENGTH", ["max_post_length"], int, False),
    ("MAX_BIO_LENGTH", ["max_bio_length", "max_user_bio_length"], int, False),
    ("MAX_POLL_OPTION_LENGTH", ["max_poll_option_length"], int, False),
    ("MAX_POLL_OPTIONS", ["max_poll_options"], int, False),
    ("DEFAULT_BANNER_COLOR", ["default_banner_color"], "color", False),
    ("POSTS_PER_REQUEST", ["posts_per_request"], int, False),
    ("ENABLE_NEW_ACCOUNTS", ["enable_signup", "enable_new_users", "enable_new_accounts"], (bool, "Literal_otp"), False),
    ("ENABLE_ABOUT_PAGE", ["enable_about_page"], bool, False),
    ("ENABLE_PRONOUNS", ["enable_pronouns"], bool, False),
    ("ENABLE_RATELIMIT", ["enable_ratelimit"], bool, False),
    ("GOOGLE_VERIFICATION_TAG", ["google_verification_tag"], str, False),
    ("ALTERNATE_IPS", ["alternate_ips"], (bool, str), False),
    ("TIMELINE_POLLING_INTERVAL", ["timeline_polling_interval"], int, False),
    ("NOTIFICATION_POLLING_INTERVAL", ["notifications_polling_interval"], int, False)
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

SITE_NAME = SITE_NAME.replace(";", ":")
MAX_USERNAME_LENGTH = clamp(MAX_USERNAME_LENGTH, minimum=1, maximum=2 ** 8 - 1)
MAX_DISPL_NAME_LENGTH = clamp(MAX_DISPL_NAME_LENGTH, minimum=MAX_USERNAME_LENGTH, maximum=2 ** 8 - 1)
MAX_BIO_LENGTH = clamp(MAX_BIO_LENGTH, minimum=1, maximum=2 ** 16 - 1)
MAX_CONTENT_WARNING_LENGTH = clamp(MAX_CONTENT_WARNING_LENGTH, minimum=1, maximum=2 ** 8 - 1)
MAX_POST_LENGTH = clamp(MAX_POST_LENGTH, minimum=1, maximum=2 ** 16 - 1)
MAX_POLL_OPTIONS = clamp(MAX_POLL_OPTIONS, minimum=2, maximum=2 ** 8 - 1)
MAX_POLL_OPTION_LENGTH = clamp(MAX_POLL_OPTION_LENGTH, minimum=1, maximum=2 ** 16 - 1)
POSTS_PER_REQUEST = clamp(POSTS_PER_REQUEST, minimum=1, maximum=2 ** 8 - 1)
TIMELINE_POLLING_INTERVAL = clamp(TIMELINE_POLLING_INTERVAL, minimum=1)
NOTIFICATION_POLLING_INTERVAL = clamp(NOTIFICATION_POLLING_INTERVAL, minimum=1)
DATABASE_BACKUPS["frequency"] = clamp(DATABASE_BACKUPS["frequency"], minimum=1) # type: ignore
DATABASE_BACKUPS["keep"] = clamp(DATABASE_BACKUPS["keep"], minimum=1)

if SITE_DESCRIPTION is None:
    SITE_DESCRIPTION = f"{SITE_NAME} is a small social media platform running Smiggins. On {SITE_NAME}, you can talk to others in a fun and inclusive environment."

if isinstance(ENABLE_NEW_ACCOUNTS, str):
    ENABLE_NEW_ACCOUNTS = ENABLE_NEW_ACCOUNTS.lower()

# Used when hashing user tokens
PRIVATE_AUTHENTICATOR_KEY: str = hashlib.sha256(auth_key).hexdigest()

ROBOTS: str = f"""\
User-agent: *
Disallow: /logout/
Disallow: /django-admin/
Disallow: /api/

# https://github.com/ai-robots-txt/ai.robots.txt/blob/main/robots.txt
{"User-agent: AddSearchBot|User-agent: AI2Bot|User-agent: Ai2Bot-Dolma|User-agent: aiHitBot|User-agent: AmazonBuyForMe|User-agent: atlassian-bot|User-agent: amazon-kendra|User-agent: Amazonbot|User-agent: Andibot|User-agent: Anomura|User-agent: anthropic-ai|User-agent: Applebot|User-agent: Applebot-Extended|User-agent: Awario|User-agent: bedrockbot|User-agent: bigsur.ai|User-agent: Bravebot|User-agent: Brightbot 1.0|User-agent: BuddyBot|User-agent: Bytespider|User-agent: CCBot|User-agent: ChatGPT Agent|User-agent: ChatGPT-User|User-agent: Claude-SearchBot|User-agent: Claude-User|User-agent: Claude-Web|User-agent: ClaudeBot|User-agent: Cloudflare-AutoRAG|User-agent: CloudVertexBot|User-agent: cohere-ai|User-agent: cohere-training-data-crawler|User-agent: Cotoyogi|User-agent: Crawlspace|User-agent: Datenbank Crawler|User-agent: DeepSeekBot|User-agent: Devin|User-agent: Diffbot|User-agent: DuckAssistBot|User-agent: Echobot Bot|User-agent: EchoboxBot|User-agent: FacebookBot|User-agent: facebookexternalhit|User-agent: Factset_spyderbot|User-agent: FirecrawlAgent|User-agent: FriendlyCrawler|User-agent: Gemini-Deep-Research|User-agent: Google-CloudVertexBot|User-agent: Google-Extended|User-agent: Google-Firebase|User-agent: Google-NotebookLM|User-agent: GoogleAgent-Mariner|User-agent: GoogleOther|User-agent: GoogleOther-Image|User-agent: GoogleOther-Video|User-agent: GPTBot|User-agent: iaskspider/2.0|User-agent: IbouBot|User-agent: ICC-Crawler|User-agent: ImagesiftBot|User-agent: img2dataset|User-agent: ISSCyberRiskCrawler|User-agent: Kangaroo Bot|User-agent: KlaviyoAIBot|User-agent: LinerBot|User-agent: Linguee Bot|User-agent: meta-externalagent|User-agent: Meta-ExternalAgent|User-agent: meta-externalfetcher|User-agent: Meta-ExternalFetcher|User-agent: meta-webindexer|User-agent: MistralAI-User|User-agent: MistralAI-User/1.0|User-agent: MyCentralAIScraperBot|User-agent: netEstate Imprint Crawler|User-agent: NotebookLM|User-agent: NovaAct|User-agent: OAI-SearchBot|User-agent: omgili|User-agent: omgilibot|User-agent: OpenAI|User-agent: Operator|User-agent: PanguBot|User-agent: Panscient|User-agent: panscient.com|User-agent: Perplexity-User|User-agent: PerplexityBot|User-agent: PetalBot|User-agent: PhindBot|User-agent: Poseidon Research Crawler|User-agent: QualifiedBot|User-agent: QuillBot|User-agent: quillbot.com|User-agent: SBIntuitionsBot|User-agent: Scrapy|User-agent: SemrushBot-OCOB|User-agent: SemrushBot-SWA|User-agent: ShapBot|User-agent: Sidetrade indexer bot|User-agent: TerraCotta|User-agent: Thinkbot|User-agent: TikTokSpider|User-agent: Timpibot|User-agent: VelenPublicWebCrawler|User-agent: WARDBot|User-agent: Webzio-Extended|User-agent: wpbot|User-agent: YaK|User-agent: YandexAdditional|User-agent: YandexAdditionalBot|User-agent: YouBot".replace("|", '''
''')}
Disallow: /
""" if ALLOW_INDEXING else "User-agent: *\nDisallow: /\n"

print("Finished loading config")
