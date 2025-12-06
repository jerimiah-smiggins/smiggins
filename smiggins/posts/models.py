from typing import TYPE_CHECKING

from django.contrib import admin as django_admin
from django.contrib.admin.exceptions import AlreadyRegistered  # type: ignore
from django.db import models


class User(models.Model):
    user_id = models.IntegerField(primary_key=True, unique=True)
    username = models.CharField(max_length=2 ** 8 - 1, unique=True)

    password_hash = models.TextField(null=True)
    auth_key = models.CharField(max_length=64, unique=True)
    legacy_token = models.CharField(max_length=64, null=True, unique=True)

    # Admin level
    # Functions as a binary mask. Definitions (32 bit compatible):
    #                       +- Generate OTPs
    #                       |+- Unused (kept for compatability)
    #                       ||+- Change admin levels for self and others
    #                       |||+++++- Unused (kept for compatability)
    #                       ||||||||+- Delete accounts
    #          Unused       |||||||||+- Delete posts
    #            |          ||||||||||
    # 0000000000000000000000X0X00000XX
    admin_level = models.IntegerField(default=0)

    display_name = models.CharField(max_length=2 ** 8 - 1)
    bio = models.CharField(max_length=2 ** 16 - 1, default="", blank=True)
    color = models.CharField(max_length=7)
    color_two = models.CharField(max_length=7, default="#000000", blank=True)
    gradient = models.BooleanField(default=False)

    pronouns = models.CharField(max_length=2 ** 8 - 1, default="", blank=True)

    default_post_private = models.BooleanField(default=False)
    verify_followers = models.BooleanField(default=False)

    following = models.ManyToManyField("self", symmetrical=False, through_fields=("user", "following"), through="M2MFollow", related_name="followers", blank=True)
    blocking = models.ManyToManyField("self", symmetrical=False, through_fields=("user", "blocking"), through="M2MBlock", related_name="blockers", blank=True)
    pending_followers = models.ManyToManyField("self", symmetrical=False, through_fields=("user", "following"), through="M2MPending", related_name="pending_following", blank=True)

    if TYPE_CHECKING:
        pinned: "Post | None"
    else:
        pinned = models.ForeignKey("Post", on_delete=models.SET_NULL, null=True, blank=True)

    if TYPE_CHECKING:
        posts: models.Manager["Post"]
        admin_log_for: models.Manager["AdminLog"]
        admin_log_by: models.Manager["AdminLog"]
        notifications: models.Manager["Notification"]
        liked_posts: models.Manager["Post"]
        followers: models.Manager["User"]
        blockers: models.Manager["User"]
        pending_following: models.Manager["User"]

    def __str__(self):
        return f"({self.user_id}) @{self.username}"

class Post(models.Model):
    post_id = models.IntegerField(primary_key=True)
    content = models.TextField(max_length=2 ** 16 - 1, blank=True)
    content_warning = models.TextField(max_length=2 ** 8 - 1, null=True, blank=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    timestamp = models.IntegerField()

    edited = models.BooleanField(default=False)
    edited_at = models.IntegerField(null=True, blank=True)

    likes = models.ManyToManyField(User, through="M2MLike", related_name="liked_posts", blank=True)
    comment_parent = models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="comments", to="posts.post", null=True, blank=True)
    quoted_post = models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="quotes", to="posts.post", null=True, blank=True)

    # null: anyone (compatibility only), run script 05 to fix
    # False: anyone
    # True: followers only
    private = models.BooleanField(null=True)

    if TYPE_CHECKING:
        hashtags: models.Manager["Hashtag"]
        comments: models.Manager["Post"]
        quotes: models.Manager["Post"]
        poll: "Poll | None"

    # def get_poll(self: "Post", user: User | None) -> dict | None:
    #     if hasattr(self, "poll"):
    #         p: Poll = self.poll
    #     else:
    #         return None

    #     return {
    #         "votes": p.votes.count(),
    #         "voted": user is not None and p.votes.filter(user=user).count() > 0,
    #         "content": [{
    #             "id": c.id,
    #             "value": c.content,
    #             "votes": c.votes.count(),
    #             "voted": user is not None and c.votes.filter(user=user).count() > 0
    #         } for c in p.choices.all()]
    #     }

    def __str__(self):
        return f"({self.post_id}) {self.content}"

class Notification(models.Model):
    notif_id = models.IntegerField(primary_key=True, unique=True)
    timestamp = models.IntegerField()
    read = models.BooleanField(default=False)

    # The type of the event that caused the notification. Can be:
    # - comment (commenting on your post)
    # - quote (your post/comment being quoted)
    # - ping (get @mentioned)
    # - like (your post got liked)
    event_type = models.CharField(max_length=7)

    # Exists in order to automatically remove a notification if a like gets removed
    linked_like = models.ForeignKey("M2MLike", on_delete=models.CASCADE, null=True, blank=True)

    # The post that caused the notification
    post = models.ForeignKey(Post, on_delete=models.CASCADE)

    # The user object for who the notification is for
    is_for = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")

    def __str__(self):
        return f"({'' if self.read else 'un'}read) {self.event_type} ({self.notif_id}) for {self.is_for.username if self.is_for else None}"

class Hashtag(models.Model):
    tag = models.CharField(max_length=2 ** 8 - 1, unique=True, primary_key=True)
    posts = models.ManyToManyField(Post, through="M2MHashtagPost", related_name="hashtags", blank=True)

    def __str__(self):
        return f"#{self.tag} ({self.posts.count()} posts)"

class AdminLog(models.Model):
    type = models.TextField()
    u_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_log_by")
    u_for = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="admin_log_for")
    uname_for = models.TextField(null=True)
    info = models.TextField()
    timestamp = models.IntegerField()

    def __str__(self):
        return f"{self.type} - {self.u_by.username} -> {self.uname_for or (self.u_for.username if isinstance(self.u_for, User) else self.u_for)} - {self.info}"

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

class InviteCode(models.Model):
    id = models.CharField(primary_key=True, unique=True, max_length=64)

class MessageGroup(models.Model):
    group_id = models.IntegerField(primary_key=True)
    members = models.ManyToManyField(User, through="M2MMessageMember", related_name="message_groups")

    def __str__(self) -> str:
        return f"({self.group_id}) " + ", ".join(self.members.all().values_list("username", flat=True))

class Message(models.Model):
    content = models.CharField(max_length=2 ** 16 - 1)
    group = models.ForeignKey(MessageGroup, related_name="messages", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="messages", on_delete=models.CASCADE)
    timestamp = models.IntegerField()

    def __str__(self) -> str:
        return f"({self.group.group_id}) @{self.user.username} - {self.content}"

class M2MLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "post")

    def __str__(self):
        return f"{self.user.username} liked post {self.post.post_id}"

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

class M2MMessageMember(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(MessageGroup, on_delete=models.CASCADE)
    unread = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "group")

class GenericData(models.Model):
    id = models.CharField(max_length=50, unique=True, primary_key=True)
    value = models.TextField(blank=True)

try:
    django_admin.site.register([
        User,
        Post,
        Notification,
        Hashtag,
        AdminLog,
        Poll,
        PollChoice,
        PollVote,
        InviteCode,
        MessageGroup,
        Message,
        M2MLike,
        M2MFollow,
        M2MBlock,
        M2MPending,
        M2MHashtagPost,
        M2MMessageMember,
        GenericData
    ])

except AlreadyRegistered:
    ...
