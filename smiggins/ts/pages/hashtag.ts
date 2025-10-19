function getHashtagFromPath(path?: string): string {
  return (path || location.pathname).toLowerCase().split("/").filter(Boolean)[1];
}

function p_hashtag(element: HTMLDivElement): void {
  let timelineElement: HTMLDivElement | null = element.querySelector("#timeline-posts");
  let tag: string = getHashtagFromPath();

  if (!timelineElement || !tag) { return; }

  hookTimeline(timelineElement, {
    [`hashtag_${tag}_recent`]: { url: `/api/timeline/tag/${tag}?sort=recent`, prependPosts: false },
    [`hashtag_${tag}_oldest`]: { url: `/api/timeline/tag/${tag}?sort=oldest`, prependPosts: false, disablePolling: true },
  }, `hashtag_${tag}_recent`, element);
}
