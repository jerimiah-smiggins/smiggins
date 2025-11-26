function getHashtagFromPath(path?: string): string {
  return (path || location.pathname).toLowerCase().split("/").filter(Boolean)[1];
}

function p_hashtag(element: D): void {
  let timelineElement: Del = element.querySelector("#timeline-posts");
  let tag: string = getHashtagFromPath();

  if (!timelineElement || !tag) { return; }

  hookTimeline(timelineElement, element.querySelector("#timeline-carousel") as Del, {
    [`hashtag_${tag}_recent`]: { url: `/api/timeline/tag/${tag}?sort=recent`, prependPosts: false },
    [`hashtag_${tag}_oldest`]: { url: `/api/timeline/tag/${tag}?sort=oldest`, prependPosts: false, disablePolling: true, invertOffset: true },
  }, `hashtag_${tag}_recent`, element);
}
