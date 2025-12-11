function getHashtagFromPath(path?: string): string {
  return (path || location.pathname).toLowerCase().split("/").filter(Boolean)[1];
}

function p_hashtag(element: D): void {
  let timelineElement: Del = element.querySelector("#timeline-posts");
  let tag: string = getHashtagFromPath();

  if (!timelineElement || !tag) { return; }

  hookTimeline(timelineElement, element.querySelector("#timeline-carousel") as Del, {
    [`hashtag_${tag}_recent`]: { api: api_TimelineHashtag, args: [getHashtagFromPath(), "recent"], prependPosts: false },
    [`hashtag_${tag}_oldest`]: { api: api_TimelineHashtag, args: [getHashtagFromPath(), "oldest"], prependPosts: false, disablePolling: true, invertOffset: true },
  }, `hashtag_${tag}_recent`, element);
}
