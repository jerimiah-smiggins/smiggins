# For admin-related apis

import base64

from posts.models import Badge, Comment, Hashtag, Post, User

from ..helper import find_hashtags, get_lang, log_admin_action, trim_whitespace
from ..variables import ADMIN_LOG_PATH, BADGE_DATA, OWNER_USER_ID
from .schema import (AccountIdentifier, DeleteBadge, NewBadge, SaveUser,
                     UserBadge, UserLevel)


class BitMask:
    @staticmethod
    def can_use(user: User, identifier: int) -> bool:
        return User.user_id == OWNER_USER_ID or bool(user.admin_level >> identifier & 1)

    @staticmethod
    def can_use_direct(user_level: int, identifier: int) -> bool:
        return bool(user_level >> identifier & 1)

    DELETE_POST = 0
    DELETE_USER = 1
    CREATE_BADGE = 2
    DELETE_BADGE = 3
    GIVE_BADGE_TO_USER = 4
    MODIFY_ACCOUNT = 5
    ACC_SWITCHER = 6 # requires MODIFY_ACCOUNT
    ADMIN_LEVEL = 7
    READ_LOGS = 8

    MAX_LEVEL = 8

def user_delete(request, data: AccountIdentifier) -> tuple | dict:
    # Deleting an account

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
        log_admin_action("Delete user", user, f"User {identifier} (use_id: {use_id}) not found")
        lang = get_lang(user)

        return 404, {
            "success": False,
            "reason": lang["generic"]["user_not_found"]
        }

    if BitMask.can_use(user, BitMask.DELETE_USER):
        for badge in account.badges:
            b = Badge.objects.get(name=badge)
            b.users.remove(account.user_id)
            b.save()

        for post_id in account.posts:
            try:
                post = Post.objects.get(post_id=post_id)

                for tag in find_hashtags(post.content):
                    try:
                        tag_object = Hashtag.objects.get(tag=tag)
                        tag_object.posts.remove(id)
                        tag_object.save()

                    except Hashtag.DoesNotExist:
                        pass
                    except ValueError:
                        pass

                if post.quote:
                    try:
                        quoted_post = (Comment if post.quote_is_comment else Post).objects.get(pk=post.quote)
                        quoted_post.quotes.remove(post.post_id)
                        quoted_post.save()
                    except Post.DoesNotExist:
                        pass
                    except Comment.DoesNotExist:
                        pass

                for quote_id in post.quotes:
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
                    commented_post.comments.remove(comment.comment_id)
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
            post.likes.remove(account.user_id)
            post.save()
            try:
                post = (Comment if like[1] else Post).objects.get(pk=like[0])
                post.likes.remove(account.user_id)
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
            followed.followers.remove(account.user_id)
            followed.save()

        for follower_id in account.followers:
            if follower_id == account.user_id:
                continue

            follower = User.objects.get(user_id=follower_id)
            follower.following.remove(account.user_id)
            follower.save()

        account.delete()

        log_admin_action("Delete user", user, f"User {identifier} (use_id: {use_id}) deleted successfully")

        return {
            "success": True
        }

    log_admin_action("Delete user", user, f"User {identifier} (use_id: {use_id}) attempted, however too low of an admin level was used")

    return 400, {
        "success": False
    }

