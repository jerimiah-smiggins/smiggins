from typing import Any, Callable

from django.db.models.manager import BaseManager
from posts.models import Comment, Post, User

from .variables import POSTS_PER_REQUEST


def get_timeline(
    timeline: BaseManager[Post] | BaseManager[Comment] | BaseManager[User],
    identifier: Any=None,
    user: User | None=None,
    *,
    use_pages: bool=False, # if true, identifier_argument and forwards will be ignored
    identifier_argument: str | None=None,
    forwards: bool=False, # true: new ones since, false: older ones
    limit: int=POSTS_PER_REQUEST,
    always_end: bool=False,
    condition: Callable[[Post | Comment | User], bool]=lambda a: True,
    to_json: Callable[[Post | Comment | User], dict] | None=None
) -> tuple[list, bool]:
    if to_json is None:
        to_json = lambda a: {} if isinstance(a, User) else a.json(user) # noqa: E731

    if use_pages:
        if not isinstance(identifier, int) and identifier is not None:
            raise TypeError("identifier should be int with use_pages")
        elif identifier is not None:
            timeline = timeline[identifier * limit:]

    elif identifier:
        timeline = timeline.filter(**{
            f"{identifier_argument or 'pk'}__{'g' if forwards else 'l'}t": identifier
        })

    if forwards:
        timeline = timeline.reverse()

    output = []
    offset = 0

    for obj in timeline:
        if condition(obj):
            output.append(to_json(obj))
        else:
            offset += 1
            continue

        if len(output) >= limit:
            break

    return output, always_end or timeline.count() - offset - limit <= 0
