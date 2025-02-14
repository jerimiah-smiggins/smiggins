from typing import TYPE_CHECKING, Any, Literal

from backend.lang import get_lang
from backend.variables import (ENABLE_BADGES, ENABLE_EDITING_POSTS,
                               ENABLE_GRADIENT_BANNERS, ENABLE_PINNED_POSTS,
                               ENABLE_PRONOUNS, OWNER_USER_ID)
from django.contrib import admin as django_admin
from django.contrib.admin.exceptions import AlreadyRegistered  # type: ignore
from django.db import models

# The "#!# <something>" comment shows something that might happen in the future but has yet to be implemented

def _can_view(post: "Post | Comment", user: "User | None") -> tuple[Literal[True]] | tuple[Literal[False], Literal["blocked", "private", "blocking"]]:
    if user is None:
        if post.private:
            return False, "private"
        return True,

    creator = post.creator

    if creator.user_id == user.user_id:
        return True,

    if creator.blocking.contains(user):
        return False, "blocked"

    if post.private and not creator.followers.contains(user):
        return False, "private"

    if user.blocking.contains(creator):
        return False, "blocking"

    return True,

def _post_json(
    post: "Post | Comment",
    user: "User | None",
    hide_blocking: bool=True,
    *,
    _quote_recursion: int=1
) -> dict[str, Any]:
    post_id = post.post_id if isinstance(post, Post) else post.comment_id
    creator = post.creator
    user_id = user.user_id if user else 0

    can_view = post.can_view(user)

    if can_view[0] is False and (can_view[1] == "private" or can_view[1] == "blocked" or (hide_blocking and can_view[1] == "blocking")):
        return {
            "visible": False,
            "reason": can_view[1],
            "post_id": post_id,
            "comment": False
        }

    quote = None
    if isinstance(post, Post) and post.quote and _quote_recursion <= 0:
        quote = True
    elif isinstance(post, Post) and post.quote:
        try:
            if post.quote_is_comment:
                quote = Comment.objects.get(comment_id=post.quote).json(user, True, _quote_recursion=_quote_recursion - 1)
            else:
                quote = Post.objects.get(post_id=post.quote).json(user, True, _quote_recursion=_quote_recursion - 1)
        except Comment.DoesNotExist:
            quote = { "visible": False, "reason": "deleted", "post_id": post.quote, "comment": True }
        except Post.DoesNotExist:
            quote = { "visible": False, "reason": "deleted", "post_id": post.quote, "comment": False }

    return {
        "visible": True,
        "post_id": post_id,

        "comment": isinstance(post, Comment),
        "parent": None if isinstance(post, Post) else {
            "id": post.parent,
            "comment": post.parent_is_comment
        },

        "private": post.private,
        "content_warning": post.content_warning,
        "content": post.content,
        "timestamp": post.timestamp,
        "poll": post.get_poll(user),
        "edited": (post.edited_at or 0) if post.edited else None,

        "quote": quote,

        "interactions": {
            "likes": post.likes.count(),
            "liked": post.likes.contains(user) if user else False,
            "comments": len(post.comments),
            "quotes": len(post.quotes)
        },

        "can": {
            "delete": user is not None and (user_id == creator.user_id or user_id == OWNER_USER_ID or user.admin_level % 2 == 1),
            "pin": ENABLE_PINNED_POSTS and not isinstance(post, Comment) and user is not None,
            "edit": ENABLE_EDITING_POSTS and user is not None and creator.user_id == user.user_id
        },

        "creator": {
            "display_name": creator.display_name,
            "username": creator.username,
            "badges": creator.get_badges(),
            "pronouns": creator.get_pronouns(),
            "color_one": creator.color,
            "color_two": creator.color_two if creator.gradient else creator.color,
            "gradient": creator.gradient
        }
    }

