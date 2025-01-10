home = true;
type = "post";
includeUserLink = true;
includePostLink = true;
timelineConfig.timelines = {
    random: `/api/hashtag/${hashtag}?sort=random`,
    recent: `/api/hashtag/${hashtag}?sort=recent`,
    liked: `/api/hashtag/${hashtag}?sort=liked`,
};
timelineConfig.url = timelineConfig.timelines.random;
timelineConfig.useOffsetC = true;
