# For admin-related apis

from ._settings import OWNER_USER_ID
from .packages  import *
from .schema    import *

def api_admin_badge_create(request, newBadgeSchema) -> HttpResponse:
    # Creating a badge (3+)
    ...

def api_admin_badge_delete(request, badgeSchema) -> HttpResponse:
    # Deleting a badge (3+)
    ...

def api_admin_badge_add(request, badgeSchema) -> HttpResponse:
    # Adding a badge to a user (3+)
    ...

def api_admin_badge_remove(request, badgeSchema) -> HttpResponse:
    # Removing a badge from a user (3+)
    ...

def api_admin_account_info(request, followerSchema) -> HttpResponse:
    # Get account information (4+)
    ...

def api_admin_account_save(request, adminAccountSave) -> HttpResponse:
    # Save account information (4+)
    ...

def api_admin_set_level(request, followerSchema) -> HttpResponse:
    # Set the admin level for a different person
    ...
