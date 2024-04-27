# For admin-related apis

from ._settings import OWNER_USER_ID, MAX_BIO_LENGTH, MAX_DISPL_NAME_LENGTH
from .variables import BADGE_DATA
from .packages  import User, Comment, Post, Badge, Schema
from .helper    import trim_whitespace

class AccountIdentifier(Schema):
    identifier: str | int
    use_id: bool

class DeleteBadge(Schema):
    badge_name: str

class NewBadge(DeleteBadge):
    badge_data: str

class UserBadge(AccountIdentifier):
    badge_name: str

class SaveUser(Schema):
    displ_name: str
    bio: str
    id: int

class UserLevel(AccountIdentifier):
    level: int

def api_admin_user_delete(request, data: AccountIdentifier) -> tuple | dict:
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
        for badge in (account.badges or []):
            b = Badge.objects.get(name=badge)
            b.users.remove(account.user_id)
            b.save()

        for post_id in account.posts:
            try:
                post = Post.objects.get(post_id=post_id)

                if post.quote:
                    try:
                        quoted_post = (Comment if post.quote_is_comment else Post).objects.get(pk=post.quote)
                        quoted_post.quotes.remove(post.post_id) # type: ignore
                        quoted_post.save()
                    except Post.DoesNotExist:
                        pass
                    except Comment.DoesNotExist:
                        pass

                for quote_id in (post.quotes or []):
                    quoting_post = Post.objects.get(post_id=quote_id)
                    quoting_post.quote = -1
                    quoting_post.save()

                post.delete()

            except Post.DoesNotExist:
                pass

        for comment_id in account.comments:
            try:
                comment = Comment.objects.get(comment_id=comment_id)

                try:
                    commented_post = (Comment if comment.parent_is_comment else Post).objects.get(pk=comment.parent)
                    commented_post.comments.remove(comment.comment_id) # type: ignore
                    commented_post.save()

                except Post.DoesNotExist:
                    pass
                except Comment.DoesNotExist:
                    pass

                comment.delete()

            except Comment.DoesNotExist:
                pass

        for like in account.likes:
            post = (Comment if like[1] else Post).objects.get(pk=like[0])
            print(account.user_id, type(account.user_id), post.likes, post.content, like)
            post.likes.remove(account.user_id) # type: ignore
            post.save()
            try:
                post = (Comment if like[1] else Post).objects.get(pk=like[0])
                post.likes.remove(account.user_id) # type: ignore
                post.save()

            except Post.DoesNotExist:
                pass
            except Comment.DoesNotExist:
                pass
            except ValueError:
                pass

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

def api_admin_badge_create(request, data: NewBadge) -> tuple | dict:
    # Creating a badge (3+)

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if self_user.admin_level >= 3 or self_user.user_id == OWNER_USER_ID:
        badge_name = data.badge_name.lower().replace(" ", "")
        badge_data = trim_whitespace(data.badge_data, True)

        if len(badge_name) > 64 or len(badge_name) <= 0:
            return 400, {
                "success": False,
                "reason": "Badge name must be between 1 and 64 characters in length"
            }

        for i in badge_name:
            if i not in "abcdefghijklmnopqrstuvxyz0123456789_":
                return 400, {
                    "success": False,
                    "reason": "Badge name can only contain a-z, 0-9, and underscores"
                }

        if len(badge_data) > 65536 or len(badge_data) <= 0:
            return 400, {
                "success": False,
                "reason": "Badge data must be between 1 and 65536 characters in length"
            }

        try:
            Badge.objects.get(
                name=badge_name
            )

            return 400, {
                "success": False,
                "reason": "A badge with the name " + badge_name + " already exists!"
            }

        except Badge.DoesNotExist:
            pass

        badge = Badge.objects.create(
            name=badge_name,
            svg_data=badge_data
        )
        badge.save()

        BADGE_DATA[badge_name] = badge_data

        return {
            "success": True
        }

    return 400, {
        "success": False
    }

def api_admin_badge_delete(request, data: DeleteBadge) -> tuple | dict:
    # Deleting a badge (3+)

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if self_user.admin_level >= 3 or self_user.user_id == OWNER_USER_ID:
        badge_name = data.badge_name.lower().replace(" ", "")

        if len(badge_name) > 64 or len(badge_name) <= 0:
            return 400, {
                "success": False,
                "reason": "Badge name must be between 1 and 64 characters in length"
            }

        for i in badge_name:
            if i not in "abcdefghijklmnopqrstuvxyz0123456789_":
                return 400, {
                    "success": False,
                    "reason": "Badge name can only contain a-z, 0-9, and underscores"
                }

        if badge_name in ["administrator"]:
            return 400, {
                "success": False,
                "reason": "Cannot delete that badge"
            }

        try:
            badge = Badge.objects.get(
                name=badge_name
            )
        except Badge.DoesNotExist:
            return 400, {
                "success": False,
                "reason": "A badge with the name " + badge_name + " doesn't exist!"
            }

        for i in badge.users:
            user = User.objects.get(user_id=i)
            user.badges.remove(badge_name) # type: ignore
            user.save()

        badge.delete()

        del BADGE_DATA[badge_name]

        return {
            "success": True
        }

    return 400, {
        "success": False
    }

def api_admin_badge_add(request, data: UserBadge) -> tuple | dict:
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

        if data.badge_name.lower() in ["administrator"]:
            return 400, {
                "success": False,
                "reason": "Cannot set that badge as it is done automatically"
            }

        if data.badge_name.lower() in BADGE_DATA:
            if data.badge_name.lower() not in (user.badges or []):
                user.badges.append(data.badge_name.lower()) # type: ignore
                user.save()

                badge = Badge.objects.get(name=data.badge_name)
                badge.users.append(user.user_id)
                badge.save()

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

def api_admin_badge_remove(request, data: UserBadge) -> tuple | dict:
    # Removing a badge from a user (3+)

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

        if data.badge_name.lower() in ["administrator"]:
            return 400, {
                "success": False,
                "reason": "Cannot remove that badge as it is done automatically"
            }

        if data.badge_name.lower() in BADGE_DATA:
            if data.badge_name.lower() in (user.badges or []):
                user.badges.remove(data.badge_name.lower()) # type: ignore
                user.save()

                badge = Badge.objects.get(name=data.badge_name)
                badge.users.remove(user.user_id)
                badge.save()

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

def api_admin_account_save(request, data: SaveUser) -> tuple | dict:
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

        if len(data.bio) > 65536:
            return {
                "success": False,
                "reason": f"User bio is too long! It should be between 0 and 65536 characters."
            }

        if len(data.displ_name) == 0 or len(data.displ_name) > 300:
            return {
                "success": False,
                "reason": f"Display name is too {'long' if len(data.displ_name) else 'short'}! It should be between 1 and 300 characters."
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

def api_admin_set_level(request, data: UserLevel) -> tuple | dict:
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
