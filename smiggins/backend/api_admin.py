# For admin-related apis

from ._settings import OWNER_USER_ID, MAX_BIO_LENGTH, MAX_DISPL_NAME_LENGTH
from .variables import BADGE_DATA
from .packages  import User, Comment, Post
from .helper    import trim_whitespace
from .schema    import newBadgeSchema, badgeSchema, adminAccountSchema, adminAccountSaveSchema, adminLevelSchema

def api_admin_user_delete(request, data: adminAccountSchema) -> tuple | dict:
    # Deleting an account (2+)

    token = request.COOKIES.get('token')

    try:
        user = User.objects.get(token=token)
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    identifier = data.identifier
    use_id = data.use_id

    try:
        if use_id:
            account = User.objects.get(user_id=int(identifier))
        else:
            account = User.objects.get(username=identifier)
    except User.DoesNotExist:
        return 404, {
            "success": False,
            "reason": "User not found!"
        }

    if user.user_id == OWNER_USER_ID or user.admin_level >= 2:
        for post_id in account.posts:
            try:
                post = Post.objects.get(post_id=post_id)
            except Post.DoesNotExist:
                pass

            if post.quote:
                try:
                    quoted_post = (Comment if post.quote_is_comment else Post).objects.get(pk=post.quote)
                    quoted_post.quotes.remove(post.post_id) # type: ignore
                    quoted_post.save()
                except Post.DoesNotExist:
                    pass
                except Comment.DoesNotExist:
                    pass

            post.delete()

        for comment_id in account.comments:
            try:
                comment = Comment.objects.get(post_id=comment_id)
            except Comment.DoesNotExist:
                pass

            try:
                commented_post = (Comment if comment.parent_is_comment else Post).objects.get(pk=comment.parent)
                commented_post.comments.remove(comment.comment_id) # type: ignore
                commented_post.save()
            except Post.DoesNotExist:
                pass
            except Comment.DoesNotExist:
                pass

            comment.delete()

        for followed_id in account.following:
            if followed_id == account.user_id:
                continue

            followed = User.objects.get(user_id=followed_id)
            followed.followers.remove(account.user_id) # type: ignore
            followed.save()

        for follower_id in (account.followers or []):
            if follower_id == account.user_id:
                continue

            follower = User.objects.get(user_id=follower_id)
            follower.following.remove(account.user_id) # type: ignore
            follower.save()

        account.delete()

        return {
            "success": True
        }

    return 400, {
        "success": False
    }

def api_admin_badge_create(request, data: newBadgeSchema) -> tuple | dict:
    # Creating a badge (3+)
    ...

def api_admin_badge_delete(request, data: badgeSchema) -> tuple | dict:
    # Deleting a badge (3+)
    ...

def api_admin_badge_add(request, data: badgeSchema) -> tuple | dict:
    # Adding a badge to a user (3+)

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if self_user.admin_level >= 3 or self_user.user_id == OWNER_USER_ID:
        try:
            if data.use_id:
                user = User.objects.get(user_id=int(data.identifier))
            else:
                user = User.objects.get(username=data.identifier)
        except User.DoesNotExist:
            return 404, {
                "success": False,
                "reason": "User not found!"
            }

        if data.badge_name.lower() in BADGE_DATA:
            user.badges.append(data.badge_name.lower()) # type: ignore
            user.save()

            return {
                "success": True
            }

        return 404, {
            "success": False,
            "reason": "Badge doesn't exist"
        }

    return 400, {
        "success": False
    }

def api_admin_badge_remove(request, data: badgeSchema) -> tuple | dict:
    # Removing a badge from a user (3+)
    ...

def api_admin_account_info(request, identifier: int | str, use_id: bool) -> tuple | dict:
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

def api_admin_set_level(request, data: adminLevelSchema) -> tuple | dict:
    # Set the admin level for a different person (5+)

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    use_id = data.use_id
    identifier = data.identifier
    level = data.level

    if self_user.admin_level >= 5 or self_user.user_id == OWNER_USER_ID:
        if level > 5 or level < 0:
            return 400, {
                "success": False,
                "reason": "Invalid level"
            }

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

        user.admin_level = level
        user.save()

        return {
            "success": True
        }

    return 400, {
        "success": False
    }
