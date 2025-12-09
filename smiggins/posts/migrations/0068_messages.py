# Written by trinkey on 2025-12-05

import django.db.models.deletion
from django.db import migrations, models


def get_id(*users) -> str:
    return ":".join([str(i) for i in sorted([u.user_id for u in users])])

def migrate_messages(apps, schema_editor):
    PMC = apps.get_model("posts", "PrivateMessageContainer")
    M2MMessageMember = apps.get_model("posts", "M2MMessageMember")
    MessageGroup = apps.get_model("posts", "MessageGroup")
    Message = apps.get_model("posts", "Message")

    c = 1
    for container in PMC.objects.all():
        group = MessageGroup.objects.create(pk=c, group_id=get_id(container.user_one, container.user_two), timestamp=0)
        group.save()

        M2MMessageMember.objects.create(
            user=container.user_one,
            group=group,
            unread=container.unread_one
        )

        M2MMessageMember.objects.create(
            user=container.user_two,
            group=group,
            unread=container.unread_two
        )

        recent_ts = 0
        pending_messages = []
        for message in container.messages.all():
            pending_messages.append(Message(
                timestamp=message.timestamp,
                content=message.content,
                user=container.user_one if message.from_user_one else container.user_two,
                group=group
            ))

            if message.timestamp > recent_ts:
                recent_ts = message.timestamp

        Message.objects.bulk_create(pending_messages)

        group.timestamp = recent_ts
        group.save()

        c += 1

class Migration(migrations.Migration):
    dependencies = [("posts", "0067_auth_rewrite")]

    operations = [
        migrations.RemoveField(model_name="user", name="messages"),
        migrations.RemoveField(model_name="user", name="unread_messages"),

        migrations.CreateModel(
            name="M2MMessageMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("unread", models.BooleanField(default=False)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.user"))
            ]
        ),

        migrations.CreateModel(
            name="MessageGroup",
            fields=[
                ("id", models.IntegerField(primary_key=True, serialize=False)),
                ("group_id", models.TextField(unique=True)),
                ("members", models.ManyToManyField(related_name="message_groups", through="posts.M2MMessageMember", to="posts.user")),
                ("timestamp", models.IntegerField())
            ]
        ),

        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("content", models.CharField(max_length=65535)),
                ("timestamp", models.IntegerField()),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="posts.user")),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="posts.messagegroup"))
            ]
        ),

        migrations.AddField(model_name="m2mmessagemember", name="group",field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.messagegroup")),
        migrations.AlterUniqueTogether(name="m2mmessagemember", unique_together={("user", "group")}),
        migrations.RunPython(migrate_messages),
        migrations.DeleteModel("PrivateMessage"),
        migrations.DeleteModel("PrivateMessageContainer")
    ]
