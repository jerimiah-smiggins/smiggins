function hashtagInit(): void {
  type = "post";
  includeUserLink = true;
  includePostLink = true;
  timelineConfig.timelines = {
    random: `/api/hashtag/${context.hashtag}?sort=random`,
    recent: `/api/hashtag/${context.hashtag}?sort=recent`,
    liked: `/api/hashtag/${context.hashtag}?sort=liked`,
  };

  timelineConfig.url = timelineConfig.timelines.random;
  timelineConfig.useOffsetC = true;
}
