from django.db import models


class User(models.Model):
    user_id  = models.IntegerField(primary_key=True, unique=True)
    username = models.CharField(max_length=300, unique=True)
    token    = models.CharField(max_length=64, unique=True)
    email    = models.TextField(null=True)
    email_valid = models.BooleanField(default=False)

    # Admin level
    # Functions as a binary mask. Definitions (32 bit compatible):
    #                        +- Read admin logs
    #                        |+- Change admin levels for self and others
    #                        ||+- Add any account to account switcher - requires modify info
    #                        |||+- Modify account info
    #                        ||||+- Add/remove badges from profiles
    #                        |||||+- Delete badges
    #                        ||||||+- Create/modify badges
    #                        |||||||+- Delete accounts
    #          unused        ||||||||+- Delete posts
    #            |           |||||||||
    # 00000000000000000000000XXXXXXXX
    admin_level = models.IntegerField(default=0)

    display_name = models.CharField(max_length=300)
    bio       = models.CharField(max_length=65536, default="", blank=True)
    pronouns  = models.CharField(max_length=2, default="__")
    theme     = models.CharField(max_length=30)
    color     = models.CharField(max_length=7)
    color_two = models.CharField(max_length=7, default="#000000", blank=True)
    gradient  = models.BooleanField(default=False)

    default_post_private = models.BooleanField(default=False)
    verify_followers = models.BooleanField(default=False)
    pending_followers = models.JSONField(default=list, blank=True)

    language = models.CharField(max_length=5, blank=True)

    following = models.JSONField(default=list, blank=True)
    followers = models.JSONField(default=list, blank=True)
    blocking  = models.JSONField(default=list, blank=True)
    badges    = models.JSONField(default=list, blank=True)
    notifications = models.JSONField(default=list, blank=True)
    messages = models.JSONField(default=list, blank=True)
    read_notifs = models.BooleanField(default=True)
    unread_messages = models.JSONField(default=list, blank=True)

    pinned   = models.IntegerField(default=0)
    posts    = models.JSONField(default=list, blank=True)
    comments = models.JSONField(default=list, blank=True)
    likes    = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"({self.user_id}) {self.username}"

class Post(models.Model):
    post_id   = models.IntegerField(primary_key=True)
    content   = models.TextField(max_length=65536, blank=True)
    content_warning = models.TextField(max_length=200, null=True, blank=True)
    creator   = models.IntegerField()
    timestamp = models.IntegerField()
    quote     = models.IntegerField(default=0)
    quote_is_comment = models.BooleanField(default=False)
    edited = models.BooleanField(default=False)
    edited_at = models.IntegerField(null=True)

    likes    = models.JSONField(default=list, blank=True)
    comments = models.JSONField(default=list, blank=True)
    quotes   = models.JSONField(default=list, blank=True)

    # null: anyone (compatibility only), run script 05 to fix
    # False: anyone
    # True: followers only
    private_post = models.BooleanField(null=True)

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

    def __str__(self):
        return f"({self.post_id}) {self.content}"

class Comment(models.Model):
    comment_id = models.IntegerField(primary_key=True, unique=True)
    content    = models.TextField(max_length=65536, blank=True)
    content_warning = models.TextField(max_length=200, null=True, blank=True)
    creator    = models.IntegerField()
    timestamp  = models.IntegerField()
    parent     = models.IntegerField(default=0)
    edited = models.BooleanField(default=False)
    edited_at = models.IntegerField(null=True)

    parent_is_comment = models.BooleanField(default=False)
    private_comment = models.BooleanField(null=True)

    likes    = models.JSONField(default=list, blank=True)
    comments = models.JSONField(default=list, blank=True)
    quotes   = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"({self.comment_id}) {self.content}"

class Badge(models.Model):
    name     = models.CharField(max_length=64, primary_key=True, unique=True)
    svg_data = models.CharField(max_length=65536)
    users    = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.name} ({', '.join([str(i) for i in self.users]) or 'No users'})"

class Notification(models.Model):
    notif_id  = models.IntegerField(primary_key=True, unique=True)
    timestamp = models.IntegerField()
    read      = models.BooleanField(default=False)

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
    event_id = models.IntegerField()

    # The user object for who the notification is for
    is_for = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"({'' if self.read else 'un'}read) {self.event_type} ({self.event_id}) for {self.is_for.username}"

class PrivateMessageContainer(models.Model):
    # Essentially f"{user_one.username}-{user_two.username}" where user_one
    # is earlier in the alphabet than user_two
    container_id = models.CharField(primary_key=True, unique=True, max_length=601)

    user_one = models.ForeignKey(User, on_delete=models.CASCADE, related_name="container_reference_one")
    user_two = models.ForeignKey(User, on_delete=models.CASCADE, related_name="container_reference_two")

    messages = models.JSONField(default=list, blank=True)

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

    message_container = models.ForeignKey(PrivateMessageContainer, on_delete=models.CASCADE)

    def __str__(self):
        return f"({self.message_id}) From {self.message_container.user_one.username if self.from_user_one else self.message_container.user_two.username} to {self.message_container.user_two.username if self.from_user_one else self.message_container.user_one.username} - {self.content}"

class Hashtag(models.Model):
    tag = models.CharField(max_length=64, unique=True, primary_key=True)
    posts = models.JSONField(default=list, blank=True) # [[is_comment, post_id], ...]

    def __str__(self):
        return f"#{self.tag} ({len(self.posts)} posts)"

class URLPart(models.Model):
    url = models.TextField(max_length=128, primary_key=True, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    intent = models.TextField(max_length=6) # "reset", "remove", "verify", "pwd_fm", "change"
    extra_data = models.JSONField(default=dict, blank=True)
    expire = models.IntegerField()

class AdminLog(models.Model):
    type = models.TextField()
    u_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_log_by")
    u_for = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name="admin_log_for")
    uname_for = models.TextField(null=True)
    info = models.TextField()
    timestamp = models.IntegerField()
