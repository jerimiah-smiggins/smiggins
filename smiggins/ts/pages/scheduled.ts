function p_scheduled(element: D): void {
  let timelineElement: Del = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, element.querySelector("#timeline-carousel") as Del, {
    scheduled_recent: { api: api_TimelineScheduled, args: ["recent"], prependPosts: false },
    scheduled_oldest: { api: api_TimelineScheduled, args: ["oldest"], prependPosts: false, disablePolling: true, invertOffset: true },
  }, `scheduled_recent`, element);
}