def badge_create(request, data: NewBadge) -> tuple | dict:
    # Creating a badge (3+)

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.CREATE_BADGE):
        badge_name = data.badge_name.lower().replace(" ", "")
        badge_data = trim_whitespace(data.badge_data, True)

        if len(badge_name) > 64 or len(badge_name) <= 0:
            log_admin_action("Create badge", self_user, f"Invalid badge name {badge_name}")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "reason": lang["admin"]["badge_invalid_name_size"]
            }

        for i in badge_name:
            if i not in "abcdefghijklmnopqrstuvwxyz0123456789_":
                log_admin_action("Create badge", self_user, f"Invalid badge name {badge_name}")
                lang = get_lang(self_user)
                return 400, {
                    "success": False,
                    "reason": lang["admin"]["badge_invalid_name"]
                }

        if len(badge_data) > 65536 or len(badge_data) <= 0:
            log_admin_action("Create badge", self_user, f"Invalid badge data with length {len(badge_data)}")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "reason": lang["admin"]["badge_create_invalid_data_size"]
            }

        try:
            badge = Badge.objects.get(
                name=badge_name
            )

            badge.svg_data = badge_data

        except Badge.DoesNotExist:
            badge = Badge.objects.create(
                name=badge_name,
                svg_data=badge_data
            )

        badge.save()

        BADGE_DATA[badge_name] = badge_data

        log_admin_action("Create badge", self_user, f"Created badge {badge_name}")
        return {
            "success": True
        }

    log_admin_action("Create badge", self_user, "Failed, too low of an admin level")
    return 400, {
        "success": False
    }

def badge_delete(request, data: DeleteBadge) -> tuple | dict:
    # Deleting a badge (3+)

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.DELETE_BADGE):
        badge_name = data.badge_name.lower().replace(" ", "")

        if len(badge_name) > 64 or len(badge_name) <= 0:
            log_admin_action("Delete badge", self_user, f"Invalid badge name {badge_name}")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "reason": lang["admin"]["badge_invalid_name_size"]
            }

        for i in badge_name:
            if i not in "abcdefghijklmnopqrstuvwxyz0123456789_":
                log_admin_action("Delete badge", self_user, f"Invalid badge name {badge_name}")
                lang = get_lang(self_user)
                return 400, {
                    "success": False,
                    "reason": lang["admin"]["badge_invalid_name"]
                }

        if badge_name in ["administrator"]:
            log_admin_action("Delete badge", self_user, f"Badge {badge_name} can't be deleted")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "reason": lang["admin"]["badge_delete_protected"]
            }

        try:
            badge = Badge.objects.get(
                name=badge_name
            )
        except Badge.DoesNotExist:
            log_admin_action("Delete badge", self_user, f"Badge {badge_name} doesn't exist")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "reason": lang["admin"]["badge_not_found"].replace("%s", badge_name)
            }

        for i in badge.users:
            user = User.objects.get(user_id=i)
            user.badges.remove(badge_name)
            user.save()

        badge.delete()

        del BADGE_DATA[badge_name]

        log_admin_action("Delete badge", self_user, f"Badge {badge_name} successfully deleted")
        return {
            "success": True
        }

    log_admin_action("Delete badge", self_user, "Failed, too low of an admin level")
    return 400, {
        "success": False
    }

def badge_add(request, data: UserBadge) -> tuple | dict:
    # Adding a badge to a user (3+)

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.GIVE_BADGE_TO_USER):
        try:
            if data.use_id:
                user = User.objects.get(user_id=int(data.identifier))
            else:
                user = User.objects.get(username=data.identifier)
        except User.DoesNotExist:
            log_admin_action("Add badge", self_user, f"Couldn't add badge {data.badge_name} to {data.identifier} (use_id: {data.use_id}), user not found")
            lang = get_lang(self_user)
            return 404, {
                "success": False,
                "reason": lang["generic"]["user_not_found"]
            }

        if data.badge_name.lower() in ["administrator"]:
            log_admin_action("Add badge", self_user, f"Couldn't add badge {data.badge_name} to {data.identifier} (use_id: {data.use_id})")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "reason": lang["generic"]["badge_manage_add_protected"]
            }

        if data.badge_name.lower() in BADGE_DATA:
            if data.badge_name.lower() not in user.badges:
                user.badges.append(data.badge_name.lower())
                user.save()

                badge = Badge.objects.get(name=data.badge_name)
                badge.users.append(user.user_id)
                badge.save()

            log_admin_action("Add badge", self_user, f"Added badge {data.badge_name} to {data.identifier} (use_id: {data.use_id})")
            return {
                "success": True
            }

        log_admin_action("Add badge", self_user, f"Tried to add badge {data.badge_name} to {data.identifier} (use_id: {data.use_id}), but badge doesn't exist")
        lang = get_lang(self_user)
        return 404, {
            "success": False,
            "reason": lang["admin"]["badge_not_found"].replace("%s", data.badge_name)
        }

    log_admin_action("Add badge", self_user, f"Tried to add badge {data.badge_name} to {data.identifier} (use_id: {data.use_id}), but too low of an admin level")
    return 400, {
        "success": False
    }