class User(models.Model):
    user_id = models.IntegerField(primary_key=True, unique=True)
    username = models.CharField(max_length=300, unique=True)
    token = models.CharField(max_length=64, unique=True)
    email = models.TextField(null=True, blank=True)
    email_valid = models.BooleanField(default=False)

    # Admin level
    # Functions as a binary mask. Definitions (32 bit compatible):
    #                       +- Generate OTPs
    #                       |+- Read admin logs
    #                       ||+- Change admin levels for self and others
    #                       |||+- Add any account to account switcher - requires modify info
    #                       ||||+- Modify account info
    #                       |||||+- Add/remove badges from profiles
    #                       ||||||+- Delete badges
    #                       |||||||+- Create/modify badges
    #                       ||||||||+- Delete accounts
    #          unused       |||||||||+- Delete posts
    #            |          ||||||||||
    # 0000000000000000000000XXXXXXXXX
    admin_level = models.IntegerField(default=0)

    display_name = models.CharField(max_length=300)
    bio = models.CharField(max_length=65536, default="", blank=True)
    theme = models.CharField(max_length=30)
    color = models.CharField(max_length=7)
    color_two = models.CharField(max_length=7, default="#000000", blank=True)
    gradient  = models.BooleanField(default=False)

    default_post_private = models.BooleanField(default=False)
    verify_followers = models.BooleanField(default=False)

    language = models.CharField(max_length=5, blank=True)

    following = models.ManyToManyField("self", symmetrical=False, through_fields=("user", "following"), through="M2MFollow", related_name="followers", blank=True)
    blocking = models.ManyToManyField("self", symmetrical=False, through_fields=("user", "blocking"), through="M2MBlock", related_name="blockers", blank=True)
    pending_followers = models.ManyToManyField("self", symmetrical=False, through_fields=("user", "following"), through="M2MPending", related_name="pending_following", blank=True)

    messages = models.JSONField(default=list, blank=True)
    unread_messages = models.JSONField(default=list, blank=True)

    if TYPE_CHECKING:
        pinned: "Post | None"
    else:
        pinned = models.ForeignKey("Post", on_delete=models.SET_NULL, null=True, blank=True)

    if TYPE_CHECKING:
        posts: models.Manager["Post"]
        comments: models.Manager["Comment"]
        admin_log_for: models.Manager["AdminLog"]
        admin_log_by: models.Manager["AdminLog"]
        notifications: models.Manager["Notification"]
        liked_posts: models.Manager["Post"]
        liked_comments: models.Manager["Comment"]
        followers: models.Manager["User"]
        blockers: models.Manager["User"]
        pending_following: models.Manager["User"]
        badges: models.Manager["Badge"]
        pronouns: models.Manager["UserPronouns"]

    def get_badges(self: "User") -> list[str]:
        return list(self.badges.all().values_list("name", flat=True)) + (["administrator"] if self.admin_level != 0 or self.user_id == OWNER_USER_ID else []) if ENABLE_BADGES else []

    def get_pronouns(self: "User", lang: dict | None=None) -> str | None:
        if not ENABLE_PRONOUNS:
            return None

        _p = self.pronouns.filter(language=self.language)

        if lang is None:
            creator_lang = get_lang(self)
        else:
            creator_lang = lang

        if creator_lang["generic"]["pronouns"]["enable_pronouns"]:
            if _p.exists():
                try:
                    if _p[0].secondary and creator_lang["generic"]["pronouns"]["enable_secondary"]:
                        return creator_lang["generic"]["pronouns"]["visible"][f"{_p[0].primary}_{_p[0].secondary}"]
                    else:
                        return creator_lang["generic"]["pronouns"]["visible"][f"{_p[0].primary}"]

                except KeyError:
                    ...

            try:
                return creator_lang["generic"]["pronouns"]["visible"][creator_lang["generic"]["pronouns"]["default"]]
            except KeyError:
                ...

        return None

    def json(self: "User") -> dict:
        return {
            "username": self.username,
            "display_name": self.display_name,
            "badges": self.get_badges(),
            "color_one": self.color,
            "color_two": self.color_two if ENABLE_GRADIENT_BANNERS else self.color,
            "gradient_banner": self.gradient,
            "bio": self.bio
        }

    def __str__(self):
        return f"({self.user_id}) {self.username}"

