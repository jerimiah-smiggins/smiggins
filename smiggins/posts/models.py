from typing import TYPE_CHECKING

from django.contrib import admin as django_admin
from django.contrib.admin.exceptions import AlreadyRegistered  # type: ignore
from django.db import models

# The "#!# <something>" comment shows something that might happen in the future but has yet to be implemented

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

    read_notifs = models.BooleanField(default=True)
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
    poll = models.JSONField(default=None, null=True, blank=True)

    if TYPE_CHECKING:
        hashtags: models.Manager["Hashtag"]

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

    if TYPE_CHECKING:
        messages: models.QuerySet["PrivateMessage"]

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

    def __str__(self):
        return f"{self.user.username if self.user else 'Global'}: {self.string}"

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

try:
    django_admin.site.register(User)
    django_admin.site.register(Post)
    django_admin.site.register(Comment)
    django_admin.site.register(Badge)
    django_admin.site.register(Notification)
    django_admin.site.register(PrivateMessageContainer)
    django_admin.site.register(PrivateMessage)
    django_admin.site.register(Hashtag)
    django_admin.site.register(URLPart)
    django_admin.site.register(AdminLog)
    django_admin.site.register(OneTimePassword)
    django_admin.site.register(UserPronouns)
    django_admin.site.register(MutedWord)
    django_admin.site.register(M2MLike)
    django_admin.site.register(M2MLikeC)
    django_admin.site.register(M2MFollow)
    django_admin.site.register(M2MBlock)
    django_admin.site.register(M2MPending)
    django_admin.site.register(M2MHashtagPost)
    django_admin.site.register(M2MBadgeUser)

except AlreadyRegistered:
    ...
