import json
import threading
from typing import TYPE_CHECKING, Literal

import pywebpush
from backend.variables import SITE_NAME, VAPID
from django.contrib import admin as django_admin
from django.contrib.admin.exceptions import AlreadyRegistered  # type: ignore
from django.db import models
from django.db.models.signals import post_delete, post_init
from django.dispatch import receiver

MAX_STR8 = (1 << 8) - 1
MAX_STR16 = (1 << 16) - 1

class User(models.Model):
    user_id = models.IntegerField(primary_key=True, unique=True)
    username = models.CharField(max_length=MAX_STR8, unique=True)

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

    display_name = models.CharField(max_length=MAX_STR8)
    bio = models.CharField(max_length=MAX_STR16, default="", blank=True)
    color = models.CharField(max_length=7)
    color_two = models.CharField(max_length=7, default="#000000", blank=True)
    gradient = models.BooleanField(default=False)

    pronouns = models.CharField(max_length=MAX_STR8, default="", blank=True)

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
        messages: models.Manager["Message"]

    def get_notif_count(self):
        notification_count = self.notifications.filter(read=False).count()
        message_count = M2MMessageMember.objects.filter(user=self, unread=True).count()
        folreq_count = self.pending_followers.count()

        return {
            "notifications": bool(notification_count),
            "messages": bool(message_count),
            "follow_requests": bool(folreq_count),
            "count": min(100, notification_count + message_count + folreq_count)
        }


    def __str__(self):
        return f"({self.user_id}) @{self.username}"

class Post(models.Model):
    post_id = models.IntegerField(primary_key=True)
    content = models.TextField(max_length=MAX_STR16, blank=True)
    content_warning = models.TextField(max_length=MAX_STR8, null=True, blank=True)
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
    # - follow (someone followed you)
    event_type = models.CharField(max_length=7)

    # Exists in order to automatically remove a notification if a like gets removed
    linked_like: "M2MLike | None" = models.ForeignKey("M2MLike", on_delete=models.CASCADE, null=True, blank=True) # type: ignore
    linked_follow: "M2MFollow | None" = models.ForeignKey("M2MFollow", on_delete=models.CASCADE, null=True, blank=True) # type: ignore

    # The post that caused the notification
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)

    # The user object for who the notification is for
    is_for = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")

    def __str__(self):
        return f"({'' if self.read else 'un'}read) {self.event_type} ({self.notif_id}) for {self.is_for.username if self.is_for else None}"

class Hashtag(models.Model):
    tag = models.CharField(max_length=MAX_STR8, unique=True, primary_key=True)
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
    id = models.IntegerField(primary_key=True)
    group_id = models.TextField(unique=True)
    members = models.ManyToManyField(User, through="M2MMessageMember", related_name="message_groups")
    timestamp = models.IntegerField()

    if TYPE_CHECKING:
        messages: models.Manager["Message"]

    @staticmethod
    def get_id(*users: User) -> str:
        return ":".join([str(i) for i in sorted([u.user_id for u in users])])

    def __str__(self) -> str:
        return f"({self.id}/{self.group_id}) " + ", ".join(self.members.all().values_list("username", flat=True))

class Message(models.Model):
    content = models.CharField(max_length=MAX_STR16)
    group = models.ForeignKey(MessageGroup, related_name="messages", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="messages", on_delete=models.CASCADE)
    timestamp = models.IntegerField()

    def __str__(self) -> str:
        return f"({self.group.id}/{self.group.group_id}) @{self.user.username} - {self.content}"

class PushNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    endpoint = models.TextField(unique=True)
    keys = models.TextField()
    expires = models.IntegerField(null=True)

    def to_json(self):
        return {
            "endpoint": self.endpoint,
            "keys": json.loads(self.keys),
            "expires": self.expires
        }

    @staticmethod
    def send_to(
        user: User,
        event: Literal["comment", "quote", "ping", "follow", "follow_request", "message", "none"],
        context: User | Post | MessageGroup | None
    ):
        notif_count = user.get_notif_count()["count"]
        for obj in PushNotification.objects.filter(user=user):
            obj.send(
                event,
                notif_count,
                context
            )

    def send(
        self,
        event: Literal["comment", "quote", "ping", "follow", "follow_request", "message", "message", "none"],
        notif_count: int,
        context: User | Post | MessageGroup | None
    ):
        if not VAPID:
            return

        if isinstance(context, User):
            action = f"u{context.username}"
            data = {
                "username": context.username,
                "display_name": context.display_name
            }
        elif isinstance(context, Post):
            action = f"p{context.post_id}"
            data = {
                "username": context.creator.username,
                "display_name": context.creator.display_name,
                "content": context.content[:100] + ("..." if len(context.content) > 100 else "")
            }
        elif isinstance(context, MessageGroup):
            action = f"m{context.id}"
            sender = context.messages.order_by("-pk").prefetch_related("user")[0].user
            data = {
                "username": sender.username,
                "display_name": sender.display_name,
                "users": context.members.count()
            }
        else:
            action = ""
            data = {}

        threading.Thread(target=PushNotification.webpush_safe, kwargs={
            "obj": self,
            "subscription_info": self.to_json(),
            "data": f"{SITE_NAME};{notif_count};{event};{action};{json.dumps(data)}",
            "vapid_private_key": VAPID["private"],
            "vapid_claims": {
                "sub": f"mailto:{VAPID['email']}",
                "aud": "/".join(self.endpoint.split("/")[:3])
            },
            "ttl": 60 * 60 # keep trying for an hour if the recipient isn't online
        }).start()

    @staticmethod
    def webpush_safe(obj: "PushNotification", **kwargs):
        try:
            pywebpush.webpush(**kwargs)
        except pywebpush.WebPushException as err:
            try:
                if err.response.status_code == 410: # type: ignore
                    obj.delete()
                    print("gone")
                elif err.response.status_code == 404: # type: ignore
                    obj.delete()
                    print("404")
                elif err.response.status_code == 403: # type: ignore
                    obj.delete()
                    print("forbidden")
            except AttributeError:
                ...

            raise err

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
        PushNotification,
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

@receiver(post_delete, sender=M2MMessageMember)
def cascade_message_member_delete(sender, instance: M2MMessageMember, **kwargs):
    gid: int = instance.group_id # type: ignore

    try:
        MessageGroup.objects.get(id=gid).delete()
    except MessageGroup.DoesNotExist:
        ...

@receiver(post_init, sender=Notification)
def send_push_notification(sender, instance: Notification, **kwargs):
    if instance.event_type in ["ping", "quote", "comment"] and not instance.pk:
        context: User | Post | None = instance.linked_follow.user if instance.linked_follow else instance.post

        if not context:
            return

        PushNotification.send_to(
            instance.is_for,
            instance.event_type, # type: ignore
            context
        )