class Post(models.Model):
    post_id = models.IntegerField(primary_key=True)
    content = models.TextField(max_length=65536, blank=True)
    content_warning = models.TextField(max_length=200, null=True, blank=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    timestamp = models.IntegerField()

    quote = models.IntegerField(default=0)
    quote_is_comment = models.BooleanField(default=False)

    edited = models.BooleanField(default=False)
    edited_at = models.IntegerField(null=True, blank=True)

    likes = models.ManyToManyField(User, through="M2MLike", related_name="liked_posts", blank=True)
    comments = models.JSONField(default=list, blank=True) #!# reverse foreignkey
    quotes = models.JSONField(default=list, blank=True) #!# reverse foreignkey
    # quotes = GenericRelation(Post, related_query_name="quoted_comments")

    # null: anyone (compatibility only), run script 05 to fix
    # False: anyone
    # True: followers only
    private = models.BooleanField(null=True)

    # type == None: no poll
    # type == dict: yes poll
    # Format:
    # {
    #   "votes": [1, 2, 3, 4...], // list of user ids that have voted
    #   "choices": 4 // number, between 2 and MAX_POLL_OPTIONS
    #   "content": [
    #     { "value": "Option 1", "votes": [1, 2...] },
    #     { "value": "Option 2", "votes": [3, 4...] },
    #     ...
    #   ]
    # }
    # poll = models.JSONField(default=None, null=True, blank=True)

    if TYPE_CHECKING:
        hashtags: models.Manager["Hashtag"]
        poll: "Poll"

    def get_poll(self: "Post", user: User | None) -> dict | None:
        if hasattr(self, "poll"):
            p: Poll = self.poll
        else:
            return None

        return {
            "votes": p.votes.count(),
            "voted": user is not None and p.votes.filter(user=user).count() > 0,
            "content": [{
                "id": c.id,
                "value": c.content,
                "votes": c.votes.count(),
                "voted": user is not None and c.votes.filter(user=user).count() > 0
            } for c in p.choices.all()]
        }

    def can_view(self: "Post", user: User | None):
        return _can_view(self, user)

    def json(self: "Post", user: User | None=None, hide_blocking: bool=False, *, _quote_recursion: int=1) -> dict[str, Any]:
        return _post_json(self, user, hide_blocking, _quote_recursion=_quote_recursion)

    def __str__(self):
        return f"({self.post_id}) {self.content}"

class Comment(models.Model):
    comment_id = models.IntegerField(primary_key=True, unique=True)
    content = models.TextField(max_length=65536)
    content_warning = models.TextField(max_length=200, null=True, blank=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    timestamp = models.IntegerField()

    parent = models.IntegerField(default=0) #!# foreignkey
    parent_is_comment = models.BooleanField(default=False)

    edited = models.BooleanField(default=False)
    edited_at = models.IntegerField(null=True, blank=True)

    private = models.BooleanField(null=True)

    likes = models.ManyToManyField(User, through="M2MLikeC", related_name="liked_comments", blank=True)
    comments = models.JSONField(default=list, blank=True) #!# reverse foreignkey
    quotes = models.JSONField(default=list, blank=True) #!# reverse foreignkey

    def get_poll(self: "Comment", user: User | None) -> None:
        return None

    def can_view(self: "Comment", user: User | None) -> tuple[Literal[True]] | tuple[Literal[False], Literal["blocked", "private", "blocking"]]:
        return _can_view(self, user)

    def json(self: "Comment", user: User | None=None, hide_blocking: bool=False, *, _quote_recursion: int=1) -> dict[str, Any]:
        return _post_json(self, user, hide_blocking, _quote_recursion=_quote_recursion)

    def __str__(self):
        return f"({self.comment_id}) {self.content}"

class Badge(models.Model):
    name = models.CharField(max_length=64, primary_key=True, unique=True)
    svg_data = models.CharField(max_length=65536)
    users = models.ManyToManyField(User, through="M2MBadgeUser", related_name="badges", blank=True)

    def __str__(self):
        return f"{self.name} ({', '.join(self.users.values_list('username', flat=True)) or 'No users'}"

class Notification(models.Model):
    notif_id = models.IntegerField(primary_key=True, unique=True)
    timestamp = models.IntegerField()
    read = models.BooleanField(default=False)

    # The type of the event that caused the notification. Can be:
    # - comment (commenting on your post)
    # - quote (your post/comment being quoted)
    # - ping_p (ping from a post)
    # - ping_c (ping from a comment)
    event_type = models.CharField(max_length=7)

    # The id for whatever happened.
    # - comment: it would be a comment id
    # - quote: the post id of the quote
    # - ping_p: it would be the post the ping came from
    # - ping_c: it would be the comment id from where the ping came from
    event_id = models.IntegerField() #!# foreignkey

    # The user object for who the notification is for
    is_for = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")

    def __str__(self):
        return f"({'' if self.read else 'un'}read) {self.event_type} ({self.event_id}) for {self.is_for.username if self.is_for else None}"

class PrivateMessageContainer(models.Model):
    # Essentially f"{user_one.username}-{user_two.username}" where user_one
    # is earlier in the alphabet than user_two
    container_id = models.CharField(primary_key=True, unique=True, max_length=601)

    user_one = models.ForeignKey(User, on_delete=models.CASCADE, related_name="container_reference_one")
    user_two = models.ForeignKey(User, on_delete=models.CASCADE, related_name="container_reference_two")

    unread_one = models.BooleanField(default=False)
    unread_two = models.BooleanField(default=False)

    if TYPE_CHECKING:
        messages: models.Manager["PrivateMessage"]

    def __str__(self):
        return f"Message group between {self.user_one.username} and {self.user_two.username}"

class PrivateMessage(models.Model):
    message_id = models.IntegerField(primary_key=True, unique=True)
    timestamp  = models.IntegerField()

    content = models.CharField(max_length=65536)

    # If True, then the message was sent from user one, defined in
    # the PrivateMessageContainer. If False, then the message is from
    # user two.
    from_user_one = models.BooleanField()

    message_container = models.ForeignKey(PrivateMessageContainer, on_delete=models.CASCADE, related_name="messages")

    def __str__(self):
        return f"({self.message_id}) From {self.message_container.user_one.username if self.from_user_one else self.message_container.user_two.username} to {self.message_container.user_two.username if self.from_user_one else self.message_container.user_one.username} - {self.content}"

class Hashtag(models.Model):
    tag = models.CharField(max_length=64, unique=True, primary_key=True)
    posts = models.ManyToManyField(Post, through="M2MHashtagPost", related_name="hashtags", blank=True)

    def __str__(self):
        return f"#{self.tag} ({self.posts.count()} posts)"

class URLPart(models.Model):
    url = models.TextField(max_length=128, primary_key=True, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    intent = models.TextField(max_length=6) # "reset", "remove", "verify", "pwd_fm", "change"
    extra_data = models.JSONField(default=dict, blank=True)
    expire = models.IntegerField()

    def __str__(self):
        return f"for {self.user.username} - /email/{self.url}?i={self.intent}"

class AdminLog(models.Model):
    type = models.TextField()
    u_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_log_by")
    u_for = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="admin_log_for")
    uname_for = models.TextField(null=True)
    info = models.TextField()
    timestamp = models.IntegerField()

    def __str__(self):
        return f"{self.type} - {self.u_by.username} -> {self.uname_for or (self.u_for.username if isinstance(self.u_for, User) else self.u_for)} - {self.info}"

class OneTimePassword(models.Model):
    code = models.CharField(max_length=32, primary_key=True)

    def __str__(self):
        return self.code

class UserPronouns(models.Model):
    language = models.CharField(max_length=5)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pronouns")

    primary = models.TextField()
    secondary = models.TextField(null=True)

    class Meta:
        unique_together = ("user", "language")

    def __str__(self):
        return self.user.username

class MutedWord(models.Model):
    # if user is null then the muted word is global
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="muted_words")
    is_regex = models.BooleanField(default=False)
    string = models.TextField()
    hard_mute = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username if self.user else 'Global'}: {self.string}"

