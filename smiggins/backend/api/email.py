from posts.models import User
from ..helper import get_HTTP_response, get_lang, send_email
from ..variables import WEBSITE_URL

def _format_block(
    block: str,
    lang: dict,
    username: str="",
    url: str=""
) -> tuple[str, str]:
    return (
        block \
            .replace("%u", username) \
            .replace("%r", "<strong class='red'>") \
            .replace("%R", "</strong>") \
            .replace("%l", f"<a href=\"{url}\">{lang['email']['password']['link']}</a>"),
        block \
            .replace("%u", username) \
            .replace("%r", "**") \
            .replace("%R", "**") \
            .replace("%l", url)
    )

def password_reset(request) -> dict | tuple:
    user = User.objects.get(token=request.COOKIES.get("token"))

    if not isinstance(user.email, str):
        return 400, {
            "success": False
        }

    lang = get_lang(user)
    username = user.username

    TITLE = _format_block(block=lang["email"]["password"]["title"], lang=lang, username=username)
    B1 = _format_block(block=lang["email"]["password"]["block_1"], lang=lang, username=username, url=f"{WEBSITE_URL}/home")
    B2 = _format_block(block=lang["email"]["password"]["block_2"], lang=lang, username=username)
    B3 = _format_block(block=lang["email"]["password"]["block_3"], lang=lang, username=username, url=f"{WEBSITE_URL}/home")
    B4 = _format_block(block=lang["email"]["password"]["block_4"], lang=lang)

    response = send_email(
        subject=TITLE[1],
        recipients=[user.email],
        raw_message=f"{TITLE[1]}\n\n{lang['email']['password']['greeting']}\n{B1[1]}\n{B2[1]}\n{B3[1]}\n{B4[1]}",
        html_message=get_HTTP_response( # type: ignore
            request, "email/password.html", lang,
            raw=True,

            TITLE=TITLE[0],
            B1=B1[0],
            B2=B2[0],
            B3=B3[0],
            B4=B4[0]
        )
    )

    return {
        "success": response > 0
    }