def badge_remove(request, data: UserBadge) -> tuple | dict:
    # Removing a badge from a user (3+)

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.GIVE_BADGE_TO_USER):
        try:
            if data.use_id:
                user = User.objects.get(user_id=int(data.identifier))
            else:
                user = User.objects.get(username=data.identifier)
        except User.DoesNotExist:
            lang = get_lang(self_user)
            return 404, {
                "success": False,
                "reason": lang["generic"]["user_not_found"]
            }

        if data.badge_name.lower() in ["administrator"]:
            log_admin_action("Remove badge", self_user, f"Couldn't remove badge {data.badge_name} to {data.identifier} (use_id: {data.use_id})")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "reason": lang["generic"]["badge_manage_remove_protected"]
            }

        if data.badge_name.lower() in BADGE_DATA:
            if data.badge_name.lower() in user.badges:
                user.badges.remove(data.badge_name.lower())
                user.save()

                badge = Badge.objects.get(name=data.badge_name)
                badge.users.remove(user.user_id)
                badge.save()

            log_admin_action("Remove badge", self_user, f"Removed badge {data.badge_name} to {data.identifier} (use_id: {data.use_id})")
            return {
                "success": True
            }

        log_admin_action("Remove badge", self_user, f"Tried to remove badge {data.badge_name} to {data.identifier} (use_id: {data.use_id}), but badge doesn't exist")
        lang = get_lang(self_user)
        return 404, {
            "success": False,
            "reason": lang["admin"]["badge_not_found"].replace("%s", data.badge_name)
        }

    log_admin_action("Remove badge", self_user, f"Tried to remove badge {data.badge_name} to {data.identifier} (use_id: {data.use_id}), but too low of an admin level")
    return 400, {
        "success": False
    }

def account_info(request, identifier: int | str, use_id: bool) -> tuple | dict:
    # Get account information (4+)

    token = request.COOKIES.get('token')

    try:
        self_user = User.objects.get(token=token)

    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    modify = BitMask.can_use(self_user, BitMask.MODIFY_ACCOUNT)
    switch = BitMask.can_use(self_user, BitMask.ACC_SWITCHER)

    if modify or switch:
        try:
            if use_id:
                user = User.objects.get(user_id=int(identifier))
            else:
                user = User.objects.get(username=identifier)
        except User.DoesNotExist:
            log_admin_action("Get account info", self_user, f"User {identifier} (use_id: {use_id}), not found")
            lang = get_lang(self_user)
            return 404, {
                "success": False,
                "reason": lang["generic"]["user_not_found"]
            }

        log_admin_action("Get account info", self_user, f"Fetched info for {identifier} (use_id: {use_id}) successfully")

        if modify:
            ret = {
                "success": True,
                "username": user.username,
                "user_id": user.user_id,
                "bio": user.bio,
                "displ_name": user.display_name
            }
        else:
            ret = {
                "success": True,
                "username": user.username,
                "user_id": user.user_id
            }

        if switch:
            ret["token"] = user.token

        return ret

    log_admin_action("Get account info", self_user, f"Tried to fetch account info for {identifier} (use_id: {use_id}), but too low of an admin level")
    return 400, {
        "success": False
    }

