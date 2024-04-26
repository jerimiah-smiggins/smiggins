# For admin-related apis

from ._settings import *
from .packages  import *
from .helper    import *
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

def api_admin_account_info(request, data: adminAccountSchema) -> tuple | dict:
    # Get account information (4+)

    token = request.COOKIES.get('token')
    identifier = data.identifier
    use_id = data.use_id
    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if self_user.admin_level >= 4 or self_user.user_id == OWNER_USER_ID:
        try:
            if use_id:
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

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if self_user.admin_level >= 4 or self_user.user_id == OWNER_USER_ID:
        try:
            user = User.objects.get(user_id=data.id)
        except User.DoesNotExist:
            return 404, {
                "success": False,
                "reason": "User not found!"
            }

        if len(data.bio) > MAX_BIO_LENGTH:
            return {
                "success": False,
                "reason": f"User bio is too long! It should be between 0 and {MAX_BIO_LENGTH} characters."
            }

        if len(data.displ_name) == 0 or len(data.displ_name) > MAX_DISPL_NAME_LENGTH:
            return {
                "success": False,
                "reason": f"Display name is too {'long' if len(data.displ_name) else 'short'}! It should be between 1 and {MAX_DISPL_NAME_LENGTH} characters."
            }

        user.bio = trim_whitespace(data.bio, True)
        user.display_name = trim_whitespace(data.displ_name, True)
        user.save()

        return 200, {
            "success": True
        }

    return 400, {
        "success": False
    }

def api_admin_set_level(request, data: userSchema) -> tuple | dict:
    # Set the admin level for a different person
    ...
