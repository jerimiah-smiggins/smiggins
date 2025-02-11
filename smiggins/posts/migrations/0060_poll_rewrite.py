# Written by trinkey on 2025-2-11

import django.db.models.deletion
from django.db import migrations, models


def migrate_polls(apps, schema_editor):
    Post = apps.get_model("posts", "Post")
    User = apps.get_model("posts", "User")

    Poll = apps.get_model("posts", "Poll")
    PollChoice = apps.get_model("posts", "PollChoice")
    PollVote = apps.get_model("posts", "PollVote")

    for post in Post.objects.all():
        poll = post.poll1

        if not isinstance(poll, dict):
            continue

        content: list[tuple[str, list]] = []

        try:
            unique = []
            for obj in poll["content"]:
                users = []

                for u in obj["votes"]:
                    if u in unique:
                        continue

                    unique.append(u)

                    try:
                        user = User.objects.get(user_id=u)
                    except User.DoesNotExist:
                        continue
                    else:
                        users.append(user)

                content.append((str(obj["value"]), users))

        except KeyError:
            continue
        except TypeError:
            continue

        poll = Poll.objects.create(target=post)

        for choice in content:
            c = PollChoice.objects.create(
                poll=poll,
                content=choice[0]
            )

            pv = []

            for user in choice[1]:
                pv.append(PollVote(
                    poll=poll,
                    choice=c,
                    user=user
                ))

            PollVote.objects.bulk_create(pv)

class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0059_genericdata"),
    ]

    operations = [
        migrations.RenameField("post", "poll", "poll1"),
        migrations.CreateModel(
            name="Poll",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("target", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="poll", to="posts.post"))
            ]
        ),
        migrations.CreateModel(
            name="PollChoice",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("content", models.TextField()),
                ("poll", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="choices", to="posts.poll"))
            ]
        ),
        migrations.CreateModel(
            name="PollVote",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("choice", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="votes", to="posts.pollchoice")),
                ("poll", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="votes", to="posts.poll")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="posts.user"))
            ],
            options={ "unique_together": {("poll", "user")} }
        ),
        migrations.RunPython(migrate_polls),
        migrations.RemoveField("post", "poll1")
    ]