def account_save(request, data: SaveUser) -> tuple | dict:
    # Save account information (4+)

    try:
        self_user = User.objects.get(token=request.COOKIES.get("token"))
    except User.DoesNotExist:
        return 400, {
            "success": False
        }

    if BitMask.can_use(self_user, BitMask.MODIFY_ACCOUNT):
        try:
            user = User.objects.get(user_id=data.id)
        except User.DoesNotExist:
            log_admin_action("Save account info", self_user, f"User id {data.id}, not found")
            lang = get_lang(self_user)
            return 404, {
                "success": False,
                "reason": lang["generic"]["user_not_found"]
            }

        if len(data.bio) > 65536:
            log_admin_action("Save account info", self_user, f"Tried to save info for id {data.id}, but bio (length {len(data.bio)}) is invalid")
            lang = get_lang(self_user)
            return {
                "success": False,
                "reason": lang["admin"]["modify_invalid_bio_size"]
            }

        if len(data.displ_name) == 0 or len(data.displ_name) > 300:
            log_admin_action("Save account info", self_user, f"Tried to save info for id {data.id}, but display name {data.displ_name} is invalid")
            lang = get_lang(self_user)
            return {
                "success": False,
                "reason": lang["admin"][f"modify_invalid_display_name_{'long' if len(data.displ_name) else 'short'}"]
            }

        old_bio = user.bio
        old_display_name = user.display_name
        new_bio = trim_whitespace(data.bio, True)
        new_display_name = trim_whitespace(data.displ_name, True)

        user.bio = new_bio
        user.display_name = new_display_name
        user.save()

        if old_bio == new_bio and old_display_name == new_display_name:
            log_admin_action("Save account info", self_user, f"Saved account info for id {data.id}, nothing changed")
        elif old_display_name == new_display_name:
            log_admin_action("Save account info", self_user, f"Saved account info for id {data.id}, bio: {old_bio} -> {user.bio}")
        elif old_bio == new_bio:
            log_admin_action("Save account info", self_user, f"Saved account info for id {data.id}, display_name: {old_display_name} -> {user.display_name}")
        else:
            log_admin_action("Save account info", self_user, f"Saved account info for id {data.id}, bio: {old_bio} -> {user.bio} // display_name: {old_display_name} -> {user.display_name}")

        return 200, {
            "success": True
        }

    log_admin_action("Save account info", self_user, f"Tried to save info for id {data.id}, but too low of an admin level")
    return 400, {
        "success": False
    }

def set_level(request, data: UserLevel) -> tuple | dict:
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

    if BitMask.can_use(self_user, BitMask.ADMIN_LEVEL):
        if level > 5 or level < 0:
            log_admin_action("Set admin level", self_user, f"Tried to give level {data.level} to {identifier} (use_id: {use_id}), but the level was invalid")
            lang = get_lang(self_user)
            return 400, {
                "success": False,
                "reason": lang["admin"]["level_invalid"]
            }

        try:
            if use_id:
                user = User.objects.get(user_id=int(identifier))
            else:
                user = User.objects.get(username=identifier)
        except User.DoesNotExist:
            log_admin_action("Set admin level", self_user, f"User {identifier} (use_id: {use_id}) doesn't exist")
            lang = get_lang(self_user)
            return 404, {
                "success": False,
                "reason": lang["generic"]["user_not_found"]
            }

        user.admin_level = level
        user.save()

        log_admin_action("Set admin level", self_user, f"Gave level {data.level} to {identifier} (use_id: {use_id})")
        return {
            "success": True
        }

    log_admin_action("Set admin level", self_user, f"Tried to give level {data.level} to {identifier} (use_id: {use_id}), but too low of an admin level")
    return 400, {
        "success": False
    }

def logs(request) -> tuple | dict:
        try:
            self_user = User.objects.get(token=request.COOKIES.get("token"))
        except User.DoesNotExist:
            return 400, {
                "success": False
            }

        if BitMask.can_use(self_user, BitMask.READ_LOGS):
            return {
                "success": True,
                "content": bytes.decode(base64.b64encode(open(ADMIN_LOG_PATH, "rb").read()))
            }

        return 400, {
            "success": False
        }
