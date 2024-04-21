# For admin-related apis

from ._settings import OWNER_USER_ID
from .packages  import *
from .schema    import *

def api_admin_badge_create(request, data: newBadgeSchema) -> tuple | dict:
    # Creating a badge (3+)
    ...

def api_admin_badge_delete(request, data: badgeSchema) -> tuple | dict:
    # Deleting a badge (3+)
    ...

def api_admin_badge_add(request, data: badgeSchema) -> tuple | dict:
    # Adding a badge to a user (3+)
    ...

def api_admin_badge_remove(request, data: badgeSchema) -> tuple | dict:
    # Removing a badge from a user (3+)
    ...

def api_admin_account_info(request, identifier: str, use_id: str) -> tuple | dict:
    # Get account information (4+)

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if self_user.admin_level >= 4 or self_user.user_id == OWNER_USER_ID:
        try:
            if use_id == "true":
                user = User.objects.get(user_id=int(identifier))
            else:
                user = User.objects.get(username=identifier)

        except User.DoesNotExist:
            return 404, {
                "success": False,
                "reason": "User not found!"
            }

        return {
            "success": True,
            "username": user.username,
            "user_id": user.user_id,
            "token": user.token,
            "bio": user.bio,
            "displ_name": user.display_name
        }

    return 400, {
        "success": False
    }

def api_admin_account_save(request, data: adminAccountSaveSchema) -> tuple | dict:
    # Save account information (4+)
    ...

def api_admin_set_level(request, data: followerSchema) -> tuple | dict:
    # Set the admin level for a different person
    ...
