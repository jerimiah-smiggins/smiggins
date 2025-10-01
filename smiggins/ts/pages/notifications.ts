function p_notifications(element: HTMLDivElement): void {
  let timelineElement: HTMLDivElement | null = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, {
    "notifications": { url: "/api/timeline/notifications", prependPosts: false, disableCaching: true }
  }, "notifications", element);
}
