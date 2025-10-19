from backend.helper import find_hashtags
from django.core.management.base import BaseCommand
from posts.models import Hashtag, M2MHashtagPost, Post


def _get_hashtag(tag: str) -> Hashtag:
    try:
        return Hashtag.objects.get(tag=tag)
    except Hashtag.DoesNotExist:
        return Hashtag.objects.create(tag=tag)

class Command(BaseCommand):
    help = "Vacuums the database, defragmenting and reducing gaps, as well as likely reducing filesize."

    def handle(self, *args, **kwargs):
        print("Deleting existing hashtag relatonships...")

        Hashtag.objects.all().delete()
        M2MHashtagPost.objects.all().delete()

        print("Checking all posts...")
        posts = Post.objects.all()
        pending_hashtag_objects = []

        for post in posts:
            tags = find_hashtags(post.content)

            if tags:
                print(f"Found tags {', '.join(tags)} on post {post.post_id}")

            for tag in tags:
                hashtag = _get_hashtag(tag)
                pending_hashtag_objects.append(M2MHashtagPost(
                    hashtag=hashtag,
                    post=post
                ))

        print("Creating objects...")
        M2MHashtagPost.objects.bulk_create(pending_hashtag_objects)
