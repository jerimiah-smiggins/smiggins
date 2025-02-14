function hashtagInit(): void {
  type = "post";
  includeUserLink = true;
  includePostLink = true;
  timelineConfig.timelines = {
    random: { url: `/api/hashtag/${context.hashtag}?sort=random`, forwards: false, pages: false },
    recent: { url: `/api/hashtag/${context.hashtag}?sort=recent`, forwards: true, pages: false },
    liked: { url: `/api/hashtag/${context.hashtag}?sort=liked`, forwards: false, pages: true },
  };

  timelineConfig.url = timelineConfig.timelines.random.url;
  timelineConfig.usePages = timelineConfig.timelines.random.pages;
}
