home = true;
type = "post";
includeUserLink = true;
includePostLink = true;
timelines = {
    random: `/api/hashtag/${hashtag}?sort=random`,
    recent: `/api/hashtag/${hashtag}?sort=recent`,
    liked: `/api/hashtag/${hashtag}?sort=liked`,
};
url = timelines.random;
useOffsetC = true;