class Ratelimit(models.Model):
    expires = models.IntegerField()
    route_id = models.CharField(max_length=100)
    user_id = models.CharField(max_length=64) # user token or ip address

class Poll(models.Model):
    target = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="poll")

    if TYPE_CHECKING:
        choices: models.Manager["PollChoice"]
        votes: models.Manager["PollVote"]

    def __str__(self):
        return f"post {self.target.post_id} - {self.votes.count()} vote(s) on {self.choices.count()} choices"

class PollChoice(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="choices")
    content = models.TextField()

    if TYPE_CHECKING:
        votes: models.Manager["PollVote"]
        id: int

    def __str__(self):
        return f"post {self.poll.target.post_id} - {self.votes.count()} vote(s) on '{self.content}'"

class PollVote(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="votes")
    choice = models.ForeignKey(PollChoice, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("poll", "user")

    def __str__(self):
        return f"post {self.poll.target.post_id} - {self.user.username} voted '{self.choice.content}'"

class M2MLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "post")

    def __str__(self):
        return f"{self.user.username} liked post {self.post.post_id}"

class M2MLikeC(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Comment, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "post")

    def __str__(self):
        return f"{self.user.username} liked comment {self.post.comment_id}"

class M2MFollow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following_obj")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers_obj")

    class Meta:
        unique_together = ("user", "following")

    def __str__(self):
        return f"{self.user.username} follows {self.following.username}"

class M2MBlock(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blocking_obj")
    blocking = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blocked_obj")

    class Meta:
        unique_together = ("user", "blocking")

    def __str__(self):
        return f"{self.user.username} blocks {self.blocking.username}"

class M2MPending(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pending_obj")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pending_follow_obj")

    class Meta:
        unique_together = ("user", "following")

    def __str__(self):
        return f"{self.user.username} pending follow to {self.following.username}"

class M2MHashtagPost(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    hashtag = models.ForeignKey(Hashtag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("post", "hashtag")

    def __str__(self):
        return f"post {self.post.post_id} has the hashtag {self.hashtag.tag}"

class M2MBadgeUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "badge")

    def __str__(self):
        return f"{self.user.username} has the badge {self.badge.name}"

class GenericData(models.Model):
    id = models.CharField(max_length=50, unique=True, primary_key=True)
    value = models.TextField(blank=True)

try:
    django_admin.site.register([
        User,
        Post,
        Comment,
        Badge,
        Notification,
        PrivateMessageContainer,
        PrivateMessage,
        Hashtag,
        URLPart,
        AdminLog,
        OneTimePassword,
        UserPronouns,
        MutedWord,
        Poll,
        PollChoice,
        PollVote,
        M2MLike,
        M2MLikeC,
        M2MFollow,
        M2MBlock,
        M2MPending,
        M2MHashtagPost,
        M2MBadgeUser,
        GenericData
    ])

except AlreadyRegistered:
    ...
